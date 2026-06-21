# Plan — Canvas (FigJam-in-code) & the superlore Viewer

_Priority features, built before the docs-polish pass. Status: in progress. Approved direction
2026-06-19._

## Why

Two flagship bets from `docs/VISION.md`: (1) **rich visualization** — a polished, agent-authored
whiteboard so docs feel like brainstorming, not text; (2) the **Viewer** — drop any superlore doc
and see it richly rendered, comment, hand feedback back to an agent. Built first; docs polish
(shell, landing, per-component pages — spec captured separately) comes after.

## Decision: the `superlore-canvas` format = **JSON**

The whiteboard's source of truth is a structured **JSON** spec (`{ nodes, edges, groups }`) — chosen
for agent ergonomics (JSON is agent-native / tool-calling-native), zero-dependency parsing
(`JSON.parse`), clean `zod` validation, and because **the spec _is_ the knowledge-graph** the MCP
serves (source and knowledge face are the same object — zero drift). Authored three ways:

- a fenced ` ```superlore-canvas ` JSON block in MDX (primary, Mermaid-style),
- a `<Canvas spec={…} />` prop, and
- a standalone file an agent writes.

Authors declare only **semantics** (id, kind, label, `intent`, `from`/`to`, `rel`) — never colors,
sizes, or positions. (YAML is a cheap future add via `js-yaml`.)

## Canvas architecture (`packages/superlore/src/components/canvas/`)

- **Engine:** React Flow (`@xyflow/react` 12, MIT) + **ELK** (`elkjs` 0.11) auto-layout, in a Web
  Worker, as a lazy `"use client"` island (`dynamic(ssr:false)`), so canvas-free pages pay zero cost.
- **Vocabulary:** shapes `rect|rounded|card|circle|ellipse|diamond|pill`, `sticky`, `text`,
  `group`, titled `frame`; edges `arrow|line|bidirectional|dashed` (labeled, auto-bent elbows).
- **Auto-design (`auto-design.ts`):** maps `kind`/`intent`/group → superlore tokens (`--kp-*`,
  `--color-fd-*`) only; sticky palette rotation; harmonious low-saturation group tints;
  deterministic `measureNode(kind,label)` sizing fed to ELK **and** initial RF nodes → no layout
  flash. Light + dark co-equal, no emoji.
- **Layout (`elk-layout.ts`):** `layered` for flows (default), `force` for free brainstorm
  scatter, group hierarchy via `INCLUDE_CHILDREN`; deterministic.
- **Interactivity v1:** pan / zoom / fit / minimap / controls / hover / selection (+ incident-edge
  highlight). No drag-to-edit/write-back in v1 (source is the spec).
- **Dual-representation:** serializes to `DiagramNode { syntax:"canvas", graph:{nodes,edges} }`
  (`primitives.ts`) via `registerKnowledge("Canvas")`; edge `rel`s also become `refs` so the MCP
  `navigate`s the board. One `parseCanvasSpec` used by both render and `toKnowledge` (no drift).
- **Files:** `canvas.tsx` (server-safe wrapper + schema + toKnowledge), `canvas-island.tsx`
  (`"use client"` RF), `nodes.tsx`, `edges.tsx`, `auto-design.ts`, `elk-layout.ts`,
  `parse-spec.ts`, `canvas.test.tsx`. Deps `@xyflow/react`+`elkjs` as **dependencies** (internal).
  RF base CSS vendored + re-skinned into `superlore.css` (single `superlore/css` entry stays
  authoritative). Wire into `getMDXComponents` + a fenced-code handler for `superlore-canvas`.

## Viewer architecture (`apps/docs/app/(viewer)/viewer/`)

- **Surface:** a route group `(viewer)/viewer` — top nav + theme, **no docs sidebar**. Empty-state
  dropzone → rendered doc (center, ~720px) + comment gutter (left) + rail (right). Ephemeral.
- **Runtime render:** `@mdx-js/mdx` `evaluate()` client-side with `getMDXComponents()` +
  `remark-gfm`, `remark-frontmatter`+`remark-mdx-frontmatter` (browser-safe), `rehype-slug`, and a
  custom `rehypeSuperloreBlockIds` that mints stable block ids mirroring `extract.ts` `slugify`+counter
  (so anchors match the MCP `#id` scheme). Graceful error panel; lazy-loaded (`ssr:false`).
- **Security (v1):** runs the user's own file locally; client-only, no storage; lock a strict CSP
  on `/viewer` (`connect-src 'self'`); a "Safe render" (no-JS, `remark-rehype`+`rehype-react`)
  toggle. iframe-sandbox isolation deferred. Warn clearly.
- **Comments:** block-level, anchored to `data-kp-block` ids; gutter markers + side rail
  (add/edit/delete/resolve); in-memory. **Export** a JSON sidecar `{ doc, comments:[{anchor:{blockId,
kind,quote}, body, author, createdAt}] }` to feed back to an agent; **import** to resume.
- **Deps (apps/docs):** `@mdx-js/mdx`, `@mdx-js/react`, `remark-gfm`, `remark-frontmatter`,
  `remark-mdx-frontmatter`, `rehype-slug`, `unist-util-visit`.

## Sequence

1. **Canvas** (renders in docs + viewer; the flagship). 2. **Viewer** (upload/render). 3. **Comments+export**.
   Then the deferred **docs polish** (shell + central `superlore.config.ts` + landing + per-component pages).

## Verification

- `pnpm --filter superlore test` (Canvas `toKnowledge` parity test, no RF/ELK needed) + `typecheck` + `build`.
- Playwright screenshots (`scratchpad/shot.mjs`) of a canvas demo page + the viewer, light **and** dark.
- MCP: `get_component_data` returns the canvas `graph`; `navigate` follows edge `rel`s.
- A UX/design review pass on the screenshots before calling it done.
