import type { CanvasIntent, CanvasNodeSpec, CanvasShapeKind } from "./types";

/**
 * The auto-design system. Authors declare semantics (kind + optional intent); this maps them to
 * superlore tokens only (`--kp-*` / `--color-fd-*` / curated `--kp-hue-*`) so every board lands in
 * the brand visual language, light + dark co-equal, with zero styling effort. No raw hex.
 */

/**
 * Surface + border + text classes per intent. These MUST be complete literal strings — Tailwind
 * only generates classes it can find verbatim in source, so no runtime interpolation.
 *
 * The FigJam/Prisma "vibrant but legible" recipe, theme-adaptive via color-mix:
 *   • fill   — a chromatic pastel (~40% of the hue into the card), not a near-white tint;
 *   • border — a saturated same-hue stroke (~84% of the hue) — what makes a node read as "yellow";
 *   • text   — DARK same-hue text (~48% hue mixed into the foreground). Because `--color-fd-foreground`
 *              is near-black in light and near-white in dark, this yields dark-brown-on-yellow in
 *              light and light-on-deep in dark — high contrast, and the single biggest lift away
 *              from the old "pale" look (which used a flat gray `text-fd-foreground` everywhere).
 */
export const INTENT_CLASS: Record<CanvasIntent, string> = {
  neutral: "bg-fd-card border-fd-border text-fd-foreground",
  accent:
    "text-[color-mix(in_oklab,var(--kp-accent)_52%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-accent)_34%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-accent)_84%,var(--color-fd-border))]",
  info: "text-[color-mix(in_oklab,var(--kp-hue-blue)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-blue)_52%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-blue)_88%,var(--color-fd-border))]",
  success:
    "text-[color-mix(in_oklab,var(--kp-hue-green)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-green)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-green)_88%,var(--color-fd-border))]",
  warning:
    "text-[color-mix(in_oklab,var(--kp-hue-orange)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-orange)_56%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-orange)_88%,var(--color-fd-border))]",
  danger:
    "text-[color-mix(in_oklab,var(--kp-hue-red)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-red)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-red)_88%,var(--color-fd-border))]",
  muted: "bg-fd-muted border-fd-border text-fd-muted-foreground",
  gray: "text-[color-mix(in_oklab,var(--kp-hue-gray)_52%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-gray)_30%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-gray)_74%,var(--color-fd-border))]",
  red: "text-[color-mix(in_oklab,var(--kp-hue-red)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-red)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-red)_88%,var(--color-fd-border))]",
  orange:
    "text-[color-mix(in_oklab,var(--kp-hue-orange)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-orange)_56%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-orange)_88%,var(--color-fd-border))]",
  yellow:
    "text-[color-mix(in_oklab,var(--kp-hue-yellow)_52%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-yellow)_60%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-yellow)_90%,var(--color-fd-border))]",
  green:
    "text-[color-mix(in_oklab,var(--kp-hue-green)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-green)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-green)_88%,var(--color-fd-border))]",
  teal: "text-[color-mix(in_oklab,var(--kp-hue-teal)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-teal)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-teal)_88%,var(--color-fd-border))]",
  blue: "text-[color-mix(in_oklab,var(--kp-hue-blue)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-blue)_52%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-blue)_88%,var(--color-fd-border))]",
  purple:
    "text-[color-mix(in_oklab,var(--kp-hue-purple)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-purple)_52%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-purple)_88%,var(--color-fd-border))]",
  pink: "text-[color-mix(in_oklab,var(--kp-hue-pink)_50%,var(--color-fd-foreground))] bg-[color-mix(in_oklab,var(--kp-hue-pink)_54%,var(--color-fd-card))] border-[color-mix(in_oklab,var(--kp-hue-pink)_88%,var(--color-fd-border))]",
};

/** A harmonious, colorful sticky rotation (FigJam-style hues, not random). */
const STICKY_ROTATION: CanvasIntent[] = ["yellow", "blue", "green", "pink", "purple", "teal"];

/**
 * The auto-hue rotation for ordinary shapes (rect/rounded/card/pill…) on a board the author
 * never coloured. FigJam boards have *life* — a flow of plain boxes still carries gentle,
 * harmonious colour. We reserve the loud hues (yellow/pink/red) for stickies + decisions and
 * give structural shapes a calm cool-leaning set (blue → teal → purple → green) at a softer
 * mix (see `INTENT_CLASS.*-soft`), so a naive board reads designed, not rainbow noise. The
 * sequence is deterministic by node order, so the same spec always lays out the same.
 */
const AUTO_HUE_ROTATION: CanvasIntent[] = ["blue", "teal", "purple", "green"];

/** Kinds whose default (un-coloured) appearance should pick up an auto-hue for life. */
const AUTO_HUE_KINDS = new Set<CanvasShapeKind>([
  "rect",
  "rounded",
  "card",
  "pill",
  "circle",
  "ellipse",
  "hexagon",
  "pentagon",
  "octagon",
  "triangle",
  "triangle-down",
  "parallelogram",
  "trapezoid",
  "chevron",
  "arrow-left",
  "arrow-right",
  "process",
  "document",
  "callout",
]);

export function radiusClass(kind: CanvasShapeKind): string {
  switch (kind) {
    case "rect":
      return "rounded-[6px]";
    case "pill":
    case "circle":
    case "ellipse":
      return "rounded-full";
    case "sticky":
      return "rounded-[4px]";
    case "note":
      return "rounded-[12px]";
    default:
      return "rounded-[14px]";
  }
}

/**
 * The CSS hue-anchor variable for an intent (`--kp-hue-blue`, the accent, …) — used to tint a
 * section to the same colour family as its contents. Semantic intents map onto their hue;
 * `neutral`/`muted` (and anything unmapped) fall back to the brand accent so the section still
 * reads as a calm cool region.
 */
export const INTENT_HUE_VAR: Partial<Record<CanvasIntent, string>> = {
  accent: "var(--kp-accent)",
  info: "var(--kp-hue-blue)",
  success: "var(--kp-hue-green)",
  warning: "var(--kp-hue-orange)",
  danger: "var(--kp-hue-red)",
  gray: "var(--kp-hue-gray)",
  red: "var(--kp-hue-red)",
  orange: "var(--kp-hue-orange)",
  yellow: "var(--kp-hue-yellow)",
  green: "var(--kp-hue-green)",
  teal: "var(--kp-hue-teal)",
  blue: "var(--kp-hue-blue)",
  purple: "var(--kp-hue-purple)",
  pink: "var(--kp-hue-pink)",
};

/**
 * The stroke (and arrowhead) colour for a connector given its optional `intent`:
 *   • omitted   → the subtle default connector token (calm grey)
 *   • neutral   → a strong foreground line (the "this is the main path" black arrow)
 *   • a hue / semantic → that colour family, so a flow can be read by colour
 * Token-only, theme-equal.
 */
export function edgeColor(intent?: CanvasIntent): string {
  if (!intent) return "var(--kp-canvas-edge)";
  if (intent === "neutral") return "var(--color-fd-foreground)";
  if (intent === "muted") return "var(--kp-canvas-edge)";
  return INTENT_HUE_VAR[intent] ?? "var(--kp-canvas-edge)";
}

/**
 * Stroke + fill for a hand-drawn (sketch) shape, as CSS strings (inline-style, not Tailwind — so
 * runtime interpolation is fine). Stroke leans into the hue + foreground for a marker feel; fill is
 * the same soft tint a normal node uses. Token-only, theme-equal.
 */
export function sketchColors(intent: CanvasIntent): { stroke: string; fill: string } {
  if (intent === "neutral")
    return {
      stroke: "color-mix(in oklab, var(--color-fd-foreground) 42%, var(--color-fd-border))",
      fill: "var(--color-fd-card)",
    };
  if (intent === "muted")
    return {
      stroke: "color-mix(in oklab, var(--color-fd-foreground) 34%, var(--color-fd-border))",
      fill: "var(--color-fd-muted)",
    };
  if (intent === "accent") return { stroke: "var(--kp-accent)", fill: "var(--kp-accent-weak)" };
  const hue = INTENT_HUE_VAR[intent] ?? "var(--kp-accent)";
  return {
    stroke: `color-mix(in oklab, ${hue} 62%, var(--color-fd-foreground))`,
    fill: `color-mix(in oklab, ${hue} 28%, var(--color-fd-card))`,
  };
}

export interface FrameTone {
  /** The hue var to tint fill + border with (e.g. `var(--kp-hue-teal)`). */
  hue: string;
}

/**
 * Pick a section's tone from the intents of the nodes it contains (the user's FigJam instinct:
 * a section is a *lighter shade of the colour family it holds*, while the cards inside can still
 * vary). We echo the *plurality* content hue. When the top is a multi-way tie — the contents
 * are all distinct, so there's no shared family to echo — we fall back to the calm brand accent
 * rather than latching onto whichever card happened to be declared first. Empty or all-neutral
 * sections fall back to the accent too.
 */
export function frameToneFromMembers(memberIntents: CanvasIntent[]): FrameTone {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const it of memberIntents) {
    const hue = INTENT_HUE_VAR[it];
    if (!hue) continue; // neutral/muted don't vote
    if (!counts.has(hue)) order.push(hue);
    counts.set(hue, (counts.get(hue) ?? 0) + 1);
  }
  let best = "var(--kp-accent)";
  let bestN = 0;
  let tiesAtTop = 0;
  for (const hue of order) {
    const n = counts.get(hue)!;
    if (n > bestN) {
      bestN = n;
      best = hue;
      tiesAtTop = 1;
    } else if (n === bestN) {
      tiesAtTop++;
    }
  }
  // No signal, or every family appears equally often (all distinct) — use the calm accent.
  if (bestN === 0 || tiesAtTop > 1) return { hue: "var(--kp-accent)" };
  return { hue: best };
}

/**
 * Resolve every node's intent. Explicit `intent` always wins. Otherwise the auto-designer is
 * opinionated so a naive board (kind + label only) still looks beautiful and varied:
 *   • stickies / notes  → the colourful sticky rotation (a wall of notes looks designed)
 *   • diamond (decision) → accent violet (the one "this matters" colour)
 *   • cylinder (store)   → green (the datastore convention)
 *   • everything else    → a calm, harmonious auto-hue rotation (cool-leaning), so plain
 *     boxes carry gentle colour instead of reading as a stark grey diagram.
 * The rotations advance in node order, so the result is fully deterministic.
 */
export function resolveIntents(nodes: CanvasNodeSpec[]): Map<string, CanvasIntent> {
  const map = new Map<string, CanvasIntent>();
  let stickyI = 0;
  let hueI = 0;
  for (const n of nodes) {
    if (n.intent) {
      map.set(n.id, n.intent);
      continue;
    }
    const kind = n.kind ?? "rounded";
    if (kind === "sticky" || kind === "note") {
      map.set(n.id, STICKY_ROTATION[stickyI++ % STICKY_ROTATION.length]!);
    } else if (kind === "diamond") {
      map.set(n.id, "accent");
    } else if (kind === "cylinder") {
      map.set(n.id, "green");
    } else if (kind === "stack") {
      // A pile of records reads as "data" — calm grey by default (colour it to make a point).
      map.set(n.id, "gray");
    } else if (AUTO_HUE_KINDS.has(kind)) {
      map.set(n.id, AUTO_HUE_ROTATION[hueI++ % AUTO_HUE_ROTATION.length]!);
    } else {
      map.set(n.id, "neutral");
    }
  }
  return map;
}

export interface NodeSize {
  width: number;
  height: number;
}

/** Deterministic size per kind+label — fed to BOTH ELK and the initial RF node, so no flash. */
export function measureNode(kind: CanvasShapeKind, label = "", body = ""): NodeSize {
  const chars = label.length;
  // Lines a label wraps to at a given box width — honours explicit `\n` AND soft-wrapping, so a
  // box grows tall enough for its text instead of letting it overflow the bottom edge.
  const linesAt = (w: number, frac = 1): number => {
    const per = Math.max(6, Math.floor(((w - 26) * frac) / 7.2));
    return label.split("\n").reduce((n, seg) => n + Math.max(1, Math.ceil(seg.length / per)), 0);
  };
  switch (kind) {
    case "text": {
      // A caption (label only) is small; a paragraph (body present) wraps to a column and grows
      // with its line count, so multi-line asides aren't clipped.
      if (!body) return { width: Math.max(80, Math.min(320, chars * 7 + 16)), height: 30 };
      const w = 280;
      const lines = body
        .split("\n")
        .reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / 42)), 0);
      return { width: w, height: Math.max(40, 16 + lines * 20 + (label ? 24 : 0)) };
    }
    case "heading": {
      // Free display text — a big floating title. Width tracks the text; one or two lines tall.
      const lines = Math.max(1, Math.ceil(chars / 30));
      return { width: Math.max(160, Math.min(560, chars * 13 + 24)), height: 28 + lines * 30 };
    }
    case "stack":
      // A pile of cards: the front card plus the offset of the layers peeking behind it.
      return { width: 156, height: 116 };
    case "embed":
      // A generous default for an embedded component; the renderer measures its real size and the
      // board re-lays-out to fit. An explicit width/height on the node overrides this.
      return { width: 420, height: 260 };
    case "annotation":
      return { width: Math.max(140, Math.min(280, (label + body).length * 6 + 24)), height: 56 };
    case "sticky":
      return { width: 176, height: 140 };
    case "note": {
      const lines = Math.max(2, Math.ceil((label.length + body.length) / 34) + (body ? 1 : 0));
      return { width: 248, height: Math.min(260, 44 + lines * 20) };
    }
    case "circle":
      return { width: 120, height: 120 };
    case "ellipse":
      return { width: 168, height: 104 };
    case "diamond":
      return { width: 150, height: 104 };
    case "cylinder":
      return { width: 148, height: 104 };
    case "pill":
      return { width: Math.max(96, Math.min(240, chars * 8 + 36)), height: 40 };
    // Polygons + star: square-ish, with extra room so the overlaid label never overflows the clip.
    case "triangle":
    case "triangle-down":
      return { width: 148, height: 124 };
    case "star":
      return { width: 148, height: 140 };
    case "pentagon":
    case "hexagon":
    case "octagon":
      return { width: 136, height: 124 };
    case "cross":
      return { width: 124, height: 124 };
    // Arrows + chevron: wider, the block points along the horizontal axis (text in the shaft).
    case "arrow-left":
    case "arrow-right": {
      const width = Math.max(176, Math.min(300, chars * 8 + 72));
      return { width, height: Math.max(80, 24 + linesAt(width, 0.6) * 20) };
    }
    case "chevron": {
      const width = Math.max(168, Math.min(280, chars * 8 + 64));
      return { width, height: Math.max(72, 22 + linesAt(width, 0.7) * 20) };
    }
    // Flowchart shapes: roughly card-sized, a touch wider for the slanted/barred edges.
    case "parallelogram":
    case "trapezoid": {
      const width = Math.max(168, Math.min(300, chars * 8 + 64));
      return { width, height: Math.max(72, 20 + linesAt(width, 0.78) * 20) };
    }
    case "process": {
      const width = Math.max(180, Math.min(300, chars * 8 + 80));
      return { width, height: Math.max(64, 20 + linesAt(width, 0.82) * 20) };
    }
    case "callout": {
      const width = Math.max(160, Math.min(280, chars * 8 + 48));
      // +18 for the tail beneath the bubble.
      return { width, height: Math.max(84, 24 + linesAt(width) * 20 + 18) };
    }
    case "document": {
      const width = Math.max(160, Math.min(280, chars * 8 + 48));
      // +18 for the folded bottom edge.
      return { width, height: Math.max(88, 22 + linesAt(width) * 20 + 18) };
    }
    // rect / rounded / card / generic box — grow tall enough for the (possibly multi-line) label.
    default: {
      const width = Math.max(150, Math.min(280, chars * 8 + 44));
      return { width, height: Math.max(56, 18 + linesAt(width) * 20) };
    }
  }
}
