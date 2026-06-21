import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EntityCard, type EntityCardProps } from "./entity-card";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { EntityNode } from "../knowledge/primitives";

const props: EntityCardProps = {
  type: "service",
  slug: "auth-api",
  title: "Auth API",
  summary: "SSO + token exchange.",
  fields: [
    { key: "owner", value: "platform" },
    { key: "uptime", value: "99.98%" },
  ],
  refs: [{ rel: "depends-on", target: "entity:service/token-store", label: "token-store" }],
};

describe("EntityCard — dual representation", () => {
  it("renders the entity for a human", () => {
    render(<EntityCard {...props} />);
    expect(screen.getByText("Auth API")).toBeInTheDocument();
    expect(screen.getByText("service")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("platform")).toBeInTheDocument();
  });

  it("serializes to a typed graph entity an agent can list / get / navigate", () => {
    const ctx = createExtractCtx({ pageId: "/services" });
    const node = serializeComponent("EntityCard", props, ctx) as EntityNode;

    expect(node.kind).toBe("entity");
    expect(node).toMatchObject({
      entityType: "service",
      slug: "auth-api",
      title: "Auth API",
      fields: [
        { key: "owner", value: "platform" },
        { key: "uptime", value: "99.98%" },
      ],
    });
    expect(node.refs?.[0]).toMatchObject({
      rel: "depends-on",
      target: "entity:service/token-store",
      internal: true,
    });
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
