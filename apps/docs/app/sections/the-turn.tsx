"use client";

/**
 * TheTurn — the "Give your AI the whiteboard" section of the reimagined landing.
 *
 * The visual is a WallToCanvas morph (adapted from `morph-story.tsx`): a wall of grey monospace
 * Markdown — an SRS-style architecture spec the kind an agent hands back — reorganises, on scroll,
 * into a live superlore `<Canvas bare>` of the SAME agentic-AI application architecture (the shared
 * `q3Spec`). A handful of the Markdown lines FLIP-clone toward the canvas as it resolves; the
 * connective edges draw in via a dashoffset sweep; the FoldMark sits on the hinge between states.
 *
 * The morph is scroll-SCRUBBED (not auto-looped): an IntersectionObserver arms it, then the
 * section's own scroll position drives a single 0→1 `progress` that crossfades wall→canvas. It is
 * fully reversible (scroll back up and it un-resolves). `prefers-reduced-motion` is a hard gate:
 * the scrub is disabled and the Markdown wall + the final canvas render side-by-side, both static.
 *
 * Every colour comes from the global.css token bridge or a `color-mix(... var(--kp-*) ...)`; no raw
 * hex, no theme branching in JS. Hierarchy via surface steps + 1px borders, never drop shadows.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Canvas } from "superlore";
import { q3Spec } from "../_data";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

/* ────────────────────────────────────────────────────────────────────────────
   The Markdown wall — the same agentic-AI architecture as `q3Spec`, written the
   way an agent dumps it: an SRS-style spec with `##` section headings and bulleted
   components. The heading/bullet lines that carry a `node` id FLIP-clone toward the
   canvas as it resolves; each id matches a `q3Spec` node so the morph stays grounded. */
interface MdLine {
  text: string;
  tone: "h1" | "h2" | "p" | "li" | "note" | "blank";
  /** The q3Spec node id this line resolves into (drives the FLIP clone), if any. */
  node?: string;
}

const MD_LINES: readonly MdLine[] = [
  { text: "# Agentic application — architecture", tone: "h1" },
  { text: "", tone: "blank" },
  { text: "## Edge · Gateway", tone: "h2", node: "gw" },
  { text: "- API gateway · rate limit · auth", tone: "li" },
  { text: "", tone: "blank" },
  { text: "## Agent runtime", tone: "h2", node: "loop" },
  { text: "- Planner", tone: "li", node: "planner" },
  { text: "- Agent loop · tool router", tone: "li", node: "router" },
  { text: "- Guardrails", tone: "li", node: "guard" },
  { text: "", tone: "blank" },
  { text: "## Tools · MCP", tone: "h2", node: "tsuperlore" },
  { text: "- Web search · code exec · superlore KB", tone: "li" },
  { text: "", tone: "blank" },
  { text: "## Retrieval (RAG)", tone: "h2", node: "vdb" },
  { text: "- Embedder · vector DB · reranker", tone: "li" },
  { text: "", tone: "blank" },
  { text: "## Models", tone: "h2", node: "claude" },
  { text: "- LLM router → Claude", tone: "li" },
  { text: "", tone: "blank" },
  { text: "## Memory", tone: "h2", node: "ltm" },
  { text: "- Short-term · long-term · cache", tone: "li" },
  { text: "", tone: "blank" },
  { text: "> obs: tracing + evals tap the loop", tone: "note", node: "trace" },
];

/* Resting target offsets (fractions of the stage box) for each cloned line as it travels toward
   its node position in the resolved canvas. `q3Spec` lays out left→right (`direction: "right"`), so
   these read along that flow: gateway at the left, the runtime in the middle, then tools/RAG/models/
   memory fanning out to the right, with observability tapping in low-right. Not a 1:1 layout match
   (the live Canvas owns the real layout). Keys are the `q3Spec` node ids referenced in MD_LINES. */
const CLONE_TARGETS: Record<string, { x: number; y: number }> = {
  gw: { x: 0.12, y: 0.3 },
  planner: { x: 0.34, y: 0.22 },
  loop: { x: 0.46, y: 0.45 },
  router: { x: 0.5, y: 0.62 },
  guard: { x: 0.34, y: 0.66 },
  tsuperlore: { x: 0.66, y: 0.32 },
  vdb: { x: 0.82, y: 0.34 },
  claude: { x: 0.7, y: 0.6 },
  ltm: { x: 0.86, y: 0.66 },
  trace: { x: 0.6, y: 0.88 },
};

const STAGE_HEIGHT = 440;

/* The reduced-motion fallback stacks the board into a HALF-width column, so the same wide landscape
   board wants a shorter frame to fill it without big vertical bands. A dedicated, shorter height
   keeps that panel snug while the full-width morph keeps STAGE_HEIGHT. */
const REDUCED_CANVAS_HEIGHT = 320;

/* The eased scrub: a clamped, smoothstepped 0→1. */
function smooth(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

/** Read reduced-motion once, at mount, without setState-in-effect (lazy-initialiser safe). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TheTurn() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Reduced-motion is a HARD gate: snap to the resolved end-state (armed + progress 1, no scrub).
  // All three are seeded from a lazy initializer so the effect never has to setState synchronously.
  const reduced = prefersReducedMotion();
  const [progress, setProgress] = useState<number>(() => (reduced ? 1 : 0));
  /** Gate: don't mount the (lazy, heavy) Canvas until the stage has scrolled into view. */
  const [armed, setArmed] = useState<boolean>(() => reduced);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Reduced-motion: nothing to observe or scrub — the static end-state is already mounted.
    if (reduced) return;

    // Arm once the stage enters the viewport (mounts the Canvas, starts scrubbing).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setArmed(true);
      },
      { threshold: 0.15 },
    );
    io.observe(stage);

    // Scroll-scrub: map the stage's travel through the viewport onto 0→1. The morph completes
    // while the stage sits centred, so the payoff lands in the reading position. Reversible.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = stage.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 when the stage top hits ~85% down the viewport; 1 once it has risen to ~28%. The
        // wider travel means you scroll ~a third more before the canvas resolves — the Markdown
        // wall holds longer so the "wall → whiteboard" payoff doesn't fire too early.
        const start = vh * 0.85;
        const end = vh * 0.28;
        const t = (start - rect.top) / (start - end);
        setProgress(smooth(t));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const p = progress;
  // The two faces crossfade across the scrub: the wall recedes through the first ~55%, the canvas
  // resolves through the back ~half. Edges (the dashoffset sweep) draw in the last third.
  const wallOut = smooth(p / 0.62);
  const canvasIn = smooth((p - 0.52) / 0.48);
  const edgeDraw = smooth((p - 0.68) / 0.32);

  return (
    <Reveal as="section" className="mx-auto w-full max-w-6xl px-6 py-[clamp(80px,10vw,128px)]">
      {/* ── Editorial head — left-aligned mono eyebrow + tight h2 + ≤640px deck ── */}
      <header className="max-w-[640px]">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-kp-accent-text uppercase">
          <FoldMark size={13} className="text-kp-accent-text" />
          The turn
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-[2.5rem] sm:leading-[1.08]">
          Give your AI the whiteboard — and the whole doc.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-fd-muted-foreground sm:text-[1.05rem]">
          You brainstormed on a whiteboard, closed the tab, and the thinking drifted. Now your AI
          thinks on the canvas{" "}
          <em className="text-fd-foreground not-italic">inside the document</em> and shows you —
          instead of handing back a wall of Markdown to decipher.
        </p>
      </header>

      {/* ── The WallToCanvas stage ──
          MOBILE: the scroll-scrub morph and the side-by-side fallback both rely on a wide landscape
          board that reads cut/tiny on phones, so the whole stage is DESKTOP-ONLY (hidden lg:block /
          the lg:block wrappers below). Phones get a simple static essence (a MobileTurn card) that
          carries the message without a cut canvas. Desktop (≥lg) is unchanged. */}
      <div className="mt-12">
        <div className="lg:hidden">
          <MobileTurn />
        </div>
        {reduced ? (
          <div className="hidden lg:block">
            <ReducedSideBySide />
          </div>
        ) : (
          <div
            ref={stageRef}
            className="relative hidden overflow-hidden rounded-2xl border border-fd-border bg-fd-card lg:block"
          >
            {/* Slim mono chrome — reads as a real surface, and labels the morph's two ends. */}
            <div className="relative z-20 flex items-center gap-3 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
              <FoldMark size={14} className="text-fd-muted-foreground" />
              <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
                architecture.mdx
              </span>
              <span
                className="ml-auto inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase"
                aria-hidden
              >
                <PhaseTag label="Markdown" on={wallOut < 0.5} />
                <span className="text-fd-border">/</span>
                <PhaseTag label="Canvas" on={wallOut >= 0.5} />
              </span>
            </div>

            <div className="relative" style={{ height: STAGE_HEIGHT }}>
              {/* LAYER 1 — the Markdown wall, receding as it resolves. */}
              <MarkdownWall progress={wallOut} />

              {/* FLIP clones — the list/heading lines breaking off toward node positions. */}
              <CloneField progress={p} />

              {/* The hinge mark — sits on the seam, brightening mid-morph, then fading fully out as
                  the canvas resolves (gone past ~0.8) so it never overlaps a resolved canvas edge. */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
                style={{
                  opacity:
                    (0.3 + 0.7 * Math.sin(Math.min(p, 1) * Math.PI)) *
                    (1 - smooth((p - 0.8) / 0.2)),
                  transition: "opacity 120ms linear",
                }}
              >
                <span className="grid size-9 place-items-center rounded-xl border border-kp-accent-border bg-fd-background">
                  <FoldMark
                    size={18}
                    halfToneOpacity={0.35 + 0.55 * canvasIn}
                    className="text-kp-accent-text"
                  />
                </span>
              </div>

              {/* LAYER 2 — the live superlore Canvas (the payoff). Mounted once armed so React Flow has
                  laid it out by the time it fades in; edges revealed via a dashoffset sweep. */}
              <div
                className="absolute inset-0"
                aria-hidden={canvasIn < 0.5}
                style={
                  {
                    opacity: canvasIn,
                    transform: `scale(${0.97 + 0.03 * canvasIn})`,
                    pointerEvents: canvasIn > 0.9 ? "auto" : "none",
                    // Sweep the edge strokes in: the var is read by the .kp-turn-canvas rule below.
                    ["--kp-edge-draw" as string]: String(edgeDraw),
                  } satisfies CSSProperties
                }
              >
                {armed ? (
                  <div className="kp-turn-canvas absolute inset-0">
                    <Canvas bare spec={q3Spec} height={STAGE_HEIGHT} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Caption that swaps across the scrub — frames the canvas as the doc itself. */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-t border-fd-border bg-fd-muted/50 px-4 py-2.5">
              <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
                {wallOut < 0.5
                  ? "What the agent hands back — a wall of Markdown"
                  : "The same thinking, alive on the canvas in your doc"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-kp-accent-text uppercase">
                superlore canvas
              </span>
            </div>

            {/* Scoped style: draw the canvas edges in via the scrubbed --kp-edge-draw, neutralise the
                Canvas's own card chrome, and HARD-gate every effect on reduced-motion. */}
            <style>{`
              .kp-turn-canvas > div {
                margin: 0;
                height: 100%;
                border: none;
                border-radius: 0;
                background: transparent;
              }
              /* Edges fade in with the scrub (opacity only) — always fully rendered, never a
                 broken dash pattern. */
              .kp-turn-canvas .react-flow__edge {
                opacity: var(--kp-edge-draw, 1);
                transition: opacity 120ms linear;
              }
              @media (prefers-reduced-motion: reduce) {
                .kp-turn-canvas .react-flow__edge {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </Reveal>
  );
}

/* ── Mobile static essence: NO scrub, NO cut canvas. A compact two-step card — the wall of
   Markdown an agent hands back (the legible source, scroll-contained) and a one-line caption that
   the same thinking becomes a live canvas in your doc. Copy-forward; carries the message without a
   shrunk landscape board. Phones only (the desktop scrub/side-by-side stays gated to lg). ── */
function MobileTurn() {
  return (
    <div className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
      <div className="flex items-center gap-2.5 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
        <FoldMark size={14} className="text-fd-muted-foreground" />
        <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
          architecture.mdx
        </span>
        <span className="ml-auto font-mono text-[10px] font-semibold tracking-[0.12em] text-fd-muted-foreground uppercase">
          Markdown
        </span>
      </div>
      <pre className="m-0 max-h-[260px] overflow-auto px-4 py-4 font-mono text-[12px] leading-[1.7] text-fd-muted-foreground">
        {MD_LINES.map((l, i) => (
          <span key={i} className="block min-h-[1.7em] whitespace-pre">
            <MdSpan line={l} />
          </span>
        ))}
      </pre>
      <div className="flex items-center gap-2.5 border-t border-fd-border bg-fd-muted/50 px-4 py-3">
        <FoldMark size={13} className="shrink-0 text-kp-accent-text" />
        <p className="text-[13px] leading-snug text-pretty text-fd-foreground">
          superlore turns this wall of Markdown into a live canvas{" "}
          <span className="text-fd-muted-foreground">inside your doc</span> — the board your team
          reads is the typed graph your agents read.
        </p>
      </div>
    </div>
  );
}

/* ── The Markdown wall: real source, tone-tinted, receding on scrub. ──────────── */
function MarkdownWall({ progress }: { progress: number }) {
  const style: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    opacity: 1 - progress,
    filter: progress > 0 ? `blur(${progress * 5}px) saturate(${1 - progress * 0.3})` : "none",
    transform: `scale(${1 - progress * 0.04}) translateY(${-progress * 10}px)`,
    transition: "opacity 80ms linear, filter 80ms linear, transform 80ms linear",
  };
  return (
    <div style={style} aria-hidden={progress > 0.5}>
      <pre className="m-0 px-6 py-5 font-mono text-[12.5px] leading-[1.7] text-fd-muted-foreground">
        {MD_LINES.map((l, i) => (
          <span key={i} className="block min-h-[1.7em] whitespace-pre" data-turn-tone={l.tone}>
            <MdSpan line={l} />
          </span>
        ))}
      </pre>
    </div>
  );
}

function MdSpan({ line }: { line: MdLine }) {
  if (line.text === "") return <span> </span>;
  if (line.tone === "h1") return <span className="font-bold text-fd-foreground">{line.text}</span>;
  if (line.tone === "h2")
    return <span className="font-semibold text-fd-foreground">{line.text}</span>;
  if (line.tone === "li")
    return (
      <span style={{ color: "var(--kp-text-2, var(--color-fd-foreground))" }}>{line.text}</span>
    );
  if (line.tone === "note")
    return (
      <span
        className="rounded px-1 text-kp-accent-text"
        style={{ background: "color-mix(in oklab, var(--kp-accent) 9%, transparent)" }}
      >
        {line.text}
      </span>
    );
  return <span>{line.text}</span>;
}

/* ── FLIP clones: the meaningful lines break off and travel toward node positions. ──
   They rise from their in-list slot (mid scrub) and land near their canvas node, then
   dissolve as the live Canvas owns the frame. Pure transform/opacity — GPU-cheap. */
function CloneField({ progress }: { progress: number }) {
  // Clones live only in the middle of the scrub: born at ~0.3, gone by ~0.85.
  const phase = smooth((progress - 0.3) / 0.45);
  const fade = progress > 0.8 ? smooth((progress - 0.8) / 0.2) : 0;
  if (phase <= 0) return null;

  // Each clone breaks off from where its line actually sits in the wall, so the morph reads as the
  // spec reorganising in place. srcY maps the line's index in MD_LINES onto the stage's vertical run
  // (clamped to keep clones on-stage); the live Canvas owns the resolved layout.
  const total = MD_LINES.length;
  const clones = MD_LINES.map((l, idx) => ({ line: l, idx })).filter((e) => e.line.node);

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {clones.map(({ line: l, idx }) => {
        const node = l.node as string;
        const target = CLONE_TARGETS[node];
        if (!target) return null;
        // Source slot: where the line sits in the wall (top-left column, by real line index).
        const srcX = 0.08;
        const srcY = 0.08 + (idx / total) * 0.84;
        const x = srcX + (target.x - srcX) * phase;
        const y = srcY + (target.y - srcY) * phase;
        const label = l.text.replace(/^[#>\s]+/, "").replace(/^-\s+/, "");
        return (
          <span
            key={node}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-kp-accent-border bg-fd-background px-2 py-1 font-mono text-[10px] whitespace-nowrap text-fd-foreground"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              opacity: (1 - fade) * Math.min(1, phase * 1.4),
              transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * phase})`,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function PhaseTag({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      style={{
        color: on ? "var(--kp-accent-text)" : "var(--color-fd-muted-foreground)",
        opacity: on ? 1 : 0.55,
        transition: "color 160ms linear, opacity 160ms linear",
      }}
    >
      {label}
    </span>
  );
}

/* ── Reduced-motion fallback: Markdown wall + final canvas, side-by-side, both static. ── */
function ReducedSideBySide() {
  return (
    <div className="grid gap-4 rounded-2xl border border-fd-border bg-fd-card p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-muted/40">
        <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
          <FoldMark size={13} className="text-fd-muted-foreground" />
          <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
            What the agent writes
          </span>
        </div>
        <pre className="m-0 px-5 py-4 font-mono text-[12px] leading-[1.7] text-fd-muted-foreground">
          {MD_LINES.map((l, i) => (
            <span key={i} className="block min-h-[1.7em] whitespace-pre">
              <MdSpan line={l} />
            </span>
          ))}
        </pre>
      </div>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-kp-accent-border bg-fd-background">
        <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
          <FoldMark size={13} className="text-kp-accent-text" />
          <span className="font-mono text-[11px] tracking-wide text-kp-accent-text">
            The same thinking, on the canvas
          </span>
        </div>
        {/* Centre the wide landscape board in whatever cell height the markdown column sets, so it
            fills the panel width and sits balanced — no top-aligned board with a dead band below. */}
        <div className="flex flex-1 items-center justify-center">
          <div className="kp-turn-canvas relative w-full" style={{ height: REDUCED_CANVAS_HEIGHT }}>
            <Canvas bare spec={q3Spec} height={REDUCED_CANVAS_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
}
