import { source } from "@/lib/source";
import type { KnowledgePage } from "superlore";
import type { SuperloreIndex } from "superlore/mcp";

interface DocFrontmatter {
  title?: string;
  description?: string;
  summary?: string;
  tags?: string[];
}

/**
 * Build the structured index the MCP serves from the Fumadocs source. Phase 1 indexes pages at
 * the frontmatter level (title / summary / tags) so search / get_page / list / navigate work
 * over the real docs. Component-level node extraction from the MDX AST lands in Phase 2 (see
 * docs/COMPONENTS.md §4); until then `nodes` is empty.
 */
export function buildSuperloreIndex(): SuperloreIndex {
  const pages: KnowledgePage[] = source.getPages().map((p) => {
    const fm = p.data as DocFrontmatter;
    const summary = fm.summary ?? fm.description;
    return {
      kind: "prose",
      id: p.url,
      path: p.url,
      title: fm.title,
      summary,
      tags: fm.tags,
      frontmatter: { title: fm.title ?? p.url, summary, tags: fm.tags },
      nodes: [],
    };
  });
  return { pages };
}
