import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";

/**
 * Builds the published package. Entries: the component barrel (mixed server/client), the MCP server,
 * the Auth.js helpers, the frontmatter schema, and the single-import surface (ui/source/config/next)
 * that re-exports the framework so consumers never import fumadocs/next directly. `splitting` + the
 * preserve-directives plugin keep `"use client"` at the top of each emitted chunk (required for RSC
 * consumers). The theme CSS is a raw asset, copied (not bundled) into dist/css. Peers stay external.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    mcp: "src/mcp/index.ts",
    auth: "src/auth/index.ts",
    frontmatter: "src/knowledge/frontmatter.ts",
    // The single-import surface. publishConfig.exports points ./ui ./source ./config ./next at the
    // dist files these produce — they MUST be built or a real consumer's `superlore/source` 404s.
    ui: "src/ui.tsx",
    source: "src/source.ts",
    config: "src/config.ts",
    next: "src/next.ts",
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
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
  ],
  esbuildPlugins: [
    preserveDirectivesPlugin({
      directives: ["use client", "use server"],
      include: /\.(jsx?|tsx?)$/,
      exclude: /node_modules/,
    }),
  ],
  // Copy the theme CSS to the exact path the `./css` export points at (dist/css/superlore.css).
  // Copying the *file* (not the dir) keeps it deterministic regardless of whether dist/css exists.
  onSuccess: "mkdir -p dist/css && cp src/theme/superlore.css dist/css/superlore.css",
});
