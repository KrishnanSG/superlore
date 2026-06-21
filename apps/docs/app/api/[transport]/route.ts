import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getComponentData, getPage, list, navigate, search } from "superlore/mcp";
import type { KKind } from "superlore";
import { buildSuperloreIndex } from "@/lib/superlore-index";

// superlore's docs are public and MCP-enabled: the same structured content the site renders is
// exposed to agents here. No auth — this deploy is intentionally open. mcp-handler routes via the
// [transport] segment; with basePath "/api" the Streamable HTTP endpoint resolves to /api/mcp.
const index = buildSuperloreIndex();

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search",
      "Full-text search across the superlore documentation. Returns ranked page hits.",
      { query: z.string(), limit: z.number().int().positive().optional() },
      async ({ query, limit }) => json(search(index, query, limit)),
    );
    server.tool(
      "get_page",
      "Get a documentation page's full structured content by path (e.g. /docs/components).",
      { path: z.string() },
      async ({ path }) => {
        const page = getPage(index, path);
        return page ? json(page) : json({ error: "not_found", path });
      },
    );
    server.tool(
      "list",
      "List knowledge nodes across the corpus, filtered by kind / tag / entityType.",
      {
        kind: z.string().optional(),
        tag: z.string().optional(),
        entityType: z.string().optional(),
      },
      async ({ kind, tag, entityType }) =>
        json(list(index, { kind: kind as KKind | undefined, tag, entityType })),
    );
    server.tool(
      "navigate",
      "Follow relations from a page path / node id / entity ref — returns outgoing refs + backlinks.",
      { target: z.string() },
      async ({ target }) => json(navigate(index, target)),
    );
    server.tool(
      "get_component_data",
      "Get the structured data behind a rendered component (its knowledge face) by id.",
      { id: z.string() },
      async ({ id }) => {
        const node = getComponentData(index, id);
        return node ? json(node) : json({ error: "not_found", id });
      },
    );
  },
  {},
  { basePath: "/api" },
);

export { handler as GET, handler as POST };
