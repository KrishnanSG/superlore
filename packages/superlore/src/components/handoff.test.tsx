import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Handoff, type HandoffProps } from "./handoff";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { HandoffNode } from "../knowledge/primitives";

const props: HandoffProps = {
  from: { name: "Claude", kind: "agent" },
  to: { name: "Krish", kind: "human", role: "Head of Eng" },
  date: "2026-06-22",
  status: "in-progress",
  summary: "Picking up the docs restructure.",
  context: "The atlas nav shipped; llms.txt is live.",
  done: ["Atlas nav live", "llms.txt + sitemap shipped"],
  next: ["Build the changelog route", "Add llms-full.txt"],
  questions: ["Keep built-with on the docs site or move it off?"],
  refs: [{ rel: "related", target: "/docs/architecture", label: "Architecture" }],
};

describe("Handoff — dual representation", () => {
  it("renders the handoff a human reads", () => {
    render(<Handoff {...props} />);
    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("Krish")).toBeInTheDocument();
    expect(screen.getByText("Atlas nav live")).toBeInTheDocument();
    expect(screen.getByText("Build the changelog route")).toBeInTheDocument();
  });

  it("serializes to a typed handoff knowledge node an agent continues from", () => {
    const ctx = createExtractCtx({ pageId: "/handoff" });
    const node = serializeComponent("Handoff", props, ctx) as HandoffNode;

    expect(node.kind).toBe("handoff");
    expect(node.from).toMatchObject({ name: "Claude", kind: "agent" });
    expect(node.to).toMatchObject({ name: "Krish", kind: "human", role: "Head of Eng" });
    expect(node.date).toEqual({ iso: "2026-06-22", precision: "day" });
    expect(node.status).toBe("in-progress");
    expect(node.done).toEqual(["Atlas nav live", "llms.txt + sitemap shipped"]);
    expect(node.next).toHaveLength(2);
    expect(node.questions?.[0]).toContain("built-with");
    expect(node.refs?.[0]).toMatchObject({
      rel: "related",
      target: "/docs/architecture",
      internal: true,
    });

    // the knowledge face is DATA, never a rendered picture
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=|className/);
  });

  it("supports a bare-string party and an open (no `to`) handoff", () => {
    const ctx = createExtractCtx({ pageId: "/h" });
    const node = serializeComponent(
      "Handoff",
      { from: "Krish", next: ["Review the PR"] },
      ctx,
    ) as HandoffNode;
    expect(node.from).toMatchObject({ name: "Krish", kind: "human" });
    expect(node.to).toBeUndefined();
    expect(node.next).toEqual(["Review the PR"]);
  });
});
