"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Circle,
  Copy,
  CopyPlus,
  Database,
  Diamond,
  Maximize2,
  NotepadText,
  Pencil,
  Square,
  SquareStack,
  StickyNote,
  Trash2,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import { cn } from "../../lib/cn";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { edgeColor } from "./auto-design";
import { layoutCanvas, type LaidOut } from "./elk-layout";
import { serializeEdits } from "./serialize";
import type { CanvasIntent, NormalizedCanvas } from "./types";

/** An arrowhead marker tinted to a connector's resolved colour (so head + line always match). */
function markerFor(intent?: CanvasIntent) {
  return { type: MarkerType.ArrowClosed, color: edgeColor(intent), width: 16, height: 16 };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** The shape palette for edit mode — kind + the React-Flow node type + sensible defaults + a
 * single-key shortcut. Covers the everyday FigJam vocabulary so "add a shape" is real, not just notes. */
interface ShapeDef {
  kind: string;
  type: string;
  label: string;
  key: string;
  w: number;
  h: number;
  defLabel: string;
  intent: CanvasIntent;
  Icon: LucideIcon;
}
const SHAPES: ShapeDef[] = [
  {
    kind: "sticky",
    type: "ksticky",
    label: "Sticky",
    key: "s",
    w: 184,
    h: 120,
    defLabel: "Note",
    intent: "yellow",
    Icon: StickyNote,
  },
  {
    kind: "rounded",
    type: "kshape",
    label: "Box",
    key: "b",
    w: 176,
    h: 60,
    defLabel: "Box",
    intent: "blue",
    Icon: Square,
  },
  {
    kind: "card",
    type: "kshape",
    label: "Card",
    key: "c",
    w: 200,
    h: 72,
    defLabel: "Card",
    intent: "purple",
    Icon: SquareStack,
  },
  {
    kind: "note",
    type: "knote",
    label: "Note",
    key: "n",
    w: 224,
    h: 96,
    defLabel: "Note",
    intent: "teal",
    Icon: NotepadText,
  },
  {
    kind: "diamond",
    type: "kshape",
    label: "Decision",
    key: "d",
    w: 152,
    h: 112,
    defLabel: "Decision?",
    intent: "accent",
    Icon: Diamond,
  },
  {
    kind: "cylinder",
    type: "kcyl",
    label: "Store",
    key: "y",
    w: 160,
    h: 92,
    defLabel: "Store",
    intent: "green",
    Icon: Database,
  },
  {
    kind: "circle",
    type: "kshape",
    label: "Circle",
    key: "o",
    w: 112,
    h: 112,
    defLabel: "",
    intent: "blue",
    Icon: Circle,
  },
  {
    kind: "text",
    type: "ktext",
    label: "Text",
    key: "t",
    w: 160,
    h: 44,
    defLabel: "Text",
    intent: "neutral",
    Icon: Type,
  },
];

/** Recolour swatches for the selected node. */
const EDIT_INTENTS: CanvasIntent[] = [
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blue",
  "teal",
  "green",
  "gray",
  "accent",
];

export default function CanvasIsland({
  canvas,
  blockId,
  bare,
  fixedHeight,
}: {
  canvas: NormalizedCanvas;
  blockId?: string;
  /** Drop the outer card chrome (border, margin, maximize) — for embedding (e.g. Walkthrough). */
  bare?: boolean;
  /** Force a fixed board height in px (overrides the content-hugging height). */
  fixedHeight?: number;
}) {
  const [laid, setLaid] = useState<LaidOut | null>(null);
  const [full, setFull] = useState(false);
  // Real rendered sizes of `embed` nodes, fed back so the board re-lays-out to fit them.
  const [measured, setMeasured] = useState<Map<string, { w: number; h: number }>>(() => new Map());

  const onMeasure = useCallback((id: string, w: number, h: number) => {
    setMeasured((prev) => {
      const cur = prev.get(id);
      if (cur && Math.abs(cur.w - w) < 2 && Math.abs(cur.h - h) < 2) return prev;
      const next = new Map(prev);
      next.set(id, { w, h });
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    layoutCanvas(canvas, measured)
      .then((r) => active && setLaid(r))
      .catch(() => active && setLaid({ nodes: [], edges: [], width: 0, height: 0 }));
    return () => {
      active = false;
    };
  }, [canvas, measured]);

  // Close fullscreen on Escape.
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const down = canvas.direction === "down";

  // Only a single ELK `flow` board has one true direction for every edge. Every other layout
  // (row/column/grid/free/manual/board) mixes directions, so route each edge from the side of the
  // source that faces its target — vertical stacks connect bottom→top, lateral links left→right.
  const nearestSide = !["auto", "flow", "tree"].includes(canvas.layout);

  const { nodes, edges } = useMemo(() => {
    if (!laid) return { nodes: [] as Node[], edges: [] as Edge[] };

    // Centre of each node, for free-layout handle selection (nearest-side routing).
    const centre = new Map<string, { x: number; y: number }>();
    for (const n of laid.nodes) {
      centre.set(n.id, {
        x: (n.position.x ?? 0) + (n.width ?? 0) / 2,
        y: (n.position.y ?? 0) + (n.height ?? 0) / 2,
      });
    }

    const edges: Edge[] = laid.edges.map((e) => {
      const kind = (e.data.kind as string) ?? "arrow";
      let sourceHandle = down ? "src-bottom" : "src-right";
      let targetHandle = down ? "tgt-top" : "tgt-left";
      // Absolutely-placed boards: leave from / arrive at the side facing the other node.
      if (nearestSide) {
        const a = centre.get(e.source);
        const b = centre.get(e.target);
        if (a && b) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (Math.abs(dx) >= Math.abs(dy)) {
            sourceHandle = dx >= 0 ? "src-right" : "src-left";
            targetHandle = dx >= 0 ? "tgt-left" : "tgt-right";
          } else {
            sourceHandle = dy >= 0 ? "src-bottom" : "src-top";
            targetHandle = dy >= 0 ? "tgt-top" : "tgt-bottom";
          }
        }
      }
      // An explicit fromSide/toSide overrides the auto choice — for a deliberately routed path.
      const fromSide = e.data.fromSide as string | undefined;
      const toSide = e.data.toSide as string | undefined;
      if (fromSide) sourceHandle = `src-${fromSide}`;
      if (toSide) targetHandle = `tgt-${toSide}`;
      const marker = markerFor(e.data.intent as CanvasIntent | undefined);
      return {
        ...e,
        sourceHandle,
        targetHandle,
        // ELK's orthogonal route for this edge (if any) — KEdge draws along it to avoid nodes.
        data: { ...e.data, route: laid.routes?.[e.id] },
        markerEnd: kind === "line" ? undefined : marker,
        markerStart: kind === "bidirectional" ? marker : undefined,
      } as Edge;
    });
    // Embed nodes get an onMeasure callback so they can report their rendered size for re-layout.
    const nodes: Node[] = laid.nodes.map((n) =>
      n.type === "kembed"
        ? ({
            ...n,
            data: { ...n.data, onMeasure: (w: number, h: number) => onMeasure(n.id, w, h) },
          } as unknown as Node)
        : (n as unknown as Node),
    );
    return { nodes, edges };
  }, [laid, down, nearestSide, onMeasure]);

  // ── Edit mode — drag / add / rename / delete, then "Copy spec" round-trips to our JSON. ──
  // Read-only stays the default path (uncontrolled `nodes`); editing switches to controlled
  // React-Flow state seeded from the current layout, so the view never jumps on toggle.
  const canEdit = !bare;
  const [editing, setEditing] = useState(false);
  const [editNodes, setEditNodes, onEditNodesChange] = useNodesState<Node>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const enterEdit = useCallback(() => {
    // Seed from the laid-out board the first time; keep prior edits on re-entry.
    setEditNodes((prev) => (prev.length ? prev : nodes));
    setSelId(null);
    setEditing(true);
  }, [nodes, setEditNodes]);

  const exitEdit = useCallback(() => {
    setEditing(false);
    setSelId(null);
  }, []);

  const [menu, setMenu] = useState<{ x: number; y: number; nodeId: string | null } | null>(null);

  const addShape = useCallback(
    (kind: string) => {
      const s = SHAPES.find((x) => x.kind === kind) ?? SHAPES[0];
      if (!s) return;
      const id = `n-${kind}-${Date.now().toString(36).slice(-4)}`;
      setEditNodes((ns) => {
        const off = 28 * (ns.filter((n) => n.id.startsWith("n-")).length % 6);
        const node: Node = {
          id,
          type: s.type,
          position: { x: 64 + off, y: 64 + off },
          width: s.w,
          height: s.h,
          data: { kind: s.kind, label: s.defLabel, intent: s.intent },
        };
        return [...ns, node];
      });
      setSelId(id);
    },
    [setEditNodes],
  );

  const renameSel = useCallback(
    (label: string) => {
      if (!selId) return;
      setEditNodes((ns) =>
        ns.map((n) => (n.id === selId ? { ...n, data: { ...n.data, label } } : n)),
      );
    },
    [selId, setEditNodes],
  );

  const recolor = useCallback(
    (id: string, intent: CanvasIntent) => {
      setEditNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, intent } } : n)),
      );
    },
    [setEditNodes],
  );

  const duplicate = useCallback(
    (id: string) => {
      setEditNodes((ns) => {
        const src = ns.find((n) => n.id === id);
        if (!src) return ns;
        return [
          ...ns,
          {
            ...src,
            id: `${src.id}-copy-${Date.now().toString(36).slice(-3)}`,
            position: { x: src.position.x + 28, y: src.position.y + 28 },
            selected: false,
          },
        ];
      });
    },
    [setEditNodes],
  );

  const removeNode = useCallback(
    (id: string) => {
      setEditNodes((ns) => ns.filter((n) => n.id !== id));
      setSelId((cur) => (cur === id ? null : cur));
    },
    [setEditNodes],
  );

  const deleteSel = useCallback(() => {
    if (selId) removeNode(selId);
  }, [selId, removeNode]);

  const copySpec = useCallback(() => {
    const spec = serializeEdits(editNodes, canvas);
    void navigator.clipboard?.writeText(JSON.stringify(spec, null, 2)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [editNodes, canvas]);

  const selNode = editing ? (editNodes.find((n) => n.id === selId) ?? null) : null;

  // Single-key shape shortcuts while editing; Esc clears selection + the context menu.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        setSelId(null);
        setMenu(null);
        return;
      }
      const s = SHAPES.find((x) => x.key === e.key.toLowerCase());
      if (s) {
        e.preventDefault();
        addShape(s.kind);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, addShape]);

  // Hug the laid-out content so there's no dead vertical space. `fitView` fits the graph to the
  // smaller of the width/height scales, so the container height should track the graph's own
  // aspect ratio (at a typical doc-column width) — that removes the dead band on wide boards AND
  // gives tall, top-down boards the room to show the whole story rather than a cropped slice.
  const COL = 820; // typical content-column width in the docs layout
  const PAD = 0.06; // mirrors fitViewOptions padding
  const MAX_H = 760; // a flagship board can be tall, but never runaway
  const hugged = useMemo(() => {
    if (fixedHeight) return `${fixedHeight}px`;
    if (typeof canvas.height === "number") return `${canvas.height}px`;
    if (canvas.height) return canvas.height;
    if (!laid || laid.width <= 0 || laid.height <= 0) return "440px";
    const scale = Math.min(1.1, (COL * (1 - PAD * 2)) / laid.width);
    const scaledH = laid.height * scale;
    return `${clamp(Math.round(scaledH / (1 - PAD * 2)) + 36, 280, MAX_H)}px`;
  }, [laid, canvas.height, fixedHeight]);

  // The zoom `fitView` lands on, given the hugged height. For a board taller than `MAX_H` allows,
  // this drops below the default 0.4 floor — so we lower the floor to match, letting tall boards
  // fit whole instead of cropping. Small boards never bind here (they get a small, snug height).
  const fitMinZoom = useMemo(() => {
    if (!laid || laid.width <= 0 || laid.height <= 0) return 0.4;
    const widthScale = Math.min(1.1, (COL * (1 - PAD * 2)) / laid.width);
    const heightScale = (MAX_H * (1 - PAD * 2)) / laid.height;
    return clamp(Math.min(widthScale, heightScale) - 0.02, 0.2, 0.4);
  }, [laid]);

  // Hide the minimap unless the board is genuinely large AND we're full-screen — embedded boards
  // fit-to-view (nothing to navigate), so a corner minimap there is pure clutter that overlaps
  // content. In full-screen you pan a large board, and there's room for the overview to sit clear.
  const showMinimap = full && (laid?.nodes.length ?? 0) >= 20;

  const board = (
    <ReactFlowProvider>
      {/* Hand-drawn connector filter: low-frequency turbulence displaces the stroke a touch, so
          `kind:"sketch"` edges waver like a marker. Token-coloured, theme-equal, zero deps. */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <filter id="kp-sketch" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves={2}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={2.4}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <ReactFlow
        nodes={editing ? editNodes : nodes}
        edges={edges}
        onNodesChange={editing ? onEditNodesChange : undefined}
        onNodeClick={
          editing
            ? (_, n) => {
                setSelId(n.id);
                setMenu(null);
              }
            : undefined
        }
        onPaneClick={
          editing
            ? () => {
                setSelId(null);
                setMenu(null);
              }
            : undefined
        }
        onNodeContextMenu={
          editing
            ? (e, n) => {
                e.preventDefault();
                setSelId(n.id);
                setMenu({ x: e.clientX, y: e.clientY, nodeId: n.id });
              }
            : undefined
        }
        onPaneContextMenu={
          editing
            ? (e) => {
                e.preventDefault();
                const ev = e as MouseEvent;
                setMenu({ x: ev.clientX, y: ev.clientY, nodeId: null });
              }
            : undefined
        }
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          // A bare board lives in a fixed-height frame (landing showcase, Walkthrough) and is the
          // whole point of its frame — pad it tightly so a dense board fills the space instead of
          // floating small in a sea of empty padding. (Non-bare keeps its roomier doc padding.)
          padding: bare ? 0.04 : full ? 0.08 : 0.06,
          // A bare board lives in a fixed-height frame (Walkthrough) — let fit-view zoom out as
          // far as needed so the whole board is always visible, never cropped. A dense landscape
          // board can need a deeper zoom-out than 0.2 to fit a half-width frame whole, so give bare
          // a lower floor (it matches the board-level `minZoom` clamp below).
          minZoom: bare ? 0.1 : full ? 0.2 : fitMinZoom,
          maxZoom: 1.1,
        }}
        // Bare boards are display-only embeds (landing showcase, strip tiles, etc.) — fully lock
        // interaction so page scroll/zoom passes straight through and never pans/zooms the board.
        // (`bare` can never be in edit mode: `canEdit = !bare`.)
        nodesDraggable={!bare && editing}
        nodesConnectable={false}
        elementsSelectable={!bare}
        zoomOnScroll={!bare}
        zoomOnPinch={!bare}
        zoomOnDoubleClick={!bare}
        panOnScroll={!bare}
        panOnDrag={bare ? false : undefined}
        preventScrolling={!bare}
        proOptions={{ hideAttribution: true }}
        minZoom={bare ? 0.1 : 0.2}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.4}
          color="var(--kp-canvas-dot)"
        />
        {/* Zoom/fullscreen controls are noise on a locked display-only (bare) embed. */}
        {!bare && <Controls showInteractive={false} />}
        {showMinimap && (
          <MiniMap
            pannable
            zoomable
            ariaLabel={null}
            nodeColor="var(--kp-canvas-minimap-node)"
            nodeStrokeWidth={0}
            nodeBorderRadius={3}
            maskColor="color-mix(in oklab, var(--color-fd-background) 80%, transparent)"
            maskStrokeColor="var(--color-fd-border)"
            maskStrokeWidth={1}
          />
        )}
      </ReactFlow>
    </ReactFlowProvider>
  );

  const MaxBtn = (
    <button
      type="button"
      onClick={() => setFull((v) => !v)}
      aria-label={full ? "Exit full screen" : "Maximize canvas"}
      className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground shadow-sm transition hover:border-kp-accent-border hover:text-fd-foreground"
    >
      {full ? <X className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );

  // Edit / Done toggle — sits left of the maximize button.
  const EditBtn = (
    <button
      type="button"
      onClick={editing ? exitEdit : enterEdit}
      aria-label={editing ? "Done editing" : "Edit board"}
      title={editing ? "Done editing" : "Edit board (drag, add, rename, then Copy spec)"}
      className={cn(
        "absolute top-3 right-12 z-10 grid size-8 place-items-center rounded-md border shadow-sm transition",
        editing
          ? "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text"
          : "border-fd-border bg-fd-card text-fd-muted-foreground hover:border-kp-accent-border hover:text-fd-foreground",
      )}
    >
      {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
    </button>
  );

  const swatchStyle = (it: CanvasIntent) => ({
    background: it === "accent" ? "var(--kp-accent)" : `var(--kp-hue-${it})`,
  });

  // The edit toolbar — a FigJam-style floating bar: the full shape palette, the selection's
  // rename + recolour + duplicate + delete, then Copy spec. (Right-click adds the context menu.)
  const EditBar = (
    <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-2xl border border-fd-border bg-fd-card/95 p-1.5 shadow-lg backdrop-blur">
      {SHAPES.map((s) => (
        <button
          key={s.kind}
          type="button"
          onClick={() => addShape(s.kind)}
          title={`${s.label}  (${s.key.toUpperCase()})`}
          className="grid size-8 place-items-center rounded-lg text-fd-muted-foreground transition hover:bg-fd-muted hover:text-fd-foreground"
        >
          <s.Icon className="size-[18px]" />
        </button>
      ))}
      {selNode && (
        <>
          <span className="mx-0.5 h-5 w-px bg-fd-border" />
          <input
            value={String(selNode.data.label ?? "")}
            onChange={(e) => renameSel(e.target.value)}
            placeholder="Label…"
            className="w-28 rounded-md border border-fd-border bg-fd-background px-2 py-1 text-xs text-fd-foreground outline-none focus:border-kp-accent-border"
          />
          <div className="flex items-center gap-0.5">
            {EDIT_INTENTS.map((it) => (
              <button
                key={it}
                type="button"
                onClick={() => recolor(selNode.id, it)}
                aria-label={`Colour ${it}`}
                title={it}
                className="size-4 rounded-full ring-1 ring-black/10 transition hover:scale-110 dark:ring-white/15"
                style={swatchStyle(it)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => duplicate(selNode.id)}
            aria-label="Duplicate"
            title="Duplicate"
            className="grid size-7 place-items-center rounded-md text-fd-muted-foreground transition hover:bg-fd-muted hover:text-fd-foreground"
          >
            <CopyPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={deleteSel}
            aria-label="Delete"
            title="Delete (⌫)"
            className="grid size-7 place-items-center rounded-md text-fd-muted-foreground transition hover:bg-fd-muted hover:text-kp-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </>
      )}
      <span className="mx-0.5 h-5 w-px bg-fd-border" />
      <button
        type="button"
        onClick={copySpec}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-kp-accent-text transition hover:bg-kp-accent-weak"
      >
        {copied ? (
          <>
            <Check className="size-3.5" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" /> Copy spec
          </>
        )}
      </button>
    </div>
  );

  // Right-click menu — add shapes on the pane, or act on a node.
  const ContextMenu =
    editing && menu ? (
      <div
        className="fixed z-50 min-w-[176px] overflow-hidden rounded-xl border border-fd-border bg-fd-card py-1 text-sm shadow-xl"
        style={{ left: Math.min(menu.x, window.innerWidth - 200), top: menu.y }}
        onMouseLeave={() => setMenu(null)}
      >
        {menu.nodeId ? (
          <>
            <button
              type="button"
              onClick={() => {
                duplicate(menu.nodeId!);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-fd-foreground transition hover:bg-fd-muted"
            >
              <CopyPlus className="size-3.5" /> Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                removeNode(menu.nodeId!);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-fd-foreground transition hover:bg-fd-muted hover:text-kp-danger"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
            <div className="mt-1 border-t border-fd-border px-3 pt-2 pb-1">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
                Colour
              </div>
              <div className="flex flex-wrap gap-1">
                {EDIT_INTENTS.map((it) => (
                  <button
                    key={it}
                    type="button"
                    onClick={() => {
                      recolor(menu.nodeId!, it);
                      setMenu(null);
                    }}
                    aria-label={`Colour ${it}`}
                    title={it}
                    className="size-5 rounded-full ring-1 ring-black/10 transition hover:scale-110 dark:ring-white/15"
                    style={swatchStyle(it)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
              Add shape
            </div>
            {SHAPES.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() => {
                  addShape(s.kind);
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-fd-foreground transition hover:bg-fd-muted"
              >
                <s.Icon className="size-3.5 text-fd-muted-foreground" />
                <span className="flex-1">{s.label}</span>
                <kbd className="rounded border border-fd-border bg-fd-muted px-1 font-mono text-[10px] text-fd-muted-foreground">
                  {s.key.toUpperCase()}
                </kbd>
              </button>
            ))}
          </>
        )}
      </div>
    ) : null;

  if (!laid) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-fd-background text-sm text-fd-muted-foreground",
          bare ? "h-full" : "not-prose my-6 h-[420px] rounded-xl border border-fd-border",
        )}
        style={bare ? { height: hugged } : undefined}
      >
        <span className="animate-pulse">Laying out…</span>
      </div>
    );
  }

  return (
    <>
      <div
        data-kp-block={blockId}
        className={cn(
          "relative overflow-hidden bg-fd-background",
          bare ? "h-full" : "not-prose my-6 rounded-xl border border-fd-border",
        )}
        style={{ height: hugged }}
        aria-label={canvas.title ? `Whiteboard: ${canvas.title}` : "Whiteboard"}
      >
        {!full && !bare && canEdit && EditBtn}
        {!full && !bare && editing && EditBar}
        {!full && !bare && ContextMenu}
        {!full && !bare && MaxBtn}
        {!full && board}
      </div>

      {full && (
        <div
          className={cn("fixed inset-0 z-50 flex flex-col bg-fd-background/98 backdrop-blur-sm")}
        >
          <div className="flex items-center justify-between border-b border-fd-border px-4 py-2.5">
            <span className="text-sm font-semibold text-fd-foreground">
              {canvas.title ?? "Whiteboard"}
            </span>
            {MaxBtn}
          </div>
          <div className="relative flex-1">{board}</div>
        </div>
      )}
    </>
  );
}
