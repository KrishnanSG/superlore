import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Comparison, type ComparisonProps } from "./comparison";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { ComparisonNode } from "../knowledge/primitives";

const props: ComparisonProps = {
  caption: "Docs tools",
  options: ["superlore", "Plain docs"],
  rows: [
    { criterion: "MCP-native", cells: [true, false] },
    { criterion: "Dual representation", cells: [true, "partial"] },
    { criterion: "Hosting", cells: ["self-host", "self-host"] },
  ],
};

describe("Comparison — dual representation", () => {
  it("renders a matrix a human can read", () => {
    render(<Comparison {...props} />);
    expect(screen.getByText("superlore")).toBeInTheDocument();
    expect(screen.getByText("MCP-native")).toBeInTheDocument();
    expect(screen.getAllByText("self-host")).toHaveLength(2);
  });

  it("serializes to typed verdict/text cells keyed by option id", () => {
    const ctx = createExtractCtx({ pageId: "/compare" });
    const node = serializeComponent("Comparison", props, ctx) as ComparisonNode;

    expect(node.kind).toBe("comparison");
    expect(node.title).toBe("Docs tools");
    expect(node.options).toEqual([
      { id: "superlore", label: "superlore" },
      { id: "plain-docs", label: "Plain docs" },
    ]);

    const mcpRow = node.criteria[0];
    expect(mcpRow).toMatchObject({ id: "mcp-native", label: "MCP-native" });
    expect(mcpRow?.cells.superlore).toEqual({ verdict: "yes" });
    expect(mcpRow?.cells["plain-docs"]).toEqual({ verdict: "no" });

    expect(node.criteria[1]?.cells["plain-docs"]).toEqual({ verdict: "partial" });
    // free-text cells keep their string, not a rendered glyph
    expect(node.criteria[2]?.cells.superlore).toEqual({ text: "self-host" });

    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
