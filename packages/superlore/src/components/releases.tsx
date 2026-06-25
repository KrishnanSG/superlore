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
 * `Releases` / `Changelog` wraps the stack: a **release timeline** (versions on a date axis with a
 * collision-avoidance lane layout so crowded releases never overlap, plus a sleek hover card) and a
 * tag filter. Three variants — `feature` (default, the full record), `timeline` (lighter rolling
 * feed), `compact` (dense list). All from the same typed data.
 */

type ReleaseRef = { rel?: string; target: string; label?: string };

export interface ReleaseChangeInput {
  type: ReleaseChangeType;
  text: string;
  refs?: ReleaseRef[];
}

export type ReleaseVariant = "feature" | "timeline" | "compact";

const VariantCtx = React.createContext<ReleaseVariant>("feature");
/** The union of every release's areas, so a hover card can show all areas with this one's lit. */
const AreasCtx = React.createContext<string[]>([]);

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

function inferProvider(src: string): "file" | "youtube" | "loom" | "vimeo" {
  if (/youtu\.?be|youtube\.com/.test(src)) return "youtube";
  if (/loom\.com/.test(src)) return "loom";
  if (/vimeo\.com/.test(src)) return "vimeo";
  return "file";
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
              allow="autoplay; fullscreen; picture-in-picture"
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
}: {
  version: string;
  anchor: string;
  date: string;
  status?: Status;
  areas?: string[];
  highlights?: ReleaseHighlight[];
  tags?: string[];
  variant: ReleaseVariant;
}) {
  const jump = highlights?.length
    ? highlights.map((h) => ({ label: h.title, href: `#${anchor}-h-${slug(h.title)}` }))
    : null;
  return (
    <aside className="flex flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
      {variant === "feature" ? (
        <a
          href={`#${anchor}`}
          className="w-fit rounded-lg bg-kp-accent-weak px-2.5 py-1 font-mono text-[13px] font-bold tracking-tight text-kp-accent-text no-underline"
        >
          {version}
        </a>
      ) : (
        <a
          href={`#${anchor}`}
          className="w-fit font-mono text-2xl font-bold tracking-tight text-fd-foreground no-underline transition-colors hover:text-kp-accent-text"
        >
          {version}
        </a>
      )}

      {variant === "feature" && jump && (
        <nav className="mt-1 flex flex-col">
          {jump.map((j) => (
            <a
              key={j.href}
              href={j.href}
              className="border-l-2 border-transparent py-[3px] pl-2.5 text-[14px] text-fd-muted-foreground no-underline transition hover:border-kp-accent-border hover:text-fd-foreground"
            >
              {j.label}
            </a>
          ))}
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
        </div>
        {summary && <div className="mt-1 text-[14px] text-fd-muted-foreground">{summary}</div>}
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
      />

      <div className="min-w-0">
        {title && (
          <h3 className="mt-0 mb-2 text-[26px] leading-tight font-extrabold tracking-tight text-fd-foreground">
            {title}
          </h3>
        )}
        {summary && <div className="mb-5 text-[16px] text-fd-muted-foreground">{summary}</div>}

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
  up: boolean;
  /** Assigned lane (0 = highest card). */
  lane: number;
  /** x position in percent. */
  x: number;
}

function isUpcoming(status?: string): boolean {
  return status === "planned" || status === "in-progress";
}
function monthYear(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function monthTicks(min: number, max: number): { label: string; t: number }[] {
  if (!min || max <= min) return [];
  const out: { label: string; t: number }[] = [];
  const d = new Date(min);
  d.setDate(1);
  if (d.getTime() < min) d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= max && out.length < 10) {
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase(),
      t: d.getTime(),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export interface ReleasesProps {
  children?: React.ReactNode;
  /** Accessible name for the changelog. */
  label?: string;
  /** Default rendering for every child Release. Default `feature`. */
  variant?: ReleaseVariant;
}

export function Releases({ children, label = "Changelog", variant = "feature" }: ReleasesProps) {
  const ref = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [raw, setRaw] = React.useState<Omit<TimelineItem, "lane" | "x">[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [allAreas, setAllAreas] = React.useState<string[]>([]);
  const [active, setActive] = React.useState<string>("All");
  const [hover, setHover] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  const [stageW, setStageW] = React.useState(0);

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
        up: isUpcoming(r.dataset.status),
      })),
    );
    const tg = new Set<string>();
    const ar = new Set<string>();
    rels.forEach((r) => {
      (r.dataset.tags ?? "")
        .split("|")
        .filter(Boolean)
        .forEach((t) => tg.add(t));
      (r.dataset.areas ?? "")
        .split("|")
        .filter(Boolean)
        .forEach((a) => ar.add(a));
    });
    setTags([...tg]);
    setAllAreas([...ar]);
    setNow(Date.now());
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setStageW(entries[0]?.contentRect.width ?? 0));
    ro.observe(el);
    return () => ro.disconnect();
  }, [raw.length]);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const r of root.querySelectorAll<HTMLElement>("[data-sl-release]")) {
      const has = (r.dataset.tags ?? "").split("|").filter(Boolean);
      (r as HTMLElement).style.display = active === "All" || has.includes(active) ? "" : "none";
    }
  }, [active]);

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Geometry: place each dated release on a min→max axis (incl. Now), then assign collision-free lanes.
  const dated0 = raw.filter((i) => i.t > 0);
  const ts = dated0.map((i) => i.t);
  const lo = ts.length ? Math.min(...ts) : 0;
  const hi = ts.length ? Math.max(...ts) : 1;
  const min = now != null ? Math.min(lo, now) : lo;
  const max = now != null ? Math.max(hi, now) : hi;
  const span = Math.max(max - min, 1);
  const xOf = (t: number) => 5 + ((t - min) / span) * 90;

  const items: TimelineItem[] = React.useMemo(() => {
    const sorted = [...dated0].map((i) => ({ ...i, x: xOf(i.t) })).sort((a, b) => a.x - b.x);
    const CARD = 70;
    const GAP = 10;
    const MAX_LANES = 3;
    const laneRight: number[] = [];
    const w = stageW || 720;
    return sorted.map((i) => {
      const leftPx = (i.x / 100) * w - CARD / 2;
      let lane = laneRight.findIndex((right) => right + GAP <= leftPx);
      if (lane === -1) {
        if (laneRight.length < MAX_LANES) {
          lane = laneRight.length;
          laneRight.push(0);
        } else {
          // unavoidable: use the lane whose card ends earliest
          lane = laneRight.indexOf(Math.min(...laneRight));
        }
      }
      laneRight[lane] = leftPx + CARD;
      return { ...i, lane };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dated0, stageW, min, max]);

  const months = monthTicks(min, max).map((m) => ({ ...m, x: xOf(m.t) }));
  const upcomingCount = items.filter((i) => i.up).length;
  const rangeLabel =
    items.length >= 2
      ? `${items.length} releases · ${monthYear(lo)} – ${monthYear(hi)}${upcomingCount ? ` · ${upcomingCount} upcoming` : ""}`
      : `${raw.length} release${raw.length === 1 ? "" : "s"}`;

  const showTimeline = variant !== "compact" && items.length >= 2;
  const laneBase = 58;
  const laneStep = 26;
  const stageHeight =
    laneBase +
    (Math.max(1, Math.min(3, new Set(items.map((i) => i.lane)).size)) - 1) * laneStep +
    92;

  return (
    <VariantCtx.Provider value={variant}>
      <AreasCtx.Provider value={allAreas}>
        <section ref={ref} aria-label={label} className="not-prose my-6">
          {showTimeline && (
            <div className="mb-8 rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tracking-widest text-kp-accent-text uppercase">
                  Release timeline
                </span>
                <span className="hidden font-mono text-[10px] tracking-widest text-fd-muted-foreground uppercase sm:inline">
                  Hover · click to jump
                </span>
              </div>
              <div className="mb-4 text-[13px] text-fd-muted-foreground">{rangeLabel}</div>
              <div ref={stageRef} className="relative" style={{ height: stageHeight }}>
                {/* axis + fine tick ruler */}
                <div className="absolute right-0 left-0 h-px bg-fd-border" style={{ bottom: 46 }} />
                <div
                  className="absolute right-0 left-0 flex items-end justify-between"
                  style={{ bottom: 47, height: 8 }}
                >
                  {Array.from({ length: 41 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-px",
                        i % 5 === 0 ? "h-2 bg-fd-muted-foreground/50" : "h-1 bg-fd-border",
                      )}
                    />
                  ))}
                </div>
                {months.map((m) => (
                  <div
                    key={m.label}
                    className="absolute -translate-x-1/2 font-mono text-[10px] tracking-wider text-fd-muted-foreground/70 uppercase"
                    style={{ left: `${m.x}%`, bottom: 22 }}
                  >
                    {m.label}
                  </div>
                ))}
                {/* Now marker */}
                {now != null && now > min && now < max && (
                  <div
                    className="pointer-events-none absolute z-0 -translate-x-1/2"
                    style={{ left: `${xOf(now)}%`, top: 4, bottom: 46 }}
                  >
                    <span className="text-kp-accent-ink absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-kp-accent px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase">
                      Now
                    </span>
                    <div className="mt-4 h-full w-px border-l border-dashed border-kp-accent/45" />
                  </div>
                )}
                {/* nodes */}
                {items.map((it) => {
                  const on = hover === it.id;
                  const conn = laneBase - it.lane * laneStep;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setHover(it.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(it.id)}
                      onBlur={() => setHover(null)}
                      onClick={() => jump(it.id)}
                      className="group absolute z-10 flex -translate-x-1/2 cursor-pointer flex-col items-center"
                      style={{ left: `${it.x}%`, bottom: 42 }}
                      aria-label={`Jump to ${it.v}${it.title ? ` — ${it.title}` : ""}`}
                    >
                      <span
                        className={cn(
                          "block rounded-lg px-2.5 py-1.5 text-center font-mono leading-tight whitespace-nowrap transition",
                          it.up
                            ? cn(
                                "border border-dashed border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
                                on && "-translate-y-0.5 border-kp-accent",
                              )
                            : cn(
                                "bg-[#16161e] text-white shadow-sm ring-1 dark:bg-[#20202b]",
                                on ? "-translate-y-0.5 ring-kp-accent" : "ring-black/10",
                              ),
                        )}
                      >
                        <span className="block text-[12.5px] font-bold">{it.v}</span>
                        <span
                          className={cn(
                            "block text-[9.5px]",
                            it.up ? "text-kp-accent-text/70" : "text-white/55",
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
                            : cn("w-px", on ? "bg-kp-accent" : "bg-fd-border"),
                        )}
                        style={{ height: conn, width: it.up ? 0 : 1 }}
                      />
                      <span
                        className={cn(
                          "size-2.5 translate-y-1/2 rounded-full ring-2 ring-fd-card transition-colors",
                          it.up
                            ? "bg-fd-card ring-kp-accent"
                            : on
                              ? "bg-kp-accent"
                              : "bg-fd-muted-foreground/60",
                        )}
                      />
                      {/* hover card */}
                      {on && (
                        <span
                          className="absolute bottom-full z-30 mb-2 block w-[270px] cursor-default rounded-2xl border border-fd-border bg-fd-card p-4 text-left shadow-[0_16px_48px_-12px_rgba(30,25,70,.32)]"
                          style={{
                            left: it.x > 78 ? "auto" : it.x < 22 ? 0 : "50%",
                            right: it.x > 78 ? 0 : "auto",
                            transform: it.x > 78 || it.x < 22 ? "none" : "translateX(-50%)",
                          }}
                        >
                          <span className="flex items-baseline justify-between">
                            <span className="font-mono text-[15px] font-bold text-fd-foreground">
                              {it.v}
                            </span>
                            <span className="font-mono text-[12px] text-fd-muted-foreground">
                              {it.dateLabel}
                            </span>
                          </span>
                          {it.title && (
                            <span className="mt-1.5 block text-[14px] leading-snug font-semibold text-fd-foreground">
                              {it.title}
                            </span>
                          )}
                          {allAreas.length > 0 && (
                            <>
                              <span className="mt-3 mb-2 block font-mono text-[10px] tracking-widest text-fd-muted-foreground/70 uppercase">
                                Areas updated
                              </span>
                              <span className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                {allAreas.slice(0, 8).map((a) => {
                                  const onArea = it.areas.includes(a);
                                  return (
                                    <span
                                      key={a}
                                      className={cn(
                                        "flex items-center gap-2 text-[12.5px]",
                                        onArea
                                          ? "font-medium text-fd-foreground"
                                          : "text-fd-muted-foreground/45",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "size-1.5 rounded-full",
                                          onArea ? "bg-kp-accent" : "bg-fd-border",
                                        )}
                                      />
                                      {a}
                                    </span>
                                  );
                                })}
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tags.length > 0 && variant !== "compact" && (
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
      </AreasCtx.Provider>
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
  provider: z.enum(["file", "youtube", "loom", "vimeo"]).optional(),
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
