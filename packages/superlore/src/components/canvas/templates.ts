import type { CanvasGroupSpec, CanvasSpec, RegionLayout } from "./types";

/**
 * Canvas TEMPLATES — ready, designed structures an author (usually an agent) starts from. Set
 * `template: "id"` and the template's frames + layout merge UNDER your own nodes/groups (yours win
 * by id), so you just drop nodes into the named frames; the frames lay out their own members, so no
 * coordinates are needed. Frames carry icons + a colour story so even an empty template reads as a
 * real board, not a grid of boxes. Component-shaped templates (sprint kanban → `<Board>`, RICE →
 * `<Comparison>`) live in the skill — Canvas owns the spatial/structural ones.
 */

interface FrameOpts {
  w: number;
  h: number;
  x?: number;
  y?: number;
  icon?: string;
  layout?: RegionLayout;
  align?: "start" | "center" | "end" | "stretch";
}

/** A framed region for a template — icon + colour + size for a designed, ready scaffold. */
function frame(
  id: string,
  label: string,
  intent: CanvasGroupSpec["intent"],
  o: FrameOpts,
): CanvasGroupSpec {
  return {
    id,
    label,
    intent,
    icon: o.icon,
    frame: true,
    layout: o.layout ?? "column",
    align: o.align ?? "start",
    gap: 10,
    width: o.w,
    height: o.h,
    ...(o.x != null ? { x: o.x } : {}),
    ...(o.y != null ? { y: o.y } : {}),
  };
}

export const CANVAS_TEMPLATES: Record<string, () => Partial<CanvasSpec>> = {
  // ── Strategy ──────────────────────────────────────────────────────────────
  swot: () => ({
    title: "SWOT",
    layout: "grid",
    align: "stretch",
    gap: 28,
    groups: [
      frame("strengths", "Strengths", "green", { w: 380, h: 300, icon: "trending-up" }),
      frame("weaknesses", "Weaknesses", "red", { w: 380, h: 300, icon: "trending-down" }),
      frame("opportunities", "Opportunities", "blue", { w: 380, h: 300, icon: "lightbulb" }),
      frame("threats", "Threats", "orange", { w: 380, h: 300, icon: "shield-alert" }),
    ],
  }),

  "2x2": () => ({
    title: "Impact / Effort",
    layout: "grid",
    align: "stretch",
    gap: 28,
    groups: [
      frame("quick-wins", "Quick wins — high impact · low effort", "green", {
        w: 430,
        h: 300,
        icon: "zap",
      }),
      frame("big-bets", "Big bets — high impact · high effort", "blue", {
        w: 430,
        h: 300,
        icon: "rocket",
      }),
      frame("fill-ins", "Fill-ins — low impact · low effort", "gray", {
        w: 430,
        h: 300,
        icon: "list",
      }),
      frame("money-pits", "Money pits — low impact · high effort", "red", {
        w: 430,
        h: 300,
        icon: "trash-2",
      }),
    ],
  }),

  // The canonical 9-block Business Model Canvas — frames placed by the BMC grid; members stack.
  "business-model-canvas": () => ({
    title: "Business Model Canvas",
    layout: "free",
    groups: [
      frame("partners", "Key Partners", "blue", {
        w: 196,
        h: 440,
        x: 20,
        y: 20,
        icon: "handshake",
      }),
      frame("activities", "Key Activities", "teal", {
        w: 196,
        h: 210,
        x: 236,
        y: 20,
        icon: "activity",
      }),
      frame("resources", "Key Resources", "teal", {
        w: 196,
        h: 210,
        x: 236,
        y: 250,
        icon: "boxes",
      }),
      frame("value", "Value Propositions", "accent", {
        w: 196,
        h: 440,
        x: 452,
        y: 20,
        icon: "gem",
      }),
      frame("relationships", "Customer Relationships", "purple", {
        w: 196,
        h: 210,
        x: 668,
        y: 20,
        icon: "heart-handshake",
      }),
      frame("channels", "Channels", "purple", { w: 196, h: 210, x: 668, y: 250, icon: "send" }),
      frame("segments", "Customer Segments", "green", {
        w: 196,
        h: 440,
        x: 884,
        y: 20,
        icon: "users",
      }),
      frame("costs", "Cost Structure", "red", { w: 536, h: 150, x: 20, y: 480, icon: "wallet" }),
      frame("revenue", "Revenue Streams", "green", {
        w: 544,
        h: 150,
        x: 572,
        y: 480,
        icon: "banknote",
      }),
    ],
  }),

  "lean-canvas": () => ({
    title: "Lean Canvas",
    layout: "free",
    groups: [
      frame("problem", "Problem", "red", { w: 196, h: 440, x: 20, y: 20, icon: "circle-alert" }),
      frame("solution", "Solution", "blue", { w: 196, h: 210, x: 236, y: 20, icon: "lightbulb" }),
      frame("metrics", "Key Metrics", "teal", { w: 196, h: 210, x: 236, y: 250, icon: "gauge" }),
      frame("uvp", "Unique Value Proposition", "accent", {
        w: 196,
        h: 440,
        x: 452,
        y: 20,
        icon: "gem",
      }),
      frame("advantage", "Unfair Advantage", "purple", {
        w: 196,
        h: 210,
        x: 668,
        y: 20,
        icon: "shield",
      }),
      frame("lc-channels", "Channels", "purple", { w: 196, h: 210, x: 668, y: 250, icon: "send" }),
      frame("lc-segments", "Customer Segments", "green", {
        w: 196,
        h: 440,
        x: 884,
        y: 20,
        icon: "users",
      }),
      frame("lc-costs", "Cost Structure", "red", { w: 536, h: 150, x: 20, y: 480, icon: "wallet" }),
      frame("lc-revenue", "Revenue Streams", "green", {
        w: 544,
        h: 150,
        x: 572,
        y: 480,
        icon: "banknote",
      }),
    ],
  }),

  // ── Product / planning ──────────────────────────────────────────────────────
  "okr-tree": () => ({
    title: "OKR tree",
    layout: "flow",
    direction: "down",
    nodes: [
      {
        id: "objective",
        kind: "rounded",
        intent: "accent",
        label: "Objective — the qualitative goal",
      },
      { id: "kr1", kind: "rect", intent: "blue", label: "Key result 1 — measurable" },
      { id: "kr2", kind: "rect", intent: "teal", label: "Key result 2 — measurable" },
      { id: "kr3", kind: "rect", intent: "green", label: "Key result 3 — measurable" },
    ],
    edges: [
      { from: "objective", to: "kr1", rel: "part-of" },
      { from: "objective", to: "kr2", rel: "part-of" },
      { from: "objective", to: "kr3", rel: "part-of" },
    ],
  }),

  "user-journey": () => ({
    title: "User journey",
    layout: "row",
    align: "stretch",
    gap: 22,
    groups: [
      frame("awareness", "Awareness", "blue", { w: 230, h: 360, icon: "eye" }),
      frame("consideration", "Consideration", "teal", { w: 230, h: 360, icon: "search" }),
      frame("decision", "Decision", "purple", { w: 230, h: 360, icon: "circle-check" }),
      frame("onboarding", "Onboarding", "green", { w: 230, h: 360, icon: "rocket" }),
      frame("retention", "Retention", "yellow", { w: 230, h: 360, icon: "repeat" }),
    ],
  }),

  // ── Engineering ──────────────────────────────────────────────────────────────
  "system-architecture": () => ({
    title: "System architecture",
    layout: "flow",
    direction: "right",
    groups: [
      { id: "client", label: "Client", icon: "app-window", intent: "gray", frame: true },
      { id: "edge", label: "Edge", icon: "radio-tower", intent: "blue", frame: true },
      { id: "services", label: "Services", icon: "component", intent: "purple", frame: true },
      { id: "data", label: "Data", icon: "database", intent: "green", frame: true },
    ],
    nodes: [
      { id: "user", kind: "circle", group: "client", label: "User" },
      { id: "cdn", kind: "icon", icon: "cdn", group: "edge", label: "CDN" },
      { id: "gw", kind: "icon", icon: "api-gateway", group: "edge", label: "API Gateway" },
      { id: "svc-a", kind: "rect", intent: "purple", group: "services", label: "Service A" },
      { id: "svc-b", kind: "rect", intent: "purple", group: "services", label: "Service B" },
      { id: "cache", kind: "cylinder", intent: "red", group: "data", label: "Cache" },
      { id: "db", kind: "cylinder", intent: "green", group: "data", label: "Primary DB" },
    ],
    edges: [
      { from: "user", to: "cdn", intent: "blue" },
      { from: "cdn", to: "gw", intent: "blue" },
      { from: "gw", to: "svc-a", rel: "links" },
      { from: "gw", to: "svc-b", rel: "links" },
      { from: "svc-a", to: "cache", intent: "red", rel: "depends-on" },
      { from: "svc-a", to: "db", intent: "green", rel: "depends-on" },
      { from: "svc-b", to: "db", intent: "green", rel: "depends-on" },
    ],
  }),

  rca: () => ({
    title: "Root cause analysis",
    layout: "column",
    align: "stretch",
    gap: 24,
    groups: [
      frame("symptoms", "Symptoms", "red", { w: 900, h: 200, icon: "thermometer", layout: "grid" }),
      frame("hypotheses", "Hypotheses", "orange", {
        w: 900,
        h: 200,
        icon: "circle-help",
        layout: "grid",
      }),
      frame("cause", "Root cause", "accent", { w: 900, h: 130, icon: "crosshair" }),
      frame("fix", "Remediation", "green", {
        w: 900,
        h: 130,
        icon: "wrench",
        layout: "row",
        align: "stretch",
      }),
    ],
  }),

  // ── People / facilitation ─────────────────────────────────────────────────────
  "org-chart": () => ({
    title: "Org chart",
    layout: "flow",
    direction: "down",
    nodes: [
      { id: "ceo", kind: "rect", intent: "accent", label: "CEO" },
      { id: "cto", kind: "rect", intent: "blue", label: "CTO" },
      { id: "cpo", kind: "rect", intent: "purple", label: "CPO" },
      { id: "cro", kind: "rect", intent: "green", label: "CRO" },
      { id: "eng", kind: "rect", intent: "blue", label: "Engineering" },
      { id: "design", kind: "rect", intent: "purple", label: "Design" },
      { id: "sales", kind: "rect", intent: "green", label: "Sales" },
    ],
    edges: [
      { from: "ceo", to: "cto", rel: "parent" },
      { from: "ceo", to: "cpo", rel: "parent" },
      { from: "ceo", to: "cro", rel: "parent" },
      { from: "cto", to: "eng", rel: "parent" },
      { from: "cpo", to: "design", rel: "parent" },
      { from: "cro", to: "sales", rel: "parent" },
    ],
  }),

  "mind-map": () => ({
    title: "Mind map",
    layout: "free",
    sketch: true,
    nodes: [
      { id: "center", kind: "circle", intent: "accent", label: "Central idea", x: 430, y: 250 },
      { id: "b1", kind: "sticky", intent: "yellow", label: "Branch", x: 90, y: 70 },
      { id: "b2", kind: "sticky", intent: "blue", label: "Branch", x: 770, y: 80 },
      { id: "b3", kind: "sticky", intent: "green", label: "Branch", x: 90, y: 440 },
      { id: "b4", kind: "sticky", intent: "pink", label: "Branch", x: 770, y: 440 },
    ],
    edges: [
      { from: "center", to: "b1" },
      { from: "center", to: "b2" },
      { from: "center", to: "b3" },
      { from: "center", to: "b4" },
    ],
  }),
};

export const TEMPLATE_IDS = Object.keys(CANVAS_TEMPLATES);

/** Merge a list of `{id}` items, letting `over` win field-by-field and append new ids. */
function mergeById<T extends { id: string }>(base: T[], over: T[]): T[] {
  const map = new Map<string, T>();
  for (const b of base) map.set(b.id, b);
  for (const o of over) map.set(o.id, { ...map.get(o.id), ...o });
  return [...map.values()];
}

/**
 * Expand `spec.template` into a full spec: the template provides the frames/layout, the author's
 * own nodes/groups merge on top (by id), and the author's scalar fields win.
 */
export function expandTemplate(spec: CanvasSpec): CanvasSpec {
  if (!spec.template) return spec;
  const t = CANVAS_TEMPLATES[spec.template]?.();
  if (!t) return spec; // unknown template id — render the spec as authored
  return {
    title: spec.title ?? t.title,
    layout: spec.layout ?? t.layout,
    direction: spec.direction ?? t.direction,
    align: spec.align ?? t.align,
    gap: spec.gap ?? t.gap,
    height: spec.height ?? t.height,
    sketch: spec.sketch ?? t.sketch,
    groups: mergeById(t.groups ?? [], spec.groups ?? []),
    nodes: mergeById(t.nodes ?? [], spec.nodes ?? []),
    edges: [...(t.edges ?? []), ...(spec.edges ?? [])],
  };
}
