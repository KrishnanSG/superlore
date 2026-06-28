"use client";
import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { Icon } from "./mintlify";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import {
  parseKDate,
  type RelKind,
  type ReleaseChange,
  type ReleaseChangeType,
  type ReleaseHighlight,
  type ReleaseMedia as MediaData,
  type ReleaseNode,
  type ReleaseSection,
  type Status,
} from "../knowledge/primitives";

/**
 * Release / Changelog — a reimagined, enterprise-grade release record. The human reads a media-first
 * entry (hero screenshot or video, a Highlights grid, changes grouped into New / Improved / Fixed
 * sections) beside a sticky rail that doubles as a jump-list of the areas touched; the agent gets
 * `{ kind:"release", version, date, areas, media, highlights, sections, changes }` — every block typed
 * and queryable, never a picture to interpret. That is the dual-representation moat applied to release
 * notes: a screenshot's caption and a highlight's text are DATA, not pixels.
 *
 * `Releases` / `Changelog` wraps the stack: a **release timeline** and a **multi-select feature
 * filter** (pick any number of areas; the entry list narrows to releases touching them). The timeline
 * has its own options via `timeline` — `axis` (default: versions on a date axis with a
 * collision-avoidance lane layout so crowded releases never overlap, plus a sleek hover card),
 * `strip` (an evenly-spaced, non-scrolling row of stops), or `off`. Each entry's rail shows the
 * release's feature tags as chips that double as filter toggles.
 *
 * Three entry variants — `feature` (default, the full record), `timeline` (lighter rolling feed),
 * `compact` (dense list). All from the same typed data.
 */

type ReleaseRef = { rel?: string; target: string; label?: string };

export interface ReleaseChangeInput {
  type: ReleaseChangeType;
  text: string;
  refs?: ReleaseRef[];
}

export type ReleaseVariant = "feature" | "timeline" | "compact";

const VariantCtx = React.createContext<ReleaseVariant>("feature");
/** Version of the newest shipped release — it wears a "Latest" badge. */
const LatestCtx = React.createContext<string | null>(null);
/** Lets a release's rail tag-chips drive the changelog's multi-select feature filter. */
type FilterApi = { selected: string[]; toggle: (tag: string) => void };
const FilterCtx = React.createContext<FilterApi | null>(null);

export interface ReleaseProps {
  version: string;
  date: string;
  status?: Status;
  title?: string;
  summary?: React.ReactNode;
  /** Filter chips + the changelog tag filter. */
  tags?: string[];
  /** Product areas / features this release touched — rail jump-list, timeline hover card. */
  areas?: string[];
  /** Hero & inline media. The first item renders as the hero. */
  media?: MediaData[];
  /** Marquee features, rendered as a Highlights card grid and serialized for the MCP. */
  highlights?: ReleaseHighlight[];
  /** Changes grouped under headings (New features / Improvements / Fixes / Security). */
  sections?: ReleaseSection[];
  /** Flat changes — used when `sections` isn't provided. */
  changes?: ReleaseChangeInput[];
  /** Rich MDX body rendered beside the rail — human-only, not in the MCP face. */
  children?: React.ReactNode;
  /** Override the surrounding `Releases` variant for this one entry. */
  variant?: ReleaseVariant;
}

/* ----------------------------------------------------------------- change styling --- */

const kindLabel: Record<ReleaseChangeType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  removed: "Removed",
  deprecated: "Deprecated",
  security: "Security",
};
/** Solid dot colour per change kind — used for the row marker in grouped sections. */
const kindDot: Record<ReleaseChangeType, string> = {
  added: "bg-emerald-500",
  changed: "bg-blue-500",
  fixed: "bg-violet-500",
  removed: "bg-rose-500",
  deprecated: "bg-amber-500",
  security: "bg-red-500",
};
/** Soft text+dot colour per kind — the compact variant's quiet inline tag. */
const kindText: Record<ReleaseChangeType, string> = {
  added: "text-emerald-600 dark:text-emerald-400",
  changed: "text-blue-600 dark:text-blue-400",
  fixed: "text-violet-600 dark:text-violet-400",
  removed: "text-rose-600 dark:text-rose-400",
  deprecated: "text-amber-600 dark:text-amber-400",
  security: "text-red-600 dark:text-red-400",
};

const statusMark: Record<Status, { label: string; dot: string }> = {
  planned: { label: "Planned", dot: "bg-fd-muted-foreground/45" },
  "in-progress": { label: "In progress", dot: "bg-kp-accent" },
  blocked: { label: "Blocked", dot: "bg-kp-danger" },
  done: { label: "Shipped", dot: "bg-kp-success" },
  deprecated: { label: "Deprecated", dot: "bg-fd-muted-foreground/45" },
  proposed: { label: "Proposed", dot: "bg-kp-accent" },
  accepted: { label: "Accepted", dot: "bg-kp-success" },
  rejected: { label: "Rejected", dot: "bg-kp-danger" },
  superseded: { label: "Superseded", dot: "bg-fd-muted-foreground/45" },
};

/** Infer a heading icon + tone for a section from its label (so authors just write "Fixes"). */
function sectionTone(label: string): { icon: string; chip: string; dot: string } {
  const l = label.toLowerCase();
  if (/secur/.test(l))
    return {
      icon: "shield-alert",
      chip: "bg-red-500/12 text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    };
  if (/fix|bug/.test(l))
    return {
      icon: "wrench",
      chip: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
      dot: "bg-violet-500",
    };
  if (/remov/.test(l))
    return {
      icon: "minus",
      chip: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
    };
  if (/deprecat/.test(l))
    return {
      icon: "circle-slash",
      chip: "bg-amber-500/14 text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    };
  if (/improv|enhanc|chang|updat|better/.test(l))
    return {
      icon: "sliders-horizontal",
      chip: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
    };
  if (/add|new|feature|launch|introduc/.test(l))
    return {
      icon: "plus",
      chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    };
  return {
    icon: "circle-dot",
    chip: "bg-fd-muted text-fd-muted-foreground",
    dot: "bg-fd-muted-foreground",
  };
}

/* ----------------------------------------------------------------------- dates --- */

function displayDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
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
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* --------------------------------------------------------------------- media --- */

function inferProvider(src: string): "file" | "youtube" | "loom" | "vimeo" | "iframe" {
  if (/youtu\.?be|youtube\.com/.test(src)) return "youtube";
  if (/loom\.com/.test(src)) return "loom";
  if (/vimeo\.com/.test(src)) return "vimeo";
  // A raw media file plays in <video>; anything else is embedded verbatim in an <iframe>.
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(src)) return "file";
  return "iframe";
}
function embedUrl(media: MediaData): string {
  const p = media.provider ?? inferProvider(media.src);
  const src = media.src;
  if (p === "youtube") {
    const m = /(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/.exec(src);
    const id = m?.[1] ?? "";
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  }
  if (p === "loom") {
    const m = /loom\.com\/(?:share|embed)\/([\w-]+)/.exec(src);
    return `https://www.loom.com/embed/${m?.[1] ?? ""}?autoplay=1`;
  }
  if (p === "vimeo") {
    const m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(src);
    return `https://player.vimeo.com/video/${m?.[1] ?? ""}?autoplay=1`;
  }
  return src;
}

function ImageMedia({ media }: { media: MediaData }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <figure className="my-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full cursor-zoom-in overflow-hidden rounded-xl border border-fd-border bg-fd-muted p-0"
        aria-label={media.alt ?? "Open screenshot"}
      >
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className="block w-full transition group-hover:opacity-95"
          loading="lazy"
        />
      </button>
      {media.caption && (
        <figcaption className="mt-2 text-center text-[13px] text-fd-muted-foreground">
          {media.caption}
        </figcaption>
      )}
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute inset-0 cursor-zoom-out"
          />
          <img
            src={media.src}
            alt={media.alt ?? ""}
            className="relative max-h-[90vh] max-w-[92vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </figure>
  );
}

function VideoMedia({ media }: { media: MediaData }) {
  const [playing, setPlaying] = React.useState(false);
  const provider = media.provider ?? inferProvider(media.src);
  const isFile = provider === "file";
  return (
    <figure className="my-0">
      <div
        className="relative overflow-hidden rounded-xl border border-fd-border bg-[#0d0d14]"
        style={{ aspectRatio: "16 / 9" }}
      >
        {playing ? (
          isFile ? (
            <video
              src={media.src}
              poster={media.poster}
              controls
              autoPlay
              className="h-full w-full"
            >
              <track kind="captions" />
            </video>
          ) : (
            <iframe
              src={embedUrl(media)}
              title={media.title ?? "Release video"}
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center"
            style={
              media.poster
                ? {
                    backgroundImage: `url(${media.poster})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    backgroundImage:
                      "radial-gradient(120% 90% at 80% 10%, color-mix(in oklab, var(--kp-accent) 22%, transparent), transparent 60%)",
                  }
            }
            aria-label={`Play ${media.title ?? "video"}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-105">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#16161e" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            {(media.title || media.duration) && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/55 px-2 py-1 font-mono text-[10.5px] tracking-wide text-white/90 uppercase backdrop-blur-sm">
                {media.duration ? `▶ ${media.duration}` : "▶ Play"}
                {media.title ? ` · ${media.title}` : ""}
              </span>
            )}
          </button>
        )}
      </div>
      {media.caption && (
        <figcaption className="mt-2 text-center text-[13px] text-fd-muted-foreground">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}

function MediaBlock({ media, className }: { media: MediaData; className?: string }) {
  return (
    <div className={className}>
      {media.type === "video" ? <VideoMedia media={media} /> : <ImageMedia media={media} />}
    </div>
  );
}

/* ----------------------------------------------------------------- highlights --- */

function HighlightsGrid({
  highlights,
  anchor,
}: {
  highlights: ReleaseHighlight[];
  anchor: string;
}) {
  return (
    <div className="mt-7">
      <h3 className="mt-0 mb-4 text-lg font-bold tracking-tight text-fd-foreground">Highlights</h3>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {highlights.map((h, i) => {
          const id = `${anchor}-h-${slug(h.title)}`;
          const inner = (
            <>
              {h.media ? (
                <MediaBlock media={h.media} className="mb-3 [&_figure]:m-0 [&_img]:rounded-lg" />
              ) : (
                <span className="mb-3 inline-flex size-9 items-center justify-center rounded-[9px] bg-kp-accent-weak text-kp-accent-text">
                  <Icon icon={h.icon ?? "sparkles"} size={17} />
                </span>
              )}
              <div className="text-[15px] font-semibold text-fd-foreground">{h.title}</div>
              {h.body && (
                <p className="mt-1.5 mb-0 text-[13.5px] leading-relaxed text-fd-muted-foreground">
                  {h.body}
                </p>
              )}
            </>
          );
          const cls =
            "block rounded-xl border border-fd-border bg-fd-card p-4 no-underline transition hover:-translate-y-0.5 hover:border-kp-accent-border hover:shadow-sm";
          return h.href ? (
            <a key={i} id={id} href={h.href} className={cls}>
              {inner}
            </a>
          ) : (
            <div key={i} id={id} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- changes --- */

function InlineRefs({ refs }: { refs?: ReleaseRef[] }) {
  if (!refs?.length) return null;
  return (
    <>
      {refs.map((r, ri) => (
        <a
          key={ri}
          href={r.target}
          className="ml-1.5 font-medium text-kp-accent-text underline decoration-kp-accent/35 underline-offset-2 transition hover:decoration-kp-accent"
        >
          {r.label ?? r.target}
        </a>
      ))}
    </>
  );
}

/** Grouped sections (New / Improved / Fixed). Each heading owns the category; rows stay clean. */
function Sections({ sections }: { sections: ReleaseSection[] }) {
  return (
    <div className="mt-7 space-y-7">
      {sections.map((s, si) => {
        const tone = sectionTone(s.label);
        return (
          <div key={si}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className={cn("flex size-5 items-center justify-center rounded-md", tone.chip)}>
                <Icon icon={s.icon ?? tone.icon} size={12} />
              </span>
              <span className="text-[12.5px] font-bold tracking-wide text-fd-foreground uppercase">
                {s.label}
              </span>
              <span className="ml-auto font-mono text-[11px] text-fd-muted-foreground">
                {s.changes.length}
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {s.changes.map((c, ci) => (
                <li
                  key={ci}
                  className="flex gap-3 border-t border-fd-border/60 py-2 text-[14.5px] first:border-t-0"
                >
                  <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", tone.dot)} />
                  <span className="min-w-0 flex-1 text-fd-foreground/90">
                    {c.text}
                    <InlineRefs refs={c.refs} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Flat changes — the back-compat list. Soft inline tag per row. */
function FlatChanges({ changes, compact }: { changes: ReleaseChangeInput[]; compact?: boolean }) {
  return (
    <ul className={cn("m-0 list-none p-0", compact ? "mt-2 space-y-1.5" : "mt-6 space-y-2.5")}>
      {changes.map((c, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-fd-foreground/90">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 font-medium",
              kindText[c.type],
            )}
            style={{ minWidth: 76 }}
          >
            <span className={cn("size-1.5 rounded-full", kindDot[c.type])} />
            <span className="text-[12px]">{kindLabel[c.type]}</span>
          </span>
          <span className="min-w-0 flex-1">
            {c.text}
            <InlineRefs refs={c.refs} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------------- Rail --- */

function Rail({
  version,
  anchor,
  date,
  status,
  areas,
  highlights,
  tags,
  variant,
  isLatest,
  activeJump,
}: {
  version: string;
  anchor: string;
  date: string;
  status?: Status;
  areas?: string[];
  highlights?: ReleaseHighlight[];
  tags?: string[];
  variant: ReleaseVariant;
  isLatest?: boolean;
  activeJump?: string | null;
}) {
  const jump = highlights?.length
    ? highlights.map((h) => ({ label: h.title, href: `#${anchor}-h-${slug(h.title)}` }))
    : null;
  const filter = React.useContext(FilterCtx);
  // Feature-tag chips below the rail: filterable `tags` win; otherwise show `areas` (display-only).
  const chipTags = tags && tags.length > 0 ? tags : [];
  const chipAreas = !chipTags.length && areas && areas.length ? areas : [];
  return (
    <aside className="flex flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
      {variant === "feature" ? (
        <div className="flex items-center gap-2">
          <a
            href={`#${anchor}`}
            className="w-fit rounded-lg bg-kp-accent-weak px-2.5 py-1 font-mono text-[13px] font-bold tracking-tight text-kp-accent-text no-underline"
          >
            {version}
          </a>
          {isLatest && (
            <span className="rounded-full bg-kp-success/12 px-2 py-0.5 text-[10px] font-bold tracking-wide text-kp-success uppercase">
              Latest
            </span>
          )}
        </div>
      ) : (
        <a
          href={`#${anchor}`}
          className="inline-flex w-fit items-center gap-2 font-mono text-2xl font-bold tracking-tight text-fd-foreground no-underline transition-colors hover:text-kp-accent-text"
        >
          {version}
          {isLatest && (
            <span className="rounded-full bg-kp-success/12 px-2 py-0.5 font-sans text-[10px] font-bold tracking-wide text-kp-success uppercase">
              Latest
            </span>
          )}
        </a>
      )}

      {variant === "feature" && jump && (
        <nav className="mt-1 flex flex-col">
          {jump.map((j) => {
            const on = activeJump === j.href;
            return (
              <a
                key={j.href}
                href={j.href}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "border-l-2 py-[3px] pl-2.5 text-[14px] no-underline transition",
                  on
                    ? "border-kp-accent font-medium text-fd-foreground"
                    : "border-transparent text-fd-muted-foreground hover:border-kp-accent-border hover:text-fd-foreground",
                )}
              >
                {j.label}
              </a>
            );
          })}
        </nav>
      )}

      <time dateTime={date} className="mt-1 text-[13px] text-fd-muted-foreground">
        {displayDate(date)}
      </time>
      {status && (
        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-fd-muted-foreground">
          <span className={cn("inline-block size-2 rounded-full", statusMark[status].dot)} />
          {statusMark[status].label}
        </div>
      )}

      {/* Feature tags — the areas this release touched, as chips below the meta. In the feature
          variant they double as filter toggles (click to filter the changelog by that feature). */}
      {variant === "feature" && (chipTags.length > 0 || chipAreas.length > 0) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chipTags.map((t) => {
            const on = filter?.selected.includes(t) ?? false;
            return (
              <button
                key={t}
                type="button"
                onClick={() => filter?.toggle(t)}
                aria-pressed={on}
                title={`Filter by ${t}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[11px] font-medium transition",
                  on
                    ? "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text"
                    : "border-fd-border bg-fd-card text-fd-muted-foreground hover:border-kp-accent-border hover:text-fd-foreground",
                )}
              >
                <span className="size-1.5 rounded-full" style={{ background: tagColor(t) }} />
                {t}
              </button>
            );
          })}
          {chipAreas.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card px-2 py-[3px] text-[11px] font-medium text-fd-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-fd-muted-foreground/40" />
              {a}
            </span>
          ))}
        </div>
      )}

      {variant !== "feature" && areas && areas.length > 0 && (
        <div className="mt-0.5 text-[12.5px] text-fd-muted-foreground/75">
          {areas.join("  ·  ")}
        </div>
      )}
      {variant !== "feature" && !areas?.length && tags && tags.length > 0 && (
        <div className="mt-0.5 text-[12.5px] text-fd-muted-foreground/75">{tags.join("  ·  ")}</div>
      )}
    </aside>
  );
}

/* -------------------------------------------------------------------- Release --- */

export function Release(props: ReleaseProps) {
  const ctxVariant = React.useContext(VariantCtx);
  const variant = props.variant ?? ctxVariant;
  const {
    version,
    date,
    status,
    title,
    summary,
    tags,
    areas,
    media,
    highlights,
    sections,
    changes,
    children,
  } = props;
  const anchor = anchorId(version);
  const hero = media?.[0];
  const restMedia = media?.slice(1) ?? [];
  const latest = React.useContext(LatestCtx);
  const isLatest =
    latest != null && latest === version && status !== "planned" && status !== "in-progress";
  const [activeJump, setActiveJump] = React.useState<string | null>(null);

  // Scroll-spy: light the rail jump-item whose Highlight is currently in view.
  React.useEffect(() => {
    if (variant !== "feature" || !highlights?.length) return;
    const els = highlights
      .map((h) => document.getElementById(`${anchor}-h-${slug(h.title)}`))
      .filter((e): e is HTMLElement => e != null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActiveJump(`#${vis[0].target.id}`);
      },
      { rootMargin: "-18% 0px -72% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [variant, highlights, anchor]);

  // Stamp the typed payload for the surrounding Releases (timeline + filter) to read.
  const data = {
    "data-sl-release": "",
    "data-version": version,
    "data-date": date,
    "data-status": status ?? "",
    "data-tags": (tags ?? []).join("|"),
    "data-areas": (areas ?? []).join("|"),
    "data-title": title ?? "",
  };

  /* compact — a dense single-column row, no rail, no hero. */
  if (variant === "compact") {
    return (
      <section
        id={anchor}
        {...data}
        className="not-prose scroll-mt-24 border-t border-fd-border py-5 first:border-t-0 first:pt-0"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <a
            href={`#${anchor}`}
            className="font-mono text-base font-bold text-fd-foreground no-underline"
          >
            {version}
          </a>
          <time dateTime={date} className="font-mono text-[12.5px] text-fd-muted-foreground">
            {shortDate(date)}
          </time>
          {title && <span className="text-[15px] font-semibold text-fd-foreground">{title}</span>}
          {isLatest && (
            <span className="rounded-full bg-kp-success/12 px-2 py-0.5 text-[10px] font-bold tracking-wide text-kp-success uppercase">
              Latest
            </span>
          )}
        </div>
        {summary && (
          <div className="mt-1 max-w-[70ch] text-[14px] text-fd-muted-foreground">{summary}</div>
        )}
        {sections?.length ? (
          <FlatChanges changes={sections.flatMap((s) => s.changes)} compact />
        ) : changes && changes.length > 0 ? (
          <FlatChanges changes={changes} compact />
        ) : null}
      </section>
    );
  }

  /* feature (default) + timeline — rail beside a rich body. */
  return (
    <section
      id={anchor}
      {...data}
      className="not-prose relative grid scroll-mt-24 gap-x-9 gap-y-5 border-t border-fd-border py-11 first:border-t-0 first:pt-0 lg:grid-cols-[190px_1fr]"
    >
      <Rail
        version={version}
        anchor={anchor}
        date={date}
        status={status}
        areas={areas}
        highlights={variant === "feature" ? highlights : undefined}
        tags={tags}
        variant={variant}
        isLatest={isLatest}
        activeJump={activeJump}
      />

      <div className="min-w-0">
        {title && (
          <h3 className="group/anchor mt-0 mb-2 flex items-start gap-2 text-[26px] leading-tight font-extrabold tracking-tight text-fd-foreground">
            <span>{title}</span>
            <a
              href={`#${anchor}`}
              aria-label={`Permalink to ${version}`}
              className="mt-1.5 shrink-0 text-fd-muted-foreground no-underline opacity-0 transition group-hover/anchor:opacity-100 hover:text-kp-accent-text focus-visible:opacity-100"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </a>
          </h3>
        )}
        {summary && (
          <div className="mb-5 max-w-[70ch] text-[16px] text-fd-muted-foreground">{summary}</div>
        )}

        {hero && <MediaBlock media={hero} className="mb-2" />}

        {variant === "feature" && highlights && highlights.length > 0 && (
          <HighlightsGrid highlights={highlights} anchor={anchor} />
        )}

        {children && <div className="mt-6 text-[15px] [&>*:first-child]:mt-0">{children}</div>}

        {restMedia.map((m, i) => (
          <MediaBlock key={i} media={m} className="mt-5" />
        ))}

        {sections && sections.length > 0 ? (
          <Sections sections={sections} />
        ) : changes && changes.length > 0 ? (
          <FlatChanges changes={changes} />
        ) : null}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- tag swatch colour --- */

function tagColor(tag: string): string {
  const hues = ["#6d5cf0", "#1f9d5e", "#c9921a", "#3b82d6", "#e865b5", "#6bcdbe"];
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return hues[h % hues.length]!;
}

/* --------------------------------------------------------------------- Timeline --- */

interface TimelineItem {
  v: string;
  id: string;
  t: number;
  dateLabel: string;
  title: string;
  areas: string[];
  tags: string[];
  up: boolean;
  /** Assigned lane (0 = highest card sits highest). */
  lane: number;
  /** x position in px within the scrollable track. */
  x: number;
}

const DAYS_IN_MONTH = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

function isUpcoming(status?: string): boolean {
  return status === "planned" || status === "in-progress";
}
function monthYear(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
export interface ReleasesProps {
  children?: React.ReactNode;
  /** Accessible name for the changelog. */
  label?: string;
  /** Default rendering for every child Release. Default `feature`. */
  variant?: ReleaseVariant;
  /**
   * The overview graph drawn above the entries — pick the shape that fits the cadence:
   * - `axis` (default) — a date-proportional, scrollable rail; crowded versions stack into lanes.
   * - `strip` — an evenly-spaced, non-scrolling row of version stops; calmer, no date distortion.
   * - `off` — no graph; the entries carry their own rail navigation.
   */
  timeline?: "axis" | "strip" | "off";
}

/** Hover popover state — the item plus the fixed viewport coords to draw it at. */
interface PopState {
  it: TimelineItem;
  left: number;
  top: number;
}

export function Releases({
  children,
  label = "Changelog",
  variant = "feature",
  timeline = "axis",
}: ReleasesProps) {
  const ref = React.useRef<HTMLElement>(null);
  const scRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const leftBtn = React.useRef<HTMLButtonElement>(null);
  const rightBtn = React.useRef<HTMLButtonElement>(null);
  const [raw, setRaw] = React.useState<Omit<TimelineItem, "lane" | "x">[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  // Multi-select feature filter — empty means "show everything".
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggleTag = React.useCallback((t: string) => {
    setSelected((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }, []);
  const clearFilter = React.useCallback(() => setSelected([]), []);
  const filterApi = React.useMemo<FilterApi>(
    () => ({ selected, toggle: toggleTag }),
    [selected, toggleTag],
  );
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [pop, setPop] = React.useState<PopState | null>(null);
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rels = Array.from(root.querySelectorAll<HTMLElement>("[data-sl-release]"));
    setRaw(
      rels.map((r) => ({
        v: r.dataset.version ?? "",
        id: r.id,
        t: parseTime(r.dataset.date ?? ""),
        dateLabel: shortDate(r.dataset.date ?? ""),
        title: r.dataset.title ?? "",
        areas: (r.dataset.areas ?? "").split("|").filter(Boolean),
        tags: (r.dataset.tags ?? "").split("|").filter(Boolean),
        up: isUpcoming(r.dataset.status),
      })),
    );
    const tg = new Set<string>();
    rels.forEach((r) =>
      (r.dataset.tags ?? "")
        .split("|")
        .filter(Boolean)
        .forEach((t) => tg.add(t)),
    );
    setTags([...tg]);
    setNow(Date.now());
  }, []);

  // Filter the entry list (the timeline stays a full overview). A release shows when nothing is
  // selected, or when it carries ANY of the selected features (OR semantics).
  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const r of root.querySelectorAll<HTMLElement>("[data-sl-release]")) {
      const has = (r.dataset.tags ?? "").split("|").filter(Boolean);
      const show = selected.length === 0 || has.some((t) => selected.includes(t));
      r.style.display = show ? "" : "none";
    }
  }, [selected, raw.length]);

  // Close the filter menu on outside click / Escape.
  React.useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-sl-filter]")) setFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFilterOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* --- timeline geometry: fixed month width, scrollable, ~2 months in view --- */
  const MONTH_W = 268;
  const PAD = 44;
  const dated0 = raw.filter((i) => i.t > 0);
  const allT = [...dated0.map((i) => i.t), ...(now != null ? [now] : [])];
  const minT = allT.length ? Math.min(...allT) : 0;
  const maxT = allT.length ? Math.max(...allT) : 1;
  const base = new Date(minT);
  const baseY = base.getFullYear();
  const baseM = base.getMonth();
  const monthFloat = (t: number) => {
    const d = new Date(t);
    return (
      (d.getFullYear() - baseY) * 12 +
      (d.getMonth() - baseM) +
      (d.getDate() - 1) / DAYS_IN_MONTH(d.getFullYear(), d.getMonth())
    );
  };
  const xOf = (t: number) => PAD + monthFloat(t) * MONTH_W;
  const lastMonth = Math.ceil(monthFloat(maxT));
  const trackW = PAD * 2 + (lastMonth + 0.5) * MONTH_W;

  const items: TimelineItem[] = React.useMemo(() => {
    const sorted = [...dated0].map((i) => ({ ...i, x: xOf(i.t) })).sort((a, b) => a.x - b.x);
    const CARD = 98;
    const GAP = 12;
    const MAX_LANES = 3;
    const laneRight: number[] = [];
    return sorted.map((i) => {
      const left = i.x - CARD / 2;
      let lane = laneRight.findIndex((r) => r + GAP <= left);
      if (lane === -1) {
        if (laneRight.length < MAX_LANES) {
          lane = laneRight.length;
          laneRight.push(0);
        } else lane = laneRight.indexOf(Math.min(...laneRight));
      }
      laneRight[lane] = left + CARD;
      return { ...i, lane };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, now]);

  // Wheel→horizontal, grab-drag, progress thumb sync, open-at-newest.
  React.useEffect(() => {
    const sc = scRef.current;
    if (!sc || items.length < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const sync = () => {
      const maxScroll = sc.scrollWidth - sc.clientWidth;
      const tw = Math.max((sc.clientWidth / sc.scrollWidth) * 100, 14);
      if (thumbRef.current) {
        thumbRef.current.style.width = tw + "%";
        thumbRef.current.style.left =
          (maxScroll > 0 ? (sc.scrollLeft / maxScroll) * (100 - tw) : 0) + "%";
      }
      if (leftBtn.current) leftBtn.current.toggleAttribute("disabled", sc.scrollLeft <= 1);
      if (rightBtn.current)
        rightBtn.current.toggleAttribute("disabled", sc.scrollLeft >= maxScroll - 1);
    };
    const onScroll = () => {
      setPop(null);
      sync();
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        sc.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    let down = false,
      sx = 0,
      sl = 0,
      moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = true;
      moved = false;
      sx = e.clientX;
      sl = sc.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) {
        moved = true;
        sc.classList.add("sl-grabbing");
        setPop(null);
        sc.setPointerCapture(e.pointerId);
      }
      sc.scrollLeft = sl - dx;
    };
    const onUp = () => {
      down = false;
      sc.classList.remove("sl-grabbing");
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    sc.addEventListener("wheel", onWheel, { passive: false });
    sc.addEventListener("pointerdown", onDown);
    sc.addEventListener("pointermove", onMove);
    sc.addEventListener("pointerup", onUp);
    sc.addEventListener("pointercancel", onUp);
    sc.addEventListener("click", onClickCapture, true);
    // open scrolled to the newest releases
    sc.scrollTo({ left: sc.scrollWidth, behavior: reduce ? "auto" : "auto" });
    sync();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      sc.removeEventListener("wheel", onWheel);
      sc.removeEventListener("pointerdown", onDown);
      sc.removeEventListener("pointermove", onMove);
      sc.removeEventListener("pointerup", onUp);
      sc.removeEventListener("pointercancel", onUp);
      sc.removeEventListener("click", onClickCapture, true);
    };
  }, [items.length, trackW]);

  const showPop = (el: HTMLElement, it: TimelineItem) => {
    const r = el.getBoundingClientRect();
    const W = 248;
    const left = Math.max(12, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 12));
    const top = Math.max(12, r.top - 8); // popover renders upward from here via translateY(-100%)
    setPop({ it, left, top });
  };

  // month ticks/labels across the track
  const monthCols = Array.from({ length: lastMonth + 1 }, (_, m) => ({
    m,
    x: PAD + m * MONTH_W,
    label: new Date(baseY, baseM + m, 1)
      .toLocaleDateString("en-US", { month: "short", year: "numeric" })
      .toUpperCase(),
  }));
  const upcomingCount = items.filter((i) => i.up).length;
  const rangeLabel =
    items.length >= 2
      ? `${items.length} releases · ${monthYear(minT)} – ${monthYear(maxT)}${upcomingCount ? ` · ${upcomingCount} upcoming` : ""}`
      : `${raw.length} release${raw.length === 1 ? "" : "s"}`;

  const showTimeline = variant !== "compact" && items.length >= 2 && timeline !== "off";
  const maxLane = items.length ? Math.max(...items.map((i) => i.lane)) : 0;
  // Vertical bands, measured up from the track's bottom edge:
  //   month labels (LABEL_Y) ── axis line (AXIS_Y, dots centred here) ── connectors ── cards.
  // A lane step taller than a card guarantees stacked cards never overlap; lane 0 sits nearest the
  // axis and higher lanes climb away from it, so the track only grows as tall as a crowd needs.
  const AXIS_Y = 52;
  const LABEL_Y = 13;
  const CARD_H = 44;
  const LANE_STEP = CARD_H + 10;
  const BASE_CONN = 26;
  const connOf = (lane: number) => BASE_CONN + lane * LANE_STEP;
  const trackH = AXIS_Y + connOf(maxLane) + CARD_H + 22;
  const matchCount =
    selected.length === 0
      ? raw.length
      : raw.filter((r) => r.tags.some((t) => selected.includes(t))).length;
  // The newest shipped release wears a "Latest" badge (computed once raw is read on the client).
  const shipped = raw.filter((r) => r.t > 0 && !r.up);
  const latestVersion = shipped.length ? shipped.reduce((a, b) => (b.t > a.t ? b : a)).v : null;

  return (
    <VariantCtx.Provider value={variant}>
      <LatestCtx.Provider value={latestVersion}>
        <section ref={ref} aria-label={label} className="not-prose my-6">
          {showTimeline && timeline === "axis" && (
            <div className="mb-7 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-sm">
              <div className="flex items-center justify-between px-5 pt-5">
                <span className="font-mono text-[11px] font-semibold tracking-widest text-kp-accent-text uppercase">
                  Release timeline
                </span>
                <span className="hidden font-mono text-[10px] tracking-widest text-fd-muted-foreground uppercase sm:inline">
                  Drag · scroll · click to jump
                </span>
              </div>
              <div className="mb-3 px-5 pt-1 text-[13px] text-fd-muted-foreground">
                {rangeLabel}
              </div>

              <div className="relative">
                {/* edge fades */}
                <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 w-9 bg-gradient-to-r from-fd-card to-transparent" />
                <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-20 w-9 bg-gradient-to-l from-fd-card to-transparent" />
                {/* arrows */}
                <button
                  ref={leftBtn}
                  type="button"
                  aria-label="Scroll to older releases"
                  onClick={() => scRef.current?.scrollBy({ left: -MONTH_W, behavior: "smooth" })}
                  className="absolute top-1/2 left-2 z-30 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground shadow-sm transition hover:text-kp-accent-text disabled:pointer-events-none disabled:opacity-0"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  ref={rightBtn}
                  type="button"
                  aria-label="Scroll to newer releases"
                  onClick={() => scRef.current?.scrollBy({ left: MONTH_W, behavior: "smooth" })}
                  className="absolute top-1/2 right-2 z-30 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground shadow-sm transition hover:text-kp-accent-text disabled:pointer-events-none disabled:opacity-0"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>

                <div
                  ref={scRef}
                  className="cursor-grab [scrollbar-width:none] overflow-x-auto overflow-y-visible px-1 [-ms-overflow-style:none] [&.sl-grabbing]:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                  style={{ touchAction: "pan-x" }}
                >
                  <div className="relative" style={{ width: trackW, height: trackH }}>
                    {/* axis + tick ruler */}
                    <div
                      className="absolute right-0 left-0 h-px bg-fd-border"
                      style={{ bottom: AXIS_Y }}
                    />
                    {monthCols.flatMap((c) =>
                      Array.from({ length: 5 }, (_, k) => (
                        <span
                          key={`${c.m}-${k}`}
                          className={cn(
                            "absolute w-px",
                            k === 0 ? "h-2 bg-fd-muted-foreground/35" : "h-1 bg-fd-border",
                          )}
                          style={{ left: c.x + k * (MONTH_W / 5), bottom: AXIS_Y - 8 }}
                        />
                      )),
                    )}
                    {monthCols.map((c) => (
                      <div
                        key={c.label}
                        className="absolute font-mono text-[10px] tracking-wider text-fd-muted-foreground/70 uppercase"
                        style={{
                          left: c.x + MONTH_W / 2,
                          bottom: LABEL_Y,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {c.label}
                      </div>
                    ))}
                    {/* Now marker */}
                    {now != null && now > minT && now < maxT && (
                      <div
                        className="pointer-events-none absolute"
                        style={{
                          left: xOf(now),
                          top: 6,
                          bottom: AXIS_Y,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <span className="text-kp-accent-ink absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-kp-accent px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wider uppercase">
                          Now
                        </span>
                        <div className="mt-4 h-full w-px border-l border-dashed border-kp-accent/45" />
                      </div>
                    )}
                    {/* markers — light chips; the latest shipped version wears the accent */}
                    {items.map((it) => {
                      const conn = connOf(it.lane);
                      const isLatest = it.v === latestVersion && !it.up;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onMouseEnter={(e) => showPop(e.currentTarget, it)}
                          onMouseLeave={() => setPop(null)}
                          onFocus={(e) => showPop(e.currentTarget, it)}
                          onBlur={() => setPop(null)}
                          onClick={() => jump(it.id)}
                          className="group absolute flex flex-col items-center"
                          style={{
                            left: it.x,
                            bottom: AXIS_Y,
                            transform: "translateX(-50%)",
                            appearance: "none",
                            background: "transparent",
                            border: 0,
                            padding: 0,
                            cursor: "inherit",
                          }}
                          aria-label={`Jump to ${it.v}${it.title ? ` — ${it.title}` : ""}`}
                        >
                          <span
                            className={cn(
                              "block rounded-[9px] border px-2.5 py-1 text-center leading-tight whitespace-nowrap shadow-sm transition group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
                              it.up
                                ? "border-dashed border-kp-accent-border bg-kp-accent-weak group-hover:border-kp-accent"
                                : isLatest
                                  ? "border-kp-accent bg-kp-accent-weak shadow-[0_6px_18px_-9px_var(--kp-accent)]"
                                  : "border-fd-border bg-fd-card group-hover:border-kp-accent group-hover:shadow-[0_6px_16px_-8px_var(--kp-accent)]",
                            )}
                          >
                            <span
                              className={cn(
                                "block font-mono text-[12px] font-semibold",
                                it.up || isLatest ? "text-kp-accent-text" : "text-fd-foreground",
                              )}
                            >
                              {it.v}
                            </span>
                            <span
                              className={cn(
                                "mt-px block font-mono text-[9px]",
                                it.up
                                  ? "text-kp-accent-text/65"
                                  : isLatest
                                    ? "text-kp-accent-text/70"
                                    : "text-fd-muted-foreground/80",
                              )}
                            >
                              {it.dateLabel}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "transition-colors",
                              it.up
                                ? "border-l border-dashed border-kp-accent-border"
                                : isLatest
                                  ? "w-px bg-kp-accent"
                                  : "w-px bg-fd-border group-hover:bg-kp-accent",
                            )}
                            style={{ height: conn, width: it.up ? 0 : 1 }}
                          />
                          <span
                            className={cn(
                              "size-2.5 translate-y-1/2 rounded-full ring-[3px] ring-fd-card transition group-hover:scale-110",
                              it.up
                                ? "bg-fd-card shadow-[inset_0_0_0_2px_var(--kp-accent)]"
                                : isLatest
                                  ? "bg-kp-accent"
                                  : "bg-fd-muted-foreground/55 group-hover:bg-kp-accent",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* slim progress bar */}
              <div className="relative mx-5 mt-3 mb-4 h-1 rounded-full bg-fd-border/50">
                <div
                  ref={thumbRef}
                  className="absolute inset-y-0 left-0 min-w-[30px] rounded-full bg-fd-border"
                />
              </div>
            </div>
          )}

          {/* strip — an evenly-spaced, non-scrolling row of version stops (calmer, no date axis) */}
          {showTimeline && timeline === "strip" && (
            <div className="mb-7 rounded-2xl border border-fd-border bg-fd-card px-5 py-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tracking-widest text-kp-accent-text uppercase">
                  Release timeline
                </span>
                <span className="hidden font-mono text-[10px] tracking-widest text-fd-muted-foreground uppercase sm:inline">
                  Click to jump
                </span>
              </div>
              <div className="mt-1 mb-5 text-[13px] text-fd-muted-foreground">{rangeLabel}</div>
              <div className="relative">
                <div className="pointer-events-none absolute top-[5px] right-2 left-2 h-px bg-fd-border" />
                <div className="relative flex flex-wrap justify-between gap-x-3 gap-y-5">
                  {items.map((it) => {
                    const isLatest = it.v === latestVersion && !it.up;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onMouseEnter={(e) => showPop(e.currentTarget, it)}
                        onMouseLeave={() => setPop(null)}
                        onFocus={(e) => showPop(e.currentTarget, it)}
                        onBlur={() => setPop(null)}
                        onClick={() => jump(it.id)}
                        className="group flex flex-col items-center"
                        aria-label={`Jump to ${it.v}${it.title ? ` — ${it.title}` : ""}`}
                      >
                        <span
                          className={cn(
                            "size-2.5 rounded-full ring-4 ring-fd-card transition group-hover:scale-110",
                            it.up
                              ? "bg-fd-card shadow-[inset_0_0_0_2px_var(--kp-accent)]"
                              : isLatest
                                ? "bg-kp-accent"
                                : "bg-fd-muted-foreground/55 group-hover:bg-kp-accent",
                          )}
                        />
                        <span
                          className={cn(
                            "mt-2.5 block rounded-[9px] border px-2.5 py-1 text-center leading-tight whitespace-nowrap shadow-sm transition group-hover:-translate-y-0.5",
                            it.up
                              ? "border-dashed border-kp-accent-border bg-kp-accent-weak"
                              : isLatest
                                ? "border-kp-accent bg-kp-accent-weak"
                                : "border-fd-border bg-fd-card group-hover:border-kp-accent group-hover:shadow-[0_6px_16px_-8px_var(--kp-accent)]",
                          )}
                        >
                          <span
                            className={cn(
                              "block font-mono text-[12px] font-semibold",
                              it.up || isLatest ? "text-kp-accent-text" : "text-fd-foreground",
                            )}
                          >
                            {it.v}
                          </span>
                          <span
                            className={cn(
                              "mt-px block font-mono text-[9px]",
                              it.up || isLatest
                                ? "text-kp-accent-text/70"
                                : "text-fd-muted-foreground/80",
                            )}
                          >
                            {it.dateLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* fixed hover popover — escapes the scroller's clip */}
          {pop && (
            <div
              className="fixed z-[80] w-[248px] -translate-y-full rounded-2xl border border-fd-border bg-fd-card p-4 shadow-[0_16px_44px_-12px_rgba(30,25,75,.3)]"
              style={{ left: pop.left, top: pop.top }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-semibold tracking-[.02em] text-kp-accent-text">
                    {pop.it.v}
                  </span>
                  {pop.it.up && (
                    <span className="rounded-full bg-kp-accent-weak px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wider text-kp-accent-text uppercase">
                      Upcoming
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-fd-muted-foreground">
                  {pop.it.dateLabel}
                </span>
              </div>
              {pop.it.title && (
                <div className="mb-3 text-[14.5px] leading-snug font-bold tracking-[-.01em] text-fd-foreground">
                  {pop.it.title}
                </div>
              )}
              {pop.it.areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pop.it.areas.map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-fd-muted px-2 py-[3px] text-[11px] font-medium text-fd-muted-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 border-t border-fd-border/60 pt-2.5 text-[11.5px] font-medium text-kp-accent-text">
                Jump to release →
              </div>
            </div>
          )}

          {/* right-aligned multi-select feature filter */}
          {tags.length > 0 && variant !== "compact" && (
            <div className="mb-7 flex items-center justify-between gap-3">
              <span className="text-[13px] text-fd-muted-foreground">
                {selected.length === 0
                  ? null
                  : `${matchCount} release${matchCount === 1 ? "" : "s"} · ${selected.join(", ")}`}
              </span>
              <div data-sl-filter className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border bg-fd-card px-3 py-1.5 text-[13px] font-medium transition",
                    selected.length > 0
                      ? "border-kp-accent-border text-kp-accent-text"
                      : "border-fd-border text-fd-foreground hover:border-kp-accent-border",
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={selected.length > 0 ? "" : "text-fd-muted-foreground"}
                  >
                    <path d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                  Filter features
                  {selected.length > 0 && (
                    <span className="grid min-w-[18px] place-items-center rounded-full bg-kp-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {selected.length}
                    </span>
                  )}
                  {selected.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear all filters"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          clearFilter();
                        }
                      }}
                      className="grid size-4 place-items-center rounded-full text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                      "text-fd-muted-foreground transition",
                      filterOpen && "rotate-180",
                    )}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {filterOpen && (
                  <div
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute right-0 z-50 mt-1.5 max-h-72 w-60 overflow-y-auto rounded-xl border border-fd-border bg-fd-card p-1.5 shadow-[0_16px_44px_-12px_rgba(30,25,75,.3)]"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected.length === 0}
                      onClick={clearFilter}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition",
                        selected.length === 0
                          ? "text-kp-accent-text"
                          : "text-fd-muted-foreground hover:bg-fd-muted",
                      )}
                    >
                      <span className="flex-1 font-medium">All features</span>
                      {selected.length === 0 && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                    <div className="my-1 h-px bg-fd-border/60" />
                    {tags.map((t) => {
                      const on = selected.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          role="option"
                          aria-selected={on}
                          onClick={() => toggleTag(t)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition",
                            on
                              ? "bg-kp-accent-weak text-kp-accent-text"
                              : "text-fd-foreground hover:bg-fd-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition",
                              on
                                ? "border-kp-accent bg-kp-accent text-white"
                                : "border-fd-border text-transparent",
                            )}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </span>
                          <span
                            className="size-2 rounded-full"
                            style={{ background: tagColor(t) }}
                          />
                          <span className="flex-1">{t}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <FilterCtx.Provider value={filterApi}>{children}</FilterCtx.Provider>

          {/* empty state when a filter matches nothing */}
          {selected.length > 0 && matchCount === 0 && (
            <div className="rounded-xl border border-dashed border-fd-border py-12 text-center text-[14px] text-fd-muted-foreground">
              No releases tagged{" "}
              <span className="font-medium text-fd-foreground">{selected.join(", ")}</span>.{" "}
              <button
                type="button"
                onClick={clearFilter}
                className="font-medium text-kp-accent-text underline-offset-2 hover:underline"
              >
                Show all
              </button>
            </div>
          )}
        </section>
      </LatestCtx.Provider>
    </VariantCtx.Provider>
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
const changeSchema = z.object({
  type: changeTypeEnum,
  text: z.string(),
  refs: z.array(refSchema).optional(),
});
const mediaSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string(),
  provider: z.enum(["file", "youtube", "loom", "vimeo", "iframe"]).optional(),
  poster: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  title: z.string().optional(),
  duration: z.string().optional(),
});
const highlightSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  icon: z.string().optional(),
  href: z.string().optional(),
  media: mediaSchema.optional(),
});
const sectionSchema = z.object({
  label: z.string(),
  icon: z.string().optional(),
  changes: z.array(changeSchema),
});

const releaseSchema = z.object({
  version: z.string(),
  date: z.string(),
  status: statusEnum.optional(),
  title: z.string().optional(),
  summary: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  media: z.array(mediaSchema).optional(),
  highlights: z.array(highlightSchema).optional(),
  sections: z.array(sectionSchema).optional(),
  changes: z.array(changeSchema).optional(),
});

registerKnowledge("Release", {
  schema: releaseSchema,
  toKnowledge: (p: z.infer<typeof releaseSchema>, ctx: ExtractCtx) => {
    const mapChange = (c: z.infer<typeof changeSchema>): ReleaseChange => ({
      type: c.type,
      text: c.text,
      refs: c.refs?.map((r) => ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label)),
    });
    const sections = p.sections?.map((s) => ({
      label: s.label,
      icon: s.icon,
      changes: s.changes.map(mapChange),
    }));
    // The flat `changes` spine is the union of section changes + any flat changes authored directly.
    const flat = [
      ...(sections?.flatMap((s) => s.changes) ?? []),
      ...(p.changes ?? []).map(mapChange),
    ];
    return {
      kind: "release",
      id: ctx.nextId(p.version),
      title: p.title ?? p.version,
      summary: p.summary != null ? ctx.text(p.summary) || undefined : undefined,
      status: p.status,
      version: p.version,
      date: parseKDate(p.date),
      areas: p.areas,
      media: p.media,
      highlights: p.highlights?.map((h) => ({
        title: h.title,
        body: h.body,
        icon: h.icon,
        href: h.href,
        media: h.media,
      })),
      sections,
      changes: flat,
    } satisfies ReleaseNode;
  },
});
