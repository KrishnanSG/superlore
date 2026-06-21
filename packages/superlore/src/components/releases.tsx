import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import {
  parseKDate,
  type RelKind,
  type ReleaseChange,
  type ReleaseChangeType,
  type ReleaseNode,
  type Status,
} from "../knowledge/primitives";

/**
 * Release / Changelog — a versioned release with a date, status, and a list of changes each typed
 * by kind (added / changed / fixed / removed / deprecated / security). The human reads a changelog
 * entry; the agent gets `{ kind:"release", version, date, changes:[{ type, text }] }` so it can
 * answer "what changed in 2.0?" or "every security fix since June" without parsing prose.
 *
 * `Releases` / `Changelog` is a thin presentational stack of `Release`s; each `Release` is the
 * dual-representation unit and the one that registers a knowledge face.
 */

type ReleaseRef = { rel?: string; target: string; label?: string };

export interface ReleaseChangeInput {
  type: ReleaseChangeType;
  text: string;
  refs?: ReleaseRef[];
}

export interface ReleaseProps {
  version: string;
  date: string;
  status?: Status;
  title?: string;
  summary?: React.ReactNode;
  changes: ReleaseChangeInput[];
}

const changeMeta: Record<ReleaseChangeType, { label: string; cls: string }> = {
  added: { label: "Added", cls: "border-kp-success/40 bg-kp-success/10 text-kp-success" },
  changed: {
    label: "Changed",
    cls: "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
  },
  fixed: { label: "Fixed", cls: "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text" },
  removed: { label: "Removed", cls: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger" },
  deprecated: {
    label: "Deprecated",
    cls: "border-kp-warning/40 bg-kp-warning/10 text-kp-warning",
  },
  security: { label: "Security", cls: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger" },
};

const statusCls: Record<Status, string> = {
  planned: "border-fd-border bg-fd-muted text-fd-muted-foreground",
  "in-progress": "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
  blocked: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger",
  done: "border-kp-success/40 bg-kp-success/10 text-kp-success",
  deprecated: "border-fd-border bg-fd-muted text-fd-muted-foreground",
  proposed: "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
  accepted: "border-kp-success/40 bg-kp-success/10 text-kp-success",
  rejected: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger",
  superseded: "border-fd-border bg-fd-muted text-fd-muted-foreground",
};

/** Render a full ISO day nicely (e.g. 2026-06-15 → "June 15, 2026"); pass coarser dates through. */
function displayDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function anchorId(version: string): string {
  return version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One changelog entry: a sticky left rail (date pill + version + status + tags) beside a right
 * column with the headline and the typed changes — the KB changelog layout, on superlore tokens.
 */
export function Release({ version, date, status, title, summary, changes }: ReleaseProps) {
  const anchor = anchorId(version);
  return (
    <section
      id={anchor}
      className="not-prose relative grid scroll-mt-24 gap-6 border-t border-fd-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-[200px_1fr]"
    >
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <a
          href={`#${anchor}`}
          className="inline-flex items-center gap-2 rounded-full border border-kp-accent-border bg-kp-accent-weak px-3 py-1 font-mono text-sm font-semibold text-kp-accent-text no-underline"
        >
          <span className="inline-block size-1.5 rounded-full bg-kp-accent" />
          {displayDate(date)}
        </a>
        <div className="font-mono text-sm font-semibold text-fd-foreground">{version}</div>
        {status && (
          <div>
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                statusCls[status],
              )}
            >
              {status}
            </span>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        {title && (
          <h3 className="mt-0 mb-3 text-xl font-bold tracking-tight text-fd-foreground">{title}</h3>
        )}
        {summary && <div className="mb-3 text-sm text-fd-muted-foreground">{summary}</div>}
        <ul className="space-y-2">
          {changes.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-fd-foreground/90">
              <span
                className={cn(
                  "mt-0.5 inline-flex shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                  changeMeta[c.type].cls,
                )}
              >
                {changeMeta[c.type].label}
              </span>
              <span className="min-w-0 flex-1">
                {c.text}
                {c.refs?.map((r, ri) => (
                  <a
                    key={ri}
                    href={r.target}
                    className="ml-1.5 inline-flex items-center rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[11px] text-kp-accent-text no-underline"
                  >
                    {r.label ?? r.target}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export interface ReleasesProps {
  children?: React.ReactNode;
  /** Accessible name for the changelog. */
  label?: string;
}

/** A vertical changelog — a stack of `Release` entries divided by hairlines. Presentational only. */
export function Releases({ children, label = "Changelog" }: ReleasesProps) {
  return (
    <section aria-label={label} className="not-prose my-6">
      {children}
    </section>
  );
}

/** Alias for authors who prefer `<Changelog>`. */
export const Changelog = Releases;

/* ------------------------------------------------------------- knowledge face --- */

const changeTypeEnum = z.enum(["added", "changed", "fixed", "removed", "deprecated", "security"]);

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

const releaseSchema = z.object({
  version: z.string(),
  date: z.string(),
  status: statusEnum.optional(),
  title: z.string().optional(),
  summary: z.unknown().optional(),
  changes: z.array(
    z.object({
      type: changeTypeEnum,
      text: z.string(),
      refs: z.array(refSchema).optional(),
    }),
  ),
});

registerKnowledge("Release", {
  schema: releaseSchema,
  toKnowledge: (p: z.infer<typeof releaseSchema>, ctx: ExtractCtx) =>
    ({
      kind: "release",
      id: ctx.nextId(p.version),
      title: p.title ?? p.version,
      summary: p.summary != null ? ctx.text(p.summary) || undefined : undefined,
      status: p.status,
      version: p.version,
      date: parseKDate(p.date),
      changes: p.changes.map(
        (c): ReleaseChange => ({
          type: c.type,
          text: c.text,
          refs: c.refs?.map((r) =>
            ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
          ),
        }),
      ),
    }) satisfies ReleaseNode,
});
