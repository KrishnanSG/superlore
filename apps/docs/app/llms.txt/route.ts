import { source } from "@/lib/source";

/**
 * `/llms.txt` — the agent-discovery front door (llmstxt.org). A curated, plain-text index of the
 * docs, generated from the same page tree humans read, so it can't drift. Connected agents get the
 * richer typed corpus over the MCP at `/api/mcp`; this is the public, crawlable entry point for any
 * AI (or search) that doesn't speak MCP — and good for SEO / findability.
 */
export const dynamic = "force-static";

const BASE = "https://superlore.vercel.app";

const sectionFor = (url: string): string => {
  if (url.startsWith("/docs/components")) return "API Reference";
  if (url.startsWith("/docs/canvas")) return "Canvas";
  if (url.startsWith("/docs/agents")) return "Agents & MCP";
  return "Guide";
};

export function GET(): Response {
  const pages = source.getPages().slice().sort((a, b) => a.url.localeCompare(b.url));

  const bySection = new Map<string, string[]>();
  for (const p of pages) {
    const section = sectionFor(p.url);
    const desc = String(p.data.description ?? p.data.summary ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const line = `- [${p.data.title}](${BASE}${p.url})${desc ? `: ${desc}` : ""}`;
    (bySection.get(section) ?? bySection.set(section, []).get(section)!).push(line);
  }

  const order = ["Guide", "Canvas", "Agents & MCP", "API Reference"];
  const body = [
    "# superlore",
    "",
    "> The company knowledge base your agents run on. Author rich, structured docs once — canvases,",
    "> boards, timelines — and every agent reads the same corpus over MCP.",
    "",
    "superlore is MCP-native: a live MCP server serves this same content as typed, structured data",
    `at ${BASE}/api/mcp. The pages below are the human-readable docs; an agent should prefer the MCP.`,
    "",
    ...order.flatMap((section) => {
      const lines = bySection.get(section);
      return lines && lines.length ? [`## ${section}`, "", ...lines, ""] : [];
    }),
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
