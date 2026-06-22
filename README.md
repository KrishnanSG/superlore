<div align="center">

<img src="https://superlore.vercel.app/superlore-mark.svg" width="76" height="76" alt="superlore" />

# superlore

### The company knowledge base your agents run on.

Your agents turn specs, transcripts, and brainstorms into rich, structured docs —
**canvases, boards, timelines** — that compound into one company knowledge base every agent
can read over **MCP**.

**_One corpus. Humans and agents._**

<p>
  <a href="./LICENSE"><img alt="License: Apache 2.0" src="https://img.shields.io/badge/License-Apache_2.0-6D5CF0.svg" /></a>
  <a href="#requirements"><img alt="Node >= 20" src="https://img.shields.io/badge/Node-%E2%89%A5%2020-6D5CF0.svg" /></a>
  <a href="#built-with-superlore"><img alt="Built with superlore" src="https://img.shields.io/badge/Built%20with-superlore-6D5CF0.svg" /></a>
  <a href="./CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-6D5CF0.svg" /></a>
  <a href="https://github.com/KrishnanSG/superlore/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/KrishnanSG/superlore?style=flat&color=6D5CF0&label=Stars" /></a>
</p>

<sub>Open source · MCP-native · Deploy anywhere</sub>

<br />
<br />

<img src="https://superlore.vercel.app/hero.png" alt="superlore — one .mdx source rendering as a live Canvas, Timeline, Board, and EntityCard" width="100%" />

</div>

<br />

<div align="center">
  <b><a href="https://superlore.vercel.app/docs">Documentation</a></b>
  &nbsp;·&nbsp;
  <b><a href="https://superlore.vercel.app/viewer">Live demo (Viewer)</a></b>
  &nbsp;·&nbsp;
  <b><a href="https://superlore.vercel.app/docs/built-with-superlore">Built with superlore</a></b>
  &nbsp;·&nbsp;
  <b><a href="https://superlore.vercel.app/docs/agents/mcp">MCP</a></b>
</div>

<br />

---

## What is superlore

Half your docs are read by **agents** now, not people. Every other tool just bolts an MCP onto
the old way of writing them — serving scraped, lossy HTML instead of the structured source. superlore
rethinks the document itself, for a world where AI writes, reads, and maintains it.

You author your knowledge **once**, in MDX, and the same structured content becomes two things at
the same time:

- **Humans** get a clean, interactive, _visual_ knowledge base — whiteboards, boards, timelines,
  entity cards, tables, and diagrams that make complex knowledge legible at a glance. Not flat
  pages.
- **Agents** get a built-in **MCP** server over the _same_ source — clean, typed, structured
  knowledge they search and read directly. Not a screenshot of a component; the data _behind_ it.

> **The board a human sees IS the typed graph an agent reads — queryable structure, not a flat image.**

This is the non-negotiable idea: every component is **dual-representation**. It renders for people
_and_ serializes for agents, from one authored instance. No second authoring step. No drift.

```
        author + deploy                          consume
   you ──────────────▶  superlore KB (MDX)  ──────────────▶  agents (MCP)
   (via agent skills)        │
                             └──────────────▶  humans (visual site)
```

---

## The money shot: one block, two faces

Write a single fenced `superlore-canvas` block in your MDX:

````mdx
```superlore-canvas
{
  "title": "URL shortener",
  "direction": "right",
  "groups": [
    { "id": "edge", "label": "Edge", "frame": true, "intent": "gray" },
    { "id": "svc",  "label": "Services", "frame": true, "intent": "blue" },
    { "id": "data", "label": "Data", "frame": true, "intent": "green" }
  ],
  "nodes": [
    { "id": "gw",       "kind": "icon",     "icon": "shield", "label": "API gateway",     "group": "edge" },
    { "id": "create",   "kind": "rounded",  "label": "Shorten API",      "group": "svc" },
    { "id": "redirect", "kind": "rounded",  "label": "Redirect service", "group": "svc" },
    { "id": "hit",      "kind": "diamond",  "label": "Cache hit?",       "group": "svc" },
    { "id": "cache",    "kind": "cylinder", "label": "Redis cache",      "group": "data" },
    { "id": "db",       "kind": "cylinder", "label": "Links DB",         "group": "data" }
  ],
  "edges": [
    { "from": "gw",       "to": "create",   "label": "POST /shorten" },
    { "from": "gw",       "to": "redirect", "label": "GET /:slug" },
    { "from": "redirect", "to": "hit" },
    { "from": "hit",      "to": "cache",    "label": "yes" },
    { "from": "hit",      "to": "db",       "label": "no", "rel": "depends-on" }
  ]
}
```
````

**Face 1 — the human surface.** superlore auto-designs and auto-lays-out a polished, interactive
whiteboard. No colours, sizes, or positions to pick. Drag nodes, drop stickies, hit **Copy spec**
to round-trip your edits back to JSON.

<div align="center">
  <img src="https://superlore.vercel.app/dual-representation.png" alt="A superlore canvas rendered as a polished, interactive architecture whiteboard — the human surface of one authored block" width="100%" />
</div>

**Face 2 — the agent surface.** The exact same block is a typed graph the MCP serves. An agent
calls `get_component_data("url-shortener")` and gets the data, never the pixels:

```json
{
  "kind": "diagram",
  "syntax": "canvas",
  "graph": {
    "nodes": [
      { "id": "gw", "kind": "icon", "label": "API gateway", "group": "edge" },
      { "id": "create", "kind": "rounded", "label": "Shorten API", "group": "svc" },
      { "id": "redirect", "kind": "rounded", "label": "Redirect service", "group": "svc" },
      { "id": "hit", "kind": "diamond", "label": "Cache hit?", "group": "svc" },
      { "id": "cache", "kind": "cylinder", "label": "Redis cache", "group": "data" },
      { "id": "db", "kind": "cylinder", "label": "Links DB", "group": "data" }
    ],
    "edges": [
      { "from": "gw", "to": "create", "label": "POST /shorten" },
      { "from": "gw", "to": "redirect", "label": "GET /:slug" },
      { "from": "redirect", "to": "hit" },
      { "from": "hit", "to": "cache", "label": "yes" },
      { "from": "hit", "to": "db", "label": "no", "rel": "depends-on" }
    ]
  }
}
```

Both lanes are derived from the same spec — they are provably one object, not a second, drifting
mock-up.

---

## Features

|                                    |                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dual-representation components** | Canvas · Timeline · Board · EntityCard · Table · Decision · Comparison · Roster · Checklist · Releases · Schedule · Walkthrough — each renders for humans **and** serializes to a typed knowledge face for the MCP.                                              |
| **The Canvas — FigJam, in code**   | Declare nodes, edges, and groups; superlore auto-designs and auto-lays-out an interactive whiteboard (React Flow + ELK), with a full shape library, sketch mode, edit-as-whiteboard, and a vertical library of templates. The board _is_ the typed graph.        |
| **MCP-native**                     | Every superlore deploys an MCP server at `/api/mcp` over the same content the site renders — five first-class tools: `search`, `get_page`, `list`, `navigate`, `get_component_data`. Not a scrape; the structured index the site is built from.                  |
| **The Viewer**                     | Drop in any `.mdx` and see it render live — boards, timelines, diagrams — with FigJam-style comments and export. No site, no build.                                                                                                                              |
| **Editor extension**               | superlore Preview for **VS Code · Cursor · Windsurf**: rich live preview of every component as you type, FigJam-style comment pins anchored in flow coordinates, and **Copy to Agent** — turn a review thread into a ready-to-paste prompt that closes the loop. |
| **One-config auth**                | Auth.js v5 + Google SSO, **off by default**. Flip it on with env vars — gate the whole site or just the MCP, restrict to a workspace domain or an email allowlist. The MCP inherits the same policy via `proxy.ts`; the two can never drift.                     |
| **Theme-equal design system**      | Light and dark are co-equal, derived from one token set, defaulting to system. Set one accent colour and the whole thing re-skins — for both themes. Flat, clean, no emoji in core UI.                                                                           |
| **Deploy anywhere**                | It's MDX in your repo. Ship to Vercel, Cloudflare, or your own box — your knowledge stays yours. We never host your data.                                                                                                                                        |
| **Agent skills**                   | Ship-along skills so an agent can scaffold, author ("vibe"), and deploy a KB without ever learning how superlore works.                                                                                                                                          |
| **Open source**                    | Apache-2.0 licensed.                                                                                                                                                                                                                                             |

---

## Requirements

superlore is a component library, theme, and MCP server you drop into your docs app.

|              |              |
| ------------ | ------------ |
| **Node**     | ≥ 20         |
| **Next.js**  | 16           |
| **React**    | 19           |
| **Fumadocs** | ui + core 16 |
| **Tailwind** | v4           |

> superlore targets **Next.js 16** — middleware is `proxy.ts` (not `middleware.ts`), and request APIs
> like `cookies()` / `headers()` are async. Don't port a Next 15-era snippet.

## Quickstart

The fastest path is to **let your agent build it** — install the superlore plugin, then ask:

```text
/plugin marketplace add KrishnanSG/superlore
/plugin install superlore@superlore
```

```text
Make me a docs site with superlore
```

Your agent scaffolds the project, writes `superlore.json`, seeds pages, wires the MCP, and previews
it. Prefer a terminal? `curl -fsSL https://superlore.vercel.app/install.sh | sh`, then `superlore
init` — which scaffolds the KB **and** sets up your editor: it detects VS Code / Cursor / Windsurf
and installs the superlore Preview extension into each (run it any time with `superlore connect`).

**Or add it to an app**

```bash
npm i superlore
```

Import the theme — two lines. `superlore/css` bundles the base styles it sits on **and** registers
its own components, so there's no `@source` to wire up:

```css
@import "tailwindcss";
@import "superlore/css";
```

Wire the components in, and author MDX:

```tsx
// mdx-components.tsx
import { getMDXComponents } from "superlore";

export function useMDXComponents(components) {
  return getMDXComponents(components);
}
```

```mdx
---
title: Q3 Roadmap
summary: What ships this quarter and when.
tags: [roadmap]
---

<Timeline
  items={[
    { date: "2026-07-01", title: "Kickoff", status: "done" },
    { date: "2026-Q3", title: "GA launch", status: "planned" },
  ]}
/>
```

That single `Timeline` renders a polished, accessible list for humans **and** serializes to a
structured `{ kind: "timeline", items: [...] }` your agent reads over the MCP. You did not write
the data twice — there is one source. The package ships subpath exports for each surface:
`superlore`, `superlore/mcp`, `superlore/auth`, `superlore/frontmatter`, and `superlore/css`.

See [**Getting started**](https://superlore.vercel.app/docs/getting-started) for the full wiring (MCP route,
frontmatter schema, auth).

---

## MCP

Every superlore deploy exposes a Model Context Protocol server at `/api/mcp` over **Streamable HTTP**,
serving the same structured index the site renders. Point any MCP-capable client at it:

```json
{
  "mcpServers": {
    "superlore": {
      "type": "http",
      "url": "https://your-kb.dev/api/mcp"
    }
  }
}
```

It exposes **five first-class tools** over the typed content:

| Tool                 | Arguments                  | Returns                                                       |
| -------------------- | -------------------------- | ------------------------------------------------------------- |
| `search`             | `query, limit?`            | Ranked page hits across the corpus                            |
| `get_page`           | `path`                     | Frontmatter + ordered knowledge nodes for one page            |
| `list`               | `kind?, tag?, entityType?` | Filtered knowledge nodes across the corpus                    |
| `navigate`           | `target`                   | Outgoing refs + backlinks — the corpus as a graph             |
| `get_component_data` | `id`                       | The typed data behind a single component (its knowledge face) |

If a deploy gates the site (Auth.js / SSO), the MCP inherits the same policy — gating the site
automatically gates the agent surface. See the [**MCP docs**](https://superlore.vercel.app/docs/agents/mcp).

---

## Built with superlore

Shipped a knowledge base with superlore? Add the badge to your README:

```md
[![Built with superlore](https://superlore.vercel.app/built-with-superlore.svg)](https://superlore.vercel.app)
```

[![Built with superlore](https://superlore.vercel.app/built-with-superlore.svg)](https://superlore.vercel.app)

The badge also lives at `/built-with-superlore.svg` on your own deploy — see
[**Built with superlore**](https://superlore.vercel.app/docs/built-with-superlore) for HTML and React snippets.

---

## Project structure

This is a pnpm + Turbo monorepo.

| Path                                          | What                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/superlore/`](./packages/superlore) | The core library — dual-representation components, theme, MCP server, auth, content model. Subpath exports: `.`, `./mcp`, `./auth`, `./frontmatter`, `./css`. |
| [`templates/starter/`](./templates/starter)   | The `npm create superlore` starter KB _(planned)_.                                                                                                            |
| [`apps/docs/`](./apps/docs)                   | superlore's own docs, built with superlore — the canonical, MCP-enabled reference.                                                                            |
| [`extensions/vscode/`](./extensions/vscode)   | superlore Preview — the VS Code / Cursor / Windsurf extension.                                                                                                |
| [`skills/`](./skills)                         | Agent skills shipped to consumers: Canvas authoring today; scaffold / author / deploy planned.                                                                |
| [`brand/`](./brand)                           | The Fold mark, colour tokens, and voice.                                                                                                                      |
| [`docs/`](./docs)                             | Internal project docs — architecture, roadmap.                                                                                                                |

## Documentation

| Doc                                                                  | What                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Getting started](https://superlore.vercel.app/docs/getting-started) | Install, wire it into your app, author your first dual-representation page. |
| [Canvas](https://superlore.vercel.app/docs/canvas)                   | The FigJam-style whiteboard authored in MDX.                                          |
| [Components](https://superlore.vercel.app/docs/components)           | The full library, each with a live example and its knowledge face.                    |
| [Agents & MCP](https://superlore.vercel.app/docs/agents/mcp)         | The five tools, how to connect, and authoring for agents.                             |
| [Enabling auth](https://superlore.vercel.app/docs/auth)              | Gate the site (and the MCP) with Google SSO — optional, off by default.               |
| [`DESIGN.md`](./DESIGN.md)                                           | The visual system — colour tokens, type scale, components.                            |

---

## Status

superlore is **live**. [`superlore`](https://www.npmjs.com/package/superlore) and
[`superlore-cli`](https://www.npmjs.com/package/superlore-cli) are on npm; the docs site
(`apps/docs`) — itself built with superlore — runs the Canvas, the MCP server, and the Viewer in
production, alongside a VS Code / Cursor / Windsurf extension. It's pre-1.0, so the public API can
still shift between minor versions — pin a version and watch releases.

## Contributing

superlore is built to go open and grow a community. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md), and see [`SECURITY.md`](./SECURITY.md) to report a
vulnerability. PRs welcome.

## License

[Apache-2.0](./LICENSE) © [Krishnan S G](https://github.com/KrishnanSG)

<div align="center">
<br />
<sub><b>superlore</b> — author once. Humans and agents read the same corpus.</sub>
</div>
