# CLAUDE.md — superlore

Guidance for AI agents working in this repo (the repo root). Read this every session.

## Start here

This project is **early** — vision, brand, and architecture are locked; the code is being
built out. Before doing anything, read, in order:

1. **`docs/ARCHITECTURE.md`** — the thesis, the dual-representation contract, and system design.
2. **`DESIGN.md`** — the visual system (colour tokens, type scale, components). The source of
   truth for anything you render.
3. **`docs/ROADMAP.md`** — the phased plan and current state.

## What superlore is

superlore is **the company knowledge base your agents run on** — an agent-native KB, not a
docs-page generator. Author once in MDX; **humans** get a clean, interactive, visual KB, and
**agents** get a first-class **MCP** over the _same structured content_. Existing tools render
pages for humans and retrofit an MCP;
superlore is MCP-native from the ground up. Deployment is the user's (Vercel/anywhere) — we never
host — and superlore ships **agent skills** so anyone can scaffold, author ("vibe"), and deploy a
KB without knowing how superlore works. Tagline: **"One corpus. Humans and agents."**

## The non-negotiable design idea

**Dual-representation components.** Every component must render beautifully for humans _and_
serialize to clean, structured, machine-readable knowledge for the MCP — from one authored
source. A `Timeline` or `Board` is never a picture the agent has to interpret; the agent gets
the data behind it. If you add a component, you implement _both_ representations. This is the
moat — don't compromise it.

## Conventions (intended — enforce as the code lands)

- **TypeScript strict, no `any`** — use `unknown` + narrowing; type-only imports.
- **Tokens, not literals** — colour/spacing via design tokens (`--*` / Tailwind v4 `@theme`),
  never raw hex in components. Light and dark are co-equal first-class themes via `[data-theme]`;
  default to system. Never branch on theme in JS.
- **Reuse over bespoke** — this _is_ the reusable layer; keep components in the package, not
  copy-pasted into apps. Add a story/example for every new or changed component.
- **Next.js 16 + Fumadocs** — this is **not** the Next.js in your training data (middleware is
  `proxy.ts`; `params`/`searchParams`/`cookies()`/`headers()` are async). Check the installed
  docs under `node_modules/next/dist/docs/` before writing Next code.
- **The MCP is a first-class surface**, not an afterthought — changes to the content model must
  keep the MCP contract coherent.
- **No emoji in core UI.** Flat, theme-equal, hierarchy via surfaces + 1px borders.

## Repo layout (scaffold)

| Path                  | What                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `packages/superlore/` | The core library — components, theme, MCP server, auth, content model (`npm i superlore`). |
| `templates/starter/`  | The `npm create superlore` starter KB.                                                     |
| `skills/`             | Agent skills shipped to consumers: scaffold, author/"vibe", deploy.                        |
| `apps/docs/`          | superlore's own docs, built with superlore — the canonical, MCP-enabled reference.         |
| `docs/`               | Internal project docs (architecture, roadmap).                                             |
| `brand/`              | The mark, colour tokens, voice.                                                            |

## How to run

Monorepo: **pnpm** (Node ≥ 20, pnpm ≥ 10). Workspace tooling is being set up — see
`package.json` and `pnpm-workspace.yaml`. Until packages have real code, there's nothing to
run yet; follow `docs/ROADMAP.md`.

## Brand

- Brand violet `#6D5CF0`; mark in `brand/`. See `brand/README.md`.

**Ground every claim in the actual files — read them, don't invent.**
