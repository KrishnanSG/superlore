"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs";

/** The hand-drawn shapes a node can opt into with `hand: true` — used *where needed*, not globally. */
export type SketchKind = "rect" | "ellipse" | "diamond" | "cylinder";

function cylinderPath(w: number, h: number): string {
  const p = 3;
  const ry = Math.min(15, h * 0.16);
  const x0 = p;
  const x1 = w - p;
  const yt = p + ry;
  const yb = h - p - ry;
  return [
    `M${x0},${yt}`,
    `C${x0},${yt - ry * 1.34} ${x1},${yt - ry * 1.34} ${x1},${yt}`,
    `L${x1},${yb}`,
    `C${x1},${yb + ry * 1.34} ${x0},${yb + ry * 1.34} ${x0},${yb}`,
    "Z",
    `M${x0},${yt}`,
    `C${x0},${yt + ry * 1.34} ${x1},${yt + ry * 1.34} ${x1},${yt}`,
  ].join(" ");
}

/**
 * A hand-drawn shape rendered behind a node's content via rough.js (the engine behind Excalidraw).
 * Stroke + fill are driven by the `--kp-sk-stroke` / `--kp-sk-fill` CSS vars the node sets, so the
 * sketch stays theme-aware and token-only. The seed is per-node, so the wobble is stable.
 */
export function SketchShape({
  w,
  h,
  kind,
  seed,
  dashed,
  noFill,
}: {
  w: number;
  h: number;
  kind: SketchKind;
  seed: number;
  dashed?: boolean;
  noFill?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !w || !h) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    const opt: Record<string, unknown> = {
      roughness: 1.25,
      bowing: 1.3,
      seed: seed || 1,
      strokeWidth: 1.7,
      fillStyle: "solid",
      ...(noFill ? {} : { fill: "#000" }),
    };
    const p = 3;
    let g: SVGGElement;
    if (kind === "ellipse") g = rc.ellipse(w / 2, h / 2, w - p * 2, h - p * 2, opt);
    else if (kind === "diamond")
      g = rc.polygon(
        [
          [w / 2, p],
          [w - p, h / 2],
          [w / 2, h - p],
          [p, h / 2],
        ],
        opt,
      );
    else if (kind === "cylinder") g = rc.path(cylinderPath(w, h), opt);
    else g = rc.rectangle(p, p, w - p * 2, h - p * 2, opt);
    // Recolour rough's concrete attributes with our CSS vars (theme-aware).
    g.querySelectorAll("path").forEach((path) => {
      const f = path.getAttribute("fill");
      if (f && f !== "none") {
        path.style.fill = "var(--kp-sk-fill)";
        path.removeAttribute("fill");
      }
      const s = path.getAttribute("stroke");
      if (s && s !== "none") {
        path.style.stroke = "var(--kp-sk-stroke)";
        path.removeAttribute("stroke");
        if (dashed) path.style.strokeDasharray = "7 6";
      }
    });
    svg.appendChild(g);
  }, [w, h, kind, seed, dashed, noFill]);
  return (
    <svg
      ref={ref}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    />
  );
}
