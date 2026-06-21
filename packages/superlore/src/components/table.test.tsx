import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./table";
import { serializeComponent } from "../knowledge/registry";
import { createExtractCtx } from "../knowledge/extract";
import type { TableNode } from "../knowledge/primitives";

const columns: DataTableColumn[] = [
  { key: "plan", label: "Plan" },
  { key: "limit", label: "Limit (req/min)", type: "number" },
];
const rows: Record<string, string | number>[] = [
  { plan: "Free", limit: 60 },
  { plan: "Pro", limit: 1000 },
];

describe("DataTable — dual representation", () => {
  it("renders the grid for a human", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("serializes to typed columns + rows (numbers stay numbers, so agents can compare)", () => {
    const ctx = createExtractCtx({ pageId: "/pricing" });
    const node = serializeComponent("DataTable", { columns, rows }, ctx) as TableNode;

    expect(node.kind).toBe("table");
    expect(node.columns).toEqual(columns);
    expect(node.rows).toEqual([
      { plan: "Free", limit: 60 },
      { plan: "Pro", limit: 1000 },
    ]);
    expect(typeof node.rows[1]?.limit).toBe("number");
    expect(JSON.stringify(node)).not.toMatch(/<svg|class=/);
  });
});
