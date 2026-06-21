"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { edgeColor } from "./auto-design";
import type { CanvasIntent } from "./types";

type Pt = { x: number; y: number };

/** An orthogonal polyline through `pts` with corners rounded by `r` — ELK route → smooth path. */
function roundedPath(pts: Pt[], r = 12): string {
  if (pts.length < 2) return "";
  const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
  const first = pts[0]!;
  let d = `M ${first.x},${first.y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const prev = pts[i - 1]!;
    const next = pts[i + 1]!;
    const dPrev = dist(prev, p) || 1;
    const dNext = dist(p, next) || 1;
    const r1 = Math.min(r, dPrev / 2);
    const r2 = Math.min(r, dNext / 2);
    d += ` L ${p.x + ((prev.x - p.x) / dPrev) * r1},${p.y + ((prev.y - p.y) / dPrev) * r1}`;
    d += ` Q ${p.x},${p.y} ${p.x + ((next.x - p.x) / dNext) * r2},${p.y + ((next.y - p.y) / dNext) * r2}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last.x},${last.y}`;
  return d;
}

export function KEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  markerStart,
}: EdgeProps) {
  const kind = (data?.kind as string | undefined) ?? "arrow";
  const hand = !!data?.hand;
  const sketch = kind === "sketch";
  const stroke = edgeColor(data?.intent as CanvasIntent | undefined);
  // A precomputed ELK route (orthogonal, node-avoiding) wins — draw the connector along it.
  const route = data?.route as Pt[] | undefined;
  // Sketch + curved connectors follow a bezier; everything else takes the tidy orthogonal elbow.
  const curved = kind === "curved" || sketch;
  let path: string;
  let labelX: number;
  let labelY: number;
  if (route && route.length >= 2 && !sketch) {
    path = roundedPath(route);
    const mid = route[Math.floor(route.length / 2)]!;
    labelX = mid.x;
    labelY = mid.y;
  } else {
    [path, labelX, labelY] = curved
      ? getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius: 16,
        });
  }

  // Nudge the label off the line toward the midpoint between endpoints, so it never sits
  // on a segment that hugs a node. Small bias along the dominant axis keeps it legible.
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const horizontal = Math.abs(dx) >= Math.abs(dy);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke,
          strokeWidth: sketch ? 2.25 : 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          // Keep the stroke a constant screen-pixel width regardless of the viewport zoom. When a
          // large board is fit-viewed into a small frame (e.g. a strip tile at ~0.25 zoom) a plain
          // 2px stroke shrinks sub-pixel and the connectors vanish while nodes/labels stay visible.
          // Non-scaling-stroke pins the line so edges read clearly at any zoom; the dash pattern
          // is given in user units (matching the unscaled stroke) so dashed edges stay even too.
          vectorEffect: "non-scaling-stroke",
          strokeDasharray: kind === "dashed" ? "6 6" : undefined,
          // A gentle hand-drawn waver — a dependency-free SVG displacement filter (see the def
          // rendered once by the island). Keeps the stroke token-coloured and theme-equal.
          filter: sketch ? "url(#kp-sketch)" : undefined,
        }}
      />
      {data?.label ? (
        <EdgeLabelRenderer>
          <div
            className={
              hand
                ? "pointer-events-none absolute z-10 rounded-md px-1.5 py-0.5 text-[14px] leading-none whitespace-nowrap text-fd-muted-foreground select-none"
                : "pointer-events-none absolute z-10 rounded-md border border-fd-border bg-fd-card px-2 py-0.5 text-[10.5px] font-medium tracking-tight whitespace-nowrap text-fd-muted-foreground shadow-[var(--kp-canvas-shadow)] select-none"
            }
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (horizontal ? -10 : 0)}px)`,
              ...(hand
                ? {
                    fontFamily: "var(--font-hand), ui-rounded, cursive",
                    background: "color-mix(in oklab, var(--color-fd-background) 86%, transparent)",
                  }
                : null),
            }}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const edgeTypes = { kedge: KEdge };
