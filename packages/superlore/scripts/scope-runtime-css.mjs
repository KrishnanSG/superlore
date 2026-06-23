// Scope the precompiled runtime stylesheet to a `.superlore-doc` container.
//
// `superlore/runtime.css` is a full Tailwind v4 build — global by nature: it resets `*`/`html`/`body`,
// defines theme tokens on `:root`, repaints `body`, and emits ~1.4k bare utility classes. A host app
// (e.g. a single-route client shell with no isolated doc route to quarantine the import) cannot import
// that app-wide without regressing its own UI: `--font-sans`/`--font-mono` collide, `body` is repainted,
// utilities clash.
//
// This transform rewrites every selector so it ONLY matches inside `<div class="superlore-doc">`, and
// moves dark mode onto the container (`[data-theme="dark"]`) instead of an `<html>` ancestor. The host
// then imports the sheet once, app-wide, with ZERO leakage outside the container — a 0-pixel host diff.
//
// Why a post-transform (not Tailwind config): Tailwind v4 has no first-class "emit everything under a
// selector" output mode, and the host-side escapes (shadow DOM, build-time prefixing) are fragile and
// wrong for the consumer to own. We own the CSS contract, so we own the scoping — with a real CSS +
// selector parser (never regex on minified CSS) so `:where(.dark, .dark *)`, escaped utility classes
// (`.dark\:bg-x`), and `@layer`/`@supports`/`@media` nesting are all handled correctly.
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

/** The container class a host wraps a doc in. Public contract — keep in sync with the renderer + docs. */
export const CONTAINER_CLASS = "superlore-doc";

// At-rules whose nested rules must stay global: `@keyframes`/`@font-face`/`@property`/`@page`/
// `@counter-style` define names/types/registrations, not page styles — scoping their inner selectors
// (`from`, `to`, `50%`) would corrupt them, and they have no effect on a host until something inside
// the container references them. Everything else (`@layer`, `@media`, `@supports`) gets scoped.
function inGlobalAtRule(rule) {
  for (let p = rule.parent; p; p = p.parent) {
    if (p.type !== "atrule") continue;
    const name = p.name.toLowerCase();
    if (/keyframes$/.test(name) || name === "font-face" || name === "property") return true;
    if (name === "page" || name === "counter-style") return true;
  }
  return false;
}

/**
 * Rewrite one comma-separated selector list so every selector is rooted at `.superlore-doc`:
 *   - `:root` / `:host` / `html` / `body`      → `.superlore-doc` (the container is the doc root)
 *   - `.dark` class (incl. inside `:where()`)  → `[data-theme="dark"]` (dark rides the container)
 *   - anything else (`.flex`, `*`, `::selection`, `#id`, `[attr]`) → prefixed `.superlore-doc <sel>`
 * Selectors already rooted at the container (after the root rewrites) are left un-prefixed, so the
 * light token block `:root,:root.light,html:not(.dark)` collapses to `.superlore-doc…` (light base)
 * and `html.dark` becomes `.superlore-doc[data-theme="dark"]` (dark override wins on specificity).
 */
export function scopeSelectorList(selectorList) {
  return selectorParser((root) => {
    const seen = new Set();
    root.each((sel) => {
      sel.walk((node) => {
        if (node.type === "pseudo" && (node.value === ":root" || node.value === ":host")) {
          node.replaceWith(selectorParser.className({ value: CONTAINER_CLASS }));
        } else if (node.type === "tag" && (node.value === "html" || node.value === "body")) {
          node.replaceWith(selectorParser.className({ value: CONTAINER_CLASS }));
        } else if (node.type === "class" && node.value === "dark") {
          node.replaceWith(
            selectorParser.attribute({
              attribute: "data-theme",
              operator: "=",
              value: "dark",
              quoteMark: '"',
            }),
          );
        }
      });
      const first = sel.first;
      const rooted = first && first.type === "class" && first.value === CONTAINER_CLASS;
      if (!rooted) {
        sel.prepend(selectorParser.combinator({ value: " " }));
        sel.prepend(selectorParser.className({ value: CONTAINER_CLASS }));
      }
      // Dedup selectors that collapsed to the same thing (e.g. `html,:host` → `.superlore-doc` twice).
      const text = String(sel).trim();
      if (seen.has(text)) sel.remove();
      else seen.add(text);
    });
  }).processSync(selectorList);
}

/** Scope a whole compiled stylesheet to `.superlore-doc`. Returns the rewritten CSS string. */
export function scopeCss(css) {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (inGlobalAtRule(rule)) return;
    rule.selector = scopeSelectorList(rule.selector);
  });
  return root.toString();
}

// Selectors that MUST NOT appear globally in the scoped output — the leak surface that regresses a
// host. The build asserts the output is clean against these (and CI re-greps the shipped file).
export const FORBIDDEN_GLOBAL = [
  { re: /(^|[\s,}]):root\b/, what: ":root token block" },
  { re: /(^|[\s,}]):host\b/, what: ":host token block" },
  { re: /(^|[\s,}])html[\s.,:{[]/, what: "global html selector" },
  { re: /(^|[\s,}])body[\s.,:{[]/, what: "global body selector" },
  { re: /(^|[}])\*[\s,]/, what: "global universal/preflight selector" },
];

/** Throw if any forbidden global selector survived scoping. Used by the build to fail loudly. */
export function assertScoped(css) {
  for (const { re, what } of FORBIDDEN_GLOBAL) {
    const m = re.exec(css);
    if (m) {
      const at = Math.max(0, m.index - 30);
      throw new Error(
        `runtime.css scoping leaked a ${what}: …${css.slice(at, m.index + 50)}…\n` +
          "Every selector must be rooted at `.superlore-doc`. See scope-runtime-css.mjs.",
      );
    }
  }
}
