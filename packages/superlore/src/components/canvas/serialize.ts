import type { Node } from "@xyflow/react";
import type { CanvasEdgeSpec, CanvasGroupSpec, CanvasNodeSpec, NormalizedCanvas } from "./types";

/**
 * Round-trip the user's edits back to a `superlore-canvas` spec — the heart of "edit like FigJam, but
 * it's still our JSON." Takes the live React-Flow nodes (after dragging / adding / renaming) and
 * emits a `layout: "manual"` spec with absolute coordinates, so reopening it reproduces the board
 * exactly AND the MCP reads the same typed graph. Edges are carried through unchanged (v1 edits
 * nodes, not connectors).
 */

interface SpecOut {
  title?: string;
  layout: "manual";
  direction?: "right" | "down";
  groups?: CanvasGroupSpec[];
  nodes: CanvasNodeSpec[];
  edges?: CanvasEdgeSpec[];
}

type RFData = Record<string, unknown>;

const isFrame = (n: Node) => n.type === "kframe" || n.type === "kgroup";

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function serializeEdits(rfNodes: Node[], canvas: NormalizedCanvas): SpecOut {
  const byId = new Map(rfNodes.map((n) => [n.id, n]));

  // Absolute top-left: a node's position is relative to its parent frame, so walk the chain.
  const absPos = (n: Node): { x: number; y: number } => {
    let x = n.position.x;
    let y = n.position.y;
    let p = n.parentId;
    const guard = new Set<string>();
    while (p && byId.has(p) && !guard.has(p)) {
      guard.add(p);
      const pn = byId.get(p)!;
      x += pn.position.x;
      y += pn.position.y;
      p = pn.parentId;
    }
    return { x: Math.round(x), y: Math.round(y) };
  };

  const groups: CanvasGroupSpec[] = rfNodes.filter(isFrame).map((n) => {
    const d = n.data as RFData;
    const { x, y } = absPos(n);
    const parent =
      n.parentId && byId.has(n.parentId) && isFrame(byId.get(n.parentId)!) ? n.parentId : undefined;
    return {
      id: n.id,
      label: str(d.label),
      frame: n.type === "kframe",
      dashed: d.dashed === true ? true : undefined,
      intent: d.intent as CanvasGroupSpec["intent"],
      icon: str(d.icon),
      parent,
      x,
      y,
      width: n.width ? Math.round(n.width) : undefined,
      height: n.height ? Math.round(n.height) : undefined,
    };
  });

  const nodes: CanvasNodeSpec[] = rfNodes
    .filter((n) => !isFrame(n))
    .map((n) => {
      const d = n.data as RFData;
      const { x, y } = absPos(n);
      const group = n.parentId && byId.has(n.parentId) ? n.parentId : undefined;
      return {
        id: n.id,
        kind: (d.kind as CanvasNodeSpec["kind"]) ?? "rounded",
        label: str(d.label),
        body: str(d.body),
        intent: d.intent as CanvasNodeSpec["intent"],
        icon: str(d.icon),
        group,
        x,
        y,
        width: n.width ? Math.round(n.width) : undefined,
        height: n.height ? Math.round(n.height) : undefined,
      };
    });

  const edges: CanvasEdgeSpec[] = canvas.edges.map((e) => ({
    from: e.from,
    to: e.to,
    label: e.label,
    kind: e.kind,
    intent: e.intent,
    rel: e.rel,
    fromSide: e.fromSide,
    toSide: e.toSide,
  }));

  return {
    title: canvas.title,
    layout: "manual",
    direction: canvas.direction,
    groups: groups.length ? groups : undefined,
    nodes,
    edges: edges.length ? edges : undefined,
  };
}
