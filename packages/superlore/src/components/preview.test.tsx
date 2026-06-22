import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Preview, Skeleton, Menu, type PreviewProps } from "./preview";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { InterfaceNode } from "../knowledge/primitives";

const props: PreviewProps = {
  url: "acme.dev/docs/canvas",
  title: "The whiteboard, in MDX",
  brand: "Acme KB",
  tabs: [
    { label: "Guide" },
    { label: "Canvas", active: true },
    { label: "Agents & MCP" },
    { label: "API Reference" },
  ],
  sidebar: [
    {
      group: "Canvas",
      items: [{ label: "Overview", active: true }, { label: "Gallery" }, { label: "Templates" }],
    },
    { group: "Reference", items: [{ label: "Components", collapsed: true }] },
  ],
  search: true,
  children: "Body copy.",
};

describe("Preview — dual representation", () => {
  it("renders a UI mockup a human can read", () => {
    render(<Preview {...props} />);
    expect(screen.getByText("acme.dev/docs/canvas")).toBeInTheDocument();
    expect(screen.getByText("The whiteboard, in MDX")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument(); // a tab
    expect(screen.getByText("Overview")).toBeInTheDocument(); // active sidebar item
    expect(screen.getByText("Body copy.")).toBeInTheDocument(); // content slot
  });

  it("serializes the interface to structured knowledge an agent consumes directly", () => {
    const ctx = createExtractCtx({ pageId: "/docs/themes" });
    const node = serializeComponent("Preview", props, ctx) as InterfaceNode;

    expect(node.kind).toBe("interface");
    expect(node.chrome).toBe("app"); // it carries product nav
    expect(node.url).toBe("acme.dev/docs/canvas");
    expect(node.content).toBe("Body copy.");

    // tabs: the active one is flagged, the others aren't
    expect(node.tabs).toHaveLength(4);
    expect(node.tabs?.[1]).toMatchObject({ label: "Canvas", active: true });
    expect(node.tabs?.[0]).toMatchObject({ label: "Guide" });
    expect(node.tabs?.[0]?.active).toBeUndefined();

    // sidebar: groups → items, with active / collapsed state preserved
    expect(node.sidebar?.[0]?.group).toBe("Canvas");
    expect(node.sidebar?.[0]?.items[0]).toMatchObject({ label: "Overview", active: true });
    expect(node.sidebar?.[1]?.items[0]).toMatchObject({ label: "Components", collapsed: true });

    // the knowledge face is DATA, never a rendered picture
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=|className/);
  });

  it("nests sidebar children", () => {
    const ctx = createExtractCtx({ pageId: "/p" });
    const node = serializeComponent(
      "Preview",
      {
        sidebar: [
          {
            group: "Region model",
            items: [{ label: "Region model", children: [{ label: "Concepts" }, { label: "Live demo" }] }],
          },
        ],
      },
      ctx,
    ) as InterfaceNode;
    expect(node.sidebar?.[0]?.items[0]?.children).toHaveLength(2);
    expect(node.sidebar?.[0]?.items[0]?.children?.[0]).toMatchObject({ label: "Concepts" });
  });
});

describe("Skeleton + Menu — presentational primitives", () => {
  it("Skeleton renders the requested number of faux lines", () => {
    const { container } = render(<Skeleton lines={4} />);
    expect(container.firstElementChild?.children).toHaveLength(4);
  });

  it("Menu renders its items, labels and hints", () => {
    render(
      <Menu
        label="Get started"
        items={[
          { label: "Copy for Claude", hint: "claude.ai / Claude Code", shortcut: "⌘C", active: true },
          { label: "Copy for Codex", hint: "OpenAI" },
        ]}
      />,
    );
    expect(screen.getByText("Get started")).toBeInTheDocument();
    expect(screen.getByText("Copy for Claude")).toBeInTheDocument();
    expect(screen.getByText("claude.ai / Claude Code")).toBeInTheDocument();
  });
});
