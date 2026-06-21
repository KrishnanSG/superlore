import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { BoardCard, BoardColumn, BoardNode, RelKind, Status } from "../knowledge/primitives";

/**
 * Board — a kanban of cards grouped into columns by status/stage. The human reads the lanes; the
 * agent gets `{ kind:"board", columns:[{ id,title,cards:[…] }] }` — every card's status, assignee,
 * tags, and refs as data, never a screenshot of a board to interpret.
 */

type BoardRef = { rel?: string; target: string; label?: string };

export interface BoardCardInput {
  title: string;
  body?: React.ReactNode;
  status?: Status;
  assignee?: string;
  tags?: string[];
  refs?: BoardRef[];
}

export interface BoardColumnInput {
  title: string;
  status?: Status;
  cards: BoardCardInput[];
}

export interface BoardProps {
  columns: BoardColumnInput[];
  /** Accessible name for the board. */
  label?: string;
}

// A status keys a thin coloured top-rail on the column (the KB kanban's stage cue), drawn with
// the shared intent tokens so light + dark stay co-equal.
const columnTone: Record<Status, string> = {
  planned: "before:bg-fd-border",
  "in-progress": "before:bg-kp-accent",
  blocked: "before:bg-kp-danger",
  done: "before:bg-kp-success",
  deprecated: "before:bg-fd-muted-foreground",
  proposed: "before:bg-kp-accent",
  accepted: "before:bg-kp-success",
  rejected: "before:bg-kp-danger",
  superseded: "before:bg-fd-muted-foreground",
};

export function Board({ columns, label = "Board" }: BoardProps) {
  return (
    <section
      aria-label={label}
      className="not-prose -mx-2 my-6 flex [scrollbar-width:thin] gap-3 overflow-x-auto px-2 pb-3"
    >
      {columns.map((col, ci) => (
        <div
          key={ci}
          className={cn(
            // Column = an elevated card with a thin coloured top-rail (::before) keyed to status.
            "relative flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-fd-border bg-fd-card",
            "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:content-['']",
            col.status ? columnTone[col.status] : "before:bg-fd-border",
          )}
        >
          <header className="border-b border-fd-border px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate font-semibold text-fd-foreground">{col.title}</h3>
              <span className="shrink-0 text-xs text-fd-muted-foreground tabular-nums">
                {col.cards.length}
              </span>
            </div>
          </header>
          <div className="flex min-h-32 flex-col gap-2 p-2">
            {col.cards.length === 0 && (
              <div className="px-1 py-2 text-xs text-fd-muted-foreground/70 italic">
                Nothing here right now.
              </div>
            )}
            {col.cards.map((card, ki) => (
              <article
                key={ki}
                className="rounded-md border border-fd-border bg-fd-background p-3 transition hover:border-fd-primary"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0 font-semibold break-words text-fd-foreground">
                    {card.title}
                  </div>
                  {card.assignee && (
                    <span className="max-w-[8rem] shrink-0 truncate font-mono text-xs text-fd-primary">
                      {card.assignee}
                    </span>
                  )}
                </div>
                {card.body && (
                  <div className="mt-1.5 line-clamp-3 text-xs text-fd-muted-foreground">
                    {card.body}
                  </div>
                )}
                {(card.tags?.length || card.refs?.length) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {card.tags?.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-[10px] font-medium text-fd-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    {card.refs?.map((r, ri) => (
                      <a
                        key={ri}
                        href={r.target}
                        className="inline-flex items-center rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[10px] font-medium text-kp-accent-text no-underline"
                      >
                        {r.label ?? r.target}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Alias for authors who prefer `<Kanban>`. */
export const Kanban = Board;

/* ------------------------------------------------------------- knowledge face --- */

const statusEnum = z.enum([
  "planned",
  "in-progress",
  "blocked",
  "done",
  "deprecated",
  "proposed",
  "accepted",
  "rejected",
  "superseded",
]);

const refSchema = z.object({
  rel: z.string().optional(),
  target: z.string(),
  label: z.string().optional(),
});

const boardSchema = z.object({
  label: z.string().optional(),
  columns: z.array(
    z.object({
      title: z.string(),
      status: statusEnum.optional(),
      cards: z.array(
        z.object({
          title: z.string(),
          body: z.unknown().optional(),
          status: statusEnum.optional(),
          assignee: z.string().optional(),
          tags: z.array(z.string()).optional(),
          refs: z.array(refSchema).optional(),
        }),
      ),
    }),
  ),
});

const boardFace = {
  schema: boardSchema,
  toKnowledge: (p: z.infer<typeof boardSchema>, ctx: ExtractCtx) =>
    ({
      kind: "board",
      id: ctx.nextId(p.label ?? "board"),
      title: p.label,
      columns: p.columns.map(
        (col): BoardColumn => ({
          id: ctx.nextId(col.title),
          title: col.title,
          status: col.status,
          cards: col.cards.map(
            (card): BoardCard => ({
              id: ctx.nextId(card.title),
              title: card.title,
              body: card.body != null ? ctx.text(card.body) || undefined : undefined,
              status: card.status,
              assignee: card.assignee,
              tags: card.tags,
              refs: card.refs?.map((r) =>
                ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
              ),
            }),
          ),
        }),
      ),
    }) satisfies BoardNode,
} as const;

registerKnowledge("Board", boardFace);
registerKnowledge("Kanban", boardFace);
