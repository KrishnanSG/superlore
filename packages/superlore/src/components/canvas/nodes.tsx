"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "../../lib/cn";
import { Icon } from "../mintlify";
import { INTENT_CLASS, INTENT_HUE_VAR, radiusClass, sketchColors } from "./auto-design";
import { EMBED_COMPONENTS } from "./embeds";
import { SketchShape, type SketchKind } from "./sketch-shape";
import type { CanvasIntent, CanvasShapeKind } from "./types";

interface ShapeData {
  kind: CanvasShapeKind;
  label?: string;
  body?: string;
  intent: CanvasIntent;
  icon?: string;
  src?: string;
  /** Render text in the handwriting face. */
  hand?: boolean;
  /** Dashed border (tentative/proposed). */
  dashed?: boolean;
  /** Hand outline only — no fill (a "circle this" emphasis ring). */
  outline?: boolean;
  /** Stack depth — how many cards peek behind the front one. */
  count?: number;
  /** For `kind:"embed"` — the registered component name + its props. */
  component?: string;
  props?: Record<string, unknown>;
  /** Injected by the island so a measured embed can trigger one re-layout to fit its content. */
  onMeasure?: (w: number, h: number) => void;
}

/** The hand-drawn text face, applied inline so it overrides the surface font deterministically. */
const HAND_FONT = { fontFamily: "var(--font-hand), ui-rounded, cursive" } as const;
interface GroupData {
  label?: string;
  /** A lucide icon name shown in the header chip. */
  icon?: string;
  intent?: CanvasIntent;
  frame?: boolean;
  /** A dashed (vs. solid) section border — a loose/working grouping. */
  dashed?: boolean;
  depth?: number;
  /** Hue var derived from the section's contents (e.g. `var(--kp-hue-teal)`). */
  hue?: string;
  /** Lay a subtle dot grid inside the section. */
  dotted?: boolean;
  /** Render the section title in the handwriting face (hand-drawn boards). */
  hand?: boolean;
}

/** A subtle dot-grid ground for a section, tinted to the section's hue. Sits under the contents. */
function DottedGround({ radius }: { radius: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-[3px]"
      style={{
        borderRadius: radius,
        backgroundImage: "radial-gradient(var(--kp-canvas-dot) 1.1px, transparent 1.2px)",
        backgroundSize: "18px 18px",
        backgroundPosition: "10px 10px",
        opacity: 0.7,
      }}
    />
  );
}

const hiddenHandle = {
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  border: "none",
  background: "transparent",
} as const;

function Anchors() {
  // Source + target on all four sides, so flow boards use the directional pair and free boards
  // can pick the side nearest the other node — no spaghetti wrap-arounds.
  return (
    <>
      <Handle
        id="tgt-left"
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="tgt-top"
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="tgt-right"
        type="target"
        position={Position.Right}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="tgt-bottom"
        type="target"
        position={Position.Bottom}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="src-left"
        type="source"
        position={Position.Left}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="src-top"
        type="source"
        position={Position.Top}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="src-right"
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        id="src-bottom"
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={hiddenHandle}
      />
    </>
  );
}

// Resting shadow + hover lift + crisp 1px border live in `.kp-canvas-node` (superlore.css);
// selection swaps in the DESIGN.md focus ring via `.kp-canvas-selected`.
const SURFACE = "kp-canvas-node";
const SELECTED = "kp-canvas-selected";

function Label({ data }: { data: ShapeData }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 leading-snug whitespace-pre-line">
      {data.icon && <Icon icon={data.icon} size={15} />}
      {data.label}
    </span>
  );
}

/** Stable per-node seed so a hand-drawn shape's wobble doesn't change between renders. */
function handSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2000) + 1;
}

/**
 * A node drawn by hand (`hand: true`) — a rough.js shape behind crisp handwritten text. Used for
 * the *accent* elements of a brainstorm (a circled idea, a scribbled box), not whole boards.
 */
function HandBox({
  d,
  id,
  width,
  height,
  shape,
  children,
  align = "center",
}: {
  d: ShapeData;
  id: string;
  width?: number;
  height?: number;
  shape: SketchKind;
  children: ReactNode;
  align?: "center" | "top-left";
}) {
  const c = sketchColors(d.intent);
  return (
    <>
      <Anchors />
      <div
        className="relative h-full w-full"
        style={{ "--kp-sk-stroke": c.stroke, "--kp-sk-fill": c.fill } as CSSProperties}
      >
        {width && height ? (
          <SketchShape
            w={width}
            h={height}
            kind={shape}
            seed={handSeed(id)}
            dashed={d.dashed}
            noFill={d.outline}
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 flex px-4 text-[15px] leading-snug",
            align === "top-left"
              ? "items-start justify-start pt-3.5 text-left"
              : "items-center justify-center text-center",
          )}
          style={HAND_FONT}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export function ShapeNode({ data, selected, id, width, height }: NodeProps) {
  const d = data as unknown as ShapeData;
  const kind = d.kind;
  const round = kind === "circle" || kind === "ellipse";

  if (d.hand) {
    const shape: SketchKind = kind === "diamond" ? "diamond" : round ? "ellipse" : "rect";
    return (
      <HandBox d={d} id={id} width={width} height={height} shape={shape}>
        <Label data={d} />
      </HandBox>
    );
  }

  if (kind === "diamond") {
    return (
      <>
        <Anchors />
        <div className="relative h-full w-full">
          <div
            className={cn(
              "absolute inset-[12%] rotate-45 rounded-[10px] border",
              INTENT_CLASS[d.intent],
              d.dashed && "border-dashed",
              SURFACE,
              selected && SELECTED,
            )}
          />
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-sm font-medium">
            <Label data={d} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Anchors />
      <div
        className={cn(
          "flex h-full w-full items-center justify-center border px-3 py-2 text-center text-sm font-medium",
          INTENT_CLASS[d.intent],
          radiusClass(kind),
          d.dashed && "border-dashed",
          // circles/ellipses need a visible surface step so they don't vanish (esp. on dark)
          round && d.intent === "neutral" && "bg-fd-muted",
          SURFACE,
          selected && SELECTED,
        )}
        style={d.hand ? HAND_FONT : undefined}
      >
        <Label data={d} />
      </div>
    </>
  );
}

/**
 * CSS `clip-path` polygons per kind. The clipped surface reuses `.kp-canvas-node` +
 * `INTENT_CLASS` so every shape is auto-designed and theme-aware. Coordinates are percentages
 * of the node box, so they scale with `measureNode`'s per-kind sizing.
 */
const SHAPE_CLIP: Partial<Record<CanvasShapeKind, string>> = {
  triangle: "polygon(50% 0, 100% 100%, 0 100%)",
  "triangle-down": "polygon(0 0, 100% 0, 50% 100%)",
  pentagon: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)",
  hexagon: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
  octagon: "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)",
  star: "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  cross:
    "polygon(35% 0, 65% 0, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0 65%, 0 35%, 35% 35%)",
  "arrow-right": "polygon(0 25%, 60% 25%, 60% 0, 100% 50%, 60% 100%, 60% 75%, 0 75%)",
  "arrow-left": "polygon(40% 0, 40% 25%, 100% 25%, 100% 75%, 40% 75%, 40% 100%, 0 50%)",
  chevron: "polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%)",
  parallelogram: "polygon(25% 0, 100% 0, 75% 100%, 0 100%)",
  trapezoid: "polygon(20% 0, 80% 0, 100% 100%, 0 100%)",
};

type Box = { top?: string; right?: string; bottom?: string; left?: string };

/**
 * Where the centered, non-clipped label sits within the box, so it never lands on a clipped
 * point (triangle apex, star tip, arrow head). Values are percentage insets that keep the label
 * over the shape's solid body. Same approach as `diamond`: clip the surface, float the label
 * above it in its own un-clipped layer. Kinds without an entry use the full box (centered).
 */
const LABEL_BOX: Partial<Record<CanvasShapeKind, Box>> = {
  triangle: { top: "32%", right: "12%", bottom: "6%", left: "12%" }, // lower third, off the apex
  "triangle-down": { top: "6%", right: "12%", bottom: "32%", left: "12%" }, // upper third
  star: { top: "30%", right: "20%", bottom: "26%", left: "20%" }, // the star's central body
  "arrow-right": { top: "0", right: "42%", bottom: "0", left: "4%" }, // the shaft, not the head
  "arrow-left": { top: "0", right: "4%", bottom: "0", left: "42%" },
  chevron: { top: "0", right: "28%", bottom: "0", left: "6%" }, // the body, before the point
  parallelogram: { top: "0", right: "22%", bottom: "0", left: "22%" },
  trapezoid: { top: "0", right: "18%", bottom: "0", left: "18%" },
};

/**
 * Clip-path shapes (polygons, arrows, chevron, cross). The fill is a clipped surface; the label
 * lives in a separate, un-clipped overlay layer centered over the shape's solid body so it stays
 * readable even when a centered label would overflow the clip.
 */
export function PolyNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  const clip = SHAPE_CLIP[d.kind];
  const box = LABEL_BOX[d.kind];
  return (
    <>
      <Anchors />
      <div className="relative h-full w-full">
        <div
          className={cn(
            "absolute inset-0 border",
            INTENT_CLASS[d.intent],
            d.dashed && "border-dashed",
            SURFACE,
            selected && SELECTED,
          )}
          style={{ clipPath: clip, WebkitClipPath: clip }}
        />
        <div
          className="absolute flex items-center justify-center px-2 text-center text-sm leading-tight font-medium"
          style={box ?? { inset: 0 }}
        >
          <Label data={d} />
        </div>
      </div>
    </>
  );
}

/**
 * Speech bubble — a rounded surface with an integral pointed tail. The tail is a small square
 * rotated 45°, sharing the bubble's surface + border, sitting half-behind the bubble so only its
 * downward point (two bordered edges) shows — the classic, crisp FigJam bubble, no SVG.
 */
export function CalloutNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div className="relative h-full w-full">
        {/* Tail first (painted under the bubble). border-r + border-b form the downward point. */}
        <div
          className={cn(
            "absolute bottom-[3%] left-[22%] size-4 rotate-45 border-r border-b",
            INTENT_CLASS[d.intent],
          )}
        />
        {/* Bubble on top — its opaque fill covers the tail's inner half, leaving the point. */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 bottom-[15%] z-[1] flex items-center justify-center rounded-[14px] border px-3 text-center text-sm font-medium",
            INTENT_CLASS[d.intent],
            d.dashed && "border-dashed",
            SURFACE,
            selected && SELECTED,
          )}
          style={d.hand ? HAND_FONT : undefined}
        >
          <Label data={d} />
        </div>
      </div>
    </>
  );
}

/** Document — a page with a folded/wavy bottom edge (clip-path). */
export function DocumentNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  // A single gentle fold across the bottom edge — a page, not torn teeth.
  const clip = "polygon(0 0, 100% 0, 100% 84%, 66% 76%, 33% 92%, 0 84%)";
  return (
    <>
      <Anchors />
      <div className="relative h-full w-full">
        <div
          className={cn(
            "absolute inset-0 border",
            INTENT_CLASS[d.intent],
            d.dashed && "border-dashed",
            SURFACE,
            selected && SELECTED,
          )}
          style={{ clipPath: clip, WebkitClipPath: clip }}
        />
        <div className="absolute inset-x-0 top-0 bottom-[20%] flex items-center justify-center px-3 text-center text-sm font-medium">
          <Label data={d} />
        </div>
      </div>
    </>
  );
}

/** Predefined process — a rect with two vertical inner bars on either side. */
export function ProcessNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-[6px] border px-7 text-center text-sm font-medium",
          INTENT_CLASS[d.intent],
          d.dashed && "border-dashed",
          SURFACE,
          selected && SELECTED,
        )}
      >
        <span className="pointer-events-none absolute inset-y-0 left-[10%] w-px bg-current opacity-40" />
        <span className="pointer-events-none absolute inset-y-0 right-[10%] w-px bg-current opacity-40" />
        <Label data={d} />
      </div>
    </>
  );
}

export function StickyNode({ data, selected, id, width, height }: NodeProps) {
  const d = data as unknown as ShapeData;
  if (d.hand)
    return (
      <HandBox d={d} id={id} width={width} height={height} shape="rect" align="top-left">
        {d.label}
      </HandBox>
    );
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "relative flex h-full w-full items-start rounded-[4px] border p-3 text-sm font-medium",
          INTENT_CLASS[d.intent],
          d.dashed && "border-dashed",
          SURFACE,
          selected && SELECTED,
        )}
        style={d.hand ? HAND_FONT : undefined}
      >
        {d.label}
        <span
          className="absolute right-0 bottom-0 h-3.5 w-3.5 bg-black/10"
          style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
        />
      </div>
    </>
  );
}

export function NoteNode({ data, selected, id, width, height }: NodeProps) {
  const d = data as unknown as ShapeData;
  if (d.hand)
    return (
      <HandBox d={d} id={id} width={width} height={height} shape="rect" align="top-left">
        <div className="flex flex-col gap-1">
          {d.label && <div className="font-semibold">{d.label}</div>}
          {d.body && <div className="whitespace-pre-wrap opacity-90">{d.body}</div>}
        </div>
      </HandBox>
    );
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "flex h-full w-full flex-col gap-1 rounded-[12px] border p-3 text-left text-[13px] leading-snug",
          INTENT_CLASS[d.intent],
          d.dashed && "border-dashed",
          SURFACE,
          selected && SELECTED,
        )}
        style={d.hand ? HAND_FONT : undefined}
      >
        {d.label && <div className="font-semibold">{d.label}</div>}
        {d.body && <div className="whitespace-pre-wrap opacity-90">{d.body}</div>}
      </div>
    </>
  );
}

export function CylinderNode({ data, selected, id, width, height }: NodeProps) {
  const d = data as unknown as ShapeData;
  if (d.hand)
    return (
      <HandBox d={d} id={id} width={width} height={height} shape="cylinder">
        <Label data={d} />
      </HandBox>
    );
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "flex h-full w-full items-center justify-center [border-radius:50%_/_16px] border text-center text-sm font-medium",
          INTENT_CLASS[d.intent],
          d.dashed && "border-dashed",
          SURFACE,
          selected && SELECTED,
        )}
      >
        <Label data={d} />
      </div>
    </>
  );
}

/**
 * Free text on the board. A bare `label` is a small caption (centered); add a `body` and it
 * becomes a left-aligned multi-line aside (the "let me explain this bit" paragraph). `hand` puts
 * it in the handwriting face.
 */
export function TextNode({ data }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      {d.body ? (
        <div
          className="px-1 py-0.5 text-left text-[13px] leading-snug whitespace-pre-wrap text-fd-foreground"
          style={d.hand ? HAND_FONT : undefined}
        >
          {d.label && <div className="mb-1 font-semibold">{d.label}</div>}
          {d.body}
        </div>
      ) : (
        <div
          className="px-1 py-0.5 text-center text-sm font-medium text-fd-muted-foreground"
          style={d.hand ? HAND_FONT : undefined}
        >
          {d.label}
        </div>
      )}
    </>
  );
}

/** A big free-floating display title — section captions, "How do we solve this?", a board verdict. */
export function HeadingNode({ data }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "flex h-full w-full items-center justify-center px-1 text-center font-semibold text-fd-foreground",
          d.hand ? "text-[30px] leading-tight font-normal" : "text-2xl tracking-tight",
        )}
        style={d.hand ? HAND_FONT : undefined}
      >
        {d.label}
      </div>
    </>
  );
}

/** A pile of cards — "many of these": records, stories, a dataset, a backlog of work. */
export function StackNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  const layers = Math.max(2, Math.min(4, d.count ?? 3));
  const step = 7; // px offset between stacked cards
  const back = layers - 1;
  const card = `calc(100% - ${back * step}px)`;
  return (
    <>
      <Anchors />
      <div className="relative h-full w-full">
        {/* The layers peeking behind (down-right) the front card — so the pile reads as "many".
            Deepest first, so each draws behind the one in front of it. */}
        {Array.from({ length: back }, (_, i) => {
          const k = back - i; // back-most layer first
          return (
            <div
              key={k}
              className={cn("absolute rounded-[8px] border bg-fd-card", SURFACE)}
              style={{ left: k * step, top: k * step, width: card, height: card }}
            />
          );
        })}
        {/* The front card carries the colour + label. */}
        <div
          className={cn(
            "absolute top-0 left-0 flex items-center justify-center rounded-[8px] border px-3 text-center text-[13px] font-medium",
            INTENT_CLASS[d.intent],
            d.dashed && "border-dashed",
            SURFACE,
            selected && SELECTED,
          )}
          style={{ width: card, height: card }}
        >
          <Label data={d} />
        </div>
      </div>
    </>
  );
}

export function IconNode({ data }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
        <Icon icon={d.icon ?? "box"} size={40} className="text-fd-muted-foreground" />
        {d.label && <span className="text-xs font-medium text-fd-foreground">{d.label}</span>}
      </div>
    </>
  );
}

export function ImageNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-[12px] border border-fd-border bg-fd-card",
          SURFACE,
          selected && SELECTED,
        )}
      >
        {d.src ? (
          // contain, not cover: a screenshot / diagram / logo on a board should never be cropped.
          <img src={d.src} alt={d.label ?? ""} className="h-full w-full object-contain p-1" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-fd-muted-foreground">
            {d.label ?? "image"}
          </div>
        )}
      </div>
    </>
  );
}

export function AnnotationNode({ data }: NodeProps) {
  const d = data as unknown as ShapeData;
  return (
    <>
      <Anchors />
      <div
        className="px-1 text-center text-[17px] leading-tight text-kp-accent-text"
        style={{ fontFamily: "var(--font-hand), ui-rounded, cursive" }}
      >
        {d.label}
      </div>
    </>
  );
}

/**
 * The hue a section is tinted with — its members' colour family (e.g. `var(--kp-hue-teal)`),
 * or the brand accent if the author set an explicit intent / there's nothing to derive from.
 */
function sectionHue(d: GroupData): string {
  if (d.intent) {
    const v = INTENT_HUE_VAR[d.intent];
    if (v) return v;
  }
  return d.hue ?? "var(--kp-accent)";
}

/**
 * A soft group region — lighter than a titled frame. A subtle tinted fill, a dashed border in
 * the same colour family as its contents, and an inset label. Used for loose clusters.
 */
export function GroupNode({ data }: NodeProps) {
  const d = data as unknown as GroupData;
  const hue = sectionHue(d);
  return (
    <div
      className="relative h-full w-full rounded-[18px] border border-dashed"
      style={{
        background: `color-mix(in oklab, ${hue} var(--kp-group-fill), var(--color-fd-background))`,
        borderColor: `color-mix(in oklab, ${hue} var(--kp-group-border), var(--color-fd-border))`,
      }}
    >
      {d.dotted && <DottedGround radius="16px" />}
      {d.label &&
        (d.hand ? (
          <div
            className="relative px-3.5 pt-2 text-[16px] leading-none text-fd-foreground"
            style={{ fontFamily: "var(--font-hand), ui-rounded, cursive" }}
          >
            {d.label}
          </div>
        ) : (
          <div className="relative px-3.5 pt-2.5 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-fd-muted-foreground uppercase">
            {d.label}
          </div>
        ))}
    </div>
  );
}

/**
 * A titled section (FigJam frame). A clearly-bordered, soft-filled rounded region tinted to the
 * colour family of its contents (a lighter shade than the cards inside). Nested sections
 * (`depth > 0`) get a slightly stronger fill + border so the hierarchy reads at a glance.
 */
export function FrameNode({ data }: NodeProps) {
  const d = data as unknown as GroupData;
  const hue = sectionHue(d);
  const nested = (d.depth ?? 0) > 0;
  const fillAmt = nested ? "var(--kp-frame-fill-nested)" : "var(--kp-frame-fill)";
  const borderAmt = nested ? "var(--kp-frame-border-nested)" : "var(--kp-frame-border)";
  return (
    <div
      className={cn("relative h-full w-full rounded-[18px] border", d.dashed && "border-dashed")}
      style={{
        background: `color-mix(in oklab, ${hue} ${fillAmt}, var(--color-fd-background))`,
        borderColor: `color-mix(in oklab, ${hue} ${borderAmt}, var(--color-fd-border))`,
      }}
    >
      {d.dotted && <DottedGround radius="16px" />}
      {d.label &&
        (d.hand ? (
          // Hand-drawn board: the section title is handwritten, on a clean chip on the top edge.
          <div
            className="absolute -top-[15px] left-5 inline-flex items-center rounded-[8px] border bg-fd-card px-3 py-[3px] text-[17px] leading-none text-fd-foreground shadow-[var(--kp-canvas-shadow)]"
            style={{
              fontFamily: "var(--font-hand), ui-rounded, cursive",
              borderColor: `color-mix(in oklab, ${hue} var(--kp-frame-border), var(--color-fd-border))`,
            }}
          >
            {d.label}
          </div>
        ) : (
          // A pill-header tab sitting on the frame's top edge — the FigJam section header.
          <div
            className="absolute -top-[13px] left-5 inline-flex items-center gap-1.5 rounded-[8px] border bg-fd-card px-3 py-[5px] font-mono text-[11px] font-semibold tracking-[0.13em] text-fd-foreground uppercase shadow-[var(--kp-canvas-shadow)]"
            style={{
              borderColor: `color-mix(in oklab, ${hue} var(--kp-frame-border), var(--color-fd-border))`,
            }}
          >
            {d.icon && <Icon icon={d.icon} size={12} className="-ml-0.5 opacity-70" />}
            {d.label}
          </div>
        ))}
    </div>
  );
}

/**
 * A live superlore component placed on the board (`kind:"embed"`). The node renders the registered
 * component with its props, and reports its rendered size back so the layout can fit it. The same
 * props serialise into the canvas's knowledge graph, so the MCP sees the embedded data, not a box.
 */
export function EmbedNode({ data, selected }: NodeProps) {
  const d = data as unknown as ShapeData;
  const Comp = d.component ? EMBED_COMPONENTS[d.component] : undefined;
  const ref = useRef<HTMLDivElement>(null);
  const onMeasure = d.onMeasure;
  useEffect(() => {
    const el = ref.current;
    if (!el || !onMeasure) return;
    // Measure the shrink-to-fit wrapper's own box (offsetWidth/Height) — its size reflects the
    // component's natural size, not the node width we derive from it (which would be circular).
    const report = () => onMeasure(el.offsetWidth, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onMeasure]);
  return (
    <>
      <Anchors />
      {/* Shrink-to-fit (w-max) so the component renders at its natural width, capped so a wide
          table doesn't run away. `nowheel` lets it scroll/interact without panning the canvas. */}
      <div
        ref={ref}
        className={cn(
          "nowheel not-prose inline-block w-max max-w-[680px] min-w-[180px] rounded-[14px] border bg-fd-card p-3",
          INTENT_CLASS[d.intent],
          d.dashed && "border-dashed",
          SURFACE,
          selected && SELECTED,
        )}
      >
        {Comp ? (
          <Comp {...(d.props ?? {})} />
        ) : (
          <span className="text-xs text-fd-muted-foreground">
            Unknown component{d.component ? `: ${d.component}` : ""}
          </span>
        )}
      </div>
    </>
  );
}

export const nodeTypes = {
  kshape: ShapeNode,
  kembed: EmbedNode,
  kpoly: PolyNode,
  kcallout: CalloutNode,
  kdocument: DocumentNode,
  kprocess: ProcessNode,
  ksticky: StickyNode,
  knote: NoteNode,
  kcyl: CylinderNode,
  ktext: TextNode,
  kheading: HeadingNode,
  kstack: StackNode,
  kannot: AnnotationNode,
  kicon: IconNode,
  kimage: ImageNode,
  kgroup: GroupNode,
  kframe: FrameNode,
};
