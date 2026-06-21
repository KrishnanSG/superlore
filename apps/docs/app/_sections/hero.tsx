"use client";

/**
 * Hero — the landing's locked centrepiece (the ONLY centered section).
 *
 * The pitch leads with the moat: your agents already write the docs — superlore gives them a toolkit of
 * rich, ready-made components (canvases, boards, timelines, decision records) so they author a real,
 * structured company knowledge base instead of walls of Markdown. The "humans AND agents read it"
 * framing is deliberately NOT the headline (it's said once, in the closing tagline); the centrepiece
 * is the `<SurfaceMarquee>` — a full-bleed, edge-scrolling shelf of live document surfaces that shows
 * the breadth of what gets authored, all from one repo of `.mdx`.
 *
 * All colour flows through the global.css token bridge / `color-mix(... var(--kp-*) ...)`; no raw hex,
 * no theme branching in JS. Backdrop reuses the established `.kp-hero-grid` + `.kp-hero-aurora` ambient
 * with a local token-derived grain filter over the glow to kill banding.
 */

import { useId } from "react";
import { Eye } from "lucide-react";

import { HeroSplit } from "./hero-split";

export function Hero() {
  const grainId = useId().replace(/[:]/g, "");

  return (
    <section className="relative overflow-hidden border-b border-fd-border bg-fd-background">
      {/* Backdrop: token-grid + violet aurora, with a local grain filter over the glow. */}
      <div aria-hidden className="kp-hero-grid" />
      <div aria-hidden className="kp-hero-aurora" />
      <svg aria-hidden className="pointer-events-none absolute size-0">
        <filter id={`grain-${grainId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-overlay"
        style={{ filter: `url(#grain-${grainId})` }}
      />
      {/* Lit top hairline — accent fading to transparent. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--kp-accent) 55%, transparent), transparent)",
        }}
      />

      {/* Editorial header — the one centered block on the page. Kept compact so the marquee
          centrepiece rises into the initial viewport (visual peeks above the fold). */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-16 pb-6 text-center sm:pt-16">
        <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-kp-accent-text uppercase">
          Your company&apos;s corpus
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-[-0.025em] text-balance text-fd-foreground sm:text-[3.5rem] sm:leading-[1.04]">
          The company knowledge base
          <br className="hidden sm:block" /> your agents{" "}
          <span className="text-kp-accent-text">run on</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-[42rem] text-base leading-relaxed text-pretty text-fd-muted-foreground sm:text-lg">
          Your agents turn specs, transcripts, and brainstorms into rich, structured docs —
          canvases, boards, timelines — that compound into one company knowledge base every agent
          can read over MCP.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a className="kp-btn kp-btn-primary" href="/docs/getting-started">
            Get started
          </a>
          <a className="kp-btn kp-btn-secondary" href="/viewer">
            <Eye className="size-4" />
            Try the Viewer
          </a>
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-wide text-fd-muted-foreground">
          Open source · MCP-native · Deploy anywhere
        </p>
      </div>

      {/* The centrepiece: one authored doc shown as two faces — the human render and the typed
          context an agent reads. The framed artifact peeks above the fold to invite scroll. */}
      <div className="relative z-10 pb-16 sm:pb-20">
        <HeroSplit />
      </div>
    </section>
  );
}
