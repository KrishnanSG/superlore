import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Decision } from "./decision";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { DecisionNode } from "../knowledge/primitives";

const props = {
  title: "Adopt MCP as the agent surface",
  status: "accepted" as const,
  identifier: "ADR-007",
  date: "2026-06-01",
  context: "Agents need structured access, not scraped HTML.",
  decision: "Ship a first-class MCP over the structured index.",
  consequences: ["Every component must expose a knowledge face.", "Auth gates the MCP route."],
  supersedes: { target: "/docs/adr/006", label: "ADR-006" },
  refs: [{ rel: "related", target: "/docs/mcp", label: "MCP docs" }],
};

describe("Decision — dual representation", () => {
  it("renders the record a human can read", () => {
    render(<Decision {...props} />);
    expect(screen.getByText("Adopt MCP as the agent surface")).toBeInTheDocument();
    expect(screen.getByText("ADR-007")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(
      screen.getByText("Ship a first-class MCP over the structured index."),
    ).toBeInTheDocument();
  });

  it("serializes to a decision node with status, parsed date, and chained refs", () => {
    const ctx = createExtractCtx({ pageId: "/adr/007" });
    const node = serializeComponent("Decision", props, ctx) as DecisionNode;

    expect(node.kind).toBe("decision");
    expect(node.id).toBe("adr-007");
    expect(node.status).toBe("accepted");
    expect(node.identifier).toBe("ADR-007");
    expect(node.date).toEqual({ iso: "2026-06-01", precision: "day" });
    expect(node.context).toBe("Agents need structured access, not scraped HTML.");
    expect(node.decision).toBe("Ship a first-class MCP over the structured index.");
    expect(node.consequences).toEqual([
      "Every component must expose a knowledge face.",
      "Auth gates the MCP route.",
    ]);

    // supersedes / superseded-by ride the shared refs[] as typed, directed edges
    expect(node.refs?.[0]).toMatchObject({
      rel: "supersedes",
      target: "/docs/adr/006",
      internal: true,
    });
    expect(node.refs?.[1]).toMatchObject({ rel: "related", target: "/docs/mcp" });

    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
