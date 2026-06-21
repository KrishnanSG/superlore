import { describe, it, expect } from "vitest";
import "./canvas"; // registers the Canvas knowledge face
import "../comparison"; // registers the Comparison face, so an embedded Comparison serializes
import { parseCanvasSpec } from "./parse-spec";
import { serializeComponent } from "../../knowledge/registry";
import { createExtractCtx } from "../../knowledge/extract";
import type { DiagramNode } from "../../knowledge/primitives";

const json = JSON.stringify({
  title: "Launch board",
  nodes: [
    { id: "auth", kind: "sticky", label: "Ship MCP auth", to: "mcp" },
    { id: "mcp", kind: "card", label: "MCP server" },
  ],
  edges: [{ from: "auth", to: "mcp", rel: "depends-on", label: "serializes via" }],
});

describe("Canvas — spec + dual representation", () => {
  it("normalizes the spec and expands `to` sugar into edges", () => {
    const canvas = parseCanvasSpec(json);
    // one explicit edge + one from the `to:"mcp"` sugar
    expect(canvas.edges).toHaveLength(2);
    expect(canvas.edges.some((e) => e.from === "auth" && e.to === "mcp")).toBe(true);
  });

  it("serializes the superlore-canvas spec to a typed graph (the knowledge face)", () => {
    const ctx = createExtractCtx({ pageId: "/board" });
    const node = serializeComponent("Canvas", { json }, ctx) as DiagramNode;

    expect(node.kind).toBe("diagram");
    expect(node.syntax).toBe("canvas");
    expect(node.graph?.nodes).toEqual([
      { id: "auth", label: "Ship MCP auth", group: undefined, kind: "sticky" },
      { id: "mcp", label: "MCP server", group: undefined, kind: "card" },
    ]);
    expect(node.graph?.edges.find((e) => e.rel === "depends-on")).toMatchObject({
      from: "auth",
      to: "mcp",
      label: "serializes via",
    });
    // typed relation surfaces as a navigable ref; knowledge face is data, never markup
    expect(node.refs?.some((r) => r.rel === "depends-on" && r.target === "#mcp")).toBe(true);
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });

  it("accepts the extended vocabulary — stack/heading kinds, edge intent, dashed groups, board layout", () => {
    const spec = JSON.stringify({
      title: "Poster",
      layout: "board",
      groups: [{ id: "s", label: "Section", frame: true, dashed: true }],
      nodes: [
        { id: "pile", kind: "stack", count: 3, group: "s", label: "Records" },
        { id: "ask", kind: "heading", hand: true, label: "How?" },
        { id: "box", kind: "rect", dashed: true, group: "s", label: "Tentative" },
      ],
      edges: [{ from: "pile", to: "box", intent: "yellow" }],
    });
    const canvas = parseCanvasSpec(spec);
    expect(canvas.layout).toBe("board");
    expect(canvas.nodes.find((n) => n.id === "pile")?.kind).toBe("stack");
    expect(canvas.nodes.find((n) => n.id === "box")?.dashed).toBe(true);
    expect(canvas.groups[0]?.dashed).toBe(true);
    expect(canvas.edges[0]?.intent).toBe("yellow");

    // The graph face still serializes the new kinds losslessly.
    const ctx = createExtractCtx({ pageId: "/poster" });
    const node = serializeComponent("Canvas", { json: spec }, ctx) as DiagramNode;
    expect(node.graph?.nodes.find((n) => n.id === "pile")?.kind).toBe("stack");
    expect(node.graph?.nodes.find((n) => n.id === "ask")?.kind).toBe("heading");
  });

  it("embeds a superlore component and carries its typed knowledge in the canvas graph", () => {
    const spec = JSON.stringify({
      nodes: [
        {
          id: "cmp",
          kind: "embed",
          component: "Comparison",
          props: {
            options: ["A", "B"],
            rows: [{ criterion: "Relational", cells: [true, false] }],
          },
        },
      ],
    });
    const ctx = createExtractCtx({ pageId: "/e" });
    const node = serializeComponent("Canvas", { json: spec }, ctx) as DiagramNode;
    const g = node.graph?.nodes.find((n) => n.id === "cmp");
    expect(g?.kind).toBe("embed");
    // the embedded Comparison's own knowledge rides along — the MCP sees the cells, not a box
    expect(g?.embed?.kind).toBe("comparison");
    expect(JSON.stringify(g?.embed)).toContain("Relational");
  });
});
