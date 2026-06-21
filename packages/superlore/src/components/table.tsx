import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { FieldType, KValue, TableNode } from "../knowledge/primitives";

/**
 * DataTable — typed columns + rows. The human reads a grid; the agent gets typed rows it can
 * filter / sort / compare ("which plan has the highest limit?") without OCR-ing a rendered table.
 */

export interface DataTableColumn {
  key: string;
  label: string;
  type?: FieldType;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Record<string, React.ReactNode>[];
  caption?: string;
}

function asValue(v: unknown, ctx: ExtractCtx): KValue {
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (v == null) return null;
  return ctx.text(v);
}

export function DataTable({ columns, rows, caption }: DataTableProps) {
  return (
    <div className="not-prose my-5 overflow-x-auto rounded-lg border border-fd-border">
      <table className="w-full border-collapse text-sm">
        {caption && (
          <caption className="px-3 py-2 text-left text-xs text-fd-muted-foreground">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-fd-border bg-fd-muted/50">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-3 py-2 text-left font-semibold text-fd-foreground",
                  c.type === "number" && "text-right tabular-nums",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2 text-fd-foreground/90",
                    c.type === "number" && "text-right font-mono tabular-nums",
                  )}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Alias for authors who prefer `<Table>`. */
export const Table = DataTable;

/* ------------------------------------------------------------- knowledge face --- */

const fieldTypeEnum = z.enum(["text", "number", "bool", "date", "enum", "code", "ref"]);

const tableSchema = z.object({
  columns: z.array(
    z.object({ key: z.string(), label: z.string(), type: fieldTypeEnum.optional() }),
  ),
  rows: z.array(z.record(z.string(), z.unknown())),
  caption: z.string().optional(),
});

const tableFace = {
  schema: tableSchema,
  toKnowledge: (p: z.infer<typeof tableSchema>, ctx: ExtractCtx) => {
    const rows = p.rows.map((row) => {
      const out: Record<string, KValue> = {};
      for (const col of p.columns) out[col.key] = asValue(row[col.key], ctx);
      return out;
    });
    return {
      kind: "table",
      id: ctx.nextId(p.caption ?? "table"),
      title: p.caption,
      columns: p.columns,
      rows,
    } satisfies TableNode;
  },
} as const;

registerKnowledge("DataTable", tableFace);
registerKnowledge("Table", tableFace);
