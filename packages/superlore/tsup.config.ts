import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";

/**
 * Builds the published package. Three entries: the component barrel (mixed server/client),
 * the MCP server, and the Auth.js helpers. `splitting` + the preserve-directives plugin keep
 * `"use client"` at the top of each emitted chunk (required for RSC consumers). The theme CSS
 * is a raw asset, copied (not bundled) into dist/css. Peers stay external.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    mcp: "src/mcp/index.ts",
    auth: "src/auth/index.ts",
    frontmatter: "src/knowledge/frontmatter.ts",
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
