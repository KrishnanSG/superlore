import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import {
  parseKDate,
  type RelKind,
  type ScheduleEvent,
  type ScheduleNode,
} from "../knowledge/primitives";

/**
 * Schedule — dated events in a readable agenda, grouped by day. The human scans the agenda; the
 * agent gets `{ kind:"schedule", events:[{ date, title, time, owner }] }` with dates parsed to
 * range-queryable `KDate`s — never a picture of a calendar.
 */

type ScheduleRef = { rel?: string; target: string; label?: string };

export interface ScheduleEventInput {
  date: string;
  title: string;
  time?: string;
  owner?: string;
  tags?: string[];
  body?: React.ReactNode;
  refs?: ScheduleRef[];
}

export interface ScheduleProps {
  events: ScheduleEventInput[];
  /** Accessible name for the schedule. */
  label?: string;
}

function dayHeading(iso: string): string {
  // Render full days nicely; leave coarser precisions (year/quarter/month) as authored.
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const d = new Date(iso.length > 10 ? iso : `${iso}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return iso;
}

export function Schedule({ events, label = "Schedule" }: ScheduleProps) {
  // Group consecutive events by their authored date, preserving author order.
  const groups: { date: string; items: ScheduleEventInput[] }[] = [];
  for (const ev of events) {
    const last = groups.at(-1);
    if (last && last.date === ev.date) last.items.push(ev);
    else groups.push({ date: ev.date, items: [ev] });
  }

  return (
    <section
      aria-label={label}
      className="not-prose my-6 overflow-hidden rounded-lg border border-fd-border"
    >
      {groups.map((g, gi) => (
        <div key={gi} className="border-b border-fd-border last:border-0">
          <div className="bg-fd-muted/40 px-4 py-1.5 font-mono text-xs tracking-wide text-fd-muted-foreground tabular-nums">
            {dayHeading(g.date)}
          </div>
          <ul className="divide-y divide-fd-border">
            {g.items.map((ev, ei) => (
              <li key={ei} className="flex items-start gap-3 px-4 py-2.5">
                {ev.time && (
                  <span className="mt-0.5 w-16 shrink-0 font-mono text-xs text-fd-muted-foreground tabular-nums">
                    {ev.time}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fd-foreground">{ev.title}</div>
                  {ev.body && (
                    <div className="mt-0.5 text-sm text-fd-muted-foreground">{ev.body}</div>
                  )}
                  {(ev.owner || ev.tags?.length || ev.refs?.length) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {ev.owner && (
                        <span className="rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">
                          {ev.owner}
                        </span>
                      )}
                      {ev.tags?.map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground",
                          )}
                        >
                          {t}
                        </span>
                      ))}
                      {ev.refs?.map((r, ri) => (
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
          </ul>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------- knowledge face --- */

const refSchema = z.object({
  rel: z.string().optional(),
  target: z.string(),
  label: z.string().optional(),
});

const scheduleSchema = z.object({
  label: z.string().optional(),
  events: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      time: z.string().optional(),
      owner: z.string().optional(),
      tags: z.array(z.string()).optional(),
      body: z.unknown().optional(),
      refs: z.array(refSchema).optional(),
    }),
  ),
});

registerKnowledge("Schedule", {
  schema: scheduleSchema,
  toKnowledge: (p: z.infer<typeof scheduleSchema>, ctx: ExtractCtx) =>
    ({
      kind: "schedule",
      id: ctx.nextId(p.label ?? "schedule"),
      title: p.label,
      events: p.events.map(
        (ev): ScheduleEvent => ({
          id: ctx.nextId(ev.title),
          date: parseKDate(ev.date),
          title: ev.title,
          time: ev.time,
          owner: ev.owner,
          tags: ev.tags,
          body: ev.body != null ? ctx.text(ev.body) || undefined : undefined,
          refs: ev.refs?.map((r) =>
            ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
          ),
        }),
      ),
    }) satisfies ScheduleNode,
});
