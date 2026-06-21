import { z } from "zod";
import { Check, Minus, Contrast, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { ComparisonCell, ComparisonNode, ComparisonVerdict } from "../knowledge/primitives";

/**
 * Comparison — a feature matrix: options (columns) × criteria (rows). The human reads a tidy
 * matrix with yes/no/partial marks; the agent gets `{ kind:"comparison", options, criteria }` where
 * every cell is a typed `verdict` (yes/no/partial) or free `text` — never a rendered mark it has to
 * recognise. So "which option supports X?" is a filter, not OCR.
 */

/** A cell value: `true`/`false`/`"partial"` for a verdict, or any string for free text. */
export type ComparisonCellInput = boolean | "partial" | string;

/** A row with fewer cells than options has its missing cells treated as `no`. */

export interface ComparisonProps {
  /** Column headers — the options being compared. */
  options: string[];
  /** Rows — each criterion plus a cell per option (same order as `options`). */
  rows: { criterion: string; cells: ComparisonCellInput[] }[];
  caption?: string;
}

function toCell(v: ComparisonCellInput | undefined): ComparisonCell {
  if (v === true) return { verdict: "yes" };
  if (v === false || v == null) return { verdict: "no" };
  if (v === "partial") return { verdict: "partial" };
  return { text: v };
}

const verdictMark: Record<ComparisonVerdict, { Icon: LucideIcon; cls: string; label: string }> = {
  yes: { Icon: Check, cls: "text-kp-success", label: "yes" },
  no: { Icon: Minus, cls: "text-fd-muted-foreground/50", label: "no" },
  partial: { Icon: Contrast, cls: "text-kp-warning", label: "partial" },
};

function Cell({ cell }: { cell: ComparisonCell }) {
  if (cell.verdict) {
    const m = verdictMark[cell.verdict];
    return (
      <span className={cn("inline-flex", m.cls)} role="img" aria-label={m.label}>
        <m.Icon className="size-4" />
      </span>
    );
  }
  return <span className="text-sm text-fd-foreground/90">{cell.text}</span>;
}

export function Comparison({ options, rows, caption }: ComparisonProps) {
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
            <th scope="col" className="px-3 py-2 text-left font-semibold text-fd-foreground">
              <span className="sr-only">Criterion</span>
            </th>
            {options.map((o) => (
              <th
                key={o}
                scope="col"
                className="px-3 py-2 text-center font-semibold text-fd-foreground"
              >
                {o}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30">
              <th scope="row" className="px-3 py-2 text-left font-medium text-fd-foreground/90">
                {row.criterion}
              </th>
              {options.map((o, oi) => (
                <td key={o} className="px-3 py-2 text-center align-middle">
                  <Cell cell={toCell(row.cells[oi])} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------- knowledge face --- */

const cellSchema = z.union([z.boolean(), z.literal("partial"), z.string()]);

const comparisonSchema = z.object({
  options: z.array(z.string()),
  rows: z.array(
    z.object({
      criterion: z.string(),
      cells: z.array(cellSchema),
    }),
  ),
  caption: z.string().optional(),
});

registerKnowledge("Comparison", {
  schema: comparisonSchema,
  toKnowledge: (p: z.infer<typeof comparisonSchema>, ctx: ExtractCtx) => {
    const options = p.options.map((label) => ({ id: ctx.nextId(label), label }));
    return {
      kind: "comparison",
      id: ctx.nextId(p.caption ?? "comparison"),
      title: p.caption,
      options,
      criteria: p.rows.map((row) => {
        const cells: Record<string, ComparisonCell> = {};
        options.forEach((opt, oi) => {
          cells[opt.id] = toCell(row.cells[oi]);
        });
        return { id: ctx.nextId(row.criterion), label: row.criterion, cells };
      }),
    } satisfies ComparisonNode;
  },
});
