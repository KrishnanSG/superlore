# superlore — product vision (north star)

_Captures the direction beyond the locked architecture. `docs/ARCHITECTURE.md` is the system as
designed today; this is where it's going. Nothing here is built yet — it's the bet we're
building toward. Last updated 2026-06-19._

## The one-liner

**One corpus. Humans and agents.** Author knowledge once; humans get a clean, _visual_,
interactive KB and agents get a first-class MCP over the same structured content. Two further
bets sharpen this:

## Bet 1 — Visuals are first-class, not decoration

People don't read walls of text; a good visual is ~10× more impactful. superlore treats **rich
visualization as a primary authoring primitive**, not an afterthought:

- **Diagrams from MDX, automatically.** Mermaid today (`Diagram`), but the bar is higher: an
  author (or their agent) writes intent in MDX and gets a clean, theme-aware diagram with no
  hand-layout. Flow, sequence, architecture, graph.
- **An auto-rendered whiteboard / canvas.** A `Canvas`/`Whiteboard` component that lays out
  nodes, groups, and connectors from declarative MDX — the "draw it for me" surface, tokenized
  (light and dark as equals), and (per the contract) serializing to a node/edge **graph** the MCP can traverse.
  **Decision (researched):** build it on **React Flow (`@xyflow/react`, MIT) + ELK (elkjs) for
  auto-layout** — React Flow's `{nodes, edges}` state _is_ the knowledge graph, so the human
  render and the MCP face are two projections of one source and can't drift. Dagre is a flat-tree
  fast-path; Excalidraw (MIT) is a deferred freeform mode. **tldraw is ruled out** — its
  source-available license ($6k/yr watermark removal) is incompatible with shipping inside an MIT
  package that deploys anywhere. Mount as a `"use client"` lazy island (`dynamic(ssr:false)`);
  theme via Tailwind v4 CSS variables (no JS theme branching).
- **Charts & metrics as data+picture.** Bar/line/area from inline data, rendered for humans and
  serialized as the underlying series for agents — the numbers, not just the picture.

Every visualization still obeys the dual-representation contract: the human sees the picture;
the agent gets the graph/series/records behind it. Visuals are the human face of the same
structured knowledge — they never become an opaque image.

## Bet 2 — superlore is the rich viewer for the docs agents already make (the adoption wedge)

Teams and individuals now generate huge volumes of **plain `.md`** with their agents — plans,
specs, briefs, postmortems. Markdown is boring: text, maybe an image, flat. Meanwhile the
content _wants_ to be a board, a timeline, a set of cards, a diagram. superlore closes that gap by
meeting people where they already are:

1. **The superlore format.** A rich, superlore-flavored **`.mdx`** — frontmatter + superlore components
   (cards, boards, timelines, entities, visualizations). Same authoring whether a human or an
   agent writes it. (Open question: keep it as plain `.mdx`, which every tool already
   understands, vs. a distinct extension like `.kdx`. Leaning `.mdx` to minimize friction; a
   recognizable alias is a marketing/UX call, not a technical need.)
2. **A public ingest skill.** A skill anyone clones into Claude / their agent so that the docs it
   produces come out as **superlore-style `.mdx`** instead of flat `.md` — promoting prose into
   cards/boards/timelines/diagrams where it fits. Zero superlore knowledge required; the skill
   carries it. (This is a sibling to the scaffold/author/deploy skills already planned.)
3. **A drag-and-drop viewer.** Drop a superlore `.mdx` (or even a plain `.md`) onto superlore and
   _instantly_ see the rich, visual rendering — every superlore component, the violet theme, the
   structure. **Possibly ephemeral: render-only, nothing stored** — the value is the instant
   "whoa, my boring plan is now a living document." This is the lowest-friction on-ramp to the
   whole product and a strong virality lever.
4. **Comment → download → hand back to the agent.** Readers leave **inline comments** on the
   rendered doc, **download** them (structured), and feed them back to the agent that wrote it —
   closing the loop: _agent authors → human reviews visually + comments → comments return to the
   agent_. Review becomes a first-class, agent-compatible step, not a Google-Docs detour.

### Why this matters

- It rides an existing behavior (agents writing `.md`) instead of asking for a new one.
- The viewer is a near-zero-commitment entry point — no deploy, no account, maybe no storage —
  that demonstrates the entire value prop in one drag-and-drop.
- The comment loop makes superlore part of the agent _workflow_, not just an output target.
- All of it reuses the same component library + dual-representation contract — the viewer is
  just another projection of the superlore content model.

## How these fold into the plan

- **Components:** add a **Rich visualization** category — `Canvas`/`Whiteboard`, `Chart`, and a
  stronger `Diagram` — to `docs/COMPONENTS.md`, each with a knowledge face (graph/series).
- **Skills:** add an **ingest** skill (`.md` → superlore `.mdx`) alongside scaffold/author/deploy.
- **Surfaces:** add the **superlore Viewer** (drag-and-drop, ephemeral render) and the **comment +
  export** loop as new roadmap phases (`docs/ROADMAP.md`).

## Open questions this raises

- Corpus file extension: `.mdx` vs a branded `.kdx`/`.superlore` alias. (Lean `.mdx`.)
- Viewer: purely client-side render (privacy, no storage) vs optional save/share. Start
  client-side and ephemeral.
- Comment storage/export format: a portable JSON sidecar the agent can read; where it lives when
  the doc itself isn't stored.
- How much "promotion" (prose → board/timeline/cards) the ingest skill does automatically vs.
  suggests.
