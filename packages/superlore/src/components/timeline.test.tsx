import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline, type TimelineItemInput } from "./timeline";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { TimelineNode } from "../knowledge/primitives";

const items: TimelineItemInput[] = [
  {
    date: "2026-Q3",
    title: "GA launch",
    status: "planned",
    refs: [{ rel: "related", target: "/releases/2-0", label: "v2.0" }],
  },
  { date: "2026-09-15", title: "Security audit", body: "External review", tags: ["security"] },
];

describe("Timeline — dual representation", () => {
  it("renders an accessible list a human can read", () => {
    render(<Timeline items={items} label="Q3 roadmap" />);
    expect(screen.getByRole("list", { name: "Q3 roadmap" })).toBeInTheDocument();
    expect(screen.getByText("GA launch")).toBeInTheDocument();
    expect(screen.getByText("Security audit")).toBeInTheDocument();
  });

  it("serializes to structured knowledge an agent consumes directly", () => {
    const ctx = createExtractCtx({ pageId: "/roadmap" });
    const node = serializeComponent(
      "Timeline",
      { items, label: "Q3 roadmap" },
      ctx,
    ) as TimelineNode;

    expect(node.kind).toBe("timeline");
    expect(node.items).toHaveLength(2);
    expect(node.items[0]).toMatchObject({
      title: "GA launch",
      date: { iso: "2026-Q3", precision: "quarter" },
      status: "planned",
    });
    expect(node.items[1]?.date).toEqual({ iso: "2026-09-15", precision: "day" });
    expect(node.items[1]?.tags).toEqual(["security"]);

    // refs are resolved + typed, and the target is recognised as internal to the corpus.
    expect(node.items[0]?.refs?.[0]).toMatchObject({
      rel: "related",
      target: "/releases/2-0",
      internal: true,
    });

    // the knowledge face is DATA, never a rendered picture
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
