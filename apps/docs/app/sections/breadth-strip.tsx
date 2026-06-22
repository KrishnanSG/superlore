"use client";

/**
 * BreadthStrip — the "ONE SURFACE" section.
 *
 * A full-bleed, edge-scrolling marquee of real mini document-surfaces, proving that every kind of
 * company knowledge — product docs, architecture, the sales pipeline, standups, brand, onboarding,
 * runbooks, decisions, OKRs, org — is the SAME authored MDX rendering as a human surface AND
 * serializing for agents. Tiles reuse the real package components (`Timeline`, `Canvas`,
 * `EntityCard`, `Board`, `Table`, `Note`, `Comparison`, `Decision`, `Roster`, `Checklist`) and the
 * real `CANVAS_TEMPLATES` (via `<Canvas spec={{ template }} />`) over the shared `_data` specs —
 * never a second, drifting mock-up. The Brand tile is a small token-built swatch/type surface (the
 * swatch fills ARE the design tokens, so it stays token-true with no raw hex).
 *
 * Variety: the shelf deliberately mixes several gallery canvases (architecture, system design, RCA,
 * OKR tree, user journey, org chart, mind map) among the component surfaces so the breadth reads as
 * "wow, it does all of this". React-Flow canvas tiles are the heaviest, rendered `bare` and fit-to-
 * tile at low zoom (no interaction), so they stay light; every other tile — Board, Table, Decision,
 * Brand swatch — is cheap and purely declarative.
 *
 * Motion: a CSS marquee (duplicate track, translateX 0 → -50%) edge-masked with `mask-image`, paused
 * on hover / focus-within, with scroll-snap on the contained `overflow-x:auto` rail so the page body
 * never scrolls sideways. `prefers-reduced-motion` is a HARD gate — the animation collapses to a
 * static, hand-scrollable snap rail (CSS-only, no JS theme/motion branch).
 */

import { isValidElement, type ReactNode } from "react";
import {
  Board,
  Canvas,
  Checklist,
  Comparison,
  Decision,
  EntityCard,
  Note,
  Roster,
  Table,
  Timeline,
  type CanvasSpec,
  type ChecklistProps,
  type ComparisonProps,
  type DecisionProps,
  type RosterProps,
} from "superlore";
import { Pause, Play } from "lucide-react";
import {
  accountsEntity,
  systemSpec,
  milestoneTimeline,
  queueSpec,
  salesPipeline,
  standupColumns,
  standupRows,
} from "../_data";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

/* ── tile model ──────────────────────────────────────────────────────────────────── */

interface BreadthTile {
  /** Stable key + mono corner label (the "filename"-style tag). */
  id: string;
  /** Short corner label, e.g. `releases.mdx`. */
  file: string;
  /** Human title shown above the surface. */
  title: string;
  /** The live, real-component surface for this tile. */
  surface: ReactNode;
  /**
   * One-line caption describing the surface. When set, the live `surface` is DESKTOP-ONLY
   * (`hidden lg:block`) and a simple static label card renders in its place on phones — used for
   * the React-Flow canvas tiles, which read cut/tiny shrunk to ~360px. Component tiles (Board /
   * Table / Decision / …) stay fully live on mobile and omit this.
   */
  mobileCaption?: string;
}

/* The Onboarding tile reuses the SAME "Pick a job queue" decision the KB surface shows, recast as a
   small status board so the strip carries a real <Board> — its columns/cards are data the agent
   reads, not a picture. */
const onboardingColumns = [
  {
    title: "Evaluating",
    status: "in-progress" as const,
    cards: [
      { title: queueSpec.nodes?.[1]?.label ?? "Managed (SQS)", status: "in-progress" as const },
      { title: queueSpec.nodes?.[2]?.label ?? "Self-host (Redis)", status: "planned" as const },
    ],
  },
  {
    title: "Decided",
    status: "done" as const,
    cards: [{ title: queueSpec.nodes?.[3]?.label ?? "Chosen: SQS", status: "done" as const }],
  },
];

/* The Runbook tile pairs a typed <Table> with a <Note> callout — the on-call grid an engineer scans
   and the same typed rows an agent can query. */
const runbookColumns = [
  { key: "signal", label: "Signal" },
  { key: "sev", label: "Sev" },
  { key: "action", label: "First action" },
];
const runbookRows = [
  { signal: "5xx > 1%", sev: "P1", action: "Page on-call" },
  { signal: "p99 > 800ms", sev: "P2", action: "Check cart svc" },
  { signal: "Queue depth ↑", sev: "P3", action: "Scale workers" },
];

/* The Compare tile carries a real <Comparison> — an options matrix the human scans for ✓/–/partial
   and the agent reads as typed cells. It weighs the SAME job-queue options ADR-014 lands on (the
   decisions.mdx tile), so compare + decision read as one chain. Phrased so ✓ always means "good",
   and deliberately NOT a superlore plan/pricing table (which would read as our own pricing). */
const queueCompareOptions = ["SQS", "Self-host Redis", "RabbitMQ"];
const queueCompareRows: ComparisonProps["rows"] = [
  { criterion: "No broker to run", cells: [true, false, false] },
  { criterion: "Exactly-once delivery", cells: ["partial", false, true] },
  { criterion: "No vendor lock-in", cells: [false, true, true] },
  { criterion: "Ops on-call", cells: ["None", "High", "Medium"] },
];

/* The Decisions tile carries a real <Decision> (ADR) — rationale a human reads, and a typed
   `{ status, context, decision, consequences, refs }` record an agent can follow as a chain. */
const queueDecisionRefs: DecisionProps["refs"] = [
  { rel: "related", target: "#runbook", label: "Queue runbook" },
];

/* The Team tile carries a real <Roster> — people grouped by reporting line, each addressable as an
   entity with a `reportsTo` edge the agent can query ("who reports to X?"). */
const teamPeople: RosterProps["people"] = [
  { name: "Maya Chen", role: "Eng lead", slug: "maya", tags: ["platform"] },
  { name: "Dev Patel", role: "Backend", slug: "dev", reportsTo: "Maya Chen" },
  { name: "Ren Ito", role: "Frontend", slug: "ren", reportsTo: "Maya Chen" },
];

/* The Launch tile carries a real <Checklist> — items with a real done-state the agent can COUNT
   ("3 of 4 done"), grouped + owned, not a styled strike-through it has to infer. */
const launchItems: ChecklistProps["items"] = [
  { text: "Cut release branch", done: true, owner: "Maya", group: "Ship" },
  { text: "Run smoke suite", done: true, owner: "Dev", group: "Ship" },
  { text: "Update changelog", done: false, owner: "Ren", group: "Ship" },
  { text: "Announce in #releases", done: false, group: "Comms" },
];

/* The Brand tile is a small self-contained surface (no new component needed): three colour swatches
   + a short type scale + a tagline. To stay token-true it depicts SUPERLORE'S OWN design system — the
   swatches' backgrounds ARE the tokens (`--kp-accent`, `--kp-accent-weak`, ink) used as content, so
   there is no raw hex anywhere. */
const brandSwatches: { name: string; background: string; border?: boolean }[] = [
  { name: "Accent", background: "var(--kp-accent)" },
  { name: "Accent weak", background: "var(--kp-accent-weak)", border: true },
  { name: "Ink", background: "var(--color-fd-foreground)" },
];
const brandTypeScale: { role: string; spec: string }[] = [
  { role: "Display", spec: "Inter · 680" },
  { role: "Body", spec: "Inter · 400" },
  { role: "Code", spec: "JetBrains Mono · 400" },
];

function BrandSurface() {
  return (
    <div className="space-y-4">
      {/* 60/20/20 colour system — the swatch fills are the design tokens themselves. */}
      <div className="grid grid-cols-3 gap-2">
        {brandSwatches.map((s) => (
          <div key={s.name} className="space-y-1.5">
            <div
              className={`h-12 rounded-md ${s.border ? "border border-kp-accent-border" : "border border-fd-border"}`}
              style={{ background: s.background }}
            />
            <p className="font-mono text-[10px] tracking-[0.04em] text-fd-muted-foreground">
              {s.name}
            </p>
          </div>
        ))}
      </div>
      {/* Type scale — role · family · weight. */}
      <dl className="divide-y divide-fd-border overflow-hidden rounded-md border border-fd-border">
        {brandTypeScale.map((t) => (
          <div key={t.role} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
            <dt className="text-[13px] font-medium text-fd-foreground">{t.role}</dt>
            <dd className="font-mono text-[11px] text-fd-muted-foreground">{t.spec}</dd>
          </div>
        ))}
      </dl>
      {/* One tagline line. */}
      <p className="border-l border-kp-accent-border pl-2.5 text-[13px] text-pretty text-fd-foreground">
        One corpus. Humans and agents.
      </p>
    </div>
  );
}

/* ── live canvas-template tiles ─────────────────────────────────────────────────────
   Each renders through the PUBLIC <Canvas> via the `template` field; `parseCanvasSpec` runs
   `expandTemplate`, so the template's frames + filled nodes/edges come straight from the real
   `CANVAS_TEMPLATES` registry — never re-drawn here. We pick the FILLED templates (members + edges,
   or grid/radial layouts) so they read fit-to-tile and show real variety: system-architecture, rca,
   okr-tree, user-journey, org-chart, mind-map — plus the authored `systemSpec` architecture board. */

/* Every tile's SURFACE region is locked to this height (the mono header + badge stay natural), so
   all tiles end up visually equal while overflowing content (a long table / board) fades out at the
   bottom rather than expanding the tile. The live canvas tiles fill the SAME height so they fit-to-
   tile with no dead band. */
/* Two FILLED, vibrant authored canvases (the matching gallery TEMPLATES are blank scaffolds — frames
   with no member nodes — so they'd render empty here). Explicit FigJam-bright intents on every node
   so the tiles read full and colourful. */
const rcaSpec: CanvasSpec = {
  title: "Checkout 5xx",
  direction: "right",
  groups: [
    { id: "sym", label: "Symptoms", frame: true, intent: "red" },
    { id: "hyp", label: "Hypotheses", frame: true, intent: "orange" },
    { id: "root", label: "Root cause", frame: true, intent: "purple" },
    { id: "fix", label: "Remediation", frame: true, intent: "green" },
  ],
  nodes: [
    { id: "s1", kind: "sticky", group: "sym", intent: "red", label: "5xx spike 14:02" },
    { id: "s2", kind: "sticky", group: "sym", intent: "red", label: "p99 → 2.4s" },
    { id: "h1", kind: "sticky", group: "hyp", intent: "yellow", label: "Bad deploy?" },
    { id: "h2", kind: "sticky", group: "hyp", intent: "orange", label: "DB pool exhausted" },
    { id: "r1", kind: "rounded", group: "root", intent: "purple", label: "Conn leak in v2.3" },
    { id: "f1", kind: "rounded", group: "fix", intent: "green", label: "Cap pool + recycle" },
  ],
  edges: [
    { from: "s1", to: "h1" },
    { from: "s2", to: "h2" },
    { from: "h2", to: "r1" },
    { from: "r1", to: "f1" },
  ],
};
const journeySpec: CanvasSpec = {
  title: "Sign-up journey",
  direction: "right",
  groups: [
    { id: "aware", label: "Awareness", frame: true, intent: "blue" },
    { id: "consider", label: "Consideration", frame: true, intent: "teal" },
    { id: "decide", label: "Decision", frame: true, intent: "purple" },
    { id: "onboard", label: "Onboarding", frame: true, intent: "green" },
    { id: "retain", label: "Retention", frame: true, intent: "yellow" },
  ],
  nodes: [
    { id: "a", kind: "sticky", group: "aware", intent: "blue", label: "Reads a blog post" },
    { id: "c", kind: "sticky", group: "consider", intent: "teal", label: "Compares tools" },
    { id: "d", kind: "sticky", group: "decide", intent: "purple", label: "Signs up" },
    { id: "o", kind: "sticky", group: "onboard", intent: "green", label: "Ships first KB" },
    { id: "r", kind: "sticky", group: "retain", intent: "yellow", label: "Daily agent use" },
  ],
  edges: [
    { from: "a", to: "c" },
    { from: "c", to: "d" },
    { from: "d", to: "o" },
    { from: "o", to: "r" },
  ],
};

const SURFACE_HEIGHT = 360;
const TEMPLATE_TILE_HEIGHT = SURFACE_HEIGHT;

/** A canvas tile beside another canvas reads as a wall of whiteboards. Spread the canvases evenly
 *  through the marquee so two never sit adjacent — a stable ratio weave, resilient as tiles change. */
const isCanvasTile = (t: BreadthTile): boolean =>
  isValidElement(t.surface) && t.surface.type === Canvas;

function spreadCanvases(list: readonly BreadthTile[]): BreadthTile[] {
  const canvases = list.filter(isCanvasTile);
  const rest = list.filter((t) => !isCanvasTile(t));
  if (canvases.length === 0 || rest.length === 0) return [...list];
  // Seed with the non-canvas tiles, then drop each canvas into an evenly spaced slot so two
  // canvases never sit adjacent (the gap is >= 2 whenever there are at least as many other tiles).
  const out: BreadthTile[] = [...rest];
  const step = (rest.length + canvases.length) / canvases.length;
  canvases.forEach((canvas, i) => {
    out.splice(Math.min(out.length, Math.round(i * step) + 1), 0, canvas);
  });
  return out;
}

const tiles: readonly BreadthTile[] = [
  /* ── product docs & releases (left anchor) ─────────────────────────────────── */
  {
    id: "releases",
    file: "releases.mdx",
    title: "Releases",
    surface: <Timeline items={milestoneTimeline} label="Release timeline" />,
  },
  {
    id: "compare",
    file: "compare.mdx",
    title: "Options matrix",
    surface: (
      <Comparison
        options={queueCompareOptions}
        rows={queueCompareRows}
        caption="Job queue options"
      />
    ),
  },
  {
    id: "architecture",
    file: "architecture.mdx",
    title: "Architecture",
    surface: <Canvas bare spec={systemSpec} height={SURFACE_HEIGHT} />,
    mobileCaption:
      "A live service map — nodes, edges, and groups your agents read as a typed graph.",
  },
  {
    id: "system-architecture",
    file: "system-design.mdx",
    title: "System design",
    surface: (
      <Canvas
        bare
        spec={{ template: "system-architecture", title: "Request path" }}
        height={TEMPLATE_TILE_HEIGHT}
      />
    ),
    mobileCaption: "The request path from edge to data, as a canvas your team and agents share.",
  },
  {
    id: "rca",
    file: "incident-rca.mdx",
    title: "Root-cause analysis",
    surface: <Canvas bare spec={rcaSpec} height={TEMPLATE_TILE_HEIGHT} />,
    mobileCaption: "Symptoms → hypotheses → root cause → fix, mapped on a canvas.",
  },
  {
    id: "okrs",
    file: "okrs.mdx",
    title: "OKRs",
    surface: (
      <Canvas
        bare
        spec={{ template: "okr-tree", title: "Q3 objective" }}
        height={TEMPLATE_TILE_HEIGHT}
      />
    ),
    mobileCaption: "Objectives and key results as a tree your agents can traverse.",
  },
  {
    id: "journey",
    file: "journey.mdx",
    title: "User journey",
    surface: <Canvas bare spec={journeySpec} height={TEMPLATE_TILE_HEIGHT} />,
    mobileCaption: "Awareness to retention, each stage a node on a shared canvas.",
  },
  {
    id: "decisions",
    file: "decisions.mdx",
    title: "Decision record",
    surface: (
      <Decision
        identifier="ADR-014"
        title="Adopt a managed job queue"
        status="accepted"
        date="2026-05"
        decision="Use SQS for background jobs; no broker to run."
        consequences={["No ops on-call for the broker", "Vendor lock-in to AWS"]}
        refs={queueDecisionRefs}
      />
    ),
  },
  /* ── company knowledge base (right anchor) ─────────────────────────────────── */
  {
    id: "pipeline",
    file: "pipeline.mdx",
    title: "Sales pipeline",
    surface: (
      <div className="space-y-2">
        <p className="font-mono text-[11px] tracking-[0.04em] text-fd-muted-foreground">
          Open $1.7M · 19 prospects
        </p>
        <Board columns={salesPipeline} label="Sales pipeline by stage" />
      </div>
    ),
  },
  {
    id: "accounts",
    file: "accounts.mdx",
    title: "Account",
    surface: <EntityCard {...accountsEntity} />,
  },
  {
    id: "standup",
    file: "standup.mdx",
    title: "Standup",
    surface: <Table columns={standupColumns} rows={standupRows} caption="Status per person" />,
  },
  {
    id: "brand",
    file: "brand.mdx",
    title: "Brand",
    surface: <BrandSurface />,
  },
  {
    id: "launch",
    file: "launch.mdx",
    title: "Launch checklist",
    surface: <Checklist items={launchItems} label="Release checklist" />,
  },
  {
    id: "onboarding",
    file: "onboarding.mdx",
    title: "Onboarding",
    surface: <Board columns={onboardingColumns} label="Onboarding decisions" />,
  },
  {
    id: "team",
    file: "team.mdx",
    title: "Team roster",
    surface: <Roster people={teamPeople} label="Platform team" />,
  },
  {
    id: "org",
    file: "org.mdx",
    title: "Org chart",
    surface: (
      <Canvas
        bare
        spec={{ template: "org-chart", title: "Company org" }}
        height={TEMPLATE_TILE_HEIGHT}
      />
    ),
    mobileCaption: "Who reports to whom — a typed org graph, queryable by your agents.",
  },
  {
    id: "mindmap",
    file: "brainstorm.mdx",
    title: "Brainstorm",
    surface: (
      <Canvas
        bare
        spec={{ template: "mind-map", title: "Q3 brainstorm" }}
        height={TEMPLATE_TILE_HEIGHT}
      />
    ),
    mobileCaption: "A mind map of ideas and branches — structured nodes, not a flat picture.",
  },
  {
    id: "runbook",
    file: "runbook.mdx",
    title: "Runbook",
    surface: (
      <div className="space-y-3">
        <Table columns={runbookColumns} rows={runbookRows} caption="On-call signals" />
        <Note title="Escalation">After two failed retries, page the platform lead.</Note>
      </div>
    ),
  },
];

/* ── one tile ────────────────────────────────────────────────────────────────────── */

function Tile({ tile }: { tile: BreadthTile }) {
  return (
    <article
      className="bs-tile flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card sm:w-[440px]"
      aria-label={`${tile.title} — a live superlore document surface`}
    >
      {/* corner header: mono filename + faint agent-readable badge */}
      <div className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/40 px-4 py-2.5">
        <span className="flex items-center gap-2">
          <FoldMark size={13} className="text-kp-accent-text" />
          <span className="font-mono text-[11px] tracking-[0.04em] text-fd-foreground">
            {tile.file}
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-[0.08em] text-fd-muted-foreground uppercase opacity-70">
          Readable by agents
        </span>
      </div>
      {/* the live surface — title at natural height, the surface itself locked to a fixed height
          with a bottom fade so over-tall content (tables/boards) blurs out instead of growing the
          tile. Every tile therefore ends up the same visual height. Canvas tiles (those carrying a
          `mobileCaption`) render the live board DESKTOP-ONLY and a simple static label card on
          phones, where a shrunk React-Flow board reads cut/tiny. */}
      <div className="flex flex-col px-4 py-4">
        <h3 className="mb-2 text-sm font-semibold text-fd-foreground">{tile.title}</h3>
        {/* Every surface — including the canvas tiles — renders live on all breakpoints; the board
            fits-to-tile, so phones get the real visual, not a caption stand-in. */}
        <div
          className="bs-surface min-w-0 [&_*]:max-w-full"
          style={{ height: `${SURFACE_HEIGHT}px` }}
        >
          {tile.surface}
        </div>
      </div>
    </article>
  );
}

/* ── anchor end-labels ───────────────────────────────────────────────────────────── */

function RailAnchor({ label, side }: { label: string; side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-1/2 z-10 hidden font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-fd-muted-foreground uppercase md:inline ${
        side === "left" ? "left-4" : "right-4"
      }`}
      style={{
        writingMode: "vertical-rl",
        transform: `translateY(-50%) rotate(${side === "left" ? "180deg" : "0deg"})`,
      }}
    >
      {label}
    </span>
  );
}

/* ── marquee ─────────────────────────────────────────────────────────────────────────
   The full-bleed, edge-scrolling rail of live document surfaces. Exported on its own (no section
   heading) so it can be dropped into the hero as the centrepiece visual — the hero header carries
   the message that used to live here. Render it inside any full-width band. */

export function SurfaceMarquee({ className }: { className?: string }) {
  // Two copies of the track make the -50% loop seamless. Tiles get unique React keys per copy.
  const ordered = spreadCanvases(tiles);
  const track = [...ordered, ...ordered];

  return (
    <div className={`bs-marquee-root relative${className ? ` ${className}` : ""}`}>
      {/* scoped, self-contained marquee + reduced-motion CSS (token-only colours, no JS branch) */}
      <style>{`
        .bs-rail {
          --bs-gap: 1.25rem;
          /* edge fade so tiles bleed off both sides */
          -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
                  mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
        }
        /* Every tile's surface is a fixed-height window; content that overflows it fades out at the
           bottom (mask) instead of stretching the tile, so all tiles are visually equal height. The
           live-canvas surfaces fit-to-view inside the same window, so the fade simply never bites. */
        .bs-surface {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent);
                  mask-image: linear-gradient(to bottom, #000 70%, transparent);
        }
        /* Hide React-Flow's +/− / fit-view controls (and any attribution) ONLY inside the strip —
           they overlap the small fit-to-tile boards here. Scoped to .bs-track so other canvases on
           the page keep their controls. */
        .bs-track .react-flow__controls,
        .bs-track .react-flow__attribution {
          display: none !important;
        }
        /* ── canvas-tile edge fix ──────────────────────────────────────────────────────────
           These boards fit-to-tile at a very low zoom (~0.25). React-Flow renders the edges layer
           and each per-edge <svg> at auto/zero size and relies on overflow:visible to paint the
           connector outside that box. At this extreme zoom the browser was clipping the long edge
           routes (short, near-origin edges still showed — which is why some tiles looked like they
           had "partial" edges). Giving the edges layer + its child svgs a real, full-size painting
           viewport makes every connector render. Strip-scoped so no other canvas is touched. */
        .bs-track .react-flow__edges,
        .bs-track .react-flow__edges > svg {
          width: 100% !important;
          height: 100% !important;
          overflow: visible !important;
        }
        /* At this density the calm default connector also reads faint, so nudge the stroke up a
           touch (the package already pins it to a constant screen-px width via non-scaling-stroke).
           !important because BaseEdge sets the 2px width inline, and inline beats a stylesheet rule. */
        .bs-track .react-flow__edge-path {
          stroke-width: 3px !important;
        }
        .bs-track {
          display: flex;
          gap: var(--bs-gap);
          width: max-content;
          /* GPU-composite the loop so it stays smooth even with live components in the tiles */
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          /* Calm, premium drift — slow enough to read each (now larger) surface as it passes.
             Scaled up with the longer track (more canvas tiles) so per-pixel speed stays constant. */
          animation: bs-marquee 168s linear infinite;
        }
        /* No hover pause — the rail keeps moving under the cursor. Only the explicit
           pause toggle stops it (CSS-only via :has). */
        .bs-marquee-root:has(.bs-pause:checked) .bs-track {
          animation-play-state: paused;
        }
        .bs-ico--play { display: none; }
        .bs-pause:checked ~ .bs-ico--pause { display: none; }
        .bs-pause:checked ~ .bs-ico--play { display: inline-block; }
        @keyframes bs-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-50% - (var(--bs-gap) / 2)), 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          /* HARD gate: no marquee. Static, hand-scrollable snap rail. */
          .bs-track { animation: none; }
          .bs-rail {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: thin;
          }
          .bs-rail-dup { display: none; }
        }
      `}</style>

      {/* the rail — horizontal scroll CONTAINED here; page body never scrolls sideways */}
      <RailAnchor label="Product docs & releases" side="left" />
      <RailAnchor label="Company knowledge base" side="right" />
      <div className="bs-rail">
        <ul className="bs-track list-none px-6 py-1">
          {track.map((tile, i) => (
            <li
              key={`${tile.id}-${i}`}
              className={i >= ordered.length ? "bs-rail-dup" : undefined}
              aria-hidden={i >= ordered.length ? true : undefined}
            >
              <Tile tile={tile} />
            </li>
          ))}
        </ul>
      </div>

      {/* Subtle, explicit pause toggle — CSS-only (:has + :checked). The rail does NOT pause on
          hover; only this control stops it. */}
      <label
        className="absolute right-5 bottom-[-14px] z-20 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        title="Pause / play auto-scroll"
      >
        <input type="checkbox" className="bs-pause sr-only" aria-label="Pause auto-scroll" />
        <Pause className="bs-ico bs-ico--pause size-3.5" />
        <Play className="bs-ico bs-ico--play size-3.5" />
      </label>
    </div>
  );
}

/* ── section ─────────────────────────────────────────────────────────────────────────
   The "everything your company needs" beat: a left-aligned editorial head over the enlarged,
   edge-scrolling shelf of live document surfaces. Self-paints its own surface step + borders. */

export function BreadthSection() {
  return (
    <section
      aria-labelledby="breadth-heading"
      className="relative overflow-hidden border-y border-fd-border bg-fd-muted/40 py-[clamp(56px,10vw,128px)]"
    >
      <Reveal className="mx-auto mb-12 w-full max-w-6xl px-6">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kp-accent-text uppercase">
          One surface
        </p>
        <h2
          id="breadth-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-balance text-fd-foreground sm:text-4xl"
        >
          Everything your company needs to document, in one place.
        </h2>
        <p className="mt-4 max-w-[640px] text-base leading-relaxed text-fd-muted-foreground">
          Product docs and architecture, the sales pipeline and runbooks, decisions, onboarding,
          OKRs, the org — every kind of company knowledge, authored as MDX in your repo and live
          below. Each surface renders for your team and serializes for your agents.
        </p>
      </Reveal>

      <SurfaceMarquee />
    </section>
  );
}
