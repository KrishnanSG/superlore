import { defineConfig } from "tsdown";

/**
 * Builds the published package. tsdown (rolldown) is used instead of tsup specifically because it
 * preserves `"use client"` / `"use server"` directives natively — every client component (Canvas,
 * ThemeToggle, the Isolate error boundary, walkthrough, diagram…) keeps its boundary in the dist, so
 * a real RSC consumer (Next) treats them correctly instead of evaluating client classes on the server.
 *
 * Entries: the component barrel (mixed server/client), the MCP server, the Auth.js helpers, the
 * frontmatter schema, and the single-import surface (ui/source/config/next) that re-exports the
 * framework. The theme CSS is copied into dist/css by the build script (a raw asset). Peers external.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    mcp: "src/mcp/index.ts",
    auth: "src/auth/index.ts",
    frontmatter: "src/knowledge/frontmatter.ts",
    mdx: "src/mdx.ts",
    "mdx-lint": "src/mdx-lint.ts",
    search: "src/search.ts",
    ui: "src/ui.tsx",
    runtime: "src/runtime.tsx",
    source: "src/source.ts",
    config: "src/config.ts",
    next: "src/next.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  // Preserve module boundaries (one output file per source module) instead of merging into shared
  // chunks. Critical for RSC: a "use client" file keeps its OWN directive in its OWN output file,
  // rather than being merged into a mixed server/client chunk that drops the directive.
  unbundle: true,
  external: [
    "react",
    "react-dom",
    "next",
    "next-auth",
    "next-themes",
    "fumadocs-ui",
    "fumadocs-core",
    "fumadocs-mdx",
    "mermaid",
    "@modelcontextprotocol/sdk",
    // Type-only deps the emitted .d.mts references — keep external so the consumer's single copy is
    // used (bundling @types/mdx duplicates MDXComponents and clashes nominally with the consumer's).
    "mdx/types",
    "@types/mdx",
  ],
});
