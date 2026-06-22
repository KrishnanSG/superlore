<div align="center">

# superlore-cli

**The command companion your agents drive to build a knowledge base.**

Scaffold the project, write the config, seed pages, wire the MCP, run the build — `superlore-cli`
is the hands your agent uses to turn _"make me a docs site"_ into a real, MCP-native KB. You can
drive it yourself, too.

_One corpus. Humans and agents._

</div>

---

## Let your agent do it

Install the superlore Claude plugin:

```text
/plugin marketplace add KrishnanSG/superlore
/plugin install superlore@superlore
```

Then just ask:

```text
Make me a docs site with superlore
```

Your agent runs `superlore` under the hood — scaffolds the app, writes `superlore.json`, seeds a
page or two, mounts the MCP route, and previews it. You watch it happen. Then keep talking:
_"add an onboarding page"_, _"diagram our architecture"_, _"draft the Q3 roadmap."_

## Or drive it yourself

```bash
curl -fsSL https://superlore.vercel.app/install.sh | sh    # or: npm i -g superlore-cli
```

```bash
superlore init my-kb   # scaffold — 2 questions → superlore.json + starter pages, then sets up your editor
superlore connect      # detect VS Code / Cursor / Windsurf and install the live-preview extension
superlore dev          # live preview at localhost:3000
superlore build        # production build, deploy anywhere
```

`init` ends by offering to run `connect` for you, so one command takes you from nothing to a
scaffolded KB with the editor extension installed — then it points you at wiring the MCP to your
agent. `connect` detects each editor via its CLI or standard install path (macOS / Linux / Windows)
and is safe to re-run.

`superlore deploy` is reserved for managed **superlore Cloud**
([waitlisted](https://superlore.vercel.app/cloud)) — self-host free with `superlore build`.

## `superlore.json`

`init` writes one config the CLI, the site, and your agents all read:

```json
{
  "name": "Acme Knowledge Base",
  "type": "company-kb",
  "auth": { "enabled": true, "provider": "google", "allowedDomain": "acme.com" },
  "mcp": { "enabled": true, "path": "/api/mcp" }
}
```

- **`type`** — `company-kb` (internal, for your teams + agents) or `product-docs` (public).
- **`auth`** — optional Google SSO that gates the site **and** the MCP.
- **`mcp`** — the agent endpoint, on by default at `/api/mcp`.

Need the schema in code? `import { parseSuperloreJson } from "superlore-cli/config"`.

## Links

**[Docs](https://superlore.vercel.app/docs)** · **[`superlore` core](https://www.npmjs.com/package/superlore)** · **[GitHub](https://github.com/KrishnanSG/superlore)**

## License

[Apache-2.0](./LICENSE) © [Krishnan S G](https://github.com/KrishnanSG). Bundled dependencies retain
their own licenses — see [`NOTICE`](./NOTICE).
