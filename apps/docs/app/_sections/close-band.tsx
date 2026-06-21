"use client";

/**
 * CloseBand — "OWN IT", the landing's quiet closing band (the final section).
 *
 * A calm band on `bg-fd-muted` carrying the resolution of the whole page: the Fold mark does ONE
 * slow fold-open as it scrolls into view (the half-tone / machine face unfolds out from the lit /
 * human face, then rests), the headline "It's MDX in your repo. You own it. Deploy it anywhere.",
 * an open-source / deploy-anywhere / skills sub-line, the tagline "One corpus. Humans and agents."
 * used EXACTLY once, two CTAs (primary "Get started", secondary "Try the Viewer"), a mono trust
 * line, and a minimal footer whose only standing affordance is a GitHub-star link.
 *
 * The fold-open is the section's one motion: a CSS transform on the SVG's machine-face polygon
 * (transform-box: fill-box) driven by an IntersectionObserver-set state flag, with a hard
 * `prefers-reduced-motion` gate (matchMedia) that snaps straight to the rested, fully-open frame —
 * no interval, no transition. A faint Fold-tile texture (brand/superlore-mark-tile.svg as a CSS
 * background data-URI at ~3% opacity) sits behind, masked to fade at the edges.
 *
 * All colour flows through the global.css token bridge / `color-mix(... var(--kp-*) ...)`; no raw
 * hex, no theme branching in JS. Hierarchy via the surface step + 1px borders, not shadows.
 */

import { useEffect, useRef, useState } from "react";
import { Eye, Shield, Star } from "lucide-react";

import { Reveal } from "../reveal";

const GITHUB_URL = "https://github.com/KrishnanSG/superlore";

/* GitHub glyph — lucide v1 dropped the brand icon, so we draw it from the mark path (mirrors
   page.tsx so the footer star reads as the canonical GitHub mark). */
function GitHubGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.85 1.19 3.11 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  );
}

/**
 * FoldOpenMark — the close's bespoke Fold mark: it fold-opens ONCE on scroll-in, then rests.
 *
 * This is intentionally NOT the shared `FoldMark`: that one is a static two-polygon snapshot, and
 * the close needs the machine face to physically unfold from the seam. The half-tone polygon
 * rotates from folded-flat (scaleX 0 about its left/seam edge) to fully open, with a long ease.
 * Reduced-motion snaps to the open frame with no transition. Both polygons fill via currentColor.
 */
function FoldOpenMark({ size = 88, open }: { size?: number; open: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="superlore"
      fill="currentColor"
      className="text-kp-accent-text"
    >
      {/* Lit face — the human view. Always present (the source being folded). */}
      <polygon points="14,20 32,12 32,46 14,54" />
      {/* Half-tone face — the machine's view. Unfolds out from the seam (x=32) on scroll-in. */}
      <polygon
        points="32,12 50,20 50,54 32,46"
        opacity={open ? 0.5 : 0}
        style={{
          transformBox: "fill-box",
          transformOrigin: "left center",
          transform: open ? "scaleX(1)" : "scaleX(0.04)",
          transition: open
            ? "transform 1100ms cubic-bezier(0.16,1,0.3,1) 120ms, opacity 700ms ease 120ms"
            : "none",
        }}
      />
    </svg>
  );
}

export function CloseBand() {
  const sectionRef = useRef<HTMLElement>(null);
  // HARD reduced-motion gate: start in the rested, fully-open frame (no fold-open animation).
  // Read once at mount via a lazy initializer so the effect never has to setState synchronously.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Already open (reduced-motion or revisited) — nothing to observe.
    if (open) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setOpen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open]);

  // The Fold tile (brand/superlore-mark-tile.svg) inlined as a data-URI background at ~3% opacity.
  // The mark polygons use currentColor (set to the accent) so the texture stays token-true and
  // theme-equal; the tile rect is left transparent so it reads on either surface.
  const tile =
    'url("data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
        '<polygon points="14,20 32,12 32,46 14,54" fill="currentColor"/>' +
        '<polygon points="32,12 50,20 50,54 32,46" fill="currentColor" opacity="0.5"/>' +
        "</svg>",
    ) +
    '")';

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-fd-border bg-fd-muted"
    >
      {/* Faint Fold-tile texture — masked to fade at the vertical edges so it never reads as a hard
          grid. currentColor here is the accent, kept very low opacity. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-kp-accent-text opacity-[0.03]"
        style={{
          backgroundImage: tile,
          backgroundRepeat: "repeat",
          backgroundSize: "44px 44px",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, black 22%, black 78%, transparent)",
          maskImage: "linear-gradient(180deg, transparent, black 22%, black 78%, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-[clamp(80px,10vw,128px)]">
        <Reveal>
          {/* Left-aligned editorial block — mono eyebrow, the folding mark, tight h2, ≤640px deck. */}
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-kp-accent-text uppercase">
            Own it
          </p>

          {/* The folding mark sits on its own line above the headline so the whole block shares
              ONE left edge with the eyebrow, tagline, CTAs, and trust line (no inline indent). */}
          <div className="mt-7">
            <FoldOpenMark size={72} open={open} />
          </div>
          <h2 className="mt-6 max-w-[18ch] text-3xl font-semibold tracking-[-0.02em] text-balance text-fd-foreground sm:text-[2.6rem] sm:leading-[1.06]">
            It&apos;s MDX in your repo. You own it. Deploy it anywhere.
          </h2>
          <p className="mt-5 max-w-[640px] text-base leading-relaxed text-pretty text-fd-muted-foreground sm:text-lg">
            superlore is <strong className="font-semibold text-fd-foreground">open source</strong>.
            Ship it to Vercel, Cloudflare, or your own box — your knowledge stays yours. Scaffold
            and author it with the superlore skills, preview it in your editor, and deploy when
            you&apos;re ready.
          </p>
          {/* Compact trust chip — NOT a feature grid. One line, token-styled, 1px border. Grounded
              in content/docs/auth.mdx: Auth.js v5 + Google SSO, off by default, org gate via
              AUTH_ALLOWED_DOMAIN / AUTH_ALLOWED_EMAILS, MCP inherits the proxy.ts policy. */}
          <p className="mt-5 inline-flex max-w-[640px] items-start gap-2.5 rounded-lg border border-fd-border bg-fd-card px-3.5 py-2.5 text-sm leading-relaxed text-pretty text-fd-muted-foreground">
            <Shield className="mt-0.5 size-4 shrink-0 text-kp-accent-text" aria-hidden />
            <span>
              Private and secure when you want it —{" "}
              <strong className="font-medium text-fd-foreground">Google SSO and an org gate</strong>{" "}
              flip on from config, and your MCP inherits the same policy.
            </span>
          </p>

          {/* The tagline — used exactly once on the whole page, set apart on its own line. */}
          <p className="mt-9 max-w-[640px] border-l border-kp-accent-border pl-4 text-lg font-medium tracking-[-0.01em] text-fd-foreground sm:text-xl">
            One corpus. Humans and agents.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a className="kp-btn kp-btn-primary" href="/docs/getting-started">
              Get started
            </a>
            <a className="kp-btn kp-btn-secondary" href="/viewer">
              <Eye className="size-4" />
              Try the Viewer
            </a>
          </div>

          <p className="mt-6 font-mono text-[11px] tracking-wide text-fd-muted-foreground">
            Open source · MCP-native · Auth-ready · Deploy anywhere
          </p>
        </Reveal>
      </div>

      {/* Minimal footer — the surface step + a 1px rule divide it; only standing affordance is the
          GitHub-star link. */}
      <footer className="relative z-10 border-t border-fd-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
            superlore — author once. Humans and agents read the same corpus.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 text-sm font-medium text-fd-foreground transition-colors outline-none hover:border-kp-accent-border hover:text-kp-accent-text focus-visible:ring-2 focus-visible:ring-[var(--kp-accent)]"
          >
            <GitHubGlyph className="size-4" />
            <span>Star it on GitHub</span>
            <Star className="size-3.5" aria-hidden />
          </a>
        </div>
      </footer>
    </section>
  );
}
