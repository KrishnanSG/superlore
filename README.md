<div align="center">

<img src="https://superlore.vercel.app/superlore-mark.svg" width="72" height="72" alt="superlore" />

# superlore

### The company knowledge base your agents run on.

Your agents turn specs, transcripts, and brainstorms into rich, structured docs —
**canvases, boards, timelines** — that compound into one company knowledge base every agent
can read over **MCP**.

**_One corpus. Humans and agents._**

<p>
  <a href="https://www.npmjs.com/package/superlore"><img alt="superlore on npm" src="https://img.shields.io/npm/v/superlore?color=6D5CF0&label=superlore" /></a>
  <a href="./LICENSE"><img alt="License: Apache 2.0" src="https://img.shields.io/badge/License-Apache_2.0-6D5CF0.svg" /></a>
  <a href="./CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-6D5CF0.svg" /></a>
</p>

<sub>Open source · MCP-native · Deploy anywhere</sub>

&nbsp;

<b><a href="https://superlore.vercel.app">Website</a></b>&nbsp; · &nbsp;<b><a href="https://superlore.vercel.app/docs">Docs</a></b>&nbsp; · &nbsp;<b><a href="https://superlore.vercel.app/viewer">Live demo</a></b>&nbsp; · &nbsp;<b><a href="https://superlore.vercel.app/docs/agents/mcp">MCP</a></b>

</div>

---

## Get started

**Let your agent build it.** Add the superlore plugin — paste these two lines into Claude:

```text
/plugin marketplace add KrishnanSG/superlore
/plugin install superlore@superlore
```

Then, in a fresh chat, just ask:

```text
Make me a docs site with superlore
```

That's it. Claude scaffolds the project, seeds a page or two, wires up the MCP, sets up your editor,
and previews it — then you keep talking to it to author. No framework to learn.

Prefer the terminal?

```bash
curl -fsSL https://superlore.vercel.app/install.sh | sh
superlore init my-kb && cd my-kb && superlore dev
```

> Adding superlore to an existing Next.js app? See [**Getting started**](https://superlore.vercel.app/docs/getting-started).

---

## One block, two faces

Half your docs are read by **agents** now, not people — and every other tool just bolts an MCP onto
the old way of writing them, serving scraped, lossy HTML. superlore rethinks the document for a world
where AI writes, reads, and maintains it: every component is **dual-representation**. You author once,
and the same block renders a beautiful, interactive surface for humans **and** serializes to clean,
typed data an agent reads over MCP — provably one source, no drift.

<div align="center">
  <img src="https://superlore.vercel.app/dual-representation.png" alt="A superlore canvas rendered as an interactive architecture whiteboard — the human face of one authored block, and the same typed graph an agent reads over MCP" width="100%" />
</div>

> The board a human sees **is** the typed graph an agent reads — queryable structure, not a flat image.

---

## What you get

- **Dual-representation components** — Canvas, Timeline, Board, EntityCard, Table, Decision, and more. Each renders for humans _and_ serializes to a typed knowledge face for the MCP.
- **The Canvas — FigJam, in code.** Declare nodes, edges, and groups; superlore auto-designs and lays out an interactive whiteboard. The board _is_ the typed graph.
- **MCP-native.** Every deploy serves an MCP at `/api/mcp` over the same content the site renders — `search`, `get_page`, `list`, `navigate`, `get_component_data`.
- **The Viewer** — drop in any `.mdx` and see it render live, with comments and export. [Try it →](https://superlore.vercel.app/viewer)
- **Editor extension** — live preview of every component in VS Code, Cursor, and Windsurf.
- **One-config auth** — Auth.js + Google SSO, off by default; gate the site or just the MCP, and the MCP inherits the same policy.
- **Yours to deploy** — it's MDX in your repo: ship to Vercel, Cloudflare, or your own box. Or let [**superlore Cloud**](https://superlore.vercel.app/cloud) host it for you.

[**Read the docs →**](https://superlore.vercel.app/docs)

---

## Built with superlore

Shipped a KB with superlore? Add the badge:

[![Built with superlore](https://superlore.vercel.app/built-with-superlore.svg)](https://superlore.vercel.app)

```md
[![Built with superlore](https://superlore.vercel.app/built-with-superlore.svg)](https://superlore.vercel.app)
```

---

## Contributing & license

superlore is open source and built to grow a community. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
and the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md); report a vulnerability via
[`SECURITY.md`](./SECURITY.md). PRs welcome.

[Apache-2.0](./LICENSE) © [Krishnan S G](https://github.com/KrishnanSG)

<div align="center">
<br />
<sub><b>superlore</b> — author once. Humans and agents read the same corpus.</sub>
</div>
