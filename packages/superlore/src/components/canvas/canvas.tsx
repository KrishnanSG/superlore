"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { z } from "zod";
import { parseCanvasSpec } from "./parse-spec";
import { Isolate } from "../error-boundary";
import { registerKnowledge, serializeComponent, type ExtractCtx } from "../../knowledge/registry";
import type { DiagramNode, RelKind } from "../../knowledge/primitives";

const CanvasIsland = dynamic(() => import("./canvas-island"), {
  ssr: false,
  loading: () => (
    <div className="not-prose my-6 flex h-[420px] items-center justify-center rounded-xl border border-fd-border bg-fd-background text-sm text-fd-muted-foreground">
      <span className="animate-pulse">Loading canvas…</span>
    </div>
  ),
});

export interface CanvasProps {
  /** A superlore-canvas spec object. */
  spec?: unknown;
  /** A superlore-canvas spec as a JSON string (e.g. from a fenced block). */
  json?: string;
  /**
   * The block id stamped by the docs rehype plugin (`data-kp-block`). Forwarded onto the board's
   * root element so the board is a stable anchor for comments / deep links — not consumed otherwise.
   */
  "data-kp-block"?: string;
  /** Render without the outer card chrome (border, margin, maximize) — for embedding in another
   * frame, e.g. a Walkthrough. The board surface only. */
  bare?: boolean;
  /** Fixed board height in px (otherwise the board hugs its content). */
  height?: number;
}

/**
 * superlore Canvas — "FigJam, in code." Authored as a `superlore-canvas` JSON spec (object or string),
 * auto-designed + auto-laid-out, rendered as a lazy client island. The spec IS the knowledge
 * graph the MCP serves.
 */
export function Canvas({ spec, json, "data-kp-block": blockId, bare, height }: CanvasProps) {
  const canvas = useMemo(() => {
    try {
      return parseCanvasSpec(json ?? spec);
    } catch {
      return null;
    }
  }, [spec, json]);

  if (!canvas) {
    return (
      <div
        data-kp-block={blockId}
        className="not-prose my-6 rounded-xl border border-[color-mix(in_oklab,var(--kp-danger)_50%,var(--color-fd-border))] bg-[color-mix(in_oklab,var(--kp-danger)_8%,var(--color-fd-card))] p-4 text-sm text-fd-foreground"
      >
        Invalid <code className="font-mono">superlore-canvas</code> spec — expected JSON with{" "}
        <code className="font-mono">nodes</code> (and optional{" "}
        <code className="font-mono">edges</code>/<code className="font-mono">groups</code>).
      </div>
    );
  }
  // Contain a runtime layout/render fault (an ELK edge case, a bad node ref) so a single bad board
  // never crashes the page — important when Canvas is mounted directly (e.g. the Viewer), outside
  // the MDX map's boundary.
  return (
    <Isolate name="Canvas">
      <CanvasIsland canvas={canvas} blockId={blockId} bare={bare} fixedHeight={height} />
    </Isolate>
  );
}

/** Alias for authors who prefer `<Whiteboard>`. */
export const Whiteboard = Canvas;

/* ------------------------------------------------------------- knowledge face --- */

const canvasFace = {
  schema: z.object({ spec: z.unknown().optional(), json: z.string().optional() }),
  toKnowledge: (p: CanvasProps, ctx: ExtractCtx) => {
    // A malformed spec must not break build-time extraction / the MCP index — degrade to a stub.
    let canvas;
    try {
      canvas = parseCanvasSpec(p.json ?? p.spec);
    } catch {
      return {
        kind: "diagram",
        id: ctx.nextId("canvas"),
        syntax: "canvas",
        graph: { nodes: [], edges: [] },
      } satisfies DiagramNode;
    }
    const labels = canvas.nodes
      .map((n) => n.label)
      .filter((l): l is string => Boolean(l))
      .join(", ");
    return {
      kind: "diagram",
      id: ctx.nextId(canvas.title ?? "canvas"),
      title: canvas.title,
      summary: labels ? labels.slice(0, 200) : undefined,
      syntax: "canvas",
      graph: {
        nodes: canvas.nodes.map((n) => {
          const base = { id: n.id, label: n.label, group: n.group, kind: n.kind };
          // An embedded component carries its own typed knowledge — serialize it so the MCP sees
          // the Timeline/Comparison/StatGrid data, not just "a node on a board".
          if (n.kind === "embed" && n.component) {
            const embed = serializeComponent(n.component, n.props ?? {}, ctx);
            if (embed) return { ...base, embed };
          }
          return base;
        }),
        edges: canvas.edges.map((e) => ({
          from: e.from,
          to: e.to,
          label: e.label,
          rel: e.rel,
        })),
      },
      refs: canvas.edges
        .filter((e) => e.rel)
        .map((e) => ctx.resolveRef(`#${e.to}`, e.rel as RelKind, e.label)),
    } satisfies DiagramNode;
  },
} as const;

registerKnowledge("Canvas", canvasFace);
registerKnowledge("Whiteboard", canvasFace);
