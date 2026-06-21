"use client";

/**
 * Beam — an inline-SVG connective line between two points (or two element edges).
 *
 * Renders as TWO overlaid strokes on one path:
 *   1. a static 1px rail in `var(--kp-border)` — always present, the structural connector; and
 *   2. (when `pulse`) a second stroke painted with a `transparent → accent → transparent` linear
 *      gradient, animated along the path via `stroke-dasharray` / `stroke-dashoffset` keyframes —
 *      a travelling light running the rail.
 *
 * Colour comes only from tokens (`--kp-border`, `--kp-accent`); never a raw hex, never theme
 * branching in JS. `prefers-reduced-motion` is a HARD gate handled in CSS: the animated stroke
 * collapses to a static, dimmed accent rail — no motion. Drop it anywhere; size it by giving the
 * parent `position: relative` and letting the Beam fill it, or pass an explicit `width`/`height`.
 */
import { useId, type CSSProperties } from "react";

export interface BeamPoint {
  x: number;
  y: number;
}

export interface BeamProps {
  /** Explicit SVG path `d`. Takes precedence over `from`/`to`. */
  path?: string;
  /** Start anchor (used to build a smooth cubic when `path` is omitted). */
  from?: BeamPoint;
  /** End anchor. */
  to?: BeamPoint;
  /** SVG viewBox width — the coordinate space `from`/`to`/`path` live in. */
  width: number;
  /** SVG viewBox height. */
  height: number;
  /** Run the travelling-light animation (gated by reduced-motion). Default false. */
  pulse?: boolean;
  /** Seconds for one travel cycle. Default 1.8 (matches the auto-trace cadence). */
  duration?: number;
  /** Rail stroke width in px. Default 1. */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Build a smooth horizontal-bias cubic between two points — a gentle S that reads as a routed
 * connector rather than a straight ruler. Used when no explicit `path` is given.
 */
export function cubicPath(from: BeamPoint, to: BeamPoint): string {
  const dx = (to.x - from.x) * 0.5;
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

/** Measure an element's rect relative to a container — handy for anchoring Beams to live DOM. */
export function rectWithin(el: Element, container: Element): DOMRect {
  const e = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return new DOMRect(e.left - c.left, e.top - c.top, e.width, e.height);
}

export function Beam({
  path,
  from,
  to,
  width,
  height,
  pulse = false,
  duration = 1.8,
  strokeWidth = 1,
  className,
  style,
}: BeamProps) {
  const uid = useId().replace(/[:]/g, "");
  const gradId = `beam-grad-${uid}`;
  const animName = `beam-dash-${uid}`;
  const d = path ?? (from && to ? cubicPath(from, to) : "");
  if (!d) return null;

  return (
    <svg
      className={className}
      style={style}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="color-mix(in oklab, var(--kp-accent) 85%, transparent)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Static structural rail — always present. */}
      <path d={d} stroke="var(--kp-border)" strokeWidth={strokeWidth} />

      {/* Travelling light — only when pulsing; reduced-motion freezes it to a dim accent rail. */}
      {pulse && (
        <>
          <style>{`
@keyframes ${animName} {
  from { stroke-dashoffset: 32; }
  to { stroke-dashoffset: -32; }
}
.${animName} {
  stroke-dasharray: 16 16;
  animation: ${animName} ${duration}s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .${animName} {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
    opacity: 0.6;
  }
}`}</style>
          <path
            className={animName}
            d={d}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth + 1}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
