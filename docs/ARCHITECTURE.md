# superlore — architecture

_Status: design locked, implementation pending. See `docs/ROADMAP.md` for current state._

## 1. Thesis

Author knowledge **once**, in MDX, and serve it natively to **two consumers**:

- **Humans** → a clean, interactive, visual knowledge base.
- **Agents** → a first-class MCP over the _same structured content_.

Existing docs tools are render-first with an MCP retrofitted over rendered output. superlore is
**content-first**: a structured content model is the source of truth, and both the human site
and the agent MCP are projections of it.

## 2. The dual-representation contract

The core invariant. Every superlore component has two faces, from one authored instance:

- **Render face** — a polished React component for the human site.
- **Knowledge face** — a structured, typed serialization the MCP exposes to agents.

```
            ┌─────────────── one authored instance (MDX) ───────────────┐
            │   <Timeline items={[…]} />                                 │
            └───────────────┬───────────────────────┬───────────────────┘
                            │                        │
                   render face                knowledge face
                            │                        │
                  ▼ human site (visual)     ▼ MCP (structured JSON + relations)
```

Rule: **if you add a component, you implement both faces.** An agent asking "what's on the
Q3 timeline?" gets the items as data — never a description of a picture. This is the moat.

## 3. System overview

```
   author (MDX + components)
        │
        ▼
  ┌─────────────────────┐      build / index       ┌──────────────────────┐
  │  content model      │ ───────────────────────▶ │  structured index    │
  │  (MDX + frontmatter)│                           │  (pages, sections,   │
  └─────────┬───────────┘                           │   components, graph) │
            │                                        └───────┬──────────────┘
            │ render                                         │ serve
            ▼                                                ▼
   ┌──────────────────┐                            ┌──────────────────────┐
   │  human site      │                            │  MCP server          │
   │  (Next/Fumadocs) │                            │  search · get · nav  │
   └──────────────────┘                            └──────────────────────┘
            │                                                │
            └──────────────── optional auth gate ────────────┘
                     (public, or SSO / token — per deploy)
```

## 4. Building blocks

1. **Content model** — MDX files + a typed frontmatter schema (title, summary, tags, relations).
   Source of truth. A build step derives a **structured index**: pages → sections → components,
   plus a lightweight relationship graph (links, tags, references).
2. **Component library** (`packages/superlore`) — the opinionated, dual-representation structural
   components (cards, columns, steps, tabs, callouts, frames, **timelines, boards, entity
   cards, tables, diagrams**). Themeable; tokens only.
3. **MCP server** — serves the structured index: `search`, `get_page`/`get_section`,
   `list`, `navigate` (follow relations), `get_component_data`. Public or token-gated. Shares
   the content model with the site, so there's no scraping and no drift.
4. **Theme system** — Tailwind v4 `@theme inline` over live CSS tokens; light and dark as
   co-equal peers via `[data-theme]`, defaulting to system. One palette re-skins everything.
5. **Auth** — pluggable, optional, per-deploy. Auth.js v5 + Google SSO out of the box; the gate
   (`proxy.ts`) covers the site, and the MCP inherits the same policy (public ⇄ token).
6. **Skills** (`skills/`) — agent skills shipped to consumers: **scaffold** a KB, **author/"vibe"**
   content, and **deploy** to Vercel/anywhere. The zero-knowledge UX.
7. **Deploy** — the **user's responsibility**. Static export or SSR to Vercel/any Next host.
   We never host their data.

## 5. Proposed monorepo layout

```
superlore/
├── packages/
│   └── superlore/        # the core library — components, theme, MCP server, auth, content model
├── templates/
│   └── starter/       # `npm create superlore` starter KB
├── skills/            # agent skills: scaffold · author · deploy
├── apps/
│   └── docs/          # superlore's own docs, built with superlore (the canonical reference)
├── docs/              # internal project docs (this file, HANDOFF, ROADMAP)
└── brand/             # mark, colour tokens, voice
```

Consumption: `npm i superlore` to add the library to an app, or `npm create superlore` for a full KB.

## 6. Build plan

| Area                                                              | Lands in                        | Notes                                                             |
| ----------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| Page components (`mintlify`, `polish`)                            | `packages/superlore` components | Proven patterns from the source docs site, generalised to reuse.  |
| `global.css` token layer                                          | `packages/superlore` theme      | Generalise the brand tokens into a swappable preset.              |
| `auth.ts` + `proxy.ts`                                            | `packages/superlore` auth       | Make provider + gate pluggable; default Google SSO.               |
| MCP server route                                                  | `packages/superlore` MCP        | The working pattern; re-base it on the structured index.          |
| Structural components (kanban, timeline) + frontmatter schema     | components + content model      | These are the "visual KB" differentiators; add knowledge faces.   |

Net-new (designed from scratch): the structured **content/index model** and the
**dual-representation serialization** contract.

## 7. Stack

Fumadocs (render layer) · Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript
(strict) · pnpm + Turborepo · Auth.js v5 · MCP (Model Context Protocol).

## 8. Principles

- **Content-first, render + MCP as projections.** Never let the two faces drift.
- **Tokens, not literals.** Light and dark are co-equal; never branch on theme in JS.
- **Reuse lives in `packages/superlore`.** Apps and templates consume it; no copy-paste.
- **Self-documented.** superlore's own docs are built with superlore, end-to-end.
- **Zero-knowledge UX.** A non-expert (or their agent) can stand up and deploy a KB without
  learning superlore internals — the skills carry it.
