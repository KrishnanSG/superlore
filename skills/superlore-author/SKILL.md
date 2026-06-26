---
name: superlore-author
description: Author and edit content into an existing superlore knowledge base — "vibe your docs". Turns intent ("add a page about X", "document our onboarding", "make a roadmap") into well-structured MDX with dual-representation components (cards, timelines, boards, entity cards, tables, a Canvas), so humans get a clean page and agents get a typed knowledge face from one source. Use when adding, writing, editing, or restructuring pages, components, or a Canvas in a superlore KB.
metadata:
  author: superlore
  version: "1.2.1"
---

# Authoring superlore content ("vibe your docs")

Once a superlore KB exists (see **superlore-scaffold**), this skill turns a user's intent into real
content. The user describes what they want — _"add a page on our deployment process", "make a Q3
roadmap", "document the auth service"_ — and you write **MDX** that is correct, well-structured, and
upholds the dual-representation contract. They never have to learn MDX or the component API.

## The one rule: author the data, not a picture

Every superlore component is **dual-representation** — one authored instance renders for humans **and**
serializes to a typed **knowledge face** the MCP serves to agents. So you must author the _data_:

- ✅ `<Timeline items={[…]} />`, `<EntityCard fields={[…]} />`, `<DataTable rows={[…]} />`,
  `<KeyFacts items={[…]} />`, `<Comparison options={[…]} rows={[…]} />`.
- ❌ A screenshot of a roadmap, an ASCII table, or a paragraph that _describes_ a table. That data
  is then invisible to agents and unsearchable.

If you're about to write a Markdown table or a bulleted list of facts, reach for `DataTable` or
`KeyFacts` instead so the data survives into the knowledge face. If you're about to describe a
system, a flow, or a brainstorm visually, use a **Canvas** — and invoke the **superlore-canvas** skill,
which knows the full Canvas spec.

## Write the natural markdown — superlore upgrades it

Don't reach for a verbose component when plain markdown says it. superlore auto-upgrades the markdown
everyone already writes into the styled, dual-representation component — same knowledge face, zero
props to remember:

- **Task list → `Checklist`.** Write `- [ ] todo` / `- [x] done`. (Reach for `<Checklist items={…}>`
  only for owners, groups, or refs.)
- **GitHub alert → Callout.** Write `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
  `> [!CAUTION]` → `Note` / `Tip` / `Info` / `Warning` / `Danger`.
- **Fenced ` ```superlore-canvas `` → `Canvas`** (the headline visual path).
- A **code block** is always rendered dark, in any page theme — just fence it with its language.

So: prefer the markdown form first; use the explicit component only when you need a capability the
markdown can't express (typed columns, owners, a custom title). A plain Markdown table still renders,
but `DataTable` is better when the rows are real data an agent should read.

## Lead with a visual — always include a Canvas

Default to **opening the page with (or placing inline) a Canvas** that visualizes the thing — the
system, the flow, the relationships, the plan. A wall of prose is the failure mode: a reader (and an
agent) should grasp the _shape_ at a glance, then read the detail beneath it. Put the Canvas at the
top when it frames the whole page; place it inline next to the section it illustrates otherwise.

- Documenting a system or service → a Canvas of its architecture, up top.
- A process / onboarding / runbook → a Canvas of the flow.
- A decision, comparison, or plan → a Canvas mapping the options or the roadmap.
- Even a concept page is clearer with a small Canvas of how the pieces relate.

Invoke **superlore-canvas** for the spec. The bar: **visualize first**. Only skip the Canvas when a
page is genuinely non-visual (a pure changelog, a glossary) — and then do it deliberately, not by
default.

## The shape of a superlore page

A page is MDX: a typed frontmatter block, then prose enriched with components.

```mdx
---
title: Deploying Acme
icon: Rocket
description: How we ship Acme to production — environments, gates, rollback.
summary: Acme deploys via GitHub Actions to Vercel; staging auto-deploys, prod needs an approval, rollback is one click.
tags: [ops, deploy]
---

Prose connective tissue, then components.

<Steps>
  <Step title="Open a PR">…</Step>
</Steps>
```

### Frontmatter (the knowledge envelope)

| Field         | Required | Purpose                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `title`       | yes      | H1, nav label, and the unit of MCP `get_page`                           |
| `summary`     | no\*     | Plain-text gloss — powers search ranking and the first thing agents see |
| `tags`        | no       | Faceting in the UI and MCP `list` filters                               |
| `icon`        | no       | lucide icon name in **PascalCase** (e.g. `Rocket`, `LayoutTemplate`)    |
| `description` | no       | Rendered under the title; falls back to `summary` if unset              |

\* Not schema-required, but **always write a `summary`** — it's the single highest-leverage field
for search and for what an agent reads first. One plain, specific line.

Anything beyond these is the KB's own — if `source.config.ts` extends `superloreFrontmatterSchema` with
custom fields, carry them; don't invent fields that aren't in the schema.

## Workflow

1. **Understand the intent and the audience.** Internal company KB vs public product docs changes
   register. Ask only what you genuinely need (the topic, where it lives in the nav).
2. **Pick the right surface for the knowledge** (see the chooser below). Don't default everything to
   prose.
3. **Find where it goes.** Content lives under the KB's docs content dir (in superlore's own docs that's
   `apps/docs/content/docs/**`; in a scaffolded KB it's the project's `content/docs/**`). Add the new
   page to the section's `meta.json` so it appears in the nav.
4. **Write the MDX** — frontmatter first (with a real `summary`), then prose + components carrying
   the data.
5. **Verify against the MCP** if one is connected (see below).

## Choosing a component

| The knowledge is…                               | Reach for                                          |
| ----------------------------------------------- | -------------------------------------------------- |
| Dated events / status over time                 | `Timeline`                                         |
| A typed thing with fields + relations           | `EntityCard` (makes the KB a graph)                |
| Rows you'd sort or compare                      | `DataTable` (type numeric columns) / `Comparison`  |
| Headline numbers                                | `StatGrid`                                         |
| A few key attributes of one thing               | `KeyFacts`                                         |
| A sprint / sales / hiring board, a retro        | `Board`                                            |
| A decision with options + criteria              | `Decision` / `Comparison`                          |
| An ordered procedure                            | `Steps` / `Checklist`                              |
| Links to related pages                          | `CardGroup` + `Card`                               |
| A caveat, tip, or warning                       | `Callout` (`Note` / `Tip` / `Warning` / `Danger`)  |
| A flow, system, brainstorm, or map (**visual**) | **Canvas** → invoke the **superlore-canvas** skill |

Browse the full library in the KB's component docs (`content/docs/components/**`) when unsure — each
component page has a live example and shows its knowledge face.

## Connect related things

Use relations (`depends-on`, `part-of`, `related`, `links`) on entities and edges so the corpus is a
graph, not a pile of pages — the MCP's `navigate` tool follows them. Keep headings (and thus section
ids) stable, because titles become addresses (`${path}#${id}`) and inbound links + `navigate`
targets depend on them.

## Style (match superlore)

- **No emoji in content UI.** One accent (violet by default); let structure carry hierarchy.
- Light and dark are co-equal — never hand-author theme-specific values; it's a token swap.
- Lead every page with a `summary`. Prefer structural components over prose tables and screenshots.

## MDX safety — never emit unescaped `{ … }` or `<Tag>` in prose

In MDX an unescaped `{` opens a **JavaScript expression**, so prose like `### GET /users/{id}`
compiles fine but **throws at render** (`ReferenceError: id is not defined`) and can blank the page.
This is the mainline for API/SRS content. Neutralize hazards in **non-code** text:

- **API paths / params** → wrap in inline code: `` `/users/{id}` `` (highest-value rule), or escape: `\{id\}`.
- **`${…}` shell/template** and **`{{ … }}` mustache** → fence or inline-code them.
- **`<Foo>` that isn't a real superlore/HTML component** → inline-code or escape (`\<`).
- Braces inside fenced/inline code are already literal — leave them.

Lint generated MDX before writing it and self-correct. The package ships the check:

```ts
import { findMdxProblems } from "superlore/mdx-lint"; // dependency-free; returns string[]
const problems = findMdxProblems(mdx); // e.g. ["line 3: \"{id}\" … wrap in backticks or escape as \\{."]
```

(The runtime also wraps each doc in an error boundary, so a missed case degrades to a fallback
instead of crashing the host — but escape at author time; don't rely on the floor.)

## Verify with the MCP

After authoring, if the KB's MCP is connected, point an agent at it and confirm `search` finds the
new page and `get_page` returns the structure you intended (the timeline's items, the table's rows,
the canvas's nodes/edges). If the data isn't there, you wrote a picture — fix it by moving the
knowledge into a component. (To connect the MCP, use **superlore-connect-mcp**.)

## Remember

- One source, two faces. Author the **data**.
- **Lead with a Canvas** — visualize the thing at the top or inline; prose supports the picture.
- A `summary` on every page; structural components over prose; stable headings.
- Visual/diagram/whiteboard work → hand off to **superlore-canvas**.
