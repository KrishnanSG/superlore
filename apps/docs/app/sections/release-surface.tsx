"use client";

/**
 * ReleaseSurface — USE CASE · PRODUCT DOCS & RELEASES.
 *
 * "Release notes that show what changed — not just tell." A live superlore release page mocked inside
 * a slim browser-ish frame (top bar + faint mono URL pill, no OS chrome), laid out chess-style:
 * the visual document on the LEFT, the editorial copy on the RIGHT (~440px text column).
 *
 * The document is the REAL thing — a real `<Canvas bare spec={systemSpec}>` architecture diagram,
 * the REAL `<Releases>`/`<Release>` changelog over a typed `ReleaseChangeInput[]`, and a real
 * `<Timeline>` rollout — not a screenshot. The diagram still auto-cycles its nodes (`useTrace`
 * drives a token-driven accent ring on the diagram container + a live node readout, with NO drawn
 * line); the row-level hover-trace binding is gone (the changelog is now the shared component).
 *
 * The body is HEIGHT-CAPPED with a bottom mask fade + a `--color-fd-card`→transparent halo overlay
 * and a low `color-mix(... var(--kp-accent) …)` radial at the fade line, so it reads "there's more"
 * — not clipped. Reduced-motion is gated inside the shared primitives (`useTrace`, `Reveal`); the
 * mask/halo are alpha-only or token color-mix, theme-equal, no JS theme/motion branching here.
 *
 * Tokens only: every colour comes from the global.css bridge or `color-mix(... var(--kp-accent) ...)`
 * (the bottom mask uses alpha-only `#000`, which is theme-irrelevant).
 */

import { Canvas, Releases, Release, Timeline } from "superlore";
import { systemSpec, systemNodeIds, milestoneTimeline, linksApiReleaseChanges } from "../_data";
import { useTrace } from "../_use-trace";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

/** Human node labels, read straight from the shared spec so the readout never drifts. */
const nodeLabel: Record<string, string> = Object.fromEntries(
  (systemSpec.nodes ?? []).map((n) => [n.id, n.label ?? n.id]),
);

export function ReleaseSurface() {
  // The diagram auto-cycles its nodes; `activeId` lights the diagram container's accent ring and
  // the live node readout. No row binding any more — the changelog is the real `<Releases>`.
  const { activeId, setActiveId } = useTrace(systemNodeIds, { intervalMs: 2600 });

  return (
    <Reveal as="section" className="px-6 py-[clamp(56px,10vw,128px)]">
      {/* Scoped, self-contained fade CSS — alpha-only `#000` mask (theme-irrelevant) plus a
          token-driven halo + low accent radial at the fade line so the capped body reads "more
          below," not clipped. No JS theme/motion branch. */}
      <style>{`
        .rs-window {
          position: relative;
          max-height: clamp(420px, 52vh, 560px);
          overflow: hidden;
        }
        .rs-window > .rs-body {
          -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent);
                  mask-image: linear-gradient(to bottom, #000 78%, transparent);
        }
        /* Halo overlay: the card surface dissolving up into transparent, plus a low accent radial
           seated at the fade line — "lit from within," lots of headroom below. */
        .rs-window > .rs-halo {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: 38%;
          pointer-events: none;
          background:
            radial-gradient(
              120% 80% at 50% 100%,
              color-mix(in oklab, var(--kp-accent) 9%, transparent),
              transparent 70%
            ),
            linear-gradient(to top, var(--color-fd-card), transparent);
        }
      `}</style>

      <div className="mx-auto grid max-w-6xl items-center gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_440px]">
        {/* ─────────────────────────────────────────── Visual: the live release page mock ── */}
        <div className="relative order-2 lg:order-1" onPointerLeave={() => setActiveId(null)}>
          {/* Browser-ish frame — top bar + faint mono URL pill, no OS chrome. */}
          <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
            <div className="flex items-center gap-3 border-b border-fd-border bg-fd-muted/50 px-3 py-2">
              <FoldMark size={14} className="shrink-0 text-kp-accent-text" />
              <div className="flex min-w-0 flex-1 items-center rounded-md border border-fd-border bg-fd-background px-2.5 py-1">
                <span className="truncate font-mono text-[11px] text-fd-muted-foreground">
                  your-kb.dev/docs/releases/links-api-2.4
                </span>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-md border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 font-mono text-[10px] font-medium text-kp-accent-text sm:inline-flex">
                Readable by agents
              </span>
            </div>

            {/* Page body — height-capped window: a bottom mask fade + halo overlay reads "there's
                more below," not clipped. Content column + right-rail TOC inside (chess in chess). */}
            <div className="rs-window">
              <div className="rs-body grid gap-x-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_148px]">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                    Release · 2.4
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fd-foreground">
                    Links API 2.4
                  </h1>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-fd-muted-foreground">
                    Tighter rate limits at the edge, a cache-first redirect path, and a wider key
                    space. The architecture below is the same typed graph a support agent queries.
                  </p>

                  {/* The architecture diagram — a real Canvas, shown on every breakpoint (on a phone
                      the board IS the message; it fits-to-width and scrolls if needed). While a node
                      is traced, its container picks up a subtle accent ring. Desktop (≥lg) unchanged. */}
                  <div className="relative mt-5">
                    <h2
                      id="architecture"
                      className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase"
                    >
                      Architecture
                    </h2>
                    <div
                      className="mt-2 overflow-x-auto rounded-lg border bg-fd-background p-1.5 transition-colors"
                      style={{
                        borderColor: activeId
                          ? "var(--kp-accent-border)"
                          : "var(--color-fd-border)",
                        boxShadow: activeId
                          ? "0 0 0 1px color-mix(in oklab, var(--kp-accent) 30%, transparent)"
                          : "none",
                      }}
                    >
                      <Canvas bare spec={systemSpec} height={260} />
                    </div>
                    {/* Active-node readout — the live cross-highlight, derived from the shared trace. */}
                    <div className="mt-2 flex h-5 items-center gap-2">
                      {activeId ? (
                        <>
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-kp-accent"
                            style={{
                              boxShadow:
                                "0 0 0 3px color-mix(in oklab, var(--kp-accent) 22%, transparent)",
                            }}
                          />
                          <span className="font-mono text-[11px] text-kp-accent-text">
                            {activeId} · {nodeLabel[activeId]}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-[11px] text-fd-muted-foreground">
                          Tracing the live architecture graph
                        </span>
                      )}
                    </div>
                  </div>

                  {/* The changelog — the REAL `<Releases>`/`<Release>` over a typed
                      `ReleaseChangeInput[]`: the human reads the entries, the agent gets
                      `{ kind:"release", changes:[{ type, text }] }` from the same source. */}
                  <h2
                    id="changelog"
                    className="mt-7 font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase"
                  >
                    Changelog
                  </h2>
                  <Releases label="Links API 2.4 changelog">
                    <Release
                      version="2.4"
                      date="2026-06-15"
                      status="done"
                      changes={linksApiReleaseChanges}
                    />
                  </Releases>

                  {/* The rollout — a real Timeline, the canonical dual-rep component. It can partially
                      fade into the bottom mask — the intended "more below" cue. */}
                  <h2
                    id="rollout"
                    className="mt-7 font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase"
                  >
                    Rollout
                  </h2>
                  <Timeline items={milestoneTimeline} label="Links API 2.4 rollout" />
                </div>

                {/* Right-rail TOC — the on-page nav of a real doc. */}
                <nav
                  aria-label="On this page"
                  className="hidden border-l border-fd-border pl-4 lg:block"
                >
                  <p className="font-mono text-[10px] tracking-wide text-fd-muted-foreground uppercase">
                    On this page
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[12px]">
                    {[
                      { href: "#architecture", label: "Architecture" },
                      { href: "#changelog", label: "Changelog" },
                      { href: "#rollout", label: "Rollout" },
                    ].map((t) => (
                      <li key={t.href}>
                        <a
                          href={t.href}
                          className="text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:rounded focus-visible:ring-2 focus-visible:ring-kp-accent focus-visible:outline-none"
                        >
                          {t.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Halo overlay at the fade line — `--color-fd-card`→transparent + a low accent
                  radial, so the capped body reads "there's more," not clipped. */}
              <div aria-hidden className="rs-halo" />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────── Text column (~440px) ──
            Sticky + self-start so it sits balanced (vertically centered against the viewport)
            beside the now height-capped left mock, instead of a tall-left / short-right mismatch. */}
        <div className="order-1 max-w-[440px] self-start lg:sticky lg:top-24 lg:order-2">
          <p className="font-mono text-[12px] tracking-wide text-kp-accent-text uppercase">
            Use case · Product docs &amp; releases
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fd-foreground sm:text-[2rem]">
            Release notes that show what changed — not just tell.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-fd-muted-foreground">
            A release page with a native architecture diagram and a changelog that&apos;s an actual
            timeline. The diagram an engineer reads is the typed graph a support agent queries —
            from one MDX source, no second authoring step.
          </p>

          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-fd-muted-foreground">
            <li className="flex gap-3">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-kp-accent" />
              <span>
                Every change is <span className="text-fd-foreground">typed</span> (added · changed ·
                fixed · security) so an agent can answer &ldquo;what shipped in 2.4?&rdquo; without
                parsing prose.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-kp-accent" />
              <span>
                The changelog is a real <span className="text-fd-foreground">Releases</span> stack,
                the diagram a real <span className="text-fd-foreground">Canvas</span> — both
                serialize for agents.
              </span>
            </li>
          </ul>

          <p className="mt-7 inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-muted/40 px-3 py-1.5">
            <FoldMark size={13} className="shrink-0 text-kp-accent-text" />
            <span className="font-mono text-[11px] text-fd-muted-foreground">
              This is a live superlore page, not a screenshot.
            </span>
          </p>
        </div>
      </div>
    </Reveal>
  );
}
