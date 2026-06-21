import { z } from "zod";

/**
 * The `superlore-canvas` spec — the single source of truth for a superlore whiteboard. It is BOTH the
 * authoring format (a JSON object, embeddable in MDX) AND the knowledge-graph the MCP serves, so
 * the human render and the agent face are the same data. Authors declare only semantics —
 * id / kind / label / intent / relations. Colours, sizes, and positions are auto-designed.
 */

export const CANVAS_SHAPE_KINDS = [
  "rect",
  "rounded",
  "card",
  "circle",
  "ellipse",
  "diamond",
  "pill",
  "sticky",
  "text",
  "note", // a titled, multi-line note card (FigJam-style)
  "cylinder", // a database / store
  "annotation", // a handwritten-style margin note
  "heading", // free display text — a big title/label floating on the board (no box)
  "stack", // a pile of cards — "many of these": records, stories, a dataset, a backlog
  "embed", // a live superlore component (Timeline/Comparison/StatGrid…) placed on the board
  "icon", // a big icon + label — architecture components (cloud, queue, server…)
  "image", // an image placed on the canvas (![](src))
  // FigJam shape-picker — Basic. Rendered via CSS clip-path on the shared node surface.
  "triangle", // upward triangle
  "triangle-down", // inverted triangle
  "pentagon",
  "hexagon",
  "octagon",
  "star",
  "cross", // a plus / cross
  "arrow-left",
  "arrow-right",
  "chevron", // pentagon-arrow (right-pointing block arrow)
  // FigJam shape-picker — Flowchart.
  "parallelogram", // data / I/O
  "trapezoid", // manual operation
  "callout", // speech bubble (rounded rect + tail)
  "document", // page with a folded/wavy bottom edge
  "process", // predefined process — rect with two vertical inner bars
] as const;
export type CanvasShapeKind = (typeof CANVAS_SHAPE_KINDS)[number];

export const CANVAS_INTENTS = [
  // semantic
  "neutral",
  "accent",
  "info",
  "success",
  "warning",
  "danger",
  "muted",
  // FigJam-style colour names — vivid yet token-driven, so boards stay designed and theme-aware
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;
export type CanvasIntent = (typeof CANVAS_INTENTS)[number];

export const CANVAS_EDGE_KINDS = [
  "arrow",
  "line",
  "bidirectional",
  "dashed",
  "curved",
  "sketch", // a hand-drawn, wavering connector (FigJam/Excalidraw feel)
] as const;
export type CanvasEdgeKind = (typeof CANVAS_EDGE_KINDS)[number];

const REL_KINDS = [
  "links",
  "parent",
  "child",
  "related",
  "depends-on",
  "blocks",
  "supersedes",
  "superseded-by",
  "defines",
  "mentions",
  "owned-by",
  "part-of",
  "see-also",
] as const;

export const canvasNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(CANVAS_SHAPE_KINDS).optional(),
  label: z.string().optional(),
  /** Longer body text (note cards). Supports `\n` line breaks. */
  body: z.string().optional(),
  intent: z.enum(CANVAS_INTENTS).optional(),
  icon: z.string().optional(),
  /** Image source for `kind:"image"` (or any node — rendered as its content). */
  src: z.string().optional(),
  /** Render text (label/body) in the handwriting face — for `text`/`heading`/`note`/`sticky`. */
  hand: z.boolean().optional(),
  /** Dashed border — a tentative/proposed/optional box (vs. a solid committed one). */
  dashed: z.boolean().optional(),
  /** With `hand` — draw only the outline (no fill): a "circle this" emphasis ring over content. */
  outline: z.boolean().optional(),
  /** For `kind:"stack"` — how many cards in the pile read at a glance (visual depth, 2–4). */
  count: z.number().optional(),
  /** For `kind:"embed"` — the superlore component to render in this node (e.g. "Timeline"). */
  component: z.string().optional(),
  /** For `kind:"embed"` — the props passed to the embedded component (its authored data). */
  props: z.record(z.string(), z.unknown()).optional(),
  /** Group membership by group id (groups are declared in `groups`). */
  group: z.string().optional(),
  /** Sugar: declare outgoing edges inline (target id or ids). */
  to: z.union([z.string(), z.array(z.string())]).optional(),
  /** Optional explicit placement/size — overrides auto-layout. Agent-controlled. */
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type CanvasNodeSpec = z.infer<typeof canvasNodeSchema>;

export const canvasEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  kind: z.enum(CANVAS_EDGE_KINDS).optional(),
  /** Colour the connector (+ its arrowhead). `neutral` = a strong foreground line; omit = subtle. */
  intent: z.enum(CANVAS_INTENTS).optional(),
  /**
   * Force which side of each endpoint the connector leaves/arrives at (else it's auto-chosen).
   * Use it for a deliberate routed path — e.g. a connector that bows out to the `left` of both
   * boxes instead of running straight down between them.
   */
  fromSide: z.enum(["left", "right", "top", "bottom"]).optional(),
  toSide: z.enum(["left", "right", "top", "bottom"]).optional(),
  rel: z.enum(REL_KINDS).optional(),
});
export type CanvasEdgeSpec = z.infer<typeof canvasEdgeSchema>;

/**
 * How a frame arranges its OWN direct children (nodes + sub-frames). The whole board is just the
 * root frame, so the board-level `layout` is this same set (plus a few back-compat aliases).
 *   • `flow`   — follow the connectors (ELK layered); `direction` right/down. The diagram default.
 *   • `row` / `column` — stack children across / down, aligned, even gaps. No edges needed.
 *   • `grid`   — wrap children into a tidy grid in reading order (sticky walls, galleries, posters).
 *   • `free`   — keep authored x/y (FigJam-style absolute placement).
 */
export const REGION_LAYOUTS = ["flow", "row", "column", "grid", "free"] as const;
export type RegionLayout = (typeof REGION_LAYOUTS)[number];

export const canvasGroupSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  /** A lucide icon name shown in the frame's header chip — gives a template section identity. */
  icon: z.string().optional(),
  intent: z.enum(CANVAS_INTENTS).optional(),
  /** A titled "frame" (stronger container) vs a soft "group" region. */
  frame: z.boolean().optional(),
  /** How this frame lays out its own children (defaults to `flow`). */
  layout: z.enum(REGION_LAYOUTS).optional(),
  /** Flow/row/column direction for this frame. */
  direction: z.enum(["right", "down"]).optional(),
  /** Cross-axis alignment for row/column/grid children. `stretch` = equal size (kanban columns). */
  align: z.enum(["start", "center", "end", "stretch"]).optional(),
  /** Gap (px) between children for row/column/grid. */
  gap: z.number().optional(),
  /** Dashed section border — a loose/working/proposed grouping (vs. a solid committed frame). */
  dashed: z.boolean().optional(),
  /** Nest this section inside another group/frame by id — sections within sections. */
  parent: z.string().optional(),
  /** Lay a subtle dot grid inside the section (defaults on when the board is `sketch`). */
  dotted: z.boolean().optional(),
  /** Absolute placement/size (honoured in `free` layout; a min-size hint elsewhere). */
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export type CanvasGroupSpec = z.infer<typeof canvasGroupSchema>;

export const canvasSpecSchema = z.object({
  title: z.string().optional(),
  /**
   * `auto`/`flow`/`tree` — tidy layered layout (ELK). `free` — organic force scatter.
   * The board is the root frame, so this is the same set as a frame's `layout` (see REGION_LAYOUTS)
   * plus a couple of aliases: `auto`/`tree`→`flow`, `board`→`grid`. `manual` is a pure
   * absolute-placement escape hatch (every `x`/`y`/`width`/`height` honoured verbatim).
   */
  layout: z
    .enum(["auto", "flow", "tree", "free", "row", "column", "grid", "board", "manual"])
    .optional(),
  direction: z.enum(["right", "down"]).optional(),
  /** Cross-axis alignment for the root row/column/grid (`stretch` = equal-size, e.g. kanban). */
  align: z.enum(["start", "center", "end", "stretch"]).optional(),
  /** Gap (px) between the root's children. */
  gap: z.number().optional(),
  height: z.union([z.number(), z.string()]).optional(),
  /**
   * Hand-drawn board style: connectors waver like a marker, section titles + edge labels render
   * in the handwriting face, and sections default to a dotted ground. One flag turns a clean
   * board into a FigJam-style brainstorm; per-edge `kind` / per-group `dotted` still override.
   */
  sketch: z.boolean().optional(),
  /**
   * Start from a named template — a ready structure (frames + layout) you fill in. The template's
   * frames/layout merge under your own nodes/groups (yours win), so `{ "template": "swot", "nodes":
   * [{ "group": "strengths", "label": "…" }] }` drops your card into the Strengths quadrant. See
   * the templates registry for ids + the frame ids each one exposes.
   */
  template: z.string().optional(),
  nodes: z.array(canvasNodeSchema).optional(),
  edges: z.array(canvasEdgeSchema).optional(),
  groups: z.array(canvasGroupSchema).optional(),
});
export type CanvasSpec = z.infer<typeof canvasSpecSchema>;

/** A canvas after `to`-sugar expansion and defaults applied — what render + layout consume. */
export interface NormalizedCanvas {
  title?: string;
  layout: "auto" | "flow" | "tree" | "free" | "row" | "column" | "grid" | "board" | "manual";
  direction: "right" | "down";
  align?: "start" | "center" | "end" | "stretch";
  gap?: number;
  height?: number | string;
  sketch: boolean;
  nodes: CanvasNodeSpec[];
  edges: CanvasEdgeSpec[];
  groups: CanvasGroupSpec[];
}
