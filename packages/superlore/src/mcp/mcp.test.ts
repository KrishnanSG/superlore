// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createSuperloreMcpServer } from "./server";
import { grep, glob, getPage, search } from "./query";
import { serializePage } from "../knowledge/extract";
import { buildIndexFromSource } from "../source";
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

  it("grep / glob find content like a folder, and get_page returns the body", async () => {
    const { index } = buildIndex();
    // Attach a body so get_page returns readable content and grep has something to match.
    index.pages[0]!.content = "# Roadmap\n\nThe GA launch ships in Q3.\nBeta opens earlier.";
    index.pages[0]!.contentType = "mdx";
    const server = createSuperloreMcpServer({ index });
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test", version: "0.0.0" });
    await Promise.all([server.connect(serverT), client.connect(clientT)]);

    const page = (await client.callTool({
      name: "get_page",
      arguments: { path: "/roadmap" },
    })) as TextResult;
    expect(JSON.parse(page.content[0]!.text).content).toContain("GA launch ships");

    const g = (await client.callTool({
      name: "grep",
      arguments: { pattern: "ships in Q\\d" },
    })) as TextResult;
    const matches = JSON.parse(g.content[0]!.text);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ path: "/roadmap", line: 3 });

    const gl = (await client.callTool({
      name: "glob",
      arguments: { pattern: "/road*" },
    })) as TextResult;
    expect(JSON.parse(gl.content[0]!.text)[0].path).toBe("/roadmap");

    await client.close();
  });
});

describe("buildIndexFromSource — pages carry body + headings, not just frontmatter", () => {
  const fakeSource = {
    getPages: () => [
      {
        url: "/docs/guide",
        data: {
          title: "Guide",
          summary: "How to drive it.",
          tags: ["guide"],
          toc: [{ depth: 2, title: "Setup", url: "#setup" }],
          structuredData: {
            headings: [{ id: "setup", content: "Setup" }],
            contents: [
              { heading: "setup", content: "Install the package." },
              { heading: "setup", content: "Then run the server." },
            ],
          },
        },
      },
    ],
  };

  it("falls back to structuredData prose when no raw reader is wired", () => {
    const index = buildIndexFromSource(fakeSource);
    const page = getPage(index, "/docs/guide")!;
    expect(page.contentType).toBe("text");
    expect(page.content).toContain("Install the package.");
    expect(page.content).toContain("run the server");
    expect(page.headings).toEqual([{ depth: 2, id: "setup", text: "Setup" }]);
    // grep + search now hit the body, not just frontmatter.
    expect(grep(index, "run the server")).toHaveLength(1);
    expect(search(index, "install").length).toBeGreaterThan(0);
  });

  it("serves raw MDX when readContent is wired", () => {
    const index = buildIndexFromSource(fakeSource, {
      readContent: () => "## Setup\n\nimport { X } from 'pkg'\n\n<Canvas id=\"c\" />",
    });
    const page = getPage(index, "/docs/guide")!;
    expect(page.contentType).toBe("mdx");
    expect(page.content).toContain("<Canvas");
    expect(glob(index, "/docs/**")[0]!.path).toBe("/docs/guide");
  });
});
