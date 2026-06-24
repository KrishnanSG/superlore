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
 * The human reads a Mintlify-grade changelog (a release-timeline jump-strip + sticky version/date/tag
 * rail beside a rich body); the agent gets `{ kind:"release", version, date, changes }` so it can
 * answer "what changed in 2.0?" without parsing prose. The rich `children` body is human-only — the
 * typed `changes` remain the queryable knowledge face.
 *
 * `Releases` / `Changelog` is the surrounding stack — it renders a **release timeline** (versions
 * plotted on a date axis, hover + click-to-jump) and a tag filter, both driven from each Release's
 * stamped data-attributes, then renders its `Release` children.
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

// Each change kind gets its OWN calm hue (Changed ≠ Fixed) — flat tint + matching text, no chunky
// border. Light/dark via the `dark:` variant. Reads as a quiet label, not a loud pill.
const changeMeta: Record<ReleaseChangeType, { label: string; cls: string }> = {
  added: { label: "Added", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" },
  changed: { label: "Changed", cls: "bg-blue-500/12 text-blue-700 dark:text-blue-400" },
  fixed: { label: "Fixed", cls: "bg-violet-500/12 text-violet-700 dark:text-violet-400" },
  removed: { label: "Removed", cls: "bg-rose-500/12 text-rose-700 dark:text-rose-400" },
  deprecated: { label: "Deprecated", cls: "bg-amber-500/14 text-amber-700 dark:text-amber-400" },
  security: { label: "Security", cls: "bg-red-500/14 text-red-700 dark:text-red-400" },
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

/** A short axis label for a date — "Jun 18" for a day, "May" for a month, "2026" for a year. */
function shortDate(date: string): string {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (day) {
    const d = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const mon = /^(\d{4})-(\d{2})$/.exec(date);
  if (mon) {
    const d = new Date(Number(mon[1]), Number(mon[2]) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return date;
}

/** Parse a coarse-or-precise date to a timestamp (month/year start when coarse); 0 if unparseable. */
function parseTime(date: string): number {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])).getTime();
  const mon = /^(\d{4})-(\d{2})$/.exec(date);
  if (mon) return new Date(Number(mon[1]), Number(mon[2]) - 1, 1).getTime();
  const yr = /^(\d{4})$/.exec(date);
  if (yr) return new Date(Number(yr[1]), 0, 1).getTime();
  return 0;
}

function anchorId(version: string): string {
  return version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One changelog entry: a sticky left rail (big version + date + status + tag pills) beside a right
 * column with the headline, an optional rich body, and the typed changes. Stamps data-attributes
 * (`data-version`, `data-date`, `data-tags`) so the surrounding `Releases` can build its timeline.
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
      data-date={date}
      data-status={status ?? ""}
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
          <ul className="space-y-2.5">
            {changes.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-fd-foreground/90">
                <span
                  className={cn(
                    "mt-px inline-flex w-[74px] shrink-0 justify-center rounded-md px-2 py-1 text-[10.5px] font-semibold tracking-wide uppercase",
                    changeMeta[c.type].cls,
                  )}
                >
                  {changeMeta[c.type].label}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
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

interface TimelineItem {
  v: string;
  id: string;
  t: number;
  dateLabel: string;
  /** Upcoming = not yet shipped (status planned / in-progress); plotted past the Now marker. */
  up: boolean;
}

/** Has this release shipped yet? Planned + in-progress are "upcoming" (roadmap); the rest are shipped. */
function isUpcoming(status?: string): boolean {
  return status === "planned" || status === "in-progress";
}

export interface ReleasesProps {
  children?: React.ReactNode;
  /** Accessible name for the changelog. */
  label?: string;
}

/**
 * A vertical changelog led by a **release timeline** — each version plotted on a date axis with a
 * connector to a tick, hover-to-highlight and click-to-jump — plus a tag filter. Both are built from
 * the `data-version` / `data-date` / `data-tags` each child `Release` stamps. Falls back to a plain
 * stack if JS is off.
 */
export function Releases({ children, label = "Changelog" }: ReleasesProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [items, setItems] = React.useState<TimelineItem[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [active, setActive] = React.useState<string>("All");
  const [hover, setHover] = React.useState<string | null>(null);
  // Client-only (avoids an SSR/hydration time mismatch) — anchors the "Now" marker on the axis.
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rels = Array.from(root.querySelectorAll<HTMLElement>("[data-sl-release]"));
    setItems(
      rels.map((r) => ({
        v: r.dataset.version ?? "",
        id: r.id,
        t: parseTime(r.dataset.date ?? ""),
        dateLabel: shortDate(r.dataset.date ?? ""),
        up: isUpcoming(r.dataset.status),
      })),
    );
    const all = new Set<string>();
    rels.forEach((r) =>
      (r.dataset.tags ?? "")
        .split("|")
        .filter(Boolean)
        .forEach((t) => all.add(t)),
    );
    setTags([...all]);
    setNow(Date.now());
  }, []);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const r of root.querySelectorAll<HTMLElement>("[data-sl-release]")) {
      const has = (r.dataset.tags ?? "").split("|").filter(Boolean);
      r.style.display = active === "All" || has.includes(active) ? "" : "none";
    }
  }, [active]);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Timeline geometry — position each dated release along a min→max axis (incl. "now", clamped off
  // the edges) so shipped releases sit left of the Now marker and upcoming ones to its right.
  const dated = items.filter((i) => i.t > 0);
  const ts = dated.map((i) => i.t);
  const lo = ts.length ? Math.min(...ts) : 0;
  const hi = ts.length ? Math.max(...ts) : 1;
  const min = now != null ? Math.min(lo, now) : lo;
  const max = now != null ? Math.max(hi, now) : hi;
  const span = Math.max(max - min, 1);
  const xOf = (t: number) => 5 + ((t - min) / span) * 90;
  const months = monthTicks(min, max).map((m) => ({ ...m, x: xOf(m.t) }));
  const upcomingCount = dated.filter((i) => i.up).length;
  const rangeLabel =
    dated.length >= 2
      ? `${dated.length} releases · ${monthYear(lo)} – ${monthYear(hi)}${upcomingCount ? ` · ${upcomingCount} upcoming` : ""}`
      : `${items.length} release${items.length === 1 ? "" : "s"}`;

  return (
    <section ref={ref} aria-label={label} className="not-prose my-6">
      {dated.length >= 2 && (
        <div className="mb-7 rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-kp-accent-text uppercase">
              Release timeline
            </span>
            <span className="hidden text-[10px] tracking-widest text-fd-muted-foreground uppercase sm:inline">
              Hover · click to jump
            </span>
          </div>
          <div className="mb-5 text-[13px] text-fd-muted-foreground">{rangeLabel}</div>
          <div className="relative h-[120px]">
            {/* axis */}
            <div className="absolute right-0 bottom-7 left-0 h-px bg-fd-border" />
            {months.map((m) => (
              <div
                key={m.label}
                className="absolute bottom-2 -translate-x-1/2 text-[10px] font-medium tracking-wider text-fd-muted-foreground/70 uppercase"
                style={{ left: `${m.x}%` }}
              >
                {m.label}
              </div>
            ))}
            {/* "Now" marker — shipped sits to its left, upcoming to its right. */}
            {now != null && now > min && now < max && (
              <div
                className="pointer-events-none absolute top-1 bottom-7 z-0 -translate-x-1/2"
                style={{ left: `${xOf(now)}%` }}
              >
                <span className="text-kp-accent-ink absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-kp-accent px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                  Now
                </span>
                <div className="mt-4 h-full w-px border-l border-dashed border-kp-accent/45" />
              </div>
            )}
            {dated.map((it) => {
              const on = hover === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onMouseEnter={() => setHover(it.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => jump(it.id)}
                  className="group absolute top-0 bottom-7 z-10 -translate-x-1/2 cursor-pointer"
                  style={{ left: `${xOf(it.t)}%` }}
                  aria-label={`Jump to ${it.v}`}
                >
                  {/* version card — solid dark when shipped, dashed accent outline when upcoming */}
                  <span
                    className={cn(
                      "block rounded-lg px-2.5 py-1.5 text-center font-mono leading-tight whitespace-nowrap transition",
                      it.up
                        ? cn(
                            "border border-dashed border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
                            on && "-translate-y-0.5 border-kp-accent",
                          )
                        : cn(
                            "bg-[#1a1b26] text-white shadow-sm ring-1",
                            on ? "-translate-y-0.5 ring-kp-accent" : "ring-black/10",
                          ),
                    )}
                  >
                    <span className="block text-[13px] font-bold">{it.v}</span>
                    <span
                      className={cn(
                        "block text-[10px]",
                        it.up ? "text-kp-accent-text/70" : "text-white/55",
                      )}
                    >
                      {it.dateLabel}
                    </span>
                  </span>
                  {/* connector */}
                  <span
                    className={cn(
                      "absolute bottom-7 left-1/2 w-px -translate-x-1/2 transition-colors",
                      it.up
                        ? "border-l border-dashed border-kp-accent-border"
                        : on
                          ? "bg-kp-accent"
                          : "bg-fd-border",
                    )}
                    style={{ top: 44 }}
                  />
                  {/* axis dot — filled when shipped, hollow ring when upcoming */}
                  <span
                    className={cn(
                      "absolute bottom-7 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-fd-card transition-colors",
                      it.up
                        ? "bg-fd-card ring-kp-accent"
                        : on
                          ? "bg-kp-accent"
                          : "bg-fd-muted-foreground/60",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
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
      {children}
    </section>
  );
}

/** "Jun 2026" for a timestamp. */
function monthYear(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Month-boundary ticks (uppercase "MAR 2026") spanning a range, capped so the axis stays uncluttered. */
function monthTicks(min: number, max: number): { label: string; t: number }[] {
  if (!min || max <= min) return [];
  const out: { label: string; t: number }[] = [];
  const d = new Date(min);
  d.setDate(1);
  if (d.getTime() < min) d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= max && out.length < 8) {
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase(),
      t: d.getTime(),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
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
