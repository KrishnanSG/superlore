/**
 * `superlore/source` — load your authored content into a page tree the UI and the MCP both read.
 * Re-exported through superlore so the content pipeline is a superlore import, not a renderer one.
 */
import type { KnowledgePage, PageFrontmatter } from "./knowledge/primitives";
import type { SuperloreIndex } from "./mcp/query";

export { loader } from "fumadocs-core/source";
export { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
export type * as PageTree from "fumadocs-core/page-tree";

/** The slice of a Fumadocs `loader()` source we read to index a corpus: each page's url + frontmatter. */
interface IndexableSource {
  getPages: () => ReadonlyArray<{
    url: string;
    data: { title?: string; description?: string; summary?: string; tags?: string[] };
  }>;
}

/**
 * Build the structured index the MCP serves — directly from your content `source`, no scraping and
 * no React render, so the agent reads the same corpus the site renders. Phase 1 indexes pages at the
 * frontmatter level (title / summary / tags) so `search` / `get_page` / `list` / `navigate` work over
 * the real content; component-level node extraction lands later, so each page's `nodes` starts empty.
 *
 * @example
 * import { buildIndexFromSource } from "superlore/source";
 * import { source } from "@/lib/source";
 * const index = buildIndexFromSource(source);
 */
export function buildIndexFromSource(source: IndexableSource): SuperloreIndex {
  const pages: KnowledgePage[] = source.getPages().map((page) => {
    const fm = page.data;
    const summary = fm.summary ?? fm.description;
    const frontmatter: PageFrontmatter = { title: fm.title ?? page.url, summary, tags: fm.tags };
    return {
      kind: "prose",
      id: page.url,
      path: page.url,
      title: fm.title,
      summary,
      tags: fm.tags,
      frontmatter,
      nodes: [],
    };
  });
  return { pages };
}
