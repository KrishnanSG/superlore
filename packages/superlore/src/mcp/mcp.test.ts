// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createSuperloreMcpServer } from "./server";
import { serializePage } from "../knowledge/extract";
import "../components/timeline"; // registers the Timeline knowledge face

type TextResult = { content: { type: string; text: string }[] };

function buildIndex() {
  const page = serializePage({ title: "Roadmap", summary: "What ships when." }, "/roadmap", [
    {
      name: "Timeline",
      props: { items: [{ date: "2026-Q3", title: "GA launch", status: "planned" }] },
    },
  ]);
  return { index: { pages: [page] }, page };
}

describe("superlore MCP — parity with the in-process serializer", () => {
  it("serves get_component_data matching exactly what the component serializes (no drift)", async () => {
    const { index, page } = buildIndex();
    const server = createSuperloreMcpServer({ index });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test", version: "0.0.0" });
    await Promise.all([server.connect(serverT), client.connect(clientT)]);

    const nodeId = page.nodes[0]!.id;
    const res = (await client.callTool({
      name: "get_component_data",
      arguments: { id: nodeId },
    })) as TextResult;
    const data = JSON.parse(res.content[0]!.text);

    expect(data.kind).toBe("timeline");
    expect(data.items[0].title).toBe("GA launch");
    expect(data.items[0].date).toEqual({ iso: "2026-Q3", precision: "quarter" });
    expect(data).toEqual(page.nodes[0]); // the MCP serves the SAME object the serializer produced

    const hits = (await client.callTool({
      name: "search",
      arguments: { query: "ships" },
    })) as TextResult;
    expect(JSON.parse(hits.content[0]!.text)[0].path).toBe("/roadmap");

    await client.close();
  });
});
