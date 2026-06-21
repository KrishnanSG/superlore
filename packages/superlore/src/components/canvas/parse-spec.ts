import {
  canvasSpecSchema,
  type CanvasEdgeSpec,
  type CanvasSpec,
  type NormalizedCanvas,
} from "./types";
import { expandTemplate } from "./templates";

/** Parse + validate a spec from an object or a JSON string, expand any template, then normalize. */
export function parseCanvasSpec(input: unknown): NormalizedCanvas {
  const raw = typeof input === "string" ? (JSON.parse(input) as unknown) : input;
  return normalizeCanvas(expandTemplate(canvasSpecSchema.parse(raw)));
}

/** Expand `to`-sugar into edges and apply defaults. */
export function normalizeCanvas(spec: CanvasSpec): NormalizedCanvas {
  const nodes = spec.nodes ?? [];
  const edges: CanvasEdgeSpec[] = [...(spec.edges ?? [])];
  for (const n of nodes) {
    if (n.to == null) continue;
    const targets = Array.isArray(n.to) ? n.to : [n.to];
    for (const t of targets) edges.push({ from: n.id, to: t });
  }
  return {
    title: spec.title,
    layout: spec.layout ?? "auto",
    direction: spec.direction ?? "right",
    align: spec.align,
    gap: spec.gap,
    height: spec.height,
    sketch: spec.sketch ?? false,
    nodes,
    edges,
    groups: spec.groups ?? [],
  };
}
