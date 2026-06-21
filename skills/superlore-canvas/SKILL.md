---
name: superlore-canvas
description: Author rich, well-structured superlore Canvas diagrams — the `superlore-canvas` block in MDX that renders as a FigJam-grade interactive whiteboard AND a typed knowledge graph. Use whenever creating or editing a visual, diagram, whiteboard, board, architecture map, flow, mind-map, or brainstorm in a superlore knowledge base, or when asked to "visualize", "draw", "diagram", "map out", or "whiteboard" a concept.
metadata:
  author: superlore
  version: "1.0.0"
---

# Authoring superlore Canvas

A **superlore Canvas** is a whiteboard you write as data. You drop a fenced ` ```superlore-canvas ` block
(a JSON object) into any `.mdx` file and it renders as a polished, interactive board — _and_ the
same JSON is the knowledge graph the MCP serves. So you are never drawing a picture an agent has to
interpret; you are authoring `{ nodes, edges, groups }` that is simultaneously the human view and
the machine view. **Author semantics, not pixels** — colours, sizes and layout are auto-designed.

This is the move that extends FigJam: a FigJam board is pixels; a superlore Canvas is a _typed graph_
(nodes, typed relations, sections) that happens to render beautifully. Lean into the structure.

## The golden workflow — think before you draw

Do not start emitting nodes. Plan first, in this order:

1. **What is the one thing this board must communicate?** A system's shape? A decision? A flow? A
   brainstorm? The answer picks the layout and the story.
2. **What are the sections?** Almost every good board is organized into 2–6 **sections** (frames).
   Name them as the beats of the story (e.g. _Ingress → Services → Data_, or _Symptoms →
   Hypotheses → Decision → Rollout_). Sections are first-class — use them.
3. **What goes in each section, and what kind is each thing?** Pick the shape that _means_ the
   thing (see the vocabulary). A datastore is a `cylinder`, a decision is a `diamond`, an idea is a
   `sticky`, an aside is an `annotation`.
4. **How do things relate?** Draw edges for real relationships and give the important ones a typed
   `rel` (`depends-on`, `blocks`, `links`…) — that is what makes the board queryable, not just
   pretty.
5. **What's the register?** A precise architecture diagram is clean (`sketch` off). A brainstorm or
   an explainer for the team is warmer (`sketch: true`).

Then write the JSON. Trust auto-layout: do **not** set `x`/`y` unless you genuinely need an exact
placement — ELK lays everything out with no overlaps.

## The spec (exact)

A board is a JSON object. Only `nodes` is required.

```jsonc
{
  "title": "Optional board title",
  // "auto" (default, tidy layered) | "flow" | "tree" | "free" (organic scatter)
  // | "board" (a poster of disconnected sections, placed in authored order — see Layouts)
  // | "manual" (FigJam-style absolute placement — honour every x/y/width/height)
  "layout": "auto",
  "direction": "right", // "right" (default) | "down"  — flow direction for auto-layout
  "height": 520, // optional px number or CSS string; otherwise the board hugs its content
  "sketch": false, // true → hand-drawn connectors + handwritten section titles + dotted sections
  "groups": [
    /* sections */
  ],
  "nodes": [
    /* the things */
  ],
  "edges": [
    /* the relationships */
  ],
}
```

### Nodes

```jsonc
{
  "id": "api", // required, unique; referenced by edges + `to`
  "kind": "rounded", // see the vocabulary below (default "rounded")
  "label": "API gateway", // short text on the node
  "body": "line one\nline two", // longer text for `note` cards (\n = line break)
  "intent": "blue", // OPTIONAL colour — omit and auto-design picks a harmonious one
  "icon": "shield", // lucide icon name (kebab-case) — for `icon` kind or a leading glyph
  "src": "https://…/x.png", // image source for kind:"image"
  "hand": false, // true → render this node's text in the handwriting face (text/heading/note/sticky)
  "dashed": false, // true → dashed border (a tentative / proposed / optional box)
  "count": 3, // for kind:"stack" — how many cards read in the pile (2–4)
  "group": "ingress", // section membership (a group id)
  "to": ["svc", "db"], // sugar: outgoing edges to these ids (no labels)
  "x": 40,
  "y": 0,
  "width": 220,
  "height": 80, // OPTIONAL exact placement — overrides auto-layout (required in `manual`)
}
```

**Node kinds — pick the one that carries meaning:**

| Kind                                                                                                                   | Use it for                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rounded` (default), `rect`, `card`                                                                                    | a service, component, step, generic box                                                                                                                                                   |
| `circle`, `ellipse`                                                                                                    | a start/end, an actor, an endpoint                                                                                                                                                        |
| `diamond`                                                                                                              | **a decision / branch** (the one "this matters" shape)                                                                                                                                    |
| `cylinder`                                                                                                             | **a datastore** — DB, cache, queue, bucket                                                                                                                                                |
| `sticky`                                                                                                               | **an idea / note on a brainstorm** (a wall of these reads as designed)                                                                                                                    |
| `note`                                                                                                                 | a titled multi-line note (`label` + `body`)                                                                                                                                               |
| `annotation`                                                                                                           | **a handwritten margin aside** — a caveat, a "watch this", a question                                                                                                                     |
| `stack`                                                                                                                | **a pile of cards** — "many of these": records, stories, a dataset, a backlog (`count`)                                                                                                   |
| `heading`                                                                                                              | **big free display text** — a board title/verdict/question (`hand` → handwritten)                                                                                                         |
| `embed`                                                                                                                | **a live superlore component** — `component` + `props` (Timeline, Comparison, StatGrid, Board, Decision, KeyFacts, EntityCard, Releases, Roster, Schedule); its data rides into the graph |
| `icon`                                                                                                                 | **an architecture component** with a big glyph (`icon: "cloud"`, `"server"`, `"shield"`…)                                                                                                 |
| `image`                                                                                                                | an embedded image (`src`)                                                                                                                                                                 |
| `pill`, `text`                                                                                                         | a tag/label; or bare text (add a `body` for a multi-line aside paragraph)                                                                                                                 |
| `process`, `document`, `parallelogram`, `trapezoid`, `callout`                                                         | flowchart semantics (process, doc, I/O, manual op, speech bubble)                                                                                                                         |
| `triangle`, `triangle-down`, `pentagon`, `hexagon`, `octagon`, `star`, `cross`, `arrow-left`, `arrow-right`, `chevron` | basic shapes when you need a specific glyph                                                                                                                                               |

**Intents (colour) — earn them, don't spray them.** Omit `intent` and auto-design gives plain boxes
a calm, harmonious hue and stickies a lively rotation, so a board with _no_ colours still looks
designed. Set `intent` to make a point: semantic — `accent` (the brand violet, for the key thing),
`success`, `warning`, `danger`, `info`, `neutral`, `muted`; or a FigJam colour —
`gray`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`. Tip: give each
**section** a colour family and let its cards share it.

### Edges

```jsonc
{
  "from": "api",
  "to": "db",
  "label": "writes",
  "kind": "arrow",
  "intent": "blue",
  "rel": "depends-on",
}
```

- `kind`: `arrow` (default) · `line` (no head) · `bidirectional` · `dashed` (fallback/async/best-effort) · `curved` · `sketch` (hand-drawn).
- `intent` (optional colour): tint the connector + its arrowhead — a FigJam/semantic colour to read
  a flow by colour (e.g. the "happy path" in `teal`), or `neutral` for a strong foreground line.
  Omit for the calm default. Earn it like node colour; don't make a rainbow of arrows.
- `rel` (the important one): a **typed relationship** the knowledge graph keeps —
  `links`, `depends-on`, `blocks`, `parent`/`child`, `part-of`, `owned-by`, `defines`, `mentions`,
  `supersedes`/`superseded-by`, `related`, `see-also`. Use it on edges that carry real meaning;
  it's what lets an agent answer "what depends on X?" without reading the picture.
- Short edge labels (1–3 words) read best. Or use node `to:` sugar for unlabeled edges.

### Groups (sections) — the backbone of a good board

```jsonc
{
  "id": "data",
  "label": "Data tier",
  "frame": true, // true → a titled section (pill-tab header, clear border); false/omit → a soft tinted region
  "dashed": true, // a dashed section border — a loose / working / proposed grouping
  "intent": "green", // optional; otherwise the section tints to the colour family of its contents
  "parent": "vpc", // nest this section inside another (sections within sections)
  "dotted": true, // a dotted ground inside the section (on by default when the board is `sketch`)
  // "x"/"y"/"width"/"height" — absolute placement/size (honoured in `manual` layout)
}
```

Put nodes in a section with the node's `group` field. Sections can **nest** (`parent`) — e.g.
_Cloud account → VPC → Subnet_. Prefer `frame: true` for the main structural sections.

### Layouts — not every board is one flow

- **`auto`** (default) / `flow` / `tree` — a tidy layered diagram from your edges. The everyday choice.
- **`free`** — an organic scatter (a wall of stickies). Brainstorms.
- **`board`** — a **poster of disconnected sections**. Each top-level section (and each ungrouped
  node) is laid out on its own, then the blocks are packed **in the order you declare them**,
  wrapping into rows. No edges between sections required. Reach for this when the board is several
  independent diagrams + notes + headings side by side (a review board, a "today → target" study).
  You author reading order; the poster falls out. Reorder the spec → the poster re-flows.
- **`manual`** — **absolute placement.** Every node `x`/`y` (and a frame's `width`/`height`) is
  honoured verbatim, FigJam-style; nothing moves. A frame with no explicit size hugs its members.
  Use it only when you need a hand-arranged board pixel-for-pixel; otherwise prefer `board`/`auto`
  so you author semantics, not coordinates.

### Embedding a live component (`kind: "embed"`)

A node can _be_ a superlore component — a `Comparison`, `StatGrid`, `Timeline`, `Board`, `Decision`,
`KeyFacts`, `EntityCard`, `Releases`, `Roster`, or `Schedule` — so a whiteboard can hold real,
typed data beside the boxes. Give the node `"component"` (the name) and `"props"` (its authored
data). The node sizes itself to the component, and the component's own knowledge rides into the
canvas graph — so the MCP sees the comparison's cells or the timeline's items, not "a box".

```jsonc
{
  "id": "opts",
  "kind": "embed",
  "component": "Comparison",
  "props": { "options": ["A", "B"], "rows": [{ "criterion": "Managed", "cells": [true, false] }] },
}
```

### Sketch mode — for brainstorms & team explainers

Set board-level `"sketch": true` and the whole board turns hand-drawn: connectors waver like a
marker, section titles + edge labels render in a handwriting face, and sections get a dotted ground.
It's one flag that turns a clean diagram into a FigJam-style whiteboard. Use it for ideation,
explainers, and "let me walk you through this" boards; keep it **off** for precise reference
diagrams. Per-edge `"kind": "sketch"` and per-group `"dotted"` still override.

## Templates — start from a ready structure (prefer this)

When the ask matches a known framework, **don't hand-build the frames — set `template`** and drop
your nodes into its named frames. You get the correct, designed structure (icons, colours, layout)
for free, and it's reproducible. Add nodes with `group: "<frame id>"`; rename scaffold nodes by
reusing their id.

```jsonc
{ "template": "swot", "nodes": [{ "kind": "sticky", "group": "strengths", "label": "…" }] }
```

| `template`              | Frame / node ids to fill                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `swot`                  | `strengths` · `weaknesses` · `opportunities` · `threats`                                             |
| `business-model-canvas` | `partners` `activities` `resources` `value` `relationships` `channels` `segments` `costs` `revenue`  |
| `lean-canvas`           | `problem` `solution` `metrics` `uvp` `advantage` `lc-channels` `lc-segments` `lc-costs` `lc-revenue` |
| `2x2` (impact/effort)   | `quick-wins` · `big-bets` · `fill-ins` · `money-pits`                                                |
| `user-journey`          | `awareness` · `consideration` · `decision` · `onboarding` · `retention`                              |
| `rca`                   | `symptoms` · `hypotheses` · `cause` · `fix`                                                          |
| `system-architecture`   | frames `client`/`edge`/`services`/`data`; rename nodes `svc-a`,`svc-b`,`db`,…                        |
| `okr-tree`              | rename nodes `objective`,`kr1`,`kr2`,`kr3`                                                           |
| `org-chart`             | rename nodes `ceo`,`cto`,`cpo`,`cro`,`eng`,`design`,`sales`                                          |
| `mind-map`              | rename `center`,`b1`…`b4` (hand-drawn)                                                               |

**Not a whiteboard?** Use the right component instead of Canvas: a **sprint/sales/hiring board or
retro** → `<Board>`; a **RICE / ICE / RACI / decision matrix** → `<Comparison>`; a **roadmap** →
`<Timeline>`. Same typed knowledge graph, better fit.

## Recipes (copy, then adapt)

### 1 — System architecture (clean, sectioned, typed)

Tiers as frames, the right shape per thing, typed `rel` on the meaningful edges.

```superlore-canvas
{
  "title": "Checkout — request to settlement",
  "direction": "down",
  "groups": [
    { "id": "edge", "label": "Edge", "frame": true, "intent": "gray" },
    { "id": "svc", "label": "Services", "frame": true, "intent": "blue" },
    { "id": "data", "label": "Data", "frame": true, "intent": "green" }
  ],
  "nodes": [
    { "id": "client", "kind": "circle", "label": "Shopper" },
    { "id": "cdn", "kind": "icon", "icon": "globe", "label": "CDN + WAF", "group": "edge" },
    { "id": "gw", "kind": "icon", "icon": "shield", "label": "API gateway", "group": "edge" },
    { "id": "cart", "kind": "rounded", "label": "Cart service", "group": "svc" },
    { "id": "order", "kind": "rounded", "label": "Order service", "group": "svc" },
    { "id": "pay", "kind": "diamond", "label": "Payment authorized?", "group": "svc" },
    { "id": "db", "kind": "cylinder", "label": "Orders DB", "group": "data" },
    { "id": "cache", "kind": "cylinder", "label": "Redis", "group": "data" }
  ],
  "edges": [
    { "from": "client", "to": "cdn", "label": "HTTPS" },
    { "from": "cdn", "to": "gw" },
    { "from": "gw", "to": "cart", "rel": "links" },
    { "from": "cart", "to": "cache", "label": "read/write", "rel": "depends-on" },
    { "from": "gw", "to": "order", "rel": "links" },
    { "from": "order", "to": "pay" },
    { "from": "pay", "to": "db", "label": "yes", "rel": "depends-on" }
  ]
}
```

### 2 — Brainstorm / ideation board (warm, hand-drawn)

`sketch: true`, sticky notes for ideas, an annotation aside, a decision diamond.

```superlore-canvas
{
  "title": "Cutting checkout p99 latency",
  "sketch": true,
  "direction": "down",
  "groups": [
    { "id": "symptoms", "label": "Symptoms", "frame": true, "intent": "red" },
    { "id": "options", "label": "Options", "frame": true, "intent": "purple" },
    { "id": "decision", "label": "Decision", "frame": true, "intent": "teal" }
  ],
  "nodes": [
    { "id": "slo", "kind": "card", "label": "p99 = 2.4s — SLO breached", "group": "symptoms" },
    { "id": "peak", "kind": "sticky", "label": "Worst at the 8pm sale peak", "group": "symptoms" },
    { "id": "idx", "kind": "sticky", "label": "Add composite index", "group": "options" },
    { "id": "batch", "kind": "sticky", "label": "Batch the line-item reads", "group": "options" },
    { "id": "cache", "kind": "sticky", "label": "Cache hot carts", "group": "options" },
    { "id": "aside", "kind": "annotation", "label": "cache adds invalidation risk — park it", "group": "options" },
    { "id": "pick", "kind": "diamond", "label": "Index + batch first?", "group": "decision" },
    { "id": "ship", "kind": "rounded", "label": "Ship index + batched reads", "group": "decision" }
  ],
  "edges": [
    { "from": "slo", "to": "idx", "label": "dig in" },
    { "from": "idx", "to": "pick" },
    { "from": "batch", "to": "pick" },
    { "from": "pick", "to": "ship", "label": "cheapest win" }
  ]
}
```

### 3 — Decision / trade-off flow

Question → options → criteria → outcome; the chosen path stands out.

```superlore-canvas
{
  "title": "Pick a job queue",
  "direction": "down",
  "nodes": [
    { "id": "q", "kind": "diamond", "intent": "accent", "label": "Which queue?" },
    { "id": "a", "kind": "card", "intent": "blue", "label": "Managed (SQS)" },
    { "id": "b", "kind": "card", "intent": "purple", "label": "Self-host (Redis)" },
    { "id": "pick", "kind": "rounded", "intent": "green", "label": "Chosen: SQS" }
  ],
  "edges": [
    { "from": "q", "to": "a" },
    { "from": "q", "to": "b" },
    { "from": "a", "to": "pick", "label": "no ops", "rel": "links" }
  ]
}
```

### 4 — A poster of disconnected sections (`layout: "board"`)

Several independent diagrams + notes + a heading on one surface, placed in the order you declare
them. No edges between sections. Each section is laid out internally; the blocks wrap into rows.

```superlore-canvas
{
  "title": "Search relevance — where we are",
  "layout": "board",
  "direction": "down",
  "groups": [
    { "id": "today", "label": "Today", "frame": true, "intent": "blue" },
    { "id": "gaps", "label": "Gaps", "frame": true, "dashed": true, "intent": "red" }
  ],
  "nodes": [
    { "id": "q", "kind": "rect", "group": "today", "label": "Query" },
    { "id": "bm25", "kind": "rect", "group": "today", "label": "BM25 ranker" },
    { "id": "store", "kind": "cylinder", "group": "today", "label": "Index" },
    { "id": "docs", "kind": "stack", "group": "today", "label": "Results" },

    { "id": "g1", "kind": "note", "intent": "red", "group": "gaps", "body": "No semantic recall — synonyms miss." },
    { "id": "g2", "kind": "note", "intent": "red", "group": "gaps", "body": "No personalization signal." },

    { "id": "ask", "kind": "heading", "label": "What if ranking were learned?" },
    { "id": "idea", "kind": "note", "intent": "gray", "hand": true, "body": "Add a vector recall stage, then a learned re-ranker over BM25 + embeddings." }
  ],
  "edges": [
    { "from": "q", "to": "bm25", "intent": "blue" },
    { "from": "bm25", "to": "store", "intent": "blue", "label": "lookup" },
    { "from": "store", "to": "docs", "intent": "blue" }
  ]
}
```

## Quality bar (a board is good when…)

- It is **organized by sections** with clear, story-shaped names.
- Every node's **kind carries meaning** (decision=diamond, store=cylinder, idea=sticky, aside=annotation, component=icon).
- **Colour is earned** — sections share a family; the one key thing may use `accent`; the rest can be auto-coloured (omit `intent`).
- The important edges carry a typed **`rel`** so the graph is queryable.
- It **reads as a story** in the flow direction; nothing is orphaned.
- Brainstorms/explainers use **`sketch: true`**; reference diagrams stay clean.

## Common mistakes

- **Pixel-pushing.** Don't set `x`/`y`/`width`/`height` unless you truly need an exact layout — let
  auto-layout work. Reserve explicit coordinates for the rare "place this exactly here" case.
- **No sections.** A flat soup of boxes reads as noise. Group into 2–6 frames.
- **Spraying colour.** A rainbow board looks undesigned. Omit `intent` to let auto-design harmonise,
  or give each section one family.
- **Untyped relationships.** Edges with no `rel` are just lines; add `rel` to the meaningful ones so
  the knowledge graph is real.
- **Overcrowding.** If a board has > ~25 nodes, split the concept across sections or multiple boards.
- **Wrong register.** A precise architecture diagram in `sketch` mode looks sloppy; a team explainer
  in clean mode looks cold. Match the mode to the intent.

## Remember

The board is the knowledge graph. A great superlore Canvas is one where an agent calling
`get_component_data` gets clean, typed `{ nodes, edges, groups }` with real `rel`s — and a human
gets a board they actually want to read. Author for both at once.
