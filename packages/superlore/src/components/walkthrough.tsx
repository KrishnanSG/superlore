"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Canvas } from "./canvas";
import { parseCanvasSpec } from "./canvas/parse-spec";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { DiagramNode, RelKind } from "../knowledge/primitives";

/**
 * superlore Walkthrough — a stepped, auto-playing "concept animation". Each step is a superlore Canvas
 * state, so the same authored data renders a beautiful walkthrough for humans AND serializes the
 * ordered narrative (step titles, captions, and the typed graph of each state) for the MCP. Unlike
 * a screen recording or a hand-built animation, an agent reading this gets the steps as structured
 * knowledge, not a video to interpret.
 */
export interface WalkthroughStep {
  /** Short tab label for the step. */
  title: string;
  /** One-line explanation shown under the board for this step. */
  caption?: string;
  /** The superlore Canvas spec rendered for this step (object). */
  spec: unknown;
}

export interface WalkthroughProps {
  /** A heading shown in the player chrome (e.g. the concept being explained). */
  label?: string;
  steps?: WalkthroughStep[];
  /** A walkthrough authored as a JSON string (`{ label, steps }`) — the agent-authoring path. */
  json?: string;
  /** Milliseconds each step holds before auto-advancing (default 5200). */
  interval?: number;
  /** Start playing when scrolled into view (default true). */
  autoplay?: boolean;
  /** Board height in px (default 360). */
  height?: number;
}

interface Parsed {
  label?: string;
  steps: WalkthroughStep[];
  interval: number;
  autoplay: boolean;
  height: number;
}

function parse(p: WalkthroughProps): Parsed | null {
  let label = p.label;
  let steps = p.steps;
  if (!steps && p.json) {
    try {
      const obj = JSON.parse(p.json) as { label?: string; steps?: WalkthroughStep[] };
      label = label ?? obj.label;
      steps = obj.steps;
    } catch {
      return null;
    }
  }
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return {
    label,
    steps,
    interval: p.interval ?? 5200,
    autoplay: p.autoplay ?? true,
    height: p.height ?? 360,
  };
}

export function Walkthrough(props: WalkthroughProps) {
  const parsed = useMemo(() => parse(props), [props]);
  const [active, setActive] = useState(0);
  // The author's autoplay intent is the initial state; the play/pause button toggles it. Whether it
  // actually runs is derived in `live` (also gated on in-view + reduced-motion), so no setState-in-
  // effect is needed.
  const [playing, setPlaying] = useState<boolean>(props.autoplay ?? true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Only play while on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => setInView(es[0]?.isIntersecting ?? false), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const count = parsed?.steps.length ?? 0;
  const live = playing && inView && !reduced && count > 1;

  // Auto-advance.
  useEffect(() => {
    if (!live || !parsed) return;
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % parsed.steps.length),
      parsed.interval,
    );
    return () => window.clearInterval(id);
  }, [live, parsed, active]);

  if (!parsed) {
    return (
      <div className="not-prose my-6 rounded-xl border border-[color-mix(in_oklab,var(--kp-danger)_50%,var(--color-fd-border))] bg-[color-mix(in_oklab,var(--kp-danger)_8%,var(--color-fd-card))] p-4 text-sm text-fd-foreground">
        Invalid <code className="font-mono">Walkthrough</code> — expected{" "}
        <code className="font-mono">steps</code> (each with a{" "}
        <code className="font-mono">title</code> and a canvas{" "}
        <code className="font-mono">spec</code>).
      </div>
    );
  }

  const { label, steps, interval, height } = parsed;
  const goTo = (i: number) => {
    setActive(((i % count) + count) % count);
    setPlaying(false); // a manual move pauses autoplay; the user is driving now
  };

  return (
    <section ref={rootRef} className="kp-walk not-prose my-6" aria-roledescription="walkthrough">
      <div className="kp-walk-head">
        {label && <span className="kp-walk-label">{label}</span>}
        <span className="kp-walk-spacer" />
        <span className="kp-walk-count" aria-live="polite">
          {active + 1} / {count}
        </span>
        {count > 1 && (
          <button
            type="button"
            className="kp-walk-play"
            aria-pressed={live}
            aria-label={live ? "Pause walkthrough" : "Play walkthrough"}
            onClick={() => setPlaying((p) => !p)}
          >
            {live ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        )}
      </div>

      <div className="kp-walk-progress" data-playing={live}>
        <div
          key={`${active}-${live}`}
          className="kp-walk-progress-fill"
          style={{
            animationDuration: `${interval}ms`,
            animationPlayState: live ? "running" : "paused",
          }}
        />
      </div>

      <div className="kp-walk-stage" style={{ height }}>
        {steps.map((s, i) => (
          <div
            key={i}
            className="kp-walk-pane"
            data-active={i === active}
            aria-hidden={i !== active}
          >
            <Canvas spec={s.spec} bare height={height} />
          </div>
        ))}
      </div>

      <div className="kp-walk-caption-wrap">
        {steps.map((s, i) => (
          <p key={i} className="kp-walk-caption" data-active={i === active}>
            {s.caption}
          </p>
        ))}
      </div>

      {count > 1 && (
        <div className="kp-walk-foot">
          <button
            type="button"
            className="kp-walk-nav"
            aria-label="Previous step"
            onClick={() => goTo(active - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="kp-walk-tabs" role="tablist">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-current={i === active}
                className="kp-walk-tab"
                data-active={i === active}
                onClick={() => goTo(i)}
              >
                {s.title}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="kp-walk-nav"
            aria-label="Next step"
            onClick={() => goTo(active + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- knowledge face --- */

const stepSchema = z.object({
  title: z.string(),
  caption: z.string().optional(),
  spec: z.unknown(),
});

registerKnowledge("Walkthrough", {
  schema: z.object({
    label: z.string().optional(),
    steps: z.array(stepSchema).optional(),
    json: z.string().optional(),
    interval: z.number().optional(),
    autoplay: z.boolean().optional(),
    height: z.number().optional(),
  }),
  toKnowledge: (p: WalkthroughProps, ctx: ExtractCtx) => {
    const parsed = parse(p);
    const steps = parsed?.steps ?? [];
    // The narrative, queryable as text: "1. <title> — <caption>; …".
    const summary = steps
      .map((s, i) => `${i + 1}. ${s.title}${s.caption ? ` — ${s.caption}` : ""}`)
      .join("  ");
    // The canonical graph is the final state (where the walkthrough lands).
    let graph: DiagramNode["graph"] = { nodes: [], edges: [] };
    let refs: DiagramNode["refs"];
    const last = steps[steps.length - 1];
    if (last) {
      try {
        const canvas = parseCanvasSpec(last.spec);
        graph = {
          nodes: canvas.nodes.map((n) => ({
            id: n.id,
            label: n.label,
            group: n.group,
            kind: n.kind,
          })),
          edges: canvas.edges.map((e) => ({ from: e.from, to: e.to, label: e.label, rel: e.rel })),
        };
        refs = canvas.edges
          .filter((e) => e.rel)
          .map((e) => ctx.resolveRef(`#${e.to}`, e.rel as RelKind, e.label));
      } catch {
        /* leave the empty graph */
      }
    }
    return {
      kind: "diagram",
      id: ctx.nextId(parsed?.label ?? "walkthrough"),
      title: parsed?.label,
      summary: summary ? summary.slice(0, 400) : undefined,
      syntax: "walkthrough",
      graph,
      refs,
    } satisfies DiagramNode;
  },
});
