import { describe, expect, it } from "vitest";
import {
  scopeCss,
  scopeSelectorList,
  assertScoped,
  FORBIDDEN_GLOBAL,
} from "./scope-runtime-css.mjs";

// These tests pin the contract `superlore/runtime.css` ships under: every selector rooted at
// `.superlore-doc`, dark mode on the container, registrations/keyframes left global. The scoping
// regressed twice before (global `:root`/`body` leaked into a host); a leak here fails CI pre-publish.

describe("scopeSelectorList", () => {
  it("maps :root / :host / html / body onto the container", () => {
    expect(scopeSelectorList(":root")).toBe(".superlore-doc");
    expect(scopeSelectorList("html,:host")).toBe(".superlore-doc"); // duplicates collapse
    expect(scopeSelectorList("body")).toBe(".superlore-doc");
  });

  it("collapses the light token list and turns html.dark into a container dark selector", () => {
    expect(scopeSelectorList(":root,:root.light,html:not(.dark)")).toBe(
      ".superlore-doc,.superlore-doc.light,.superlore-doc:not([data-theme=dark])",
    );
    expect(scopeSelectorList("html.dark")).toBe(".superlore-doc[data-theme=dark]");
  });

  it("scopes the preflight universal + pseudo-elements to container descendants", () => {
    expect(scopeSelectorList("*,:before,:after,::backdrop")).toBe(
      ".superlore-doc *,.superlore-doc :before,.superlore-doc :after,.superlore-doc ::backdrop",
    );
    expect(scopeSelectorList("::selection")).toBe(".superlore-doc ::selection");
  });

  it("prefixes ordinary utilities / ids / attributes under the container", () => {
    expect(scopeSelectorList(".flex")).toBe(".superlore-doc .flex");
    expect(scopeSelectorList("#nd-docs-layout:has(.x)")).toBe(
      ".superlore-doc #nd-docs-layout:has(.x)",
    );
    expect(scopeSelectorList("[dir=rtl]")).toBe(".superlore-doc [dir=rtl]");
  });

  it("rewrites a bare .dark class (incl. inside :where) without touching escaped utility classes", () => {
    // The dark variant: `.dark\:bg-x:where(.dark, .dark *)` — the `:where(.dark…)` becomes
    // container-local, but the escaped class name `.dark\:bg-x` (value `dark:bg-x`) is untouched.
    const out = scopeSelectorList(".dark\\:bg-x:where(.dark,.dark *)");
    expect(out).toBe(".superlore-doc .dark\\:bg-x:where([data-theme=dark],[data-theme=dark] *)");
    expect(out).toContain(".dark\\:bg-x"); // escaped utility class preserved verbatim
  });
});

describe("scopeCss", () => {
  const SAMPLE = `
    @layer theme, base, components, utilities;
    @property --tw-rotate-x { syntax: "*"; inherits: false }
    @layer theme { :root,:host { --font-sans: ui-sans-serif; --font-mono: ui-monospace } }
    :root,:root.light,html:not(.dark) { --color-fd-background:#fcfcfd }
    html.dark { --color-fd-background:#0b0c0e }
    html,:host { line-height:1.5 }
    body { background-color:var(--color-fd-background) }
    @layer base { *,:after,:before { box-sizing:border-box; margin:0 } }
    .flex { display:flex }
    .dark\\:bg-x:where(.dark,.dark *) { background:#000 }
    @keyframes spin { from { transform:rotate(0) } to { transform:rotate(360deg) } }
    @media (min-width:48rem) { .md\\:flex { display:flex } }
    @supports (color:color-mix(in lab,red,red)) { :root { --x:1 } }
  `;
  const out = scopeCss(SAMPLE);

  it("produces no global root/element/preflight selectors (the host-leak surface)", () => {
    expect(() => assertScoped(out)).not.toThrow();
    for (const { re } of FORBIDDEN_GLOBAL) expect(out).not.toMatch(re);
  });

  it("keeps @property and @keyframes global and unscoped", () => {
    expect(out).toMatch(/@property --tw-rotate-x/);
    // keyframe steps must NOT be scoped — `.superlore-doc from {}` would be invalid
    expect(out).toMatch(/@keyframes spin/);
    expect(out).not.toMatch(/\.superlore-doc\s+from/);
    expect(out).not.toMatch(/\.superlore-doc\s+to\b/);
  });

  it("scopes rules nested in @layer / @media / @supports", () => {
    expect(out).toMatch(/\.superlore-doc \.flex/);
    expect(out).toMatch(/\.superlore-doc \.md\\:flex/);
    expect(out).toMatch(/@supports[^{]+\{\s*\.superlore-doc\b/);
  });

  it("moves dark mode onto the container and font tokens off global :root", () => {
    expect(out).toMatch(/\.superlore-doc\[data-theme=dark\]\s*\{\s*--color-fd-background:#0b0c0e/);
    expect(out).toMatch(/\.superlore-doc\b[^{]*\{[^}]*--font-sans/);
  });
});

describe("assertScoped", () => {
  it("throws when a global :root / html / body / universal leaks", () => {
    expect(() => assertScoped(":root{--x:1}")).toThrow(/:root/);
    expect(() => assertScoped("html{color:red}")).toThrow(/html/);
    expect(() => assertScoped("body{margin:0}")).toThrow(/body/);
    expect(() => assertScoped("}*,{x:1}")).toThrow(/universal/);
  });

  it("passes clean, fully-scoped output", () => {
    expect(() =>
      assertScoped(".superlore-doc{--x:1}.superlore-doc .flex{display:flex}"),
    ).not.toThrow();
  });
});
