---
name: superlore-connect-mcp
description: Register a superlore knowledge base's MCP server with the user's Claude (or other MCP client) so their agent can read the corpus directly — search, get_page, list, navigate, get_component_data. Configures it at the USER level via `claude mcp add` (or the client's mcp.json). ALWAYS asks permission before modifying the user's Claude config, and ASKS for the URL / any credential / any missing detail rather than guessing. Use when someone wants to connect, add, hook up, or point their agent / Claude at a superlore KB or its MCP.
metadata:
  author: superlore
  version: "1.0.0"
---

# Connecting the superlore MCP

superlore exposes its content to agents over a first-class **MCP** (Streamable HTTP), by default at
`/api/mcp`. This skill registers that endpoint with the user's MCP client — usually **Claude** — so
the agent can query the corpus directly (`search`, `get_page`, `list`, `navigate`,
`get_component_data`) instead of scraping pages.

This skill touches the **user's own configuration**, so it has two hard rules:

1. **Ask permission before modifying any config.** Show the exact command or file change you intend
   to make, and get a clear yes before running it.
2. **Ask, don't guess.** If the deploy URL, a credential, or a permission is missing, **ask the
   user** for it. Never invent a URL, a token, or a host.

## What you need before connecting

- **The MCP URL.** This is `<deploy-origin><mcp.path>` — e.g. `https://kb.acme.com/api/mcp`. Get the
  origin and path from:
  - `superlore.json` → `mcp.path` (defaults to `/api/mcp`), plus the deploy origin, **or**
  - the user (ask: _"What URL is your superlore KB deployed at?"_). For local dev it's typically
    `http://localhost:3000/api/mcp` (or whatever port `superlore dev` printed).
  - If you don't know the origin and it isn't in `superlore.json`, **ask** — don't assume `localhost`
    or any host.
- **A name** for the server entry. Default to `superlore`, or `superlore-<kb-name>` if the user runs more
  than one KB. Confirm if there might be a collision with an existing entry.
- **Auth, if the deploy is gated.** If `superlore.json` has `auth.enabled: true` (or the URL 401s), the
  MCP inherits the site's auth policy and the client needs a credential. **Ask the user** how
  they authenticate (e.g. a bearer token / header) and how they want to supply it — **never** ask
  them to paste a secret into the chat or hard-code one. Prefer an env-var reference. If you can't
  get a credential cleanly, stop and tell the user what's needed.

## Connect it (user level)

Prefer the Claude CLI, registering at the **user** scope so it's available across the user's
projects. **Show the command and ask first**, then run on approval:

```bash
# Public KB (no auth) — user-level (-s user)
claude mcp add --transport http -s user superlore https://YOUR-DEPLOY/api/mcp
```

For a **gated** deploy that needs a header, add it with `--header` (ask the user for the header name
and how to supply the value; use an env-var reference, not a literal secret):

```bash
claude mcp add --transport http -s user superlore https://YOUR-DEPLOY/api/mcp \
  --header "Authorization: Bearer ${SUPERLORE_MCP_TOKEN}"
```

If `claude` (the CLI) isn't available, fall back to writing the client's `mcp.json` entry — again,
**show it and ask before writing**:

```json
{
  "mcpServers": {
    "superlore": {
      "type": "http",
      "url": "https://YOUR-DEPLOY/api/mcp"
    }
  }
}
```

(The repo's connect docs use `type: "http"` with the URL — match that. For a gated deploy, add the
auth `headers` per the client's format, sourcing the value from the environment, not a literal.)

## Verify

After it's registered, confirm the connection works (a fresh client session may be needed to load
the new server). Ask the agent to:

- `search` for a term you know is in the KB, and
- `get_page` a known path (e.g. `/docs/index` or the KB's home),

and confirm real structured data comes back. If it 401s, the deploy is gated and you need the
credential step above. If it 404s, re-check the URL/path (`mcp.path` in `superlore.json`).

## The five tools (so the user knows what they got)

| Tool                 | Does                                                          |
| -------------------- | ------------------------------------------------------------- |
| `search`             | Ranked page hits across the corpus                            |
| `get_page`           | A page's full structured content (frontmatter + nodes)        |
| `list`               | Knowledge nodes filtered by `kind` / `tag` / `entityType`     |
| `navigate`           | Outgoing refs + backlinks for a path / node id / ref          |
| `get_component_data` | The typed knowledge face behind one rendered component, by id |

## Remember

- **Permission first** — show the exact change, get a yes, then act. Default to **user** scope.
- **Ask for anything missing** — URL, name, credential. Never guess a host or fabricate a token.
- **No secrets in chat** — gated deploys use a header sourced from the environment, not a literal.
