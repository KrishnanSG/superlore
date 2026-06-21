"use client";

/**
 * ContractFork — the DUAL REPRESENTATION section.
 *
 * The one place on the landing that restates the moat literally: a single authored `superlore-canvas`
 * fenced block forks — via one DETERMINISTIC static connector — into a HUMAN lane (a live
 * `<Canvas bare>`) and an AGENT lane (the typed `{ nodes, edges }` graph the MCP serves). Both lanes
 * are derived from the SAME `systemSpec` / `systemGraph()` in `_data`, so they are provably one
 * object, not a second, drifting mock-up.
 *
 * The fork connector is a fractional-coordinate inline SVG (`viewBox 0 0 100 100`,
 * `preserveAspectRatio="none"`) drawn in the spacer gap — it self-aligns to the gap and can't drift
 * (no getBoundingClientRect, no ResizeObserver). `useTrace` wires bidirectional cross-highlight:
 * hovering/focusing a JSON node row lights the matching shape (and vice-versa). All colour comes
 * from tokens; `prefers-reduced-motion` is gated inside useTrace (static end-state, hover still links).
 */
import { useCallback, useEffect, useState } from "react";
import { Canvas } from "superlore";
import { systemSpec, systemGraph, systemNodeIds, type SystemGraphNode } from "../_data";
import { useTrace } from "../_use-trace";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

const SPEC_SOURCE = JSON.stringify(systemSpec, null, 2);

/** A copy-to-clipboard control for the fenced source block; resets its "Copied" state after a tick. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, [text]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy source to clipboard"}
      className="rounded-md border border-fd-border bg-fd-background px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-fd-muted-foreground uppercase transition-colors hover:border-kp-accent-border hover:text-kp-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kp-accent-text"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ContractFork() {
  const graph = systemGraph();
  const { activeId, setActiveId, bind } = useTrace(systemNodeIds);

  const onLeave = useCallback(() => setActiveId(null), [setActiveId]);

  return (
    <Reveal as="section" className="bg-fd-muted/40">
      <div className="mx-auto w-full max-w-6xl px-6 py-[clamp(80px,10vw,128px)]">
        {/* Editorial head — left-aligned, mono eyebrow + tight h2 + ≤640px deck. */}
        <div className="max-w-[640px]">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.18em] text-kp-accent-text uppercase">
            <FoldMark size={13} className="text-kp-accent-text" />
            Dual representation
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-balance text-fd-foreground">
            Every component renders for people and serializes for agents.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-pretty text-fd-muted-foreground">
            Write one MDX block. It becomes a human surface <em>and</em> a clean, typed node/edge
            graph — no second authoring step, no drift. The board on the left{" "}
            <span className="text-fd-foreground">is</span> the graph on the right.
          </p>
        </div>

        {/* The fork: source block → HUMAN lane + AGENT lane, with one static connector between. */}
        <div
          onPointerLeave={onLeave}
          className="relative mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,0.86fr)_2.25rem_minmax(0,1.05fr)] lg:gap-0"
        >
          {/* ── Authored source — the one superlore-canvas block both lanes come from. ── */}
          <div className="relative z-10 self-center lg:pr-2">
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
              <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
                  superlore-canvas
                </span>
                <span className="ml-auto">
                  <CopyButton text={SPEC_SOURCE} />
                </span>
              </div>
              <pre className="max-h-[300px] overflow-auto bg-fd-background px-3.5 py-3 font-mono text-[11.5px] leading-[1.55] text-fd-foreground">
                <code>{SPEC_SOURCE}</code>
              </pre>
            </div>
            <p className="mt-2 px-1 font-mono text-[10.5px] tracking-wide text-fd-muted-foreground">
              one authored block
            </p>
          </div>

          {/* Static fork connector (desktop only). Fractional viewBox + preserveAspectRatio="none"
              means the coordinates self-align to the spacer's measured box — no JS measurement, so
              it can never drift. Splits the source side (x=0, y=50) up to the HUMAN lane (y≈26) and
              down to the AGENT lane (y≈74). The agent path picks up a faint accent while a node is
              traced (the JSON rows on the right are what light up). */}
          <div aria-hidden className="relative hidden self-stretch lg:block">
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden size-full lg:block"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0 50 C 50 50, 50 26, 100 26"
                stroke="var(--kp-border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 0 50 C 50 50, 50 74, 100 74"
                stroke="var(--kp-border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 0 50 C 50 50, 50 74, 100 74"
                stroke="color-mix(in oklab, var(--kp-accent) 55%, transparent)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{
                  opacity: activeId ? 1 : 0,
                  transition: "opacity 200ms linear",
                }}
              />
            </svg>
          </div>

          {/* ── The two faces of that one block. ── */}
          <div className="relative z-10 flex flex-col gap-6 lg:pl-2">
            {/* HUMAN lane — live Canvas. DESKTOP-ONLY: the landscape board reads cut/tiny on phones,
                so it is hidden < lg and a compact, legible caption card stands in (sibling lg:hidden).
                The agent ROWS below stay on both. Desktop (≥lg) is unchanged. */}
            <div className="hidden overflow-hidden rounded-xl border border-fd-border bg-fd-card lg:block">
              <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
                  Human · rendered
                </span>
              </div>
              <div className="bg-fd-background p-1.5">
                <Canvas bare spec={systemSpec} height={232} />
              </div>
            </div>

            {/* MOBILE-ONLY human-lane stand-in — a simple caption card (no cut board). */}
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card lg:hidden">
              <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
                  Human · rendered
                </span>
              </div>
              <div className="flex flex-col gap-2 bg-fd-background px-3.5 py-4">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-kp-accent-text">
                  Canvas
                </span>
                <p className="text-[13.5px] leading-relaxed text-pretty text-fd-foreground">
                  A live, interactive board your team reads — the very same nodes and edges your
                  agents read below.
                </p>
              </div>
            </div>

            {/* AGENT lane — the typed graph the MCP serves, agent-gradient hairline + pill. */}
            <div className="relative overflow-hidden rounded-xl border border-fd-border bg-fd-card">
              <span
                aria-hidden
                className="kp-agent-gradient absolute inset-x-0 top-0 h-0.5 opacity-90"
              />
              <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/60 px-3 py-2">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
                  Agent · get_component_data
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 font-mono text-[9.5px] font-medium tracking-wide text-kp-accent-text uppercase">
                  <FoldMark size={9} halfToneOpacity={0.6} className="text-kp-accent-text" />
                  Readable by agents
                </span>
              </div>
              {/* Per-node rows derived from systemGraph(); each is trace-bound + cross-lit. */}
              <ul className="divide-y divide-fd-border bg-fd-background font-mono text-[11.5px] leading-relaxed">
                {graph.graph.nodes.map((n: SystemGraphNode) => {
                  const active = activeId === n.id;
                  return (
                    <li
                      key={n.id}
                      {...bind(n.id)}
                      data-node-id={n.id}
                      data-active={active}
                      className={`flex cursor-default items-baseline gap-2 px-3.5 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-kp-accent-text focus-visible:ring-inset ${
                        active ? "bg-kp-accent-weak text-fd-foreground" : "text-fd-muted-foreground"
                      }`}
                    >
                      <span className={active ? "text-kp-accent-text" : "text-fd-foreground"}>
                        {JSON.stringify(n)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
