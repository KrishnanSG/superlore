/**
 * `superlore/source` — load your authored content into a page tree the UI and the MCP both read.
 * Re-exported through superlore so the content pipeline is a superlore import, not a renderer one.
 */
import type { KnowledgePage, PageFrontmatter, PageHeading } from "./knowledge/primitives";
import type { SuperloreIndex } from "./mcp/query";

export { loader } from "fumadocs-core/source";
export { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
export type * as PageTree from "fumadocs-core/page-tree";

/** A Fumadocs `structuredData` block — plain-text headings + paragraph contents, in document order. */
interface StructuredData {
  headings?: { id?: string; content?: string }[];
  contents?: { heading?: string; content?: string }[];
}

/** The slice of a Fumadocs `loader()` source we read to index a corpus: each page's url + data. */
interface IndexableSource {
  getPages: () => ReadonlyArray<{
    url: string;
    data: {
      title?: string;
      description?: string;
      summary?: string;
      tags?: string[];
      /** Fumadocs' extracted plain-text content (present when the structure remark plugin ran). */
      structuredData?: StructuredData;
      /** Fumadocs' table of contents — headings with depth. */
      toc?: { depth?: number; title?: unknown; url?: string }[];
    };
  }>;
}

export interface BuildIndexOptions {
  /**
   * Return the page's raw authored body (ideally with frontmatter stripped) for a given url. Wire
   * this to your content directory and `get_page` serves the literal **MDX** — components and all —
   * instead of extracted prose, and `grep` matches the real source. Omit it and the body falls back
   * to Fumadocs' `structuredData` plain text, which works with zero wiring.
   */
  readContent?: (url: string) => string | undefined;
}

/** Best-effort plain text from a Fumadocs toc title (string, or a node we can't read here). */
function headingText(title: unknown): string {
  return typeof title === "string" ? title : "";
}

interface PageData {
  toc?: { depth?: number; title?: unknown; url?: string }[];
  structuredData?: StructuredData;
}

/** Build the page outline from toc (has depth) enriched by structuredData (has ids + text). */
function buildHeadings(data: PageData): PageHeading[] {
  const fromToc = (data.toc ?? [])
    .map((h) => ({
      depth: h.depth ?? 2,
      id: h.url?.replace(/^#/, ""),
      text: headingText(h.title),
    }))
    .filter((h) => h.text || h.id);
  if (fromToc.length) {
    // Backfill missing text from structuredData by id.
    const byId = new Map((data.structuredData?.headings ?? []).map((h) => [h.id, h.content ?? ""]));
    return fromToc.map((h) => ({ ...h, text: h.text || byId.get(h.id) || h.id || "" }));
  }
  return (data.structuredData?.headings ?? [])
    .filter((h) => h.content || h.id)
    .map((h) => ({ depth: 2, id: h.id, text: h.content ?? h.id ?? "" }));
}

/** Plain-text body assembled from structuredData paragraph contents, in document order. */
function structuredText(sd: StructuredData | undefined): string {
  return (sd?.contents ?? [])
    .map((c) => c.content?.trim())
    .filter((c): c is string => Boolean(c))
    .join("\n\n")
    .trim();
}

/**
 * Build the structured index the MCP serves — directly from your content `source`, no scraping and
 * no React render, so the agent reads the same corpus the site renders. Each page carries its
 * frontmatter, its **body** (raw MDX when {@link BuildIndexOptions.readContent} is wired, else the
 * extracted plain text), and its headings — so `get_page` returns content an agent can actually
 * read and `grep` / `search` match the real text. Component-level node extraction (the typed dual
 * representation) layers on top as it lands; `nodes` stays `[]` until then.
 *
 * @example
 * import { buildIndexFromSource } from "superlore/source";
 * import { source } from "@/lib/source";
 * const index = buildIndexFromSource(source);
 */
export function buildIndexFromSource(
  source: IndexableSource,
  opts: BuildIndexOptions = {},
): SuperloreIndex {
  const pages: KnowledgePage[] = source.getPages().map((page) => {
    const fm = page.data;
    const summary = fm.summary ?? fm.description;
    const frontmatter: PageFrontmatter = { title: fm.title ?? page.url, summary, tags: fm.tags };

    const raw = opts.readContent?.(page.url)?.trim();
    const content = raw || structuredText(fm.structuredData) || undefined;
    const contentType: "mdx" | "text" | undefined = !content ? undefined : raw ? "mdx" : "text";
    const headings = buildHeadings(fm);

    return {
      kind: "prose",
      id: page.url,
      path: page.url,
      title: fm.title,
      summary,
      tags: fm.tags,
      frontmatter,
      content,
      contentType,
      headings: headings.length ? headings : undefined,
      nodes: [],
    };
  });
  return { pages };
}
