import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { source } from "@/lib/source";

/**
 * `/llms-full.txt` — the whole corpus as one plain-text document (llmstxt.org's "full" variant).
 * Where `/llms.txt` is a curated index of links, this concatenates the actual content of every doc
 * page so an LLM (or crawler that doesn't speak MCP) can ingest the entire knowledge base in a single
 * fetch. Generated from the same page tree humans read, so it can't drift. Connected agents should
 * still prefer the typed MCP corpus at `/api/mcp`.
 */
export const dynamic = "force-static";

const BASE = "https://superlore.vercel.app";
const DOCS_DIR = join(process.cwd(), "content", "docs");

/** Map a doc URL (`/docs/agents/mcp/tools`) to its source file (`…/tools.mdx` or `…/index.mdx`). */
function fileForUrl(url: string): string | null {
  const rel = url.replace(/^\/docs\/?/, "");
  const candidates = rel === "" ? ["index.mdx"] : [`${rel}.mdx`, `${rel}/index.mdx`];
  for (const candidate of candidates) {
    const abs = join(DOCS_DIR, candidate);
    if (existsSync(abs)) return abs;
  }
  return null;
}

/** Drop the YAML frontmatter block so the body reads as clean prose. */
function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  const after = raw.indexOf("\n", end + 1);
  return after === -1 ? "" : raw.slice(after + 1);
}

export function GET(): Response {
  const pages = source
    .getPages()
    .slice()
    .sort((a, b) => a.url.localeCompare(b.url));

  const parts: string[] = [
    "# superlore — full documentation",
    "",
    "> The company knowledge base your agents run on. Author rich, structured docs once — canvases,",
    "> boards, timelines — and every agent reads the same corpus over MCP.",
    "",
    `This file concatenates every documentation page. A live MCP server at ${BASE}/api/mcp serves the`,
    "same content as typed, structured data — an agent should prefer the MCP.",
    "",
    "---",
    "",
  ];

  for (const page of pages) {
    const file = fileForUrl(page.url);
    if (!file) continue;
    const body = stripFrontmatter(readFileSync(file, "utf8")).trim();
    parts.push(
      `# ${page.data.title}`,
      "",
      `Source: ${BASE}${page.url}`,
      ...(page.data.description
        ? ["", `> ${String(page.data.description).replace(/\s+/g, " ").trim()}`]
        : []),
      "",
      body,
      "",
      "---",
      "",
    );
  }

  return new Response(parts.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
