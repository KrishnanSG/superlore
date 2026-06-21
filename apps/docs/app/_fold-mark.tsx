/**
 * FoldMark — the superlore "Fold" mark, inlined as an SVG React component (brand/superlore-mark.svg).
 *
 * One flat source folded into a structured body: the LIT face is the human view, the HALF-TONE
 * face the machine's. Both polygons fill via `currentColor` so the mark inherits whatever text /
 * accent colour its container sets (`text-kp-accent-text`, `text-fd-foreground`, …) — never a raw
 * hex. Pure + server-safe (no hooks, no "use client"); recurs at the hero seam, the Turn hinge,
 * and the close.
 */
import type { SVGProps } from "react";

export interface FoldMarkProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> {
  /** Square edge length in px. Ignored when a `width`/`height` className sizes it instead. */
  size?: number;
  /** Opacity of the half-tone (machine) face, 0–1. Defaults to the brand 0.5. */
  halfToneOpacity?: number;
}

export function FoldMark({ size = 24, halfToneOpacity = 0.5, className, ...rest }: FoldMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="superlore"
      fill="currentColor"
      className={className}
      {...rest}
    >
      {/* Lit face — the human view. */}
      <polygon points="14,20 32,12 32,46 14,54" />
      {/* Half-tone face — the machine's view. */}
      <polygon points="32,12 50,20 50,54 32,46" opacity={halfToneOpacity} />
    </svg>
  );
}
