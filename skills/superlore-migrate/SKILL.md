---
name: superlore-migrate
description: Migrate an existing docs site or a set of Markdown/MDX files (Mintlify, Docusaurus, Fumadocs, Nextra, GitBook, plain .md — any framework) into a superlore knowledge base. First produces a detailed migration PLAN authored as a superlore doc (with a Canvas of the migration) that the user reviews and comments on in the editor preview or the Viewer; on approval it converts every page to superlore MDX with dual-representation components, verifies the build + key pages with Playwright, and writes a post-migration summary doc with screenshots and per-item status. Use when someone wants to move / convert / port / migrate their docs to superlore, or says "migrate my Mintlify/Docusaurus/markdown docs to superlore".
metadata:
  author: superlore
  version: "1.0.0"
---

# Migrating docs into superlore

Take someone from "I have docs in X" to "my docs are a superlore KB" — seamlessly, and without
losing their review. The headline: **plan first (and let them comment), then migrate, then prove it.**

The flow is itself authored in superlore — the plan and the summary are superlore `.mdx` docs (each
**led by a Canvas**), so the user reviews them in the editor preview or the Viewer
(`superlore.vercel.app/viewer`) and can drop comments before you touch their content.

## Principles

- **Plan before you migrate.** Never bulk-convert blind. Produce a plan, get a thumbs-up (or
  comments), then execute.
- **Author the data, lead with a visual.** Follow **superlore-author**: every migrated page leads
  with (or includes) a Canvas, and prose tables/lists become `DataTable` / `KeyFacts` / `Timeline`.
  Don't transliterate Markdown — upgrade it to dual-representation.
- **Don't guess the API.** Look up component props + the Canvas vocabulary via the **superlore-docs**
  MCP (`search`, `get_page`, `get_component_data`) or https://superlore.vercel.app/docs.
- **Assume sensible defaults; ask rarely.** Resolve ambiguity from the source repo + the docs. Ask
  the user only what's genuinely blocking (company KB vs public docs? auth-gated?).
- **Prove it.** Build + Playwright-verify key pages before declaring done.

## The flow

### 1 · Scan the source

Identify the framework and inventory the content:

| Source     | Tell-tale                          | Content                                             |
| ---------- | ---------------------------------- | --------------------------------------------------- |
| Mintlify   | `mint.json` / `docs.json`          | `.mdx`, `<Card>/<Steps>/<Tabs>/<Accordion>/<Frame>` |
| Docusaurus | `docusaurus.config.js`, `sidebars` | `docs/**/*.md(x)`, `:::note` admonitions            |
| Fumadocs   | `source.config.ts`                 | `content/docs/**/*.mdx` (closest already)           |
| Nextra     | `theme.config`, `_meta.js`         | `pages/**/*.md(x)`                                  |
| GitBook    | `SUMMARY.md`, `.gitbook.yaml`      | `**/*.md`                                           |
| Plain MD   | a folder of `.md`                  | wherever                                            |

Build a content map: every page — path, title, nav order (from the source's sidebar/meta) — and the
framework-specific components used (so you know what to map).

### 2 · Author the migration PLAN (a superlore doc)

Write `superlore-migration-plan.mdx` so the user reviews it **in the editor preview or the Viewer**
and comments block-by-block. The plan MUST include:

- A **Canvas** of the migration — source tree → superlore KB, the component mapping, the phases.
  Lead with it (this is the "show them the shape" moment).
- A **DataTable**: every source page → its superlore destination path + the components it'll use.
- A **Comparison** mapping each source component → its superlore equivalent (table below).
- A **Timeline** or **Checklist** of the migration phases.
- Open questions (few) — each with your **proposed default**, so silence means proceed.

Then tell the user to open it (editor preview, or drop it in the Viewer) and comment. **Wait for
approval / comments before migrating.** Address comments, then proceed.

### 3 · Component mapping (source → superlore)

| From (any framework)                             | superlore                                       |
| ------------------------------------------------ | ----------------------------------------------- |
| `<Card>` / `<Cards>` / link grid                 | `Card` + `CardGroup`                            |
| `<Steps>` / numbered headings                    | `Steps` / `Checklist`                           |
| `<Tabs>`                                         | `Tabs`                                          |
| `<Accordion>` / `<details>`                      | `Accordion`                                     |
| admonition (`:::note`, `<Note>`, `> [!WARNING]`) | `Note` / `Tip` / `Warning` / `Danger`           |
| Mermaid / PlantUML / **an image of a diagram**   | **Canvas** (typed nodes+edges — never an image) |
| a Markdown table of data                         | `DataTable` (type numeric cols) / `Comparison`  |
| a key-facts / spec list                          | `KeyFacts` / `StatGrid`                         |
| a roadmap / changelog                            | `Timeline` / `Releases`                         |
| an API parameter table                           | `DataTable`                                     |
| frontmatter (title/description)                  | superlore frontmatter (+ always add `summary`)  |

Anything visual or diagram-shaped → **Canvas** (invoke **superlore-canvas**). superlore has **no
Mermaid** — a Mermaid block in the source becomes a Canvas, not a Mermaid block.

### 4 · Migrate

- No superlore KB yet? Scaffold one first (**superlore-scaffold**) — company-kb vs product-docs from
  the source's nature.
- Convert each page to `content/docs/**/*.mdx`: superlore frontmatter with a real `summary`, then the
  content with mapped components, **leading with a Canvas**. Preserve the source's nav order in each
  folder's `meta.json`; keep heading ids stable (links + MCP `navigate` depend on them); keep
  relative links working and add redirects if paths changed.
- Carry assets into `public/`; replace diagram images with real Canvases wherever you can.

### 5 · Verify (build + Playwright)

- `superlore build` (or `next build`) must pass — broken MDX fails the build.
- Playwright over the migrated site: load a sample of key pages (especially the heaviest, and any
  with canvases/tables), assert each renders (no error boundary; the Canvas / `DataTable` present),
  and capture a **screenshot** in light + dark.
- If the MCP is connected, spot-check: `search` finds migrated pages and `get_page` returns the typed
  structure (canvas nodes, table rows) — proof you migrated _data_, not pictures.

### 6 · Post-migration summary (a superlore doc)

Write `superlore-migration-summary.mdx` (the user opens it in the editor/Viewer):

- A **Canvas** of before → after (source tree → superlore KB).
- The plan's page table, now with a **status** per item: migrated · partial (what's left) · skipped
  (why) — using the original plan's items so they can see exactly what got done.
- The Playwright **screenshots** of the rendered pages (in `Frame`s).
- What was upgraded (e.g. "3 Markdown tables → DataTable; 2 Mermaid diagrams → Canvas") and any
  follow-ups.

## Remember

- Plan (a superlore doc they comment on) → migrate → verify → summarize (a superlore doc).
- Lead every migrated page with a Canvas; upgrade prose to dual-representation, don't transliterate.
- Mermaid / diagrams / images-of-diagrams → **Canvas**. Look up specs via the **superlore-docs** MCP.
- Assume sensible defaults; ask only what's blocking. Prove it (build + Playwright) before "done".
