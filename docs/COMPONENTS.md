# superlore — component catalog & the dual-representation contract

_Status: design locked. Drives implementation across Phases 1–3. See `docs/ARCHITECTURE.md` §2
for the contract and `CODING_STANDARDS.md` §1 for the rule._

Every component has a **render face** (a polished React component, tokens-only, light/dark co-equal per
`DESIGN.md`) and a **knowledge face** (a typed, structured serialization the MCP exposes). All
knowledge faces share one envelope and a small set of primitives, so the MCP is internally
coherent and composable. Authored once in MDX; a build step extracts the knowledge face into the
structured index (`ARCHITECTURE.md` §3–4).

---

## 1. Catalog

| Component                                                                   | Category       | Phase          | Purpose                                                                            |
| --------------------------------------------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------- |
| Prose, Heading, Link/CrossRef, InlineCode/CodeBlock                         | Prose/inline   | 1              | The MDX body; headings are the unit of `get_section`; links carry typed relations. |
| Badge / Pill / PillGroup, Tooltip, Icon                                     | Prose/inline   | 1              | Inline chips & glosses. Icon has no knowledge face.                                |
| Callout (Info/Tip/Warning/Danger/Note/Check)                                | Callouts       | 1              | Boxed admonition with severity.                                                    |
| KeyFacts                                                                    | Callouts       | 1              | Label→value fact pairs (mini-entity).                                              |
| Card / CardGroup                                                            | Nav & layout   | 1              | Linked tiles; a navigation surface.                                                |
| Columns / Frame / Tile / Shot                                               | Nav & layout   | 1              | Layout/media. Layout-only nodes pass children through.                             |
| Steps / Step                                                                | Nav & layout   | 1              | Ordered procedure.                                                                 |
| Tabs / Tab / CodeGroup                                                      | Nav & layout   | 1              | Alternative views of one thing.                                                    |
| Accordion / AccordionGroup                                                  | Nav & layout   | 1              | Collapsible detail / Q&A.                                                          |
| Tree                                                                        | Nav & layout   | 1              | File / hierarchy tree.                                                             |
| PageHero / SectionHead / MetaBar                                            | Nav & layout   | 1              | Page + section framing.                                                            |
| StatGrid, FeatureList                                                       | Structural     | 1              | Headline metrics; itemized feature/link list.                                      |
| Diagram (Mermaid)                                                           | Rich viz       | 1→2            | Theme-aware diagram + extractable node/edge graph.                                 |
| **Canvas / Whiteboard**                                                     | **Rich viz**   | **2→3**        | **Nodes/groups/connectors auto-laid-out from MDX; serializes to a graph.**         |
| **Chart**                                                                   | **Rich viz**   | **2→3**        | **Bar/line/area from inline data; serializes to the series.**                      |
| **Timeline**                                                                | **Structural** | **2**          | **Dated, ordered events with status.**                                             |
| **Board / Kanban**                                                          | **Structural** | **2**          | **Columns of cards by status/lane.**                                               |
| **EntityCard / EntityProfile**                                              | **Structural** | **2**          | **A typed thing (person, service, term) with fields + relations.**                 |
| **Table / DataTable**                                                       | **Structural** | **2**          | **Typed columns + rows.**                                                          |
| Release / Changelog                                                         | Structural     | 2              | Versioned change entries.                                                          |
| FAQ, Glossary/Term                                                          | Structural     | 2              | Q→A pairs; defined terms + aliases.                                                |
| AgentBadge, McpPanel, CopyForAgent                                          | Agent/MCP      | 2              | The agent-readability affordances (no knowledge face).                             |
| Search (⌘K)                                                                 | Search         | 1 site / 2 MCP | Corpus search; MCP `search`.                                                       |
| Decision/ADR, Roadmap, Comparison, ParamList, Endpoint, ProcessFlow, Metric | Structural     | 3              | Specializations of the Phase-2 shapes (see §5).                                    |

Layout-only components (Columns, Frame, Tabs container, PageHero) emit no knowledge node — their
children's nodes pass through, keeping the index free of presentational noise.

---

## 2. Shared knowledge primitives

These are the spine of the MCP. Every knowledge face either **is** a `KnowledgeNode` or composes
these. (Lives at `packages/superlore/src/knowledge/primitives.ts`.)

```ts
/** Stable slug id, unique within a page; globally addressable as `${pageId}#${id}`. */
export type KId = string;

export type KKind =
  | "prose"
  | "heading"
  | "code"
  | "callout"
  | "keyfacts"
  | "card"
  | "media"
  | "steps"
  | "tabs"
  | "accordion"
  | "tree"
  | "statgrid"
  | "featurelist"
  | "diagram"
  | "timeline"
  | "board"
  | "entity"
  | "table"
  | "release"
  | "faq"
  | "term"
  | "decision"
  | "roadmap"
  | "comparison"
  | "params"
  | "endpoint"
  | "process"
  | "metric";

/** Lifecycle status — one enum across Timeline, Board, Roadmap, Decision, Release… */
export type Status =
  | "planned"
  | "in-progress"
  | "blocked"
  | "done"
  | "deprecated"
  | "proposed"
  | "accepted"
  | "rejected"
  | "superseded";

export type Severity = "info" | "tip" | "success" | "warning" | "danger";

/** Store ISO-8601; keep precision so the MCP can range-query. */
export interface KDate {
  iso: string;
  precision: "year" | "quarter" | "month" | "day" | "datetime";
}

/** The one relation type. Every cross-reference is a typed, directed Ref. */
export interface Ref {
  rel:
    | "links"
    | "parent"
    | "child"
    | "related"
    | "depends-on"
    | "blocks"
    | "supersedes"
    | "superseded-by"
    | "defines"
    | "mentions"
    | "owned-by"
    | "part-of"
    | "see-also";
  /** A page (`/path`), a node (`/path#id`), an entity (`entity:type/slug`), or a URL. */
  target: string;
  label?: string;
  internal: boolean; // resolved at index time: does the target exist in this knowledge base?
}

export type KValue = string | number | boolean | KDate | null;
export interface Field {
  key: string;
  value: KValue;
  type?: "text" | "number" | "bool" | "date" | "enum" | "code" | "ref";
}

/** THE ENVELOPE. Every component's knowledge face extends this. */
export interface KnowledgeNode {
  kind: KKind;
  id: KId;
  title?: string;
  summary?: string; // plain-text gloss for search/snippets
  tags?: string[];
  status?: Status;
  refs?: Ref[]; // outgoing relations — powers `navigate`
}

/** What a page serializes to: ordered nodes + the page's frontmatter envelope. */
export interface KnowledgePage extends KnowledgeNode {
  kind: "prose";
  path: string;
  frontmatter: { title: string; summary?: string; tags?: string[]; refs?: Ref[] };
  nodes: KnowledgeNode[]; // flattened, in document order
}
```

`KnowledgeNode` is the **only** shape an agent must learn: `kind` discriminates, `refs[]` is the
universal graph edge, and `status`/`KDate`/`Severity` are shared enums so "everything
`in-progress`" or "everything dated in Q3" works **across** Timeline, Board, Roadmap, and
Release with no per-component query logic.

---

## 3. Phase-2 specs (the moat) — render + knowledge face

The full per-component specs for the Phase-1 extraction set live in this file's history of the
design; the trivial faces (Callout→`{severity,body}`, Steps→`{steps[]}`, KeyFacts→`{fields[]}`,
StatGrid→`{stats[]}`, Code→`{lang,code}`, Card→link `refs`) exist mainly to prove the registry on
easy cases. The differentiators below are the ones to get exactly right.

### Timeline ★

- **Render:** vertical rail, each item a dated row (`mono` date, title, body, a `Status` dot).
  Scrolls in its own container. `role="list"` + `aria-label`.
- **Knowledge:**
  ```ts
  interface TimelineItem {
    id: KId;
    date: KDate;
    title: string;
    body?: string;
    status?: Status;
    tags?: string[];
    refs?: Ref[];
  }
  interface TimelineNode extends KnowledgeNode {
    kind: "timeline";
    items: TimelineItem[];
  }
  ```
- **MCP:** range queries by date precision, filter by status, follow refs.

### Board / Kanban ★

- **Render:** horizontal labelled columns of cards; column header carries a count chip; scrolls
  horizontally in its own container (page body never does).
- **Knowledge:**
  ```ts
  interface BoardCard {
    id: KId;
    title: string;
    body?: string;
    status?: Status;
    assignee?: string;
    tags?: string[];
    refs?: Ref[];
  }
  interface BoardColumn {
    id: KId;
    title: string;
    status?: Status;
    cards: BoardCard[];
  }
  interface BoardNode extends KnowledgeNode {
    kind: "board";
    columns: BoardColumn[];
  }
  ```
- **MCP:** "what's in In-Progress?" / "all cards assigned to X across columns."

### EntityCard / EntityProfile ★

- **Render:** `lg` card — optional avatar/icon, title + `entityType` chip, a `dl` of fields,
  a relations row of pill-links.
- **Knowledge:** registers a first-class graph entity.
  ```ts
  interface EntityNode extends KnowledgeNode {
    kind: "entity";
    entityType: string;
    slug: string;
    fields: Field[];
    // refs[] carries owned-by / depends-on / part-of / related…
  }
  ```
- **MCP:** `list(entityType:"service")`, `get(entity:service/auth-api)`, `navigate(depends-on)`.
  The single highest-leverage knowledge face — it turns the KB into a knowledge graph.

### Table / DataTable ★

- **Render:** bordered table, `mono`/tabular for numeric columns, sticky header, own scroll
  container.
- **Knowledge:** columns carry types so the agent knows how to compare/sort.
  ```ts
  interface TableColumn {
    key: string;
    label: string;
    type?: Field["type"];
  }
  interface TableNode extends KnowledgeNode {
    kind: "table";
    columns: TableColumn[];
    rows: Record<string, KValue>[];
  }
  ```
- **MCP:** "which plan has the highest limit?" — typed rows, no OCR.

### Rich visualization — Canvas / Whiteboard, Chart (see `docs/VISION.md` Bet 1)

Visuals are first-class, not decoration — but they still obey the contract: the human sees the
picture, the agent gets the graph/series. Never an opaque image.

```ts
interface CanvasNode extends KnowledgeNode {
  kind: "diagram";
  syntax: "canvas"; // shares the diagram kind/graph shape
  nodes: { id: string; label?: string; group?: string; kind?: string }[];
  edges: { from: string; to: string; label?: string; rel?: Ref["rel"] }[];
}
interface ChartNode extends KnowledgeNode {
  kind: "metric";
  chart: "bar" | "line" | "area";
  series: { name: string; points: { x: KValue; y: number }[] }[];
  unit?: string;
}
```

- **Canvas/Whiteboard render:** declarative MDX → auto-laid-out nodes/groups/connectors,
  tokenized (light/dark co-equal); scrolls in its own container. The "draw it for me" surface. **Built on
  React Flow (`@xyflow/react`, MIT) + ELK (elkjs)** — RF's `{nodes, edges}` state _is_ the
  `CanvasNode` graph above (the render and the knowledge face are two projections of one source;
  ELK only adds geometry, never mutates the semantic graph). Author writes `<Node>`/`<Edge>`/
  `<Group>` with no positions; ELK lays it out (in a worker). Lazy `"use client"` island
  (`dynamic(ssr:false)`); theme via Tailwind v4 CSS vars. dagre = optional flat-tree fast-path;
  Excalidraw = deferred freeform mode; tldraw avoided (non-MIT, watermark license).
- **Chart render:** tokenized bar/line/area; tabular figures; the agent reads `series`, not pixels.

### Release, FAQ, Term, Diagram (graph extraction)

```ts
interface ReleaseChange {
  type: "added" | "changed" | "fixed" | "removed" | "deprecated" | "security";
  text: string;
  refs?: Ref[];
}
interface ReleaseNode extends KnowledgeNode {
  kind: "release";
  version: string;
  date: KDate;
  changes: ReleaseChange[];
}
interface FaqNode extends KnowledgeNode {
  kind: "faq";
  items: { q: string; a: string; refs?: Ref[] }[];
}
interface TermNode extends KnowledgeNode {
  kind: "term";
  term: string;
  aliases?: string[];
  definition: string;
}
interface DiagramNode extends KnowledgeNode {
  kind: "diagram";
  syntax: "mermaid";
  source: string; // always preserved (lossless)
  graph?: {
    nodes: { id: string; label?: string }[];
    edges: { from: string; to: string; label?: string }[];
  };
}
```

---

## 4. How a component declares its knowledge face (resolves HANDOFF §7)

**Decision: a colocated `toKnowledge()` serializer per component, surfaced through a central
registry, extracted at build time from the MDX AST — not at runtime.**

Why: props-are-the-shape fails for children-driven components (Callout, Steps) and leaks
render-only props; a registry-only extractor divorces extraction from the component and drifts.
Colocation forces both faces into one file (structurally enforcing `CLAUDE.md`'s rule); the
registry gives the build a single entry point. MDX props only exist at render time, too late for
the static index — so extraction runs over the compiled MDX AST in the existing `fumadocs-mdx`
pipeline, and the MCP serves the prebuilt index (no React render, no scraping, no drift).

```ts
// packages/superlore/src/knowledge/registry.ts
export interface ExtractCtx {
  pageId: string;
  nextId: (hint?: string) => KId;
  text: (children: unknown) => string; // MDX children → plain text
  resolveRef: (target: string) => Ref; // sets Ref.internal by checking the index
}
export interface KnowledgeComponent<P> {
  schema: import("zod").ZodType<P>; // validates authored props at build time
  toKnowledge: (props: P, ctx: ExtractCtx) => KnowledgeNode;
}
export const knowledgeRegistry = new Map<string, KnowledgeComponent<unknown>>();
export function registerKnowledge<P>(name: string, def: KnowledgeComponent<P>): void;
```

```ts
// timeline.tsx — both faces, one file
export function Timeline(props: TimelineProps) { /* render face — tokens only */ }
registerKnowledge<TimelineProps>("Timeline", { schema, toKnowledge: (p, ctx) => ({ kind: "timeline", … }) });
```

Two enforcement wins fall out: (a) CI fails if a component is in the MDX registry but missing a
`registerKnowledge` entry — "render-only" becomes un-shippable; (b) the `schema` validates
authored MDX at build time, so malformed `items`/`columns` fail before reaching either face.

**Page frontmatter** supplies the page-level envelope (`title`, `summary`, `tags`, `refs`) via a
typed frontmatter schema (extend `source.config.ts`'s `defineDocs`). Frontmatter `refs` are
page-to-page edges; component `refs` are finer edges; both flow into one relation graph.

---

## 5. Phasing + the first three to build

- **Phase 1 (now):** the `mintlify` + `polish` + `mermaid` extraction, the knowledge primitives,
  the registry, and the build-time extractor scaffold. Trivial faces prove the plumbing.
- **Phase 2 (the moat):** Timeline, Board, EntityCard, Table, Release, FAQ, Term + agent
  affordances + MCP-side search.
- **Phase 3+:** Decision/ADR (≈ Entity + Status), Roadmap (≈ time-bucketed Board),
  Comparison (≈ Table), Endpoint (≈ Entity + ParamList), ProcessFlow, Metric. Each is a
  specialization of a Phase-2 shape, so they're cheap once Phase 2 lands.

**Build first, to prove the contract end-to-end:**

1. **EntityCard** — most agent-valuable; exercises envelope + `Field[]` + `Ref[]` + custom type.
2. **Timeline** — the canonical "data not a picture"; proves `KDate` range + `Status`.
3. **Table/DataTable** — the most general container; proves lossless typed rows; substrate for
   the Phase-3 specializations.

Together they cover the three structurally distinct shapes the rest of the catalog reduces to: a
graph node, a time/status sequence, and a typed grid. Prove these and the moat is real.
