"use client";

/**
 * `superlore/runtime` — render a superlore MDX **string** live, in any host app.
 *
 * The docs build compiles MDX at build time; a host that stores docs as strings (in a database, a
 * CMS, an editor buffer) needs to compile and render them at runtime. This module is that surface:
 * give it an MDX string and it returns the rendered document — the same components, the same Canvas,
 * and the same Shiki code highlighting as a published superlore page, from one authored source.
 *
 * It is the single abstraction a companion app consumes: import {@link SuperloreDoc} (or the
 * {@link useSuperloreMdx} hook / {@link compileMdxSource} function), pair it with the portable
 * stylesheet (`superlore/runtime.css`), and the doc renders natively — no iframe, nothing copied.
 *
 * Client-only: it evaluates MDX in the browser via `@mdx-js/mdx`, so it must run in a client
 * component (the "use client" directive above marks the whole module).
 */
import * as jsxRuntime from "react/jsx-runtime";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import { rehypeCode, rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins/rehype-code";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { DocsBody } from "fumadocs-ui/page";
import type { MDXComponents } from "mdx/types";
import { getMDXComponents } from "./components/mdx";
import { remarkSuperlore } from "./mdx";
import { cn } from "./lib/cn";

/**
 * A unified plugin (or `[plugin, options]` tuple). Kept structural so the public type never forces
 * the host to depend on `unified` — appended after superlore's core remark/rehype sets.
 */
export type RuntimePlugin = unknown;

/** Options shared by {@link compileMdxSource}, {@link useSuperloreMdx}, and {@link SuperloreDoc}. */
export interface SuperloreRuntimeOptions {
  /** Override or extend the component set. Merged over {@link getMDXComponents}. */
  components?: MDXComponents;
  /** Extra remark plugins, appended after superlore's core set (frontmatter, gfm, canvas). */
  remarkPlugins?: RuntimePlugin[];
  /** Extra rehype plugins, appended after superlore's core set (slug, Shiki code). */
  rehypePlugins?: RuntimePlugin[];
}

/** The result of compiling a superlore MDX string. */
export interface CompiledSuperloreDoc {
  /** The rendered document component. Pass `components` to override the set at render time. */
  Content: ComponentType<{ components?: MDXComponents }>;
  /** The page's parsed frontmatter (from `remark-mdx-frontmatter`). */
  frontmatter: Record<string, unknown>;
}

// Shiki's no-WASM JavaScript regex engine: code highlighting that runs in the browser (and inside a
// VS Code webview's CSP) with no `wasm-unsafe-eval`. `forgiving` degrades an unsupported grammar
// rather than throwing. Created once for the module — the highlighter is reused across compiles.
const shikiEngine = createJavaScriptRegexEngine({ forgiving: true });

// superlore's core MDX pipeline — identical in shape to the docs build, so a runtime-rendered string
// matches a published page: frontmatter + GFM + the `superlore-canvas` fence on the remark side;
// heading slugs + Shiki code (the same `rehypeCode` the build uses) on the rehype side.
const CORE_REMARK: RuntimePlugin[] = [
  remarkFrontmatter,
  remarkMdxFrontmatter,
  remarkGfm,
  // After GFM (which parses task-list checkboxes): canvas fences → <Canvas>, task lists →
  // <Checklist>, GitHub alerts → Callouts. One plugin, the whole markdown-first upgrade set.
  remarkSuperlore,
];
const CORE_REHYPE: RuntimePlugin[] = [
  rehypeSlug,
  [rehypeCode, { ...rehypeCodeDefaultOptions, engine: shikiEngine }],
];

/**
 * Compile a superlore MDX string into a renderable component + its frontmatter. Throws on invalid
 * MDX — callers that render user content should catch (or use {@link SuperloreDoc}, which does).
 */
export async function compileMdxSource(
  source: string,
  options: SuperloreRuntimeOptions = {},
): Promise<CompiledSuperloreDoc> {
  const mod = await evaluate(source, {
    ...jsxRuntime,
    remarkPlugins: [...CORE_REMARK, ...(options.remarkPlugins ?? [])],
    rehypePlugins: [...CORE_REHYPE, ...(options.rehypePlugins ?? [])],
  } as Parameters<typeof evaluate>[1]);
  return {
    Content: mod.default as CompiledSuperloreDoc["Content"],
    frontmatter: ((mod as { frontmatter?: Record<string, unknown> }).frontmatter ?? {}) as Record<
      string,
      unknown
    >,
  };
}

/** State returned by {@link useSuperloreMdx}. */
export interface SuperloreMdxState {
  Content: CompiledSuperloreDoc["Content"] | null;
  frontmatter: Record<string, unknown>;
  /** Compile error message, or `null`. On error the last good `Content` is retained. */
  error: string | null;
}

/**
 * Compile `source` whenever it changes, keeping the last good render on a compile error (so an
 * in-progress edit never blanks the view). Plugin/component options are read at compile time; pass
 * stable references (module-level arrays) if they matter.
 */
export function useSuperloreMdx(
  source: string,
  options: SuperloreRuntimeOptions = {},
): SuperloreMdxState {
  const [state, setState] = useState<SuperloreMdxState>({
    Content: null,
    frontmatter: {},
    error: null,
  });
  // Keep the latest options without making them an effect dependency (option object literals are new
  // each render; recompiling should track the source, not identity churn). Written in an effect, not
  // during render — and declared before the compile effect so it refreshes first on a source change.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    let cancelled = false;
    compileMdxSource(source, optionsRef.current)
      .then((result) => {
        if (cancelled) return;
        setState({ Content: result.Content, frontmatter: result.frontmatter, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Retain the prior Content — surface the error alongside the last good render.
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : String(err),
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return state;
}

/** Props for {@link SuperloreDoc}. */
export interface SuperloreDocProps extends SuperloreRuntimeOptions {
  /** The superlore MDX string to render. */
  source: string;
  /** Class added to the doc surface wrapper (alongside `superlore-doc`). */
  className?: string;
  /** Called with the parsed frontmatter after each successful compile (e.g. to render a host hero). */
  onFrontmatter?: (frontmatter: Record<string, unknown>) => void;
  /** Called with the message when a compile fails. */
  onError?: (message: string) => void;
  /** Rendered when nothing has compiled yet (first paint / a first-compile error). */
  fallback?: ReactNode;
}

/**
 * Render a superlore MDX string as a native document. The 90%-case entry point: drop it into a host
 * app, give it `source`, and the doc renders with superlore's components, Canvas, and Shiki code —
 * the same as a published page. Wraps the body in fumadocs' `DocsBody` so prose styling applies; the
 * portable `superlore/runtime.css` makes it look right outside a superlore site.
 */
export function SuperloreDoc({
  source,
  className,
  components,
  remarkPlugins,
  rehypePlugins,
  onFrontmatter,
  onError,
  fallback = null,
}: SuperloreDocProps): ReactNode {
  const { Content, frontmatter, error } = useSuperloreMdx(source, {
    components,
    remarkPlugins,
    rehypePlugins,
  });

  // Fire host callbacks as compile state settles, without coupling them into render. Latest-ref
  // pattern, written in an effect (never during render) and declared before the firing effects.
  const onFrontmatterRef = useRef(onFrontmatter);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onFrontmatterRef.current = onFrontmatter;
    onErrorRef.current = onError;
  });
  useEffect(() => {
    if (Content) onFrontmatterRef.current?.(frontmatter);
  }, [Content, frontmatter]);
  useEffect(() => {
    if (error) onErrorRef.current?.(error);
  }, [error]);

  if (!Content) return <>{fallback}</>;

  return (
    <DocsBody className={cn("superlore-doc", className)}>
      <Content components={getMDXComponents(components)} />
    </DocsBody>
  );
}

/**
 * Brand tokens a host maps onto superlore's palette. Every value is any CSS color string — including
 * `var(--your-own-token)`, so a host's existing light/dark flip cascades into the doc for free (no
 * re-passing tokens on theme change). All optional: set only the accent to rebrand, or surfaces too.
 */
export interface SuperloreThemeTokens {
  /** Primary accent — links, active state, focus ring. */
  accent?: string;
  /** Accent hover state. */
  accentHover?: string;
  /** Accent-colored text on a surface. */
  accentText?: string;
  /** Subtle accent background (chips, highlights). */
  accentMuted?: string;
  /** Accent outline / border. */
  accentBorder?: string;
  /** Text/icon shown ON the accent fill. */
  accentInk?: string;
  /** Page background. */
  background?: string;
  /** Card / panel surface. */
  surface?: string;
  /** Hover / nested surface. */
  surface2?: string;
  /** Default border. */
  border?: string;
  /** Separators / subtle borders. */
  borderSubtle?: string;
  /** Primary text. */
  text?: string;
  /** Secondary text. */
  text2?: string;
  /** Muted text / icons. */
  text3?: string;
  /** Success / done. */
  success?: string;
  /** Warning / in-progress. */
  warning?: string;
  /** Danger / error. */
  danger?: string;
  /** Escape hatch — raw CSS-variable overrides, e.g. `{ "--kp-canvas-edge": "#…" }`. */
  vars?: Record<string, string>;
}

// Friendly token → the superlore (`--kp-*`) and fumadocs (`--color-fd-*`) custom properties it drives.
// Components read these via Tailwind's `@theme inline` (utilities inline `var(--kp-accent)` directly,
// with no intermediate `--color-kp-accent`), so setting them on an ancestor recolors the subtree.
const TOKEN_VARS: Record<keyof Omit<SuperloreThemeTokens, "vars">, readonly string[]> = {
  accent: ["--kp-accent", "--color-fd-primary", "--color-fd-ring"],
  accentHover: ["--kp-accent-hover"],
  accentText: ["--kp-accent-text"],
  accentMuted: ["--kp-accent-weak", "--color-fd-accent"],
  accentBorder: ["--kp-accent-border"],
  accentInk: ["--kp-accent-ink", "--color-fd-primary-foreground"],
  background: ["--kp-bg-elev", "--color-fd-background"],
  surface: ["--kp-surface", "--color-fd-card", "--color-fd-popover"],
  surface2: ["--kp-surface-2", "--color-fd-muted", "--color-fd-secondary"],
  border: ["--kp-border", "--color-fd-border"],
  borderSubtle: ["--kp-border-subtle"],
  text: ["--color-fd-foreground", "--color-fd-card-foreground", "--color-fd-popover-foreground"],
  text2: ["--kp-text-2", "--color-fd-muted-foreground"],
  text3: ["--kp-text-3"],
  success: ["--kp-success"],
  warning: ["--kp-warning"],
  danger: ["--kp-danger"],
};

/** Turn friendly tokens into the CSS custom properties to set on the wrapper. */
function tokensToStyle(tokens: SuperloreThemeTokens): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (key === "vars" || typeof value !== "string") continue;
    for (const cssVar of TOKEN_VARS[key as keyof typeof TOKEN_VARS] ?? []) style[cssVar] = value;
  }
  if (tokens.vars) Object.assign(style, tokens.vars);
  return style as CSSProperties;
}

/** Props for {@link SuperloreTheme}. */
export interface SuperloreThemeProps {
  /** Brand tokens to apply to everything inside. */
  tokens: SuperloreThemeTokens;
  /** Class added to the theme wrapper. */
  className?: string;
  children: ReactNode;
}

/**
 * Render superlore in the **host's** brand. Wrap a {@link SuperloreDoc} (or any superlore content) and
 * the tokens cascade as CSS variables — links, accents, focus rings, and surfaces all adopt your
 * palette instead of superlore's defaults. Sugar over a plain CSS-variable contract: you can set the
 * same `--kp-*` / `--color-fd-*` variables yourself anywhere above the doc and get the identical result.
 *
 * ```tsx
 * <SuperloreTheme tokens={{ accent: "var(--brand)", accentText: "var(--brand)" }}>
 *   <SuperloreDoc source={mdx} />
 * </SuperloreTheme>
 * ```
 */
export function SuperloreTheme({ tokens, className, children }: SuperloreThemeProps): ReactNode {
  return (
    <div className={cn("superlore-theme", className)} style={tokensToStyle(tokens)}>
      {children}
    </div>
  );
}
