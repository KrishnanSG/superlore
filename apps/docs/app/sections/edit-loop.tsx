"use client";

/**
 * EditLoop — THE LOOP section, as ONE cinematic, doc-centric, auto-playing scene.
 *
 * The superlore DOC *is* the screen: a single large document window (token-built window chrome —
 * traffic dots + a `links-api.mdx` tab + a muted "superlore preview" label) spanning the full content
 * width, holding a real technical doc — a title, one prose line, and the LIVE deep board
 * (`<Canvas bare>` of the cache-branch architecture). Collaboration happens OVER the doc: comments
 * are FigJam-style absolutely-positioned OVERLAYS (pins anchored to nodes + a compact thread card),
 * so they NEVER change the layout height. The stage has a FIXED total height — nothing reflows as
 * the scene plays. That is the #1 goal: zero layout shift across the whole loop.
 *
 * A timed phase state-machine plays a tiny screen-recording of the loop. It opens with a
 * FigJam-style MULTIPLAYER CURSOR choreography — two distinct faux cursors act the scene out —
 * before the unchanged send/agent/resolve beats:
 *
 *   IDLE      — the doc sits calm; no comments, no cursors.
 *   CURSOR_A  — Krishnan's (brand-accent) cursor glides in from off-frame to the "Cache hit?"
 *               node, a click ripple fires, a PIN drops there, and his comment TYPES in
 *               character-by-character (typewriter) in the thread card.
 *   CURSOR_B  — Maya's SECOND, visually distinct (teal) cursor — with its own trailing name tag —
 *               glides to the "Redis cache" node, clicks, drops a SECOND pin, and her reply
 *               TYPES in.
 *   SEND      — the rationed `.kp-agent-gradient` "Send to agent" control flashes pressed.
 *   THINKING  — a subtle shimmer OVERLAYS the doc (NOT a layout change) while the agent works.
 *   APPLY     — the board edit lands live: the edge label swaps "yes" → "cache hit" (spec swap,
 *               topology constant), the doc's prose/decision line updates with a success tint, and
 *               both comments flip to a success-token "Resolved" check.
 *   RESOLVED  — hold the resolved outcome, then reset and replay (~13–16s loop).
 *
 * The two cursors are differentiated three ways: COLOUR (A = `--kp-accent`, B = `--kp-hue-teal`),
 * a trailing rounded NAME TAG ("Krishnan" / "Maya") in the matching hue, and the NODE each visits.
 * Both glide via `transform: translate` between the fractional pin anchors (PIN_A / PIN_B), so the
 * cursor and the pin it drops always agree on where the node is — no ref measuring needed.
 *
 * Auto-plays only once the section scrolls into view (IntersectionObserver, threshold 0.4); pauses
 * when the tab is hidden (visibilitychange); loops with a ~1.5s hold before restart.
 * `prefers-reduced-motion` is a HARD gate (lazy-init): no interval / no looping — the FINAL
 * resolved frame renders statically (diagram already updated, both comments resolved).
 *
 * The headline + deck stay real text; the animated stage is decorative (aria-hidden). Colour is
 * tokens only (or `color-mix(... var(--kp-*) / var(--color-fd-*) ...)`); the agent gradient stays
 * rationed to the single "Send to agent" control. No emoji anywhere; mono for any source text.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "superlore";
import { systemSpec } from "../_data";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

/* ── Comment anchors: `fx`/`fy` are fractions of the rendered Canvas box, so each pin lands on the
   live board exactly the way the Viewer would place it. Person A pins the cache-branch diamond
   ("hit"); Person B pins the cache cylinder ("cache") — two different nodes, two authors. The faux
   cursors glide to these SAME fractions, so each cursor and the pin it drops always agree. ── */
const PIN_A = { nodeId: "hit", fx: 0.62, fy: 0.45 } as const;
const PIN_B = { nodeId: "cache", fx: 0.84, fy: 0.3 } as const;

/* Where each cursor STARTS — just off the board edge — before it glides to its node. Fractions of
   the board box, same coordinate space as the pins. */
const CURSOR_A_FROM = { fx: 0.16, fy: 1.18 } as const; // slides up from the lower-left
const CURSOR_B_FROM = { fx: 1.16, fy: 0.78 } as const; // slides in from the right

const PERSON_A = {
  author: "Krishnan S G",
  initials: "KS",
  body: "Tighten this edge label — “yes” reads ambiguous on the cache branch.",
} as const;

const PERSON_B = {
  author: "Maya Chen",
  initials: "MC",
  body: "Agreed, and note the miss path writes through to the DB.",
} as const;

const AGENT_REPLY = "Renamed the edge to “cache hit” and re-serialized the graph.";

/* The doc's prose line swaps when the agent applies the change — the human-readable proof that
   "the doc updated", paired with the board edit. */
const PROSE_BEFORE =
  "Redirects resolve through a cache-first branch: a hit returns the cached target, a miss falls back to the links DB.";
const PROSE_AFTER =
  "Redirects resolve through a cache-first branch: on a cache hit we return the cached target; a miss writes through to the links DB.";

/* The two board states the scene swaps between: before the edit the `hit → cache` edge is labelled
   "yes"; after, "cache hit". Derived from the single shared `systemSpec` so the board never drifts —
   we clone it and rewrite ONLY the one edge label. TOPOLOGY STAYS CONSTANT (no nodes/edges added or
   removed) so React Flow keeps its layout and the board never re-fits / jumps. */
function specWithEdgeLabel(label: string) {
  return {
    ...systemSpec,
    edges: (systemSpec.edges ?? []).map((e) =>
      e.from === "hit" && e.to === "cache" ? { ...e, label } : e,
    ),
  };
}

/* ── Scene phases, in play order. Each carries the ms it dwells before advancing. The two cursor
   beats lead: a cursor glides → clicks → drops a pin → its comment types in, all within the beat. ── */
const PHASES = ["idle", "cursorA", "cursorB", "send", "thinking", "apply", "resolved"] as const;
type Phase = (typeof PHASES)[number];

const DWELL: Record<Phase, number> = {
  idle: 900,
  // Each cursor beat: glide (~900ms) + click + pin drop + ~1.1s typewriter, then a short hold.
  cursorA: 2900,
  cursorB: 2900,
  send: 800,
  thinking: 1500,
  apply: 800,
  resolved: 2600, // hold the resolved outcome before the ~1.5s reset → replay
};

/* How long the click ripple waits AFTER a cursor beat begins (lets the cursor finish gliding
   before it "clicks" and drops its pin). Kept under each cursor beat's DWELL. */
const CURSOR_GLIDE_MS = 900;
/* Per-character cadence for the typewriter; the longest body × this stays under the cursor DWELL. */
const TYPE_STEP_MS = 18;

function phaseIndex(p: Phase): number {
  return PHASES.indexOf(p);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── A small monogram avatar chip — token surface + 1px border, no image, no emoji. ── */
function Avatar({ initials, label }: { initials: string; label: string }) {
  return (
    <span
      aria-hidden
      title={label}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-fd-border bg-fd-muted font-mono text-[9.5px] font-semibold tracking-wide text-fd-muted-foreground select-none"
    >
      {initials}
    </span>
  );
}

export function EditLoop() {
  // Read reduced-motion once at mount via a lazy initializer — never setState in an effect.
  const [reduced] = useState<boolean>(prefersReducedMotion);

  // The scene only runs once it has scrolled into view; this gates the timeline.
  const [inView, setInView] = useState<boolean>(false);
  // The current scene phase. Reduced-motion pins straight to the final resolved frame.
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? "resolved" : "idle"));

  const stageRef = useRef<HTMLDivElement | null>(null);

  // ── Cursor-beat sub-state, advanced by per-beat timers (within cursorA / cursorB). A beat goes:
  // glide (clicked=false) → click ripple + pin drop (clicked=true) → typewriter (typed grows). The
  // booleans/counters reset to 0 when the loop resets to `idle`. Reduced-motion seeds them complete
  // via lazy initializers so the static frame shows both pins + both full comments. ──
  const [clickedA, setClickedA] = useState<boolean>(() => prefersReducedMotion());
  const [clickedB, setClickedB] = useState<boolean>(() => prefersReducedMotion());
  const [typedA, setTypedA] = useState<number>(() =>
    prefersReducedMotion() ? PERSON_A.body.length : 0,
  );
  const [typedB, setTypedB] = useState<number>(() =>
    prefersReducedMotion() ? PERSON_B.body.length : 0,
  );

  // ── Derived phase flags (read across the render) ────────────────────────────────
  const pi = phaseIndex(phase);
  // Pins drop on the cursor CLICK (mid-beat), not when the beat starts — so the cursor visibly
  // glides in first. Once we're past the beat, the pin is simply down.
  const pinADropped = clickedA || pi > phaseIndex("cursorA");
  const pinBDropped = clickedB || pi > phaseIndex("cursorB");
  // The thread card opens with the first pin; each comment row reveals when its pin lands.
  const commentAShown = pinADropped;
  const commentBShown = pinBDropped;
  // The slice of each body that has been "typed" so far.
  const typedBodyA = PERSON_A.body.slice(0, typedA);
  const typedBodyB = PERSON_B.body.slice(0, typedB);
  const sendPressed = phase === "send";
  const thinking = phase === "thinking";
  const applied = pi >= phaseIndex("apply"); // board edit + doc line landed; thread resolved

  // ── Cursor placement. Each cursor is parked off-frame at idle, glides to its node during its own
  // beat, then stays parked on the node until reset (so it doesn't snap away mid-scene). Returns a
  // fractional {fx,fy} in the board's coordinate space; the overlay maps it to left/top %. ──
  const cursorA = pi < phaseIndex("cursorA") ? CURSOR_A_FROM : PIN_A;
  const cursorAVisible = phase === "cursorA"; // only Krishnan's beat shows his cursor
  const cursorB = pi < phaseIndex("cursorB") ? CURSOR_B_FROM : PIN_B;
  const cursorBVisible = phase === "cursorB"; // only Maya's beat shows hers

  // The board spec swaps from "yes" → "cache hit" the moment the agent applies the change.
  const beforeSpec = useMemo(() => specWithEdgeLabel("yes"), []);
  const afterSpec = useMemo(() => specWithEdgeLabel("cache hit"), []);
  const activeSpec = applied ? afterSpec : beforeSpec;

  // ── The timeline: step phase→phase on a per-phase dwell. Gated on inView; not run under
  // reduced-motion (it rests on the final resolved frame). A ~1.5s hold sits after `resolved`
  // before the scene resets to `idle` and replays. The active timer is tracked in a ref so the
  // recursive scheduler can be torn down cleanly when the gating inputs flip. ──
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (reduced || !inView) return;
    const advance = (current: Phase) => {
      const next = current === "resolved" ? "idle" : PHASES[phaseIndex(current) + 1]!;
      const wait = current === "resolved" ? DWELL.resolved + 1500 : DWELL[current];
      timerRef.current = window.setTimeout(() => {
        // Reset cursor/typewriter sub-state HERE (in the timer callback, not synchronously in an
        // effect body) when the loop folds back to idle, so the next pass replays from scratch.
        if (next === "idle") {
          setClickedA(false);
          setClickedB(false);
          setTypedA(0);
          setTypedB(0);
        }
        setPhase(next);
        advance(next);
      }, wait);
    };
    advance(phase);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
    // Restart the loop only when gating inputs flip — not on every phase tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, inView]);

  // ── Cursor-beat driver: when a cursor beat begins, wait out the glide, fire the click + pin drop,
  // then run the typewriter one char at a time. When the loop resets to `idle`, clear all sub-state
  // so the next pass replays from scratch. Keyed on `phase`; not run under reduced-motion. ──
  useEffect(() => {
    if (reduced) return;
    if (phase !== "cursorA" && phase !== "cursorB") return;

    const isA = phase === "cursorA";
    const body = isA ? PERSON_A.body : PERSON_B.body;
    const setClicked = isA ? setClickedA : setClickedB;
    const setTyped = isA ? setTypedA : setTypedB;
    const timers: number[] = [];

    // After the cursor finishes gliding, "click": drop the pin and open the row.
    timers.push(
      window.setTimeout(() => {
        setClicked(true);
        // Typewriter: advance the slice index every TYPE_STEP_MS until the body is complete.
        for (let i = 1; i <= body.length; i++) {
          timers.push(window.setTimeout(() => setTyped(i), i * TYPE_STEP_MS));
        }
      }, CURSOR_GLIDE_MS),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, reduced]);

  // Pause/resume on tab visibility: re-arm inView when the tab returns, freeze it when hidden.
  useEffect(() => {
    if (reduced) return;
    const onVis = () => {
      if (document.hidden) setInView(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduced]);

  // Play only once the stage scrolls into view; re-arm whenever it re-enters (covers the
  // tab-hidden pause above flipping inView back off).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting && !document.hidden) setInView(true);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, inView]);

  return (
    <Reveal as="section" className="bg-fd-background">
      <style>{SCENE_CSS}</style>
      <div className="mx-auto w-full max-w-6xl px-6 py-[clamp(56px,10vw,128px)]">
        {/* Editorial head — left-aligned, mono eyebrow + tight h2 + ≤640px deck. */}
        <div className="max-w-[640px]">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.18em] text-kp-accent-text uppercase">
            <FoldMark size={13} className="text-kp-accent-text" />
            The loop
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-balance text-fd-foreground">
            Write with AI. Review with comments. Hand it back.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-pretty text-fd-muted-foreground">
            The doc <span className="text-fd-foreground">is</span> the canvas. Drop comments right
            on it, <span className="text-fd-foreground">Send to agent</span>, and watch the prose
            and the diagram update together as the thread resolves.
          </p>
        </div>

        {/* ── The stage: ONE document window spanning the full width, with comments as absolute
            overlays. The whole scene is decorative — aria-hidden — because it is a looping
            animation; the headline and deck above carry the real, readable text. The stage has a
            FIXED height and the comment overlays are position:absolute, so NOTHING reflows as the
            loop plays — zero layout shift. ── */}
        {/* MOBILE: the cursor cinematic + the wide live board read cramped/cut on phones, so the
            animated stage is DESKTOP-ONLY (hidden lg:block below) and phones get a SIMPLE static
            scene — the doc window with one clean comment-thread card (no overlapping pins/cursors,
            no cut canvas). Desktop (≥lg) is unchanged. */}
        <div className="mt-12 lg:hidden" aria-hidden>
          <MobileLoop />
        </div>
        <div className="mt-14 hidden lg:block" aria-hidden>
          <div
            ref={stageRef}
            className="kp-loop-stage relative overflow-hidden rounded-xl border border-fd-border bg-fd-card"
          >
            {/* Window chrome: traffic dots + the open tab + a muted "superlore preview" label. */}
            <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
                <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
                <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
              </span>
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-fd-border bg-fd-background px-2 py-1 font-mono text-[10.5px] text-fd-foreground">
                <FoldMark size={9} className="text-kp-accent-text" />
                links-api.mdx
              </span>
              <span className="ml-auto font-mono text-[9.5px] tracking-wide text-fd-muted-foreground uppercase">
                superlore preview
              </span>
            </div>

            {/* The doc body: title + one prose line + the LIVE deep board. Fixed-height; the board is
                the centerpiece, large and legible. */}
            <div className="relative px-[clamp(16px,3vw,40px)] py-[clamp(16px,2.6vw,32px)]">
              <h3 className="text-[clamp(1.05rem,2vw,1.4rem)] font-semibold tracking-[-0.02em] text-fd-foreground">
                Links API — architecture
              </h3>
              <p
                className={`mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-pretty transition-colors duration-500 ${
                  applied
                    ? "-mx-1 rounded bg-kp-success/10 px-1 text-fd-foreground"
                    : "text-fd-muted-foreground"
                }`}
              >
                {applied ? PROSE_AFTER : PROSE_BEFORE}
              </p>

              {/* The live deep board — the centerpiece. The spec swaps when the agent applies the
                  edit; topology is constant so React Flow keeps its layout (no re-fit, no jump). */}
              <div className="relative mt-4 rounded-lg border border-fd-border bg-fd-background">
                <Canvas bare spec={activeSpec} height={420} />

                {/* ── Multiplayer cursors: two distinct faux pointers that open the scene. Each is an
                    absolute overlay positioned by left/top % over the board box and moved by a
                    transition on those props, so they glide between the off-frame start and their
                    node. Differentiated by COLOUR + a trailing NAME TAG. position:absolute +
                    pointer-events:none → zero layout impact. ── */}
                <Cursor
                  name={PERSON_A.author.split(" ")[0]!}
                  hueVar="var(--kp-accent)"
                  inkVar="var(--kp-accent-ink)"
                  fx={cursorA.fx}
                  fy={cursorA.fy}
                  visible={cursorAVisible}
                  clicked={clickedA && phase === "cursorA"}
                />
                <Cursor
                  name={PERSON_B.author.split(" ")[0]!}
                  hueVar="var(--kp-hue-teal)"
                  inkVar="var(--color-fd-background)"
                  fx={cursorB.fx}
                  fy={cursorB.fy}
                  visible={cursorBVisible}
                  clicked={clickedB && phase === "cursorB"}
                />

                {/* ── Comment overlays: absolutely positioned, so they NEVER affect layout height.
                    Each pin anchors to a node by fractional fx/fy of the board box. ── */}

                {/* Person A's pin — on the "Cache hit?" diamond. Flips to a success check on apply. */}
                <span
                  style={{ left: `${PIN_A.fx * 100}%`, top: `${PIN_A.fy * 100}%` }}
                  className={`kp-loop-pin absolute z-20 -translate-x-1/2 -translate-y-full rounded-full rounded-bl-none border px-1.5 py-1 ${
                    pinADropped ? "is-dropped" : ""
                  } ${
                    applied
                      ? "border-kp-success/45 bg-kp-success/15 text-kp-success"
                      : "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text"
                  }`}
                >
                  {applied ? (
                    <CheckGlyph className="size-3" />
                  ) : (
                    <span className="block font-mono text-[9px] leading-none font-semibold">
                      {PERSON_A.initials}
                    </span>
                  )}
                </span>

                {/* Person B's pin — on the "Redis cache" cylinder. Flips to a success check on apply. */}
                <span
                  style={{ left: `${PIN_B.fx * 100}%`, top: `${PIN_B.fy * 100}%` }}
                  className={`kp-loop-pin absolute z-20 -translate-x-1/2 -translate-y-full rounded-full rounded-bl-none border px-1.5 py-1 ${
                    pinBDropped ? "is-dropped" : ""
                  } ${
                    applied
                      ? "border-kp-success/45 bg-kp-success/15 text-kp-success"
                      : "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text"
                  }`}
                >
                  {applied ? (
                    <CheckGlyph className="size-3" />
                  ) : (
                    <span className="block font-mono text-[9px] leading-none font-semibold">
                      {PERSON_B.initials}
                    </span>
                  )}
                </span>

                {/* The thread card — a compact FigJam-style popover overlaid near the pins. Two
                    authors, two avatars; the rationed agent control; status flips to Resolved. It is
                    position:absolute, so it never changes the board/doc height. */}
                <div className={`kp-loop-thread absolute z-30 ${commentAShown ? "is-open" : ""}`}>
                  <div className="w-[270px] overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-[var(--kp-canvas-shadow)]">
                    {/* Thread header — target + live status. */}
                    <div className="flex items-center gap-2 border-b border-fd-border px-3 py-2">
                      <span className="font-mono text-[9px] tracking-wide text-fd-muted-foreground uppercase">
                        Thread
                      </span>
                      <span className="font-mono text-[9px] tracking-wide text-fd-muted-foreground">
                        on{" "}
                        <code className="text-fd-foreground">{`{ node: "${PIN_A.nodeId}" }`}</code>
                      </span>
                      <span
                        className={`ml-auto inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-wide uppercase transition-colors ${
                          applied
                            ? "border-kp-success/45 bg-kp-success/12 text-kp-success"
                            : "border-fd-border bg-fd-muted text-fd-muted-foreground"
                        }`}
                      >
                        {applied ? (
                          <>
                            <CheckGlyph className="size-2.5" />
                            Resolved
                          </>
                        ) : (
                          "Open"
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 p-3">
                      {/* Person A's comment. */}
                      <div
                        className={`kp-loop-msg flex items-start gap-2 ${
                          commentAShown ? "is-in" : ""
                        }`}
                      >
                        <Avatar initials={PERSON_A.initials} label={PERSON_A.author} />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11.5px] font-medium text-fd-foreground">
                            {PERSON_A.author}
                          </span>
                          <TypingBody full={PERSON_A.body} typed={typedBodyA} />
                        </div>
                      </div>

                      {/* Person B's reply. */}
                      <div
                        className={`kp-loop-msg flex items-start gap-2 ${
                          commentBShown ? "is-in" : ""
                        }`}
                      >
                        <Avatar initials={PERSON_B.initials} label={PERSON_B.author} />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11.5px] font-medium text-fd-foreground">
                            {PERSON_B.author}
                          </span>
                          <TypingBody full={PERSON_B.body} typed={typedBodyB} />
                        </div>
                      </div>

                      {/* The agent turn — a "thinking" beat (typing dots), then the reply lands.
                          Reserves its space so the card never reflows. */}
                      <div className="min-h-[2.6em] border-t border-fd-border pt-2.5">
                        {thinking ? (
                          <div className="flex items-center gap-2 border-l border-kp-accent-border pl-2.5">
                            <FoldMark
                              size={11}
                              halfToneOpacity={0.6}
                              className="shrink-0 text-kp-accent-text"
                            />
                            <span className="kp-loop-dots font-mono text-[11px] text-kp-accent-text">
                              <span>•</span>
                              <span>•</span>
                              <span>•</span>
                            </span>
                          </div>
                        ) : applied ? (
                          <div className="kp-loop-reply flex items-start gap-2 border-l border-kp-accent-border pl-2.5">
                            <FoldMark
                              size={11}
                              halfToneOpacity={0.6}
                              className="mt-0.5 shrink-0 text-kp-accent-text"
                            />
                            <div>
                              <span className="font-mono text-[9px] tracking-wide text-kp-accent-text uppercase">
                                agent
                              </span>
                              <p className="mt-0.5 text-[11.5px] leading-snug text-pretty text-fd-foreground">
                                {AGENT_REPLY}
                              </p>
                            </div>
                          </div>
                        ) : (
                          // The single rationed `.kp-agent-gradient` "Send to agent" control.
                          <div
                            className={`kp-loop-send kp-agent-gradient text-kp-accent-ink inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide ${
                              sendPressed ? "is-pressed" : ""
                            }`}
                          >
                            <FoldMark
                              size={11}
                              halfToneOpacity={0.7}
                              className="text-kp-accent-ink"
                            />
                            Send to agent
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* The agent "working" shimmer — an absolute overlay ON the doc during THINKING.
                    It is position:absolute and pointer-events:none, so it never changes layout. */}
                <div className={`kp-loop-shimmer ${thinking ? "is-on" : ""}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Mobile static scene: NO cursors, NO cut board, NO overlap. The doc window (title + the
   resolved prose line) over one clean, in-flow comment-thread card — two human comments + the
   agent reply + a Resolved chip. Copy-forward; carries the loop's payoff without the cinematic.
   Phones only (the desktop cinematic stays gated to lg). ── */
function MobileLoop() {
  return (
    <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      {/* Window chrome — traffic dots + the open tab + a muted preview label. */}
      <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
          <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
          <span className="size-2 rounded-full border border-fd-border bg-fd-background" />
        </span>
        <span className="ml-1 inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-fd-border bg-fd-background px-2 py-1 font-mono text-[10.5px] text-fd-foreground">
          <FoldMark size={9} className="text-kp-accent-text" />
          links-api.mdx
        </span>
        <span className="ml-auto font-mono text-[9.5px] tracking-wide text-fd-muted-foreground uppercase">
          superlore preview
        </span>
      </div>

      <div className="px-4 py-5">
        <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-fd-foreground">
          Links API — architecture
        </h3>
        <p className="mt-2 rounded bg-kp-success/10 px-1 text-[13.5px] leading-relaxed text-pretty text-fd-foreground">
          {PROSE_AFTER}
        </p>

        {/* One clean comment-thread card, in flow (no absolute pins/cursors). */}
        <div className="mt-4 overflow-hidden rounded-xl border border-fd-border bg-fd-background">
          <div className="flex items-center gap-2 border-b border-fd-border px-3 py-2">
            <span className="font-mono text-[9px] tracking-wide text-fd-muted-foreground uppercase">
              Thread
            </span>
            <span className="font-mono text-[9px] tracking-wide text-fd-muted-foreground">
              on <code className="text-fd-foreground">{`{ node: "${PIN_A.nodeId}" }`}</code>
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-kp-success/45 bg-kp-success/12 px-1.5 py-0.5 font-mono text-[8.5px] font-semibold tracking-wide text-kp-success uppercase">
              <CheckGlyph className="size-2.5" />
              Resolved
            </span>
          </div>
          <div className="flex flex-col gap-2.5 p-3">
            <div className="flex items-start gap-2">
              <Avatar initials={PERSON_A.initials} label={PERSON_A.author} />
              <div className="min-w-0 flex-1">
                <span className="text-[11.5px] font-medium text-fd-foreground">
                  {PERSON_A.author}
                </span>
                <p className="mt-0.5 text-[12px] leading-snug text-pretty text-fd-foreground">
                  {PERSON_A.body}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Avatar initials={PERSON_B.initials} label={PERSON_B.author} />
              <div className="min-w-0 flex-1">
                <span className="text-[11.5px] font-medium text-fd-foreground">
                  {PERSON_B.author}
                </span>
                <p className="mt-0.5 text-[12px] leading-snug text-pretty text-fd-foreground">
                  {PERSON_B.body}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-kp-accent-border pt-2.5 pl-2.5">
              <FoldMark
                size={11}
                halfToneOpacity={0.6}
                className="mt-0.5 shrink-0 text-kp-accent-text"
              />
              <div>
                <span className="font-mono text-[9px] tracking-wide text-kp-accent-text uppercase">
                  agent
                </span>
                <p className="mt-0.5 text-[11.5px] leading-snug text-pretty text-fd-foreground">
                  {AGENT_REPLY}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── A typewriter comment body. The FULL text is rendered invisibly to RESERVE its final height
   (so the thread card never grows line-by-line as characters arrive — zero in-card jump), and the
   typed slice is overlaid on top with a blinking caret while it's mid-type. ── */
function TypingBody({ full, typed }: { full: string; typed: string }) {
  const typing = typed.length > 0 && typed.length < full.length;
  return (
    <p className="relative mt-0.5 text-[12px] leading-snug text-pretty text-fd-foreground">
      {/* Height reserver — invisible, but lays out the full final paragraph. */}
      <span className="invisible block" aria-hidden>
        {full}
      </span>
      {/* The visible typed slice, overlaid so it shares the reserved box exactly. */}
      <span className="absolute inset-0 block">
        {typed}
        <span className={`kp-loop-caret ${typing ? "is-typing" : ""}`} aria-hidden />
      </span>
    </p>
  );
}

/* ── A FigJam-style multiplayer cursor: an inline pointer SVG tinted to `hueVar`, with a trailing
   rounded name tag (matching hue, `inkVar` text). Positioned by fractional fx/fy of the board box;
   moving those props animates the glide via a CSS transition on left/top. A click = a quick
   scale-down + a ripple ring. Decorative; pointer-events:none so it never blocks the board. ── */
function Cursor({
  name,
  hueVar,
  inkVar,
  fx,
  fy,
  visible,
  clicked,
}: {
  name: string;
  hueVar: string;
  inkVar: string;
  fx: number;
  fy: number;
  visible: boolean;
  clicked: boolean;
}) {
  return (
    <span
      className={`kp-loop-cursor ${visible ? "is-visible" : ""} ${clicked ? "is-clicked" : ""}`}
      style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, ["--kp-cur" as string]: hueVar }}
    >
      {/* The click ripple — a ring that fires once on click. */}
      <span className="kp-loop-cursor-ripple" />
      {/* Pointer glyph — filled with the cursor hue, hairline light stroke for contrast. */}
      <svg
        viewBox="0 0 16 16"
        width={18}
        height={18}
        fill="none"
        aria-hidden
        className="kp-loop-cursor-arrow"
      >
        <path
          d="M2 1.5 13 7.2 8.1 8.4 6.6 13.5 2 1.5Z"
          fill="var(--kp-cur)"
          stroke="var(--color-fd-background)"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </svg>
      {/* Trailing name tag — multiplayer flag, matching hue. */}
      <span className="kp-loop-cursor-tag" style={{ background: hueVar, color: inkVar }}>
        {name}
      </span>
    </span>
  );
}

/* A tiny inline check glyph (currentColor) — no icon dependency, no emoji. */
function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Scene CSS — single-class selectors only (the build flattens descendant combinators in this
   page's CSS layer), all token-driven, with a HARD reduced-motion gate. Lives inline so the scene
   ships its own keyframes without touching the global sheet. The thread card + pins are absolutely
   positioned and animate via opacity/transform only — never via layout-affecting properties — so
   the fixed-height stage has ZERO layout shift across the whole loop. ── */
const SCENE_CSS = `
.kp-loop-stage {
  /* A generous fixed gutter under the board reserves room for the absolute thread card so its
     bottom edge never clips, while the stage height itself stays constant across the loop. */
}

/* ── Multiplayer cursors. The wrapper is parked at its left/top % and TRANSITIONS those props to
   glide between off-frame and node. Visibility + click are driven by inherited CSS vars
   (--cur-show / --cur-click) so child glyph/tag/ripple react without any descendant state-class
   combinator. The pointer tip sits at the anchor; the tag trails below-right. ── */
.kp-loop-cursor {
  position: absolute;
  z-index: 25;
  --cur-show: 0;
  --cur-click: 0;
  opacity: var(--cur-show);
  transform: translate(-2px, -2px) scale(calc(0.86 + 0.14 * var(--cur-show)));
  transform-origin: top left;
  transition: left 850ms cubic-bezier(0.22, 0.61, 0.36, 1),
    top 850ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 240ms ease, transform 200ms ease;
  pointer-events: none;
}
.kp-loop-cursor.is-visible { --cur-show: 1; }
.kp-loop-cursor.is-clicked { --cur-click: 1; }

.kp-loop-cursor-arrow {
  display: block;
  filter: drop-shadow(0 1px 2px color-mix(in oklab, var(--kp-cur) 35%, transparent));
  /* A quick press dip on click: scale down a touch while --cur-click is 1. */
  transform: scale(calc(1 - 0.16 * var(--cur-click)));
  transform-origin: top left;
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.kp-loop-cursor-tag {
  position: absolute;
  left: 14px;
  top: 15px;
  white-space: nowrap;
  border-radius: 7px;
  padding: 2px 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--kp-cur) 50%, transparent);
}

.kp-loop-cursor-ripple {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 26px;
  height: 26px;
  margin: -13px 0 0 -13px;
  border-radius: 9999px;
  border: 1.5px solid var(--kp-cur);
  /* Drawn from the click var: expands + fades as --cur-click goes 0 → 1. */
  opacity: calc(0.55 * var(--cur-click));
  transform: scale(calc(0.3 + 1.1 * var(--cur-click)));
  transition: opacity 520ms ease-out, transform 520ms ease-out;
  pointer-events: none;
}

.kp-loop-pin {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.4);
  transform-origin: bottom left;
  transition: opacity 260ms ease, transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 300ms ease, border-color 300ms ease, color 300ms ease;
}

/* ── Typewriter caret — a thin blinking bar that shows only while a comment is mid-type. ── */
.kp-loop-caret {
  display: inline-block;
  width: 1px;
  height: 1em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--kp-accent-text);
  opacity: 0;
}
.kp-loop-caret.is-typing {
  opacity: 1;
  animation: kp-loop-caret 0.9s step-end infinite;
}
@keyframes kp-loop-caret {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.kp-loop-pin.is-dropped {
  opacity: 1;
  transform: translate(-50%, -100%) scale(1);
}

.kp-loop-thread {
  left: 50%;
  bottom: clamp(12px, 2vw, 24px);
  width: 270px;
  margin-left: -135px;
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transform-origin: center bottom;
  transition: opacity 320ms ease, transform 360ms cubic-bezier(0.34, 1.4, 0.64, 1);
  pointer-events: none;
}
.kp-loop-thread.is-open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.kp-loop-msg {
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 300ms ease, transform 300ms ease;
}
.kp-loop-msg.is-in {
  opacity: 1;
  transform: none;
}

.kp-loop-send {
  transition: transform 200ms ease, filter 200ms ease;
}
.kp-loop-send.is-pressed {
  transform: scale(0.95);
  filter: brightness(1.08);
}

.kp-loop-dots span {
  display: inline-block;
  animation: kp-loop-dots 1.1s ease-in-out infinite;
}
.kp-loop-dots span:nth-child(2) { animation-delay: 0.16s; }
.kp-loop-dots span:nth-child(3) { animation-delay: 0.32s; }
@keyframes kp-loop-dots {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}

.kp-loop-reply { animation: kp-loop-reply 360ms ease-out; }
@keyframes kp-loop-reply {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

.kp-loop-shimmer {
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    100deg,
    transparent 35%,
    color-mix(in oklab, var(--kp-accent) 14%, transparent) 50%,
    transparent 65%
  );
  background-size: 220% 100%;
  background-position: 130% 0;
  transition: opacity 300ms ease;
}
.kp-loop-shimmer.is-on {
  opacity: 1;
  animation: kp-loop-shimmer 1.5s ease-in-out infinite;
}
@keyframes kp-loop-shimmer {
  from { background-position: 130% 0; }
  to { background-position: -30% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .kp-loop-pin {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
    transition: none;
  }
  .kp-loop-thread {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .kp-loop-msg {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .kp-loop-send { transition: none; }
  .kp-loop-dots span { animation: none; }
  .kp-loop-reply { animation: none; }
  .kp-loop-shimmer { animation: none; opacity: 0; }
  /* No cursors, no glide, no caret blink — the static frame shows the resolved end state only. */
  .kp-loop-cursor { display: none; }
  .kp-loop-caret { display: none; }
}
`;
