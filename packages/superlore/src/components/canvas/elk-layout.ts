import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import { frameToneFromMembers, measureNode, resolveIntents } from "./auto-design";
import type {
  CanvasGroupSpec,
  CanvasIntent,
  CanvasNodeSpec,
  NormalizedCanvas,
  RegionLayout,
} from "./types";

/** Loose RF-shaped node/edge so this module doesn't depend on @xyflow types. */
export interface LaidOutNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  parentId?: string;
  extent?: "parent";
  style?: Record<string, unknown>;
  draggable?: boolean;
  selectable?: boolean;
}
export interface LaidOutEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: Record<string, unknown>;
}
export interface LaidOut {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  /** Bounds of the laid-out graph, so the container can hug its content. */
  width: number;
  height: number;
  /** Per-edge orthogonal routes (absolute points) from ELK, so connectors avoid nodes. */
  routes?: Record<string, { x: number; y: number }[]>;
  /** Per-edge label centre (absolute) from ELK — it reserves space so labels never overlap. */
  labelPos?: Record<string, { x: number; y: number }>;
}

/**
 * Approx pixel size of an edge-label pill (the `text-[10.5px]` chip with `px-2 py-0.5` in edges.tsx).
 * Fed to ELK as the edge's label dimensions so the layered algorithm reserves a lane for it and
 * positions it — the fix for labels stacking on top of each other where edges converge.
 */
function edgeLabelSize(text: string): { width: number; height: number } {
  return { width: Math.ceil(text.length * 6.2) + 16, height: 20 };
}

const elk = new ELK();

function rfType(kind: string): string {
  switch (kind) {
    case "text":
      return "ktext";
    case "heading":
      return "kheading";
    case "stack":
      return "kstack";
    case "embed":
      return "kembed";
    case "sticky":
      return "ksticky";
    case "note":
      return "knote";
    case "cylinder":
      return "kcyl";
    case "annotation":
      return "kannot";
    case "icon":
      return "kicon";
    case "image":
      return "kimage";
    // FigJam clip-path shapes — polygons, arrows, chevron, cross — all share one renderer.
    case "triangle":
    case "triangle-down":
    case "pentagon":
    case "hexagon":
    case "octagon":
    case "star":
    case "cross":
    case "arrow-left":
    case "arrow-right":
    case "chevron":
    case "parallelogram":
    case "trapezoid":
      return "kpoly";
    // Flowchart shapes with structural detail beyond a single clip.
    case "callout":
      return "kcallout";
    case "document":
      return "kdocument";
    case "process":
      return "kprocess";
    default:
      return "kshape";
  }
}

function sizeOf(n: CanvasNodeSpec) {
  if (n.width && n.height) return { width: n.width, height: n.height };
  const m = measureNode(n.kind ?? "rounded", n.label ?? "", n.body ?? "");
  return { width: n.width ?? m.width, height: n.height ?? m.height };
}

function makeNode(
  spec: CanvasNodeSpec,
  intent: CanvasIntent,
  x: number,
  y: number,
  width?: number,
  height?: number,
  parentId?: string,
): LaidOutNode {
  const kind = spec.kind ?? "rounded";
  return {
    id: spec.id,
    type: rfType(kind),
    position: { x, y },
    width,
    height,
    data: {
      kind,
      label: spec.label,
      body: spec.body,
      intent,
      icon: spec.icon,
      src: spec.src,
      hand: spec.hand,
      dashed: spec.dashed,
      outline: spec.outline,
      count: spec.count,
      component: spec.component,
      props: spec.props,
    },
    ...(parentId ? { parentId, extent: "parent" as const } : {}),
  };
}

/** The data payload for a section's RF node — identical however the section is placed. */
function frameData(
  group: CanvasGroupSpec,
  depth: number,
  hue: string | undefined,
  sketch: boolean,
) {
  return {
    label: group.label,
    icon: group.icon,
    intent: group.intent,
    frame: !!group.frame,
    dashed: group.dashed,
    depth,
    hue,
    // A dotted ground when asked for, or by default on a hand-drawn board.
    dotted: group.dotted ?? sketch,
    // Handwritten section titles on a sketch board.
    hand: sketch,
  };
}

/** Build the RF edges from a normalized canvas (shared across every layout path). */
function buildEdges(canvas: NormalizedCanvas): LaidOutEdge[] {
  const coords = canvas.layout === "free" || canvas.layout === "manual";
  // explicit `kind` wins; else a hand-drawn board sketches every line, a free/absolute board
  // curves them (organic feel), and a structured board uses clean arrows.
  const defaultKind = canvas.sketch ? "sketch" : coords ? "curved" : "arrow";
  return canvas.edges.map((e, i) => ({
    id: `e${i}`,
    source: e.from,
    target: e.to,
    type: "kedge",
    data: {
      label: e.label,
      kind: e.kind ?? defaultKind,
      rel: e.rel,
      intent: e.intent,
      fromSide: e.fromSide,
      toSide: e.toSide,
      hand: canvas.sketch,
    },
  }));
}

/**
 * Per-section depth (for nested-frame emphasis) + derived hue (the colour family a frame tints to,
 * echoing its contents). Shared by every layout path so a frame looks identical however it's placed.
 */
function groupVisuals(canvas: NormalizedCanvas, intents: Map<string, CanvasIntent>) {
  const groupIds = new Set(canvas.groups.map((g) => g.id));
  const depth = new Map<string, number>();
  const depthOf = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    const g = canvas.groups.find((x) => x.id === id);
    const p = g?.parent;
    const d = p && groupIds.has(p) && !seen.has(p) ? depthOf(p, new Set(seen).add(id)) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  for (const g of canvas.groups) depthOf(g.id);

  // Collect the resolved intents each section holds — directly and bubbling up from nested
  // sections — so a frame tints to the colour family of its contents.
  const memberIntents = new Map<string, CanvasIntent[]>();
  for (const n of canvas.nodes) {
    let g = n.group && groupIds.has(n.group) ? n.group : undefined;
    const it = intents.get(n.id);
    const guard = new Set<string>();
    while (g && it && !guard.has(g)) {
      guard.add(g);
      (memberIntents.get(g) ?? memberIntents.set(g, []).get(g)!).push(it);
      const parent = canvas.groups.find((x) => x.id === g)?.parent;
      g = parent && groupIds.has(parent) ? parent : undefined;
    }
  }
  const hue = new Map<string, string>();
  for (const g of canvas.groups) {
    if (g.intent) continue; // explicit intent wins in the renderer
    hue.set(g.id, frameToneFromMembers(memberIntents.get(g.id) ?? []).hue);
  }
  return { depth, hue };
}

/** The board-level layout, mapped to a region layout (with back-compat aliases). */
function aliasLayout(l: NormalizedCanvas["layout"]): RegionLayout {
  switch (l) {
    case "row":
    case "column":
    case "grid":
    case "free":
      return l;
    case "board":
      return "grid";
    default: // auto, flow, tree
      return "flow";
  }
}

const ELK_DIR = (direction: "right" | "down") => (direction === "down" ? "DOWN" : "RIGHT");

/** Cross-axis offset of a child of `size` within an `extent`, per alignment. */
function crossPos(align: string, size: number, extent: number): number {
  if (align === "end") return Math.max(0, extent - size);
  if (align === "center") return Math.max(0, (extent - size) / 2);
  return 0; // start / stretch
}

/** Interior padding for a region — generous, for whitespace. Root has none (the container pads). */
function paddingFor(regionId: string, spec?: CanvasGroupSpec) {
  if (!regionId) return { top: 0, left: 0, right: 0, bottom: 0 };
  if (spec?.frame) return { top: 54, left: 30, right: 30, bottom: 30 };
  return spec?.label
    ? { top: 32, left: 22, right: 22, bottom: 22 }
    : { top: 18, left: 18, right: 18, bottom: 18 };
}

const FLOW_OPTS = (dir: string): Record<string, string> => ({
  "elk.algorithm": "org.eclipse.elk.layered",
  "elk.direction": dir,
  "elk.spacing.nodeNode": "64",
  "elk.layered.spacing.nodeNodeBetweenLayers": "92",
  "elk.spacing.componentComponent": "80",
  "elk.spacing.edgeNode": "36",
  "elk.spacing.edgeEdge": "22",
  "elk.layered.spacing.edgeNodeBetweenLayers": "36",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  // Respect authored order within a layer — predictable, tidy boards.
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
});

const FORCE_OPTS: Record<string, string> = {
  "elk.algorithm": "org.eclipse.elk.force",
  "elk.spacing.nodeNode": "80",
  "elk.force.repulsivePower": "1",
  "elk.force.iterations": "280",
  "elk.edgeRouting": "POLYLINE",
};

interface ElkEdgeSpec {
  id: string;
  sources: string[];
  targets: string[];
}

/** Run an ELK pass over a flat set of opaque boxes; returns each box's top-left position. */
async function elkPositions(
  boxes: { id: string; w: number; h: number }[],
  edges: ElkEdgeSpec[],
  options: Record<string, string>,
): Promise<Map<string, { x: number; y: number }>> {
  const graph: ElkNode = {
    id: "region",
    layoutOptions: options,
    children: boxes.map((b) => ({ id: b.id, width: b.w, height: b.h })),
    edges,
  };
  const res = await elk.layout(graph);
  const pos = new Map<string, { x: number; y: number }>();
  for (const c of res.children ?? []) pos.set(c.id, { x: c.x ?? 0, y: c.y ?? 0 });
  return pos;
}

/**
 * Turn a position-less canvas spec into laid-out React Flow nodes + edges.
 *
 * The model: a board is a TREE of frames; every frame lays out its own direct children (nodes and
 * sub-frames) by its `layout` — `flow` (ELK layered), `row`/`column`/`grid` (deterministic), or
 * `free` (authored coords / organic scatter). Connectors overlay everything. The board is the root
 * frame. `manual` is the one exception: a pure absolute-placement escape hatch (see `layoutManual`).
 */
export async function layoutCanvas(
  canvas: NormalizedCanvas,
  measured?: Map<string, { w: number; h: number }>,
): Promise<LaidOut> {
  if (canvas.layout === "manual") return layoutManual(canvas, measured);

  // A pure-flow board (no row/column/grid/free frames) lays out hierarchically in one ELK pass and
  // renders connectors along ELK's ORTHOGONAL routes — so lines avoid nodes. The diagram path.
  const hasNonFlowFrame = canvas.groups.some((g) => g.layout && g.layout !== "flow");
  if (aliasLayout(canvas.layout) === "flow" && !hasNonFlowFrame) {
    return layoutFlowBoard(canvas, measured);
  }

  // An embed reports its real rendered size; use it so the board fits the component.
  const size = (n: CanvasNodeSpec) => {
    const m = measured?.get(n.id);
    if (m && !(n.width && n.height)) return { width: m.w, height: m.h };
    return sizeOf(n);
  };

  const intents = resolveIntents(canvas.nodes);
  const { depth, hue } = groupVisuals(canvas, intents);
  const groupById = new Map(canvas.groups.map((g) => [g.id, g]));
  const groupIds = new Set(groupById.keys());
  const nodeSpecById = new Map(canvas.nodes.map((n) => [n.id, n]));
  const validParent = (g: CanvasGroupSpec) =>
    g.parent && groupIds.has(g.parent) && g.parent !== g.id ? g.parent : undefined;
  const regionOfNode = (n: CanvasNodeSpec) => (n.group && groupIds.has(n.group) ? n.group : "");
  const parentRegionOf = (g: CanvasGroupSpec) => validParent(g) ?? "";

  // Direct-children index, keyed by region id ("" = the root frame).
  const nodesByRegion = new Map<string, CanvasNodeSpec[]>();
  for (const n of canvas.nodes) {
    const r = regionOfNode(n);
    (nodesByRegion.get(r) ?? nodesByRegion.set(r, []).get(r)!).push(n);
  }
  const framesByRegion = new Map<string, CanvasGroupSpec[]>();
  for (const g of canvas.groups) {
    const r = parentRegionOf(g);
    (framesByRegion.get(r) ?? framesByRegion.set(r, []).get(r)!).push(g);
  }
  const nodeIndex = new Map<string, number>();
  canvas.nodes.forEach((n, i) => nodeIndex.set(n.id, i));
  // A frame's order key = the first authored index among its descendant nodes.
  const frameMin = new Map<string, number>();
  canvas.nodes.forEach((n, i) => {
    let g = n.group && groupIds.has(n.group) ? n.group : undefined;
    const guard = new Set<string>();
    while (g && !guard.has(g)) {
      guard.add(g);
      frameMin.set(g, Math.min(frameMin.get(g) ?? Infinity, i));
      g = validParent(groupById.get(g)!);
    }
  });

  // Which direct child of `regionId` does `nodeId` live under? (a leaf, or the frame containing it)
  const directChild = (regionId: string, nodeId: string): string | undefined => {
    const n = nodeSpecById.get(nodeId);
    if (!n) return undefined;
    if (regionOfNode(n) === regionId) return nodeId;
    let g = n.group && groupIds.has(n.group) ? n.group : undefined;
    const guard = new Set<string>();
    while (g && !guard.has(g)) {
      guard.add(g);
      if (parentRegionOf(groupById.get(g)!) === regionId) return g;
      g = validParent(groupById.get(g)!);
    }
    return undefined;
  };

  // ELK edges among a region's direct children (mapping each endpoint to the child that holds it).
  const regionElkEdges = (regionId: string): ElkEdgeSpec[] => {
    const out: ElkEdgeSpec[] = [];
    for (const e of canvas.edges) {
      const a = directChild(regionId, e.from);
      const b = directChild(regionId, e.to);
      if (a && b && a !== b) out.push({ id: `e${out.length}`, sources: [a], targets: [b] });
    }
    return out;
  };

  interface Box {
    id: string;
    isFrame: boolean;
    node?: CanvasNodeSpec;
    group?: CanvasGroupSpec;
    childPieces?: LaidOutNode[];
    w: number;
    h: number;
    order: number;
    x: number;
    y: number;
  }

  async function layoutRegion(
    regionId: string,
    layout: RegionLayout,
    direction: "right" | "down",
  ): Promise<{ rfNodes: LaidOutNode[]; width: number; height: number }> {
    const boxes: Box[] = [];

    // Lay out child frames first (recursively), as opaque boxes.
    for (const f of framesByRegion.get(regionId) ?? []) {
      const r = await layoutRegion(f.id, f.layout ?? "flow", f.direction ?? direction);
      boxes.push({
        id: f.id,
        isFrame: true,
        group: f,
        childPieces: r.rfNodes,
        w: Math.max(r.width, f.width ?? 0),
        h: Math.max(r.height, f.height ?? 0),
        order: frameMin.get(f.id) ?? Infinity,
        x: 0,
        y: 0,
      });
    }
    for (const n of nodesByRegion.get(regionId) ?? []) {
      const { width, height } = size(n);
      boxes.push({
        id: n.id,
        isFrame: false,
        node: n,
        w: width,
        h: height,
        order: nodeIndex.get(n.id) ?? 0,
        x: 0,
        y: 0,
      });
    }
    boxes.sort((a, b) => a.order - b.order);

    const spec = regionId ? groupById.get(regionId) : undefined;
    const pad = paddingFor(regionId, spec);
    // The root reads board-level align/gap; a frame reads its own; both fall back to sane defaults.
    const gap = spec?.gap ?? (regionId ? undefined : canvas.gap) ?? (layout === "grid" ? 48 : 56);
    const align = spec?.align ?? (regionId ? undefined : canvas.align) ?? "center";

    if (boxes.length) {
      if (layout === "flow") {
        const pos = await elkPositions(
          boxes,
          regionElkEdges(regionId),
          FLOW_OPTS(ELK_DIR(direction)),
        );
        for (const box of boxes) {
          const q = pos.get(box.id);
          box.x = q?.x ?? 0;
          box.y = q?.y ?? 0;
        }
      } else if (layout === "row" || layout === "column") {
        const horiz = layout === "row";
        const cross = horiz
          ? Math.max(...boxes.map((b) => b.h))
          : Math.max(...boxes.map((b) => b.w));
        let cur = 0;
        for (const box of boxes) {
          if (horiz) {
            box.x = cur;
            if (align === "stretch") box.h = cross;
            box.y = crossPos(align, box.h, cross);
            cur += box.w + gap;
          } else {
            box.y = cur;
            if (align === "stretch") box.w = cross;
            box.x = crossPos(align, box.w, cross);
            cur += box.h + gap;
          }
        }
      } else if (layout === "grid") {
        const cols = Math.max(1, Math.round(Math.sqrt(boxes.length)));
        let y = 0;
        for (let i = 0; i < boxes.length; i += cols) {
          const row = boxes.slice(i, i + cols);
          const rowH = Math.max(...row.map((b) => b.h));
          let x = 0;
          for (const box of row) {
            if (align === "stretch") box.h = rowH;
            box.x = x;
            box.y = y + crossPos(align, box.h, rowH);
            x += box.w + gap;
          }
          y += rowH + gap;
        }
      } else {
        // free — authored coords where given; organic force for the rest.
        const coordOf = (box: Box): { x: number; y: number } | null => {
          const s = box.isFrame ? box.group! : box.node!;
          return typeof s.x === "number" && typeof s.y === "number" ? { x: s.x, y: s.y } : null;
        };
        const fp = boxes.some((b) => !coordOf(b))
          ? await elkPositions(boxes, regionElkEdges(regionId), FORCE_OPTS)
          : null;
        let fx = 0;
        for (const box of boxes) {
          const c = coordOf(box);
          if (c) {
            box.x = c.x;
            box.y = c.y;
          } else if (fp?.get(box.id)) {
            const q = fp.get(box.id)!;
            box.x = q.x;
            box.y = q.y;
          } else {
            box.x = fx;
            box.y = 0;
            fx += box.w + 40;
          }
        }
      }
    }

    // Offset into the content area (below the header / inside the padding).
    for (const box of boxes) {
      box.x += pad.left;
      box.y += pad.top;
    }

    let cw = 0;
    let ch = 0;
    for (const box of boxes) {
      cw = Math.max(cw, box.x + box.w);
      ch = Math.max(ch, box.y + box.h);
    }
    let width = cw + pad.right;
    let height = ch + pad.bottom;
    if (spec?.width) width = Math.max(width, spec.width);
    if (spec?.height) height = Math.max(height, spec.height);

    const rfNodes: LaidOutNode[] = [];
    const parentId = regionId || undefined;
    for (const box of boxes) {
      if (box.isFrame) {
        const g = box.group!;
        rfNodes.push({
          id: g.id,
          type: g.frame ? "kframe" : "kgroup",
          position: { x: box.x, y: box.y },
          width: box.w,
          height: box.h,
          data: frameData(g, depth.get(g.id) ?? 0, hue.get(g.id), canvas.sketch),
          style: { width: box.w, height: box.h },
          draggable: false,
          selectable: false,
          ...(parentId ? { parentId, extent: "parent" as const } : {}),
        });
        rfNodes.push(...(box.childPieces ?? []));
      } else {
        rfNodes.push(
          makeNode(
            box.node!,
            intents.get(box.id) ?? "neutral",
            box.x,
            box.y,
            box.w,
            box.h,
            parentId,
          ),
        );
      }
    }
    return { rfNodes, width, height };
  }

  const root = await layoutRegion("", aliasLayout(canvas.layout), canvas.direction);
  return { nodes: root.rfNodes, edges: buildEdges(canvas), width: root.width, height: root.height };
}

/* ------------------------------------------------------------------- flow board --- */

/**
 * A connected diagram (architecture, flowchart, pipeline) — laid out hierarchically in ONE ELK
 * pass (INCLUDE_CHILDREN) so tiers/frames nest, AND rendered along ELK's ORTHOGONAL edge ROUTES so
 * connectors weave between nodes instead of cutting through them. The high-readability path.
 */
async function layoutFlowBoard(
  canvas: NormalizedCanvas,
  measured?: Map<string, { w: number; h: number }>,
): Promise<LaidOut> {
  const dir = ELK_DIR(canvas.direction);
  const intents = resolveIntents(canvas.nodes);
  const { depth: groupDepth, hue: groupHue } = groupVisuals(canvas, intents);
  const groupIds = new Set(canvas.groups.map((g) => g.id));
  const groupById = new Map(canvas.groups.map((g) => [g.id, g]));
  const nodeSpecById = new Map(canvas.nodes.map((n) => [n.id, n]));
  const size = (n: CanvasNodeSpec) => {
    const m = measured?.get(n.id);
    if (m && !(n.width && n.height)) return { width: m.w, height: m.h };
    return sizeOf(n);
  };

  const topChildren: ElkNode[] = [];
  const childrenByGroup = new Map<string, ElkNode[]>();
  const subGroupsByParent = new Map<string, string[]>();
  for (const n of canvas.nodes) {
    const { width, height } = size(n);
    const elkNode: ElkNode = { id: n.id, width, height };
    const g = n.group && groupIds.has(n.group) ? n.group : undefined;
    if (g) (childrenByGroup.get(g) ?? childrenByGroup.set(g, []).get(g)!).push(elkNode);
    else topChildren.push(elkNode);
  }
  for (const g of canvas.groups) {
    const p = g.parent && groupIds.has(g.parent) && g.parent !== g.id ? g.parent : undefined;
    if (p) (subGroupsByParent.get(p) ?? subGroupsByParent.set(p, []).get(p)!).push(g.id);
  }
  const built = new Set<string>();
  function buildGroup(id: string): ElkNode {
    built.add(id);
    const kids: ElkNode[] = [...(childrenByGroup.get(id) ?? [])];
    for (const sub of subGroupsByParent.get(id) ?? []) kids.push(buildGroup(sub));
    const g = groupById.get(id);
    return {
      id,
      children: kids,
      layoutOptions: {
        "elk.padding": g?.frame
          ? "[top=54,left=30,bottom=30,right=30]"
          : "[top=34,left=22,bottom=22,right=22]",
        "elk.algorithm": "org.eclipse.elk.layered",
        "elk.direction": dir,
        "elk.spacing.nodeNode": "52",
        "elk.layered.spacing.nodeNodeBetweenLayers": "84",
      },
    };
  }
  for (const g of canvas.groups) {
    const isNested = g.parent && groupIds.has(g.parent) && g.parent !== g.id;
    if (!isNested && !built.has(g.id)) topChildren.push(buildGroup(g.id));
  }

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "org.eclipse.elk.layered",
      "elk.direction": dir,
      "elk.spacing.nodeNode": "68",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.spacing.componentComponent": "84",
      // Keep edges off node borders so routes have a lane and never graze a box.
      "elk.spacing.edgeNode": "40",
      "elk.spacing.edgeEdge": "24",
      "elk.layered.spacing.edgeNodeBetweenLayers": "40",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      // Edge labels: ELK reserves a lane for each (as a label dummy node) and positions it, so
      // labels never stack on top of one another or a node where edges converge (fan-in/out).
      "elk.edgeLabels.placement": "CENTER",
      "elk.spacing.edgeLabel": "6",
      "elk.layered.spacing.edgeLabelBetweenLayers": "12",
    },
    children: topChildren,
    edges: canvas.edges.map((e, i) => ({
      id: `e${i}`,
      sources: [e.from],
      targets: [e.to],
      ...(e.label ? { labels: [{ id: `e${i}l`, text: e.label, ...edgeLabelSize(e.label) }] } : {}),
    })),
  };

  const res = await elk.layout(graph);
  const nodes: LaidOutNode[] = [];
  // Absolute box of every node/frame — used to validate edge routes below.
  const absBox = new Map<string, { x: number; y: number; w: number; h: number }>();
  function emit(child: ElkNode, parentId: string | undefined, ax: number, ay: number) {
    const x = child.x ?? 0;
    const y = child.y ?? 0;
    absBox.set(child.id, { x: ax + x, y: ay + y, w: child.width ?? 0, h: child.height ?? 0 });
    const group = groupById.get(child.id);
    if (group) {
      nodes.push({
        id: child.id,
        type: group.frame ? "kframe" : "kgroup",
        position: { x, y },
        width: child.width,
        height: child.height,
        data: frameData(
          group,
          groupDepth.get(child.id) ?? 0,
          groupHue.get(child.id),
          canvas.sketch,
        ),
        style: { width: child.width, height: child.height },
        draggable: false,
        selectable: false,
        ...(parentId ? { parentId, extent: "parent" as const } : {}),
      });
      for (const sub of child.children ?? []) emit(sub, child.id, ax + x, ay + y);
    } else {
      const spec = nodeSpecById.get(child.id);
      if (spec)
        nodes.push(
          makeNode(
            spec,
            intents.get(child.id) ?? "neutral",
            x,
            y,
            child.width,
            child.height,
            parentId,
          ),
        );
    }
  }
  for (const child of res.children ?? []) emit(child, undefined, 0, 0);

  // Edge routes — ELK's orthogonal sections, made absolute by accumulating container offsets.
  // Then VALIDATED: a route is only used if its ends actually sit on the source/target nodes
  // (elkjs occasionally emits a hierarchical edge in the wrong coordinate space — drop those, so
  // the connector falls back to a clean handle-to-handle path instead of floating off in space).
  const routes: Record<string, { x: number; y: number }[]> = {};
  const labelPos: Record<string, { x: number; y: number }> = {};
  const near = (p: { x: number; y: number } | undefined, id: string, tol = 48) => {
    const b = absBox.get(id);
    if (!b || !p) return false;
    return p.x >= b.x - tol && p.x <= b.x + b.w + tol && p.y >= b.y - tol && p.y <= b.y + b.h + tol;
  };
  function collectRoutes(node: ElkNode, offX: number, offY: number) {
    for (const e of node.edges ?? []) {
      const s = e.sections?.[0];
      if (!s) continue;
      const pts = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint]
        .filter(Boolean)
        .map((p) => ({ x: p!.x + offX, y: p!.y + offY }));
      if (pts.length < 2) continue;
      const idx = Number(e.id.replace(/^e/, ""));
      const spec = canvas.edges[idx];
      const a = pts[0]!;
      const b = pts[pts.length - 1]!;
      // accept whichever orientation matches the endpoints (ELK may emit either way)
      const ok =
        spec &&
        ((near(a, spec.from) && near(b, spec.to)) || (near(a, spec.to) && near(b, spec.from)));
      if (ok) {
        routes[e.id] = pts;
        // ELK placed the label (same coord space as the section it validated) — use its centre so
        // converging edges' labels sit in their own reserved lanes instead of piling up.
        const lab = e.labels?.[0];
        if (lab && lab.x != null && lab.y != null) {
          labelPos[e.id] = {
            x: lab.x + offX + (lab.width ?? 0) / 2,
            y: lab.y + offY + (lab.height ?? 0) / 2,
          };
        }
      }
    }
    for (const c of node.children ?? []) collectRoutes(c, offX + (c.x ?? 0), offY + (c.y ?? 0));
  }
  collectRoutes(res, 0, 0);

  return {
    nodes,
    edges: buildEdges(canvas),
    width: res.width ?? 0,
    height: res.height ?? 0,
    routes,
    labelPos,
  };
}

/* ----------------------------------------------------------------- manual layout --- */

/**
 * Absolute placement (the escape hatch): every `x`/`y` (and frame `width`/`height`) is honoured
 * verbatim — nothing moves. A frame without an explicit size hugs the bounding box of its members
 * (with header + padding). For faithfully reproducing a hand-arranged board to the pixel.
 */
function layoutManual(
  canvas: NormalizedCanvas,
  measured?: Map<string, { w: number; h: number }>,
): LaidOut {
  const size = (n: CanvasNodeSpec) => {
    const m = measured?.get(n.id);
    if (m && !(n.width && n.height)) return { width: m.w, height: m.h };
    return sizeOf(n);
  };
  const intents = resolveIntents(canvas.nodes);
  const groupIds = new Set(canvas.groups.map((g) => g.id));
  const groupById = new Map(canvas.groups.map((g) => [g.id, g]));
  const { depth: groupDepth, hue: groupHue } = groupVisuals(canvas, intents);
  const validParent = (g: CanvasGroupSpec) =>
    g.parent && groupIds.has(g.parent) && g.parent !== g.id ? g.parent : undefined;

  const membersByGroup = new Map<string, CanvasNodeSpec[]>();
  for (const n of canvas.nodes) {
    const g = n.group && groupIds.has(n.group) ? n.group : undefined;
    if (g) (membersByGroup.get(g) ?? membersByGroup.set(g, []).get(g)!).push(n);
  }
  const childGroupsByParent = new Map<string, string[]>();
  for (const g of canvas.groups) {
    const p = validParent(g);
    if (p) (childGroupsByParent.get(p) ?? childGroupsByParent.set(p, []).get(p)!).push(g.id);
  }

  const HEADER = 52;
  const PAD = 26;
  const boxOf = new Map<string, { x: number; y: number; width: number; height: number }>();
  function computeBox(
    id: string,
    seen = new Set<string>(),
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const cached = boxOf.get(id);
    if (cached) return cached;
    const g = groupById.get(id)!;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of membersByGroup.get(id) ?? []) {
      const { width, height } = size(n);
      const nx = n.x ?? 0;
      const ny = n.y ?? 0;
      minX = Math.min(minX, nx);
      minY = Math.min(minY, ny);
      maxX = Math.max(maxX, nx + width);
      maxY = Math.max(maxY, ny + height);
    }
    for (const sub of childGroupsByParent.get(id) ?? []) {
      if (seen.has(sub)) continue;
      const b = computeBox(sub, new Set(seen).add(id));
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    const hasKids = Number.isFinite(minX);
    const x = g.x ?? (hasKids ? minX - PAD : 0);
    const y = g.y ?? (hasKids ? minY - HEADER : 0);
    const right = g.width != null ? x + g.width : hasKids ? maxX + PAD : x + 220;
    const bottom = g.height != null ? y + g.height : hasKids ? maxY + PAD : y + 120;
    const box = { x, y, width: Math.max(80, right - x), height: Math.max(60, bottom - y) };
    boxOf.set(id, box);
    return box;
  }
  for (const g of canvas.groups) computeBox(g.id);

  const nodes: LaidOutNode[] = [];
  const sorted = [...canvas.groups].sort(
    (a, b) => (groupDepth.get(a.id) ?? 0) - (groupDepth.get(b.id) ?? 0),
  );
  for (const g of sorted) {
    const abs = computeBox(g.id);
    const parent = validParent(g);
    const pAbs = parent ? computeBox(parent) : undefined;
    const pos = pAbs ? { x: abs.x - pAbs.x, y: abs.y - pAbs.y } : { x: abs.x, y: abs.y };
    nodes.push({
      id: g.id,
      type: g.frame ? "kframe" : "kgroup",
      position: pos,
      width: abs.width,
      height: abs.height,
      data: frameData(g, groupDepth.get(g.id) ?? 0, groupHue.get(g.id), canvas.sketch),
      style: { width: abs.width, height: abs.height },
      draggable: false,
      selectable: false,
      ...(parent ? { parentId: parent, extent: "parent" as const } : {}),
    });
  }
  for (const n of canvas.nodes) {
    const { width, height } = size(n);
    const g = n.group && groupIds.has(n.group) ? n.group : undefined;
    const ax = n.x ?? 0;
    const ay = n.y ?? 0;
    if (g) {
      const p = computeBox(g);
      nodes.push(makeNode(n, intents.get(n.id) ?? "neutral", ax - p.x, ay - p.y, width, height, g));
    } else {
      nodes.push(makeNode(n, intents.get(n.id) ?? "neutral", ax, ay, width, height));
    }
  }

  let w = 0;
  let h = 0;
  for (const g of canvas.groups) {
    if (validParent(g)) continue;
    const b = computeBox(g.id);
    w = Math.max(w, b.x + b.width);
    h = Math.max(h, b.y + b.height);
  }
  for (const n of canvas.nodes) {
    if (n.group && groupIds.has(n.group)) continue;
    const { width, height } = size(n);
    w = Math.max(w, (n.x ?? 0) + width);
    h = Math.max(h, (n.y ?? 0) + height);
  }
  return { nodes, edges: buildEdges(canvas), width: w, height: h };
}
