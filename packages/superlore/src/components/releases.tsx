"use client";
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
 * Release / Changelog — a versioned release with a date, status, tags, an optional rich body, and a
 * list of changes each typed by kind (added / changed / fixed / removed / deprecated / security).
 * The human reads a Mintlify-grade changelog entry (sticky version/date/tag rail beside a rich body);
 * the agent gets `{ kind:"release", version, date, changes:[{ type, text }] }` so it can answer
 * "what changed in 2.0?" without parsing prose. The rich `children` body is human-only enrichment —
 * the typed `changes` remain the queryable knowledge face.
 *
 * `Releases` / `Changelog` is the surrounding stack — it adds a version jump-strip and a tag filter
 * (driven from each Release's stamped data-attributes), then renders its `Release` children.
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
  /** Tag pills shown in the rail and fed to the changelog tag filter (e.g. ["Dashboards","API"]). */
  tags?: string[];
  /** Rich MDX body rendered beside the rail — cards, media, prose. Human-only; not in the MCP face. */
  children?: React.ReactNode;
  changes?: ReleaseChangeInput[];
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
 * One changelog entry: a sticky left rail (big version + date + status + tag pills) beside a right
 * column with the headline, an optional rich body, and the typed changes. Stamps `data-sl-release`,
 * `data-version`, and `data-tags` so the surrounding `Releases` can build its jump-strip + filter.
 */
export function Release({
  version,
  date,
  status,
  title,
  summary,
  tags,
  children,
  changes,
}: ReleaseProps) {
  const anchor = anchorId(version);
  return (
    <section
      id={anchor}
      data-sl-release=""
      data-version={version}
      data-tags={(tags ?? []).join("|")}
      className="not-prose relative grid scroll-mt-24 gap-6 border-t border-fd-border py-10 first:border-t-0 first:pt-0 lg:grid-cols-[200px_1fr]"
    >
      <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <div className="font-mono text-3xl font-bold tracking-tight text-fd-foreground">
          {version}
        </div>
        <a
          href={`#${anchor}`}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-fd-border bg-fd-muted px-3 py-1 text-xs font-medium text-fd-muted-foreground no-underline"
        >
          <span className="inline-block size-1.5 rounded-full bg-kp-accent" />
          {displayDate(date)}
        </a>
        {status && (
          <span
            className={cn(
              "inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
              statusCls[status],
            )}
          >
            {status}
          </span>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-fd-border px-2.5 py-1 text-[11.5px] font-medium text-fd-muted-foreground"
              >
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: tagColor(t) }}
                />
                {t}
              </span>
            ))}
          </div>
        )}
      </aside>

      <div className="min-w-0">
        {title && (
          <h3 className="mt-0 mb-3 text-2xl font-bold tracking-tight text-fd-foreground">
            {title}
          </h3>
        )}
        {summary && <div className="mb-4 text-[15px] text-fd-muted-foreground">{summary}</div>}
        {children && <div className="mb-4 text-[15px] [&>*:first-child]:mt-0">{children}</div>}
        {changes && changes.length > 0 && (
          <ul className="space-y-2">
            {changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-fd-foreground/90">
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
        )}
      </div>
    </section>
  );
}

/** Deterministic, on-brand color for a tag pill / filter swatch (stable per label). */
function tagColor(tag: string): string {
  const hues = ["#6d5cf0", "#1f9d5e", "#c9921a", "#3b82d6", "#e865b5", "#6bcdbe"];
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return hues[h % hues.length]!;
}

export interface ReleasesProps {
  children?: React.ReactNode;
  /** Accessible name for the changelog. */
  label?: string;
}

/**
 * A vertical changelog with a Mintlify-grade header: a version jump-strip and a tag filter, built
 * from the `data-version` / `data-tags` each child `Release` stamps. The filter toggles entries
 * client-side; the jump-strip scrolls to a release. Falls back to a plain stack if JS is off.
 */
export function Releases({ children, label = "Changelog" }: ReleasesProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [versions, setVersions] = React.useState<{ v: string; id: string }[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [active, setActive] = React.useState<string>("All");

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rels = Array.from(root.querySelectorAll<HTMLElement>("[data-sl-release]"));
    setVersions(rels.map((r) => ({ v: r.dataset.version ?? "", id: r.id })));
    const all = new Set<string>();
    rels.forEach((r) =>
      (r.dataset.tags ?? "")
        .split("|")
        .filter(Boolean)
        .forEach((t) => all.add(t)),
    );
    setTags([...all]);
  }, []);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const r of root.querySelectorAll<HTMLElement>("[data-sl-release]")) {
      const has = (r.dataset.tags ?? "").split("|").filter(Boolean);
      r.style.display = active === "All" || has.includes(active) ? "" : "none";
    }
  }, [active]);

  return (
    <section ref={ref} aria-label={label} className="not-prose my-6">
      {(versions.length > 0 || tags.length > 0) && (
        <div className="mb-8 flex flex-col gap-4">
          {versions.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {versions.map(({ v, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-lg border border-fd-border px-2.5 py-1.5 font-mono text-[13px] font-medium text-fd-muted-foreground no-underline transition hover:border-kp-accent-border hover:bg-kp-accent-weak hover:text-kp-accent-text"
                >
                  {v}
                </a>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {["All", ...tags].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActive(t)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                    active === t
                      ? "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text"
                      : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  {t !== "All" && (
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: tagColor(t) }}
                    />
                  )}
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
  tags: z.array(z.string()).optional(),
  changes: z
    .array(
      z.object({
        type: changeTypeEnum,
        text: z.string(),
        refs: z.array(refSchema).optional(),
      }),
    )
    .optional(),
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
      changes: (p.changes ?? []).map(
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
