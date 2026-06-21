# superlore-cli

The command-line interface for [superlore](https://superlore.vercel.app) — **the company knowledge
base your agents run on.** Scaffold, run, and build an agent-native KB authored in MDX, where
humans get a clean visual site and agents read the same content over **MCP**.

> **One corpus. Humans and agents.**

## Install

```bash
# one-liner (detects pnpm / bun / npm)
curl -fsSL https://superlore.vercel.app/install.sh | sh

# or with your package manager
npm i -g superlore-cli
```

Windows (PowerShell): `irm https://superlore.vercel.app/install.ps1 | iex`. Requires Node ≥ 20.

## Quick start

```bash
superlore init my-kb     # scaffold a new KB (asks 2 questions, writes superlore.json, seeds pages)
cd my-kb
superlore dev            # local preview at http://localhost:3000
superlore build          # production build (Next.js — deploy anywhere)
```

Or skip the CLI entirely and let an agent do it: install the superlore Claude plugin and say
_"Make me a docs site using superlore."_ See
[Getting started](https://superlore.vercel.app/docs/getting-started).

## Commands

| Command                | What it does                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `superlore init [dir]` | Scaffold a new KB. Flags: `--name`, `--type <company-kb\|product-docs>`, `--auth` / `--no-auth`, `--allowed-domain <domain>`, `--accent <color>`, `--no-mcp`, `-y, --yes`. |
| `superlore dev`        | Run the local site for preview (`--port`).                                                                                                                                 |
| `superlore build`      | Production build of the KB.                                                                                                                                                |
| `superlore deploy`     | Managed deploy via **superlore Cloud** — currently waitlisted; self-host free with `superlore build`.                                                                      |

## `superlore.json`

`init` writes a `superlore.json` at your project root — the canonical config the CLI and the
`superlore` package both read:

```json
{
  "name": "Acme Knowledge Base",
  "type": "company-kb",
  "accent": "#6D5CF0",
  "auth": { "enabled": true, "provider": "google", "allowedDomain": "acme.com" },
  "mcp": { "enabled": true, "path": "/api/mcp" }
}
```

- **`type`** — `company-kb` (internal, for your teams + agents) or `product-docs` (public, for
  your users).
- **`auth`** — optional Google SSO that gates the site **and** the MCP. A company KB without auth
  is warned about before deploy.
- **`mcp`** — the agent endpoint, on by default at `/api/mcp`.

The schema + loader are exported for programmatic use: `import { parseSuperloreJson } from "superlore-cli/config"`.

## Links

- **Docs:** https://superlore.vercel.app/docs
- **Core library:** [`superlore`](https://www.npmjs.com/package/superlore)
- **Repository:** https://github.com/KrishnanSG/superlore

## License

[Apache-2.0](./LICENSE) © [Krishnan S G](https://github.com/KrishnanSG). See [`NOTICE`](./NOTICE)
for bundled third-party components.
