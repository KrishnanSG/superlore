/**
 * `superlore/config` — build-time helpers for your content config (`source.config.ts`).
 * Re-exported through superlore so the whole setup is superlore imports. This module is
 * intentionally React-free: it loads under raw Node ESM during the content build, so it must
 * never pull in the component barrel.
 */
export { defineConfig, defineDocs } from "fumadocs-mdx/config";
export { superloreFrontmatterSchema } from "./knowledge/frontmatter.js";
export type { SuperloreFrontmatter } from "./knowledge/frontmatter.js";
