# superlore

**The company knowledge base your agents run on.** `superlore` is the core library behind
[superlore](https://superlore.vercel.app) — a dual-representation component library, theme, MCP
server, and pluggable auth for **Next.js 16 + Fumadocs**. You author once in MDX; humans get a
clean, interactive, visual KB, and agents get the same content as structured, machine-readable
knowledge over **MCP**.

> **One corpus. Humans and agents.**

```bash
npm i superlore
# peers: next@16 react@19 react-dom@19 fumadocs-ui@16 fumadocs-core@16 tailwindcss@4
```

## The idea: dual representation

Every superlore component renders beautifully for people **and** serializes to clean, typed
knowledge for agents — from one authored source. A `Timeline` is never a picture an agent has to
interpret; the agent gets `{ kind: "timeline", items: [...] }`. You never write the data twice.

```mdx
<Timeline
  items={[
    { date: "2026-07-01", title: "Kickoff", status: "done" },
    { date: "2026-Q3", title: "GA launch", status: "planned" },
  ]}
/>
```

That single block is a polished, accessible list for humans and a structured record your agents
read over the MCP — from the same MDX.

## Wire it up

```tsx
// mdx-components.tsx — spread superlore's components into your MDX map
import { getMDXComponents } from "superlore";
export function useMDXComponents(components) {
  return getMDXComponents(components);
}
```

```css
/* global stylesheet — after Tailwind + the Fumadocs presets */
@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
@import "superlore/css";
@source "../node_modules/superlore/dist";
```

```ts
// source.config.ts — base your schema on superlore's knowledge envelope
import { defineDocs } from "fumadocs-mdx/config";
import { superloreFrontmatterSchema } from "superlore/frontmatter";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: superloreFrontmatterSchema.extend({
      /* your fields */
    }),
  },
});
```

The fastest path is to let an agent do all of this — see
[Getting started](https://superlore.vercel.app/docs/getting-started).

## What's in the box

- **Visual & structural (dual-representation):** `Canvas` / `Whiteboard` (FigJam-style boards
  authored in MDX), `Timeline`, `Board` / `Kanban`, `Releases` / `Changelog`, `Schedule`,
  `Decision`, `Comparison`, `Roster`, `Checklist` / `Runbook`, `Table` / `DataTable`,
  `EntityCard`, `Diagram`, `Mermaid`, `Walkthrough`.
- **Editorial & layout:** `PageHero`, `StatGrid`, `KeyFacts`, `FeatureList`, `SectionHead`,
  `MetaBar`, `Pill` / `PillGroup`.
- **Familiar primitives:** callouts (`Note` / `Tip` / `Warning` / `Danger`), `Card` / `CardGroup`,
  `Columns`, `Tabs`, `Steps`, `Accordion`, `Tree`, `Frame`, `Tooltip`, `Badge`, `Icon`.

Light and dark are co-equal, driven from one design-token set; never branch on theme in code.

## Exports

| Import                  | What                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| `superlore`             | `getMDXComponents`, the full component set, theme helpers                  |
| `superlore/mcp`         | The MCP server — expose your corpus to agents over the same content        |
| `superlore/auth`        | Pluggable Auth.js (Google SSO) gate for the site **and** the MCP           |
| `superlore/frontmatter` | The `superloreFrontmatterSchema` knowledge envelope (`summary`, `tags`, …) |
| `superlore/css`         | The superlore theme (violet brand tokens, light/dark)                      |

## Links

- **Docs:** https://superlore.vercel.app/docs
- **Components:** https://superlore.vercel.app/docs/components
- **Agents & MCP:** https://superlore.vercel.app/docs/agents/mcp
- **CLI:** [`superlore-cli`](https://www.npmjs.com/package/superlore-cli) — `superlore init`

## License

[Apache-2.0](./LICENSE) © [Krishnan S G](https://github.com/KrishnanSG). Bundled third-party
components retain their own licenses — see [`NOTICE`](./NOTICE).
