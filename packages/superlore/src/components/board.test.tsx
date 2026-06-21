import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Board, type BoardColumnInput } from "./board";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { BoardNode } from "../knowledge/primitives";

const columns: BoardColumnInput[] = [
  {
    title: "Todo",
    status: "planned",
    cards: [{ title: "Draft schema", tags: ["mcp"] }],
  },
  {
    title: "In progress",
    status: "in-progress",
    cards: [
      {
        title: "Build extractor",
        assignee: "Krishnan",
        status: "in-progress",
        refs: [{ rel: "related", target: "/docs/mcp", label: "MCP" }],
      },
    ],
  },
  { title: "Done", status: "done", cards: [] },
];

describe("Board — dual representation", () => {
  it("renders lanes and cards a human can read", () => {
    render(<Board columns={columns} label="Build board" />);
    expect(screen.getByRole("region", { name: "Build board" })).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("Draft schema")).toBeInTheDocument();
    expect(screen.getByText("Build extractor")).toBeInTheDocument();
    expect(screen.getByText("Krishnan")).toBeInTheDocument();
  });

  it("serializes to a board knowledge node with typed columns + cards", () => {
    const ctx = createExtractCtx({ pageId: "/board" });
    const node = serializeComponent("Board", { columns, label: "Build board" }, ctx) as BoardNode;

    expect(node.kind).toBe("board");
    expect(node.title).toBe("Build board");
    expect(node.columns).toHaveLength(3);

    expect(node.columns[0]).toMatchObject({ title: "Todo", status: "planned" });
    expect(node.columns[0]?.cards[0]).toMatchObject({
      title: "Draft schema",
      tags: ["mcp"],
    });
    expect(node.columns[0]?.cards[0]?.id).toBe("draft-schema");

    const inProgress = node.columns[1]?.cards[0];
    expect(inProgress).toMatchObject({
      title: "Build extractor",
      assignee: "Krishnan",
      status: "in-progress",
    });
    expect(inProgress?.refs?.[0]).toMatchObject({
      rel: "related",
      target: "/docs/mcp",
      internal: true,
    });

    expect(node.columns[2]?.cards).toEqual([]);

    // the knowledge face is DATA, never a rendered picture
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
