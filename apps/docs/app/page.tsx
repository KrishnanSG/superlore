import type { Metadata } from "next";
import { superlore } from "@/superlore.config";

import { TopBar, Footer } from "./_chrome";
import { Hero } from "./_sections/hero";
import { WhySuperlore } from "./_sections/why-superlore";
import { TheTurn } from "./sections/the-turn";
import { ContractFork } from "./sections/contract-fork";
import { BreadthSection } from "./sections/breadth-strip";
import { ReleaseSurface } from "./sections/release-surface";
import { KBSurface } from "./sections/kb-surface";
import { EditLoop } from "./sections/edit-loop";
import { MachineFacePanel } from "./_sections/machine-face";
import { Voices } from "./_sections/voices";
import { CloseBand } from "./_sections/close-band";

export const metadata: Metadata = {
  title: "superlore — the company knowledge base your agents run on",
  description: superlore.description,
};

/* ──────────────────────────────────────────────────────────────────── grain ──
   One hidden inline SVG grain filter near root — referenced by `filter: url(#kp-grain)`
   over the page's glows to kill banding. feTurbulence, numOctaves 3, saturate 0. */
function GrainFilter() {
  return (
    <svg aria-hidden width={0} height={0} className="pointer-events-none absolute">
      <filter id="kp-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────── page ── */

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <GrainFilter />
      <TopBar />
      <main className="flex-1">
        {/* The narrative stack. Section rhythm alternates bg-fd-background ↔ bg-fd-muted/40 — the
            surface step IS the divider (no horizontal rules). Self-painting sections keep their
            own background; contained sections (TheTurn, ReleaseSurface) get theirs from a wrapper. */}

        {/* 1 · Hero — header + the split-view centrepiece (one doc, two faces). The only centered
            section; paints bg-fd-background. */}
        <Hero />

        {/* 2 · One surface — BreadthSection, right after the hero: what it is → how much it covers.
            The enlarged scrolling shelf of every kind of company surface. Self-paints bg-fd-muted/40
            + own borders (the step down from the hero's bg-fd-background). */}
        <BreadthSection />

        {/* 3 · Why superlore — the founder story / pain / vision (the creator section). Steps back to
            bg-fd-background, with a subtle violet aura behind it (content sits at z-10). */}
        <div className="relative overflow-hidden bg-fd-background">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[460px]"
            style={{
              background:
                "radial-gradient(60% 70% at 78% 0%, color-mix(in oklab, var(--kp-accent) 13%, transparent), transparent 72%)",
            }}
          />
          <WhySuperlore />
        </div>

        {/* 4 · Voices — social proof early. Steps to bg-fd-muted/40. */}
        <div className="bg-fd-muted/40">
          <Voices />
        </div>

        {/* 5 · The Turn — WallToCanvas. Border-t divides it; self-paints bg-fd-background. */}
        <div className="border-t border-fd-border bg-fd-background">
          <TheTurn />
        </div>

        {/* 5 · Dual representation — ContractFork. Self-paints bg-fd-muted/40 (the step). */}
        <ContractFork />

        {/* 6 · Use case · product docs — ReleaseSurface. Contained; wrapper sets bg-fd-background (the step). */}
        <div className="bg-fd-background">
          <ReleaseSurface />
        </div>

        {/* 6 · Use case · company KB — KBSurface. Self-paints bg-fd-muted/40 (the step). */}
        <KBSurface />

        {/* 7 · The loop — EditLoop. Self-paints bg-fd-background (the step). */}
        <EditLoop />

        {/* 8 · The machine face — MachineFacePanel. Self-paints bg-fd-muted/40 + border-t (the step). */}
        <MachineFacePanel />

        {/* 10 · Own it (close) — CloseBand. Self-paints bg-fd-muted + carries its own GitHub-star band. */}
        <CloseBand />
      </main>
      <Footer />
    </div>
  );
}
