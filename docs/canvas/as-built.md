# As-built — Canvas (FigJam-in-code) & the superlore Viewer

_Status: shipped. Canvas lives in `packages/superlore/src/components/canvas/`; the Viewer lives in
`apps/docs/app/(viewer)/viewer/`. This note records what was built; see `docs/canvas/design.md` for
the design bar and `docs/ARCHITECTURE.md` for the system context._

## Why it exists

Two flagship bets from `docs/VISION.md`: (1) **rich visualization** — a polished, agent-authored
whiteboard so docs feel like brainstorming, not text; (2) the **Viewer** — drop any superlore doc
and see it richly rendered, comment, and hand feedback back to an agent. Both shipped ahead of the
docs-polish pass.

## The `superlore-canvas` format is JSON

The whiteboard's source of truth is a structured **JSON** spec (`{ nodes, edges, groups }`) — chosen
for agent ergonomics (JSON is agent-native / tool-calling-native), zero-dependency parsing
(`JSON.parse`), clean `zod` validation, and because **the spec _is_ the knowledge graph** the MCP
serves (source and knowledge face are the same object — zero drift). It is authored three ways:

- a fenced ` ```superlore-canvas ` JSON block in MDX (primary, Mermaid-style),
- a `<Canvas spec={…} />` prop, and
- a standalone file an agent writes.

Authors declare only **semantics** (id, kind, label, `intent`, `from`/`to`, `rel`) — never colours,
sizes, or positions. (YAML remains a cheap future add via `js-yaml`.)

## Canvas architecture (`packages/superlore/src/components/canvas/`)

- **Engine:** React Flow (`@xyflow/react` 12, MIT) + **ELK** (`elkjs` 0.11) auto-layout, in a Web
  Worker, as a lazy `"use client"` island (`dynamic(ssr:false)`), so canvas-free pages pay zero cost.
- **Vocabulary:** the basic shapes (`rect|rounded|card|circle|ellipse|diamond|pill`), `sticky`,
  `note`, `text`, `annotation`, `heading`, `image`, `icon`, `cylinder`, `stack`, and the full FigJam
  shape set (`triangle`, `pentagon`, `hexagon`, `octagon`, `star`, `cross`, arrows, `chevron`,
  `parallelogram`, `trapezoid`, `callout`, `document`, `process`); titled `frame` groups (nestable
  via `parent`); edges `arrow|line|curved|dashed|sketch` (labelled, auto-bent elbows, typed `rel`).
- **Auto-design (`auto-design.ts`):** maps `kind`/`intent`/group → superlore tokens (`--kp-*`,
  `--color-fd-*`) only; sticky palette rotation; harmonious low-saturation group tints;
  deterministic `measureNode(kind,label)` sizing fed to ELK **and** initial RF nodes → no layout
  flash. Light + dark co-equal, no emoji.
- **Layouts:** `auto` (layered, default) for flows, `free` for brainstorm scatter, `board` for a
  poster of disconnected sections packed in declared order, and `manual` for verbatim `x`/`y`
  placement. Group hierarchy via `INCLUDE_CHILDREN`; deterministic.
- **Interactivity:** pan / zoom / fit / minimap / controls / hover / selection (+ incident-edge
  highlight), plus a FigJam-style **edit** mode — drag nodes, add stickies, rename/delete, then
  **Copy spec** back out as a `manual`-layout `superlore-canvas` JSON.
- **Dual representation:** serializes to `DiagramNode { syntax:"canvas", graph:{nodes,edges} }` via
  `registerKnowledge("Canvas")`; edge `rel`s also become `refs` so the MCP `navigate`s the board.
  One `parseCanvasSpec` is used by both render and `toKnowledge` (no drift).

## Viewer architecture (`apps/docs/app/(viewer)/viewer/`)

- **Surface:** a route group `(viewer)/viewer` — top nav + theme, no docs sidebar. Empty-state
  dropzone → rendered doc (centre) + comment rail. Ephemeral by default.
- **Runtime render:** `@mdx-js/mdx` `evaluate()` client-side with `getMDXComponents()` +
  `remark-gfm`, `remark-frontmatter` + `remark-mdx-frontmatter` (browser-safe), `rehype-slug`, and a
  custom block-id pass that mirrors the index `slugify`+counter scheme (so anchors match the MCP
  `#id` scheme). Graceful error panel; lazy-loaded (`ssr:false`).
- **Comments:** block-level, anchored to stable block ids; a side rail to add/edit/delete/resolve;
  in-memory. Exportable as a JSON sidecar `{ doc, comments:[{anchor, body, author, createdAt}] }` to
  feed back to an agent, and importable to resume. The shipped files are `comments.ts`,
  `comment-rail.tsx`, `mdx-editor.tsx`, `empty-state.tsx`, and `viewer-client.tsx`.

## What is still open

- **Hand-back loop** — feeding exported comments back to the authoring agent as a first-class step.
- **Viewer security hardening** — a strict CSP on `/viewer`, a no-JS "safe render" toggle, and
  iframe-sandbox isolation were scoped but are not all in place.
- **Chart** — a data+picture component (Bet 1) that serializes to a series knowledge face.

## Verification

- `pnpm --filter superlore test` (Canvas `toKnowledge` parity test, no RF/ELK needed) + `typecheck`
  + `build`.
- Playwright screenshots of a canvas demo page + the viewer, light **and** dark.
- MCP: `get_component_data` returns the canvas `graph`; `navigate` follows edge `rel`s.
