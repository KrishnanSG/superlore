/**
 * `superlore/config` — build-time helpers for your content config (`source.config.ts`).
 * Re-exported through superlore so the whole setup is superlore imports. This module is
 * intentionally React-free: it loads under raw Node ESM during the content build, so it must
 * never pull in the component barrel.
 */
export { defineConfig, defineDocs } from "fumadocs-mdx/config";
export { superloreFrontmatterSchema } from "./knowledge/frontmatter.js";
export type { SuperloreFrontmatter } from "./knowledge/frontmatter.js";

/** A navbar logo — light/dark image paths + an optional home link, the way Mintlify's docs.json does it. */
export interface SuperloreLogo {
  light?: string;
  dark?: string;
  href?: string;
}

/**
 * The shape of `superlore.json` — the canonical KB config the CLI scaffolds and the layout reads.
 * Pick your `logo` (light/dark) and `favicon`, set the brand `accent` and visual `theme`, and point
 * the `mcp`. Mirrors how Mintlify's `docs.json` centralizes brand + nav config in one file.
 */
export interface SuperloreSiteConfig {
  name: string;
  /** "product-docs" | "company-kb" | author-defined. */
  type?: string;
  /** Brand accent (any CSS colour); light + dark derived. */
  accent?: string;
  /** Visual theme skin: "default" | "mint". */
  theme?: string;
  /** Navbar logo — light/dark images + home link. */
  logo?: SuperloreLogo;
  /** Favicon path (svg / png / ico). */
  favicon?: string;
  /** MCP endpoint config. */
  mcp?: { enabled?: boolean; path?: string };
}
