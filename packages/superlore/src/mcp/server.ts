import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { KKind } from "../knowledge/primitives";
import { getComponentData, getPage, list, navigate, search, type SuperloreIndex } from "./query";

export interface SuperloreMcpOptions {
  index: SuperloreIndex;
  name?: string;
  version?: string;
}

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/**
 * Build the superlore MCP server over a prebuilt knowledge index. The same structured data the
 * human site renders is exposed to agents — no scraping, no drift. Mount it on any transport
 * (Streamable HTTP in a Next route, or InMemoryTransport in tests).
 */
export function createSuperloreMcpServer(opts: SuperloreMcpOptions): McpServer {
  const { index } = opts;
  const server = new McpServer({
    name: opts.name ?? "superlore",
    version: opts.version ?? "0.1.0",
  });

  server.tool(
    "search",
    "Full-text search across the knowledge base. Returns ranked page hits.",
    { query: z.string(), limit: z.number().int().positive().optional() },
    async ({ query, limit }) => json(search(index, query, limit)),
  );

  server.tool(
    "get_page",
    "Get a page's full structured content (frontmatter + ordered knowledge nodes) by path.",
    { path: z.string() },
    async ({ path }) => {
      const page = getPage(index, path);
      return page ? json(page) : json({ error: "not_found", path });
    },
  );

  server.tool(
    "get_section",
    "Get a single knowledge node by its global id `${path}#${id}`.",
    { id: z.string() },
    async ({ id }) => {
      const node = getComponentData(index, id);
      return node ? json(node) : json({ error: "not_found", id });
    },
  );

  server.tool(
    "list",
    "List knowledge nodes across the corpus, filtered by kind / tag / entityType.",
    { kind: z.string().optional(), tag: z.string().optional(), entityType: z.string().optional() },
    async ({ kind, tag, entityType }) =>
      json(list(index, { kind: kind as KKind | undefined, tag, entityType })),
  );

  server.tool(
    "navigate",
    "Follow relations from a page path, node id, or entity ref — returns outgoing refs + backlinks.",
    { target: z.string() },
    async ({ target }) => json(navigate(index, target)),
  );

  server.tool(
    "get_component_data",
    "Get the structured data behind a rendered component (its knowledge face) by id — never a picture.",
    { id: z.string() },
    async ({ id }) => {
      const node = getComponentData(index, id);
      return node ? json(node) : json({ error: "not_found", id });
    },
  );

  return server;
}
