import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge } from "../knowledge/registry";
import { parseKDate, type RelKind, type Status, type TimelineNode } from "../knowledge/primitives";

/**
 * Timeline — dated, ordered events with status. The canonical dual-representation component:
 * the human reads the story over time; the agent gets `{ kind:"timeline", items:[…] }` with
 * parsed dates (range-queryable), statuses, and refs — never a description of a picture.
 */

type TimelineRef = { rel?: string; target: string; label?: string };

export interface TimelineItemInput {
  date: string;
  title: string;
  body?: React.ReactNode;
  status?: Status;
  tags?: string[];
  refs?: TimelineRef[];
}

export interface TimelineProps {
  items: TimelineItemInput[];
  /** Accessible name for the list. */
  label?: string;
}

const statusDot: Record<Status, string> = {
  planned: "bg-fd-muted-foreground",
  "in-progress": "bg-kp-accent",
  blocked: "bg-kp-danger",
  done: "bg-kp-success",
  deprecated: "bg-fd-muted-foreground",
  proposed: "bg-kp-accent",
  accepted: "bg-kp-success",
  rejected: "bg-kp-danger",
  superseded: "bg-fd-muted-foreground",
};

export function Timeline({ items, label = "Timeline" }: TimelineProps) {
  return (
    <ol aria-label={label} className="not-prose my-6 ml-1 space-y-0">
      {items.map((it, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {/* rail */}
          <div className="relative flex flex-col items-center">
            <span
              className={cn(
                "mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-fd-background",
                it.status ? statusDot[it.status] : "bg-kp-accent",
              )}
            />
            {i < items.length - 1 && <span className="w-px flex-1 bg-fd-border" />}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="font-mono text-xs text-fd-muted-foreground tabular-nums">{it.date}</div>
            <div className="mt-0.5 font-semibold text-fd-foreground">{it.title}</div>
            {it.body && <div className="mt-1 text-sm text-fd-muted-foreground">{it.body}</div>}
            {(it.tags?.length || it.refs?.length) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {it.tags?.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                {it.refs?.map((r, ri) => (
                  <a
                    key={ri}
                    href={r.target}
                    className="rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[11px] text-kp-accent-text no-underline"
                  >
                    {r.label ?? r.target}
                  </a>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

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

const timelineSchema = z.object({
  label: z.string().optional(),
  items: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      body: z.unknown().optional(),
      status: statusEnum.optional(),
      tags: z.array(z.string()).optional(),
      refs: z.array(refSchema).optional(),
    }),
  ),
});

registerKnowledge("Timeline", {
  schema: timelineSchema,
  toKnowledge: (p, ctx) =>
    ({
      kind: "timeline",
      id: ctx.nextId(p.label ?? "timeline"),
      title: p.label,
      items: p.items.map((it) => ({
        id: ctx.nextId(it.title),
        date: parseKDate(it.date),
        title: it.title,
        body: it.body != null ? ctx.text(it.body) || undefined : undefined,
        status: it.status,
        tags: it.tags,
        refs: it.refs?.map((r) =>
          ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
        ),
      })),
    }) satisfies TimelineNode,
});
