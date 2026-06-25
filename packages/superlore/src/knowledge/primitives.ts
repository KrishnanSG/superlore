/**
 * The shared knowledge primitives — the spine of the MCP. Every component's knowledge face
 * either IS a `KnowledgeNode` or composes these. Keep this set small and consistent: one
 * envelope, one relation type, shared `Status`/`KDate`/`Severity` enums, so cross-component
 * queries ("everything in-progress", "everything dated in Q3") work without per-component logic.
 *
 * See docs/COMPONENTS.md §2 for the rationale.
 */

/** Stable slug id, unique within a page; globally addressable as `${pageId}#${id}`. */
export type KId = string;

/** Discriminator. Every knowledge node names its component kind. */
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
  | "schedule"
  | "roster"
  | "checklist"
  | "params"
  | "endpoint"
  | "process"
  | "metric"
  | "interface"
  | "handoff";

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

/** Severity for callouts / risk. */
export type Severity = "info" | "tip" | "success" | "warning" | "danger";

/** Precision a date was authored at, so the MCP can range-query sensibly. */
export type KDatePrecision = "year" | "quarter" | "month" | "day" | "datetime";

/** Store ISO-8601; keep precision. */
export interface KDate {
  iso: string;
  precision: KDatePrecision;
}

/** The relation vocabulary. Every cross-reference is a typed, directed `Ref`. */
export type RelKind =
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

export interface Ref {
  rel: RelKind;
  /** A page (`/path`), a node (`/path#id`), an entity (`entity:type/slug`), or a URL. */
  target: string;
  label?: string;
  /** Resolved at index time: does the target exist in this knowledge base? */
  internal: boolean;
}

export type KValue = string | number | boolean | KDate | null;

export type FieldType = "text" | "number" | "bool" | "date" | "enum" | "code" | "ref";

export interface Field {
  key: string;
  value: KValue;
  type?: FieldType;
}

/**
 * THE ENVELOPE. Every component's knowledge face extends this. `kind` discriminates; `refs[]`
 * is the universal graph edge (powers `navigate`); shared enums make cross-component queries work.
 */
export interface KnowledgeNode {
  kind: KKind;
  id: KId;
  title?: string;
  /** Plain-text gloss for search/snippets — never markup. */
  summary?: string;
  tags?: string[];
  status?: Status;
  refs?: Ref[];
}

/** Frontmatter envelope for a page. */
export interface PageFrontmatter {
  title: string;
  summary?: string;
  tags?: string[];
  refs?: Ref[];
}

/** What a page serializes to: ordered nodes + the page's own frontmatter envelope. */
export interface KnowledgePage extends KnowledgeNode {
  kind: "prose";
  path: string;
  frontmatter: PageFrontmatter;
  /** Flattened, in document order. */
  nodes: KnowledgeNode[];
}

/* ------------------------------------------------------------------ node subtypes ---- */

export interface CalloutNode extends KnowledgeNode {
  kind: "callout";
  severity: Severity;
  body: string;
}

export interface CodeNode extends KnowledgeNode {
  kind: "code";
  lang?: string;
  code: string;
  filename?: string;
}

export interface KeyFactsNode extends KnowledgeNode {
  kind: "keyfacts";
  fields: Field[];
}

export interface StatGridNode extends KnowledgeNode {
  kind: "statgrid";
  stats: { label: string; value: KValue; hint?: string }[];
}

export interface StepsNode extends KnowledgeNode {
  kind: "steps";
  steps: { n: number; title?: string; body: string }[];
}

export interface FeatureListNode extends KnowledgeNode {
  kind: "featurelist";
  items: { title: string; description?: string; href?: string }[];
}

export interface CardGroupNode extends KnowledgeNode {
  kind: "card";
  items: { title: string; description?: string; href?: string; icon?: string }[];
}

export interface TimelineItem {
  id: KId;
  date: KDate;
  title: string;
  body?: string;
  status?: Status;
  tags?: string[];
  refs?: Ref[];
}

export interface TimelineNode extends KnowledgeNode {
  kind: "timeline";
  items: TimelineItem[];
}

export interface BoardCard {
  id: KId;
  title: string;
  body?: string;
  status?: Status;
  assignee?: string;
  tags?: string[];
  refs?: Ref[];
}

export interface BoardColumn {
  id: KId;
  title: string;
  status?: Status;
  cards: BoardCard[];
}

export interface BoardNode extends KnowledgeNode {
  kind: "board";
  columns: BoardColumn[];
}

export interface EntityNode extends KnowledgeNode {
  kind: "entity";
  /** "person" | "service" | "dataset" | "concept" | author-defined. */
  entityType: string;
  /** Addressable as `entity:${entityType}/${slug}`. */
  slug: string;
  fields: Field[];
}

export interface TableColumn {
  key: string;
  label: string;
  type?: FieldType;
}

export interface TableNode extends KnowledgeNode {
  kind: "table";
  columns: TableColumn[];
  rows: Record<string, KValue>[];
}

export type ReleaseChangeType =
  | "added"
  | "changed"
  | "fixed"
  | "removed"
  | "deprecated"
  | "security";

export interface ReleaseChange {
  type: ReleaseChangeType;
  text: string;
  refs?: Ref[];
}

/**
 * Provider for an embedded release video — drives which facade the renderer mounts on click.
 * `iframe` is the generic escape hatch: the renderer embeds `src` verbatim in an `<iframe>`, so any
 * embeddable player works. `file` plays a raw media file in `<video>`; the named providers get their
 * canonical embed URL.
 */
export type ReleaseMediaProvider = "file" | "youtube" | "loom" | "vimeo" | "iframe";

/**
 * A screenshot or video attached to a release or a highlight. superlore never hosts — `src` is an
 * author-provided path/URL. Referenced, not pixel-embedded, so an agent gets `{type,title,caption}`
 * and never has to interpret an image. For video, `provider: "iframe"` embeds any URL verbatim.
 */
export interface ReleaseMedia {
  type: "image" | "video";
  src: string;
  /** For video: where it lives (a raw file vs an embeddable provider page). Defaults inferred from src. */
  provider?: ReleaseMediaProvider;
  /** Poster/thumbnail for video. */
  poster?: string;
  alt?: string;
  caption?: string;
  title?: string;
  /** Human duration label, e.g. "0:42". */
  duration?: string;
}

/** A marquee feature in a release — a typed highlight card (icon + title + body + optional media). */
export interface ReleaseHighlight {
  title: string;
  body?: string;
  /** lucide icon name (kebab-case). */
  icon?: string;
  href?: string;
  media?: ReleaseMedia;
}

/** Changes grouped under a heading (New features / Improvements / Fixes / Security). */
export interface ReleaseSection {
  label: string;
  /** lucide icon name; the renderer infers a sensible default from the label when omitted. */
  icon?: string;
  changes: ReleaseChange[];
}

export interface ReleaseNode extends KnowledgeNode {
  kind: "release";
  version: string;
  date: KDate;
  /** Product areas / features this release touched — powers the rail, the timeline hover card, filters. */
  areas?: string[];
  /** Hero & inline media — screenshots and videos, referenced (not embedded). */
  media?: ReleaseMedia[];
  /** Marquee features, each a typed highlight. */
  highlights?: ReleaseHighlight[];
  /** Changes grouped into sections. When present, the queryable spine; `changes` is the flat union. */
  sections?: ReleaseSection[];
  /** Flat changes — back-compat and the always-present flattened union of every section's changes. */
  changes: ReleaseChange[];
}

export interface FaqNode extends KnowledgeNode {
  kind: "faq";
  items: { q: string; a: string; refs?: Ref[] }[];
}

export interface TermNode extends KnowledgeNode {
  kind: "term";
  term: string;
  aliases?: string[];
  definition: string;
}

export interface ScheduleEvent {
  id: KId;
  date: KDate;
  title: string;
  time?: string;
  owner?: string;
  tags?: string[];
  body?: string;
  refs?: Ref[];
}

/** Dated events in an agenda — the date stays a parsed `KDate` so the MCP can range-query it. */
export interface ScheduleNode extends KnowledgeNode {
  kind: "schedule";
  events: ScheduleEvent[];
}

export type DecisionStatus = "proposed" | "accepted" | "rejected" | "superseded";

/** An architecture/decision record (ADR). `supersedes`/`superseded-by` ride the shared `refs[]`. */
export interface DecisionNode extends KnowledgeNode {
  kind: "decision";
  status: DecisionStatus;
  /** Author-facing decision identifier, e.g. "ADR-007". */
  identifier?: string;
  date?: KDate;
  context?: string;
  decision: string;
  consequences?: string[];
}

export type ComparisonVerdict = "yes" | "no" | "partial";

export interface ComparisonCell {
  /** A boolean-ish verdict an agent can filter on, when the cell is yes/no/partial. */
  verdict?: ComparisonVerdict;
  /** Free-text value, when the cell isn't a simple verdict. */
  text?: string;
}

/** A feature matrix — options (columns) × criteria (rows). Cells stay typed, never a rendered ✓. */
export interface ComparisonNode extends KnowledgeNode {
  kind: "comparison";
  options: { id: KId; label: string }[];
  criteria: {
    id: KId;
    label: string;
    /** Keyed by option id. */
    cells: Record<string, ComparisonCell>;
  }[];
}

export interface Person {
  id: KId;
  name: string;
  role?: string;
  /** Addressable as `entity:person/${slug}`. */
  slug?: string;
  email?: string;
  /** The id of the person this one reports to — the org edge. */
  reportsTo?: KId;
  tags?: string[];
  refs?: Ref[];
}

/** A team roster — people with optional reporting lines. Each person is a graph-addressable node. */
export interface RosterNode extends KnowledgeNode {
  kind: "roster";
  people: Person[];
}

export interface ChecklistItem {
  id: KId;
  text: string;
  done: boolean;
  owner?: string;
  group?: string;
  refs?: Ref[];
}

/** An actionable checklist / runbook. Done-state is a real boolean an agent can count. */
export interface ChecklistNode extends KnowledgeNode {
  kind: "checklist";
  items: ChecklistItem[];
}

export interface GraphNodeShape {
  id: string;
  label?: string;
  group?: string;
  kind?: string;
  /** For an embedded superlore component (`kind:"embed"`) — its own serialized knowledge node. */
  embed?: KnowledgeNode;
}

export interface GraphEdgeShape {
  from: string;
  to: string;
  label?: string;
  rel?: RelKind;
}

/** Mermaid `Diagram`, the React-Flow `Canvas`, and a stepped `Walkthrough` share this graph shape. */
export interface DiagramNode extends KnowledgeNode {
  kind: "diagram";
  syntax: "mermaid" | "canvas" | "walkthrough";
  /** Lossless source for mermaid diagrams; optional for canvas. */
  source?: string;
  graph?: { nodes: GraphNodeShape[]; edges: GraphEdgeShape[] };
}

export interface ChartNode extends KnowledgeNode {
  kind: "metric";
  chart: "bar" | "line" | "area";
  series: { name: string; points: { x: KValue; y: number }[] }[];
  unit?: string;
}

export interface PreviewTab {
  label: string;
  active?: boolean;
}

export interface PreviewNavItem {
  label: string;
  active?: boolean;
  collapsed?: boolean;
  children?: PreviewNavItem[];
}

export interface PreviewNavGroup {
  /** Optional uppercase group label in the sidebar. */
  group?: string;
  items: PreviewNavItem[];
}

/**
 * A UI mockup — a browser/app interface preview (`Preview`). The human sees a styled window; the
 * agent gets the interface as DATA: the URL, the tab bar, and the nav tree (groups → items, with
 * active / collapsed / nested state) — never a picture to interpret. This is the dual-representation
 * contract applied to "what the screen looks like": an agent can answer "what tabs does the docs
 * site have?" without OCR.
 */
export interface InterfaceNode extends KnowledgeNode {
  kind: "interface";
  /** "app" once it carries product nav (tabs/sidebar/brand); "browser" for a bare window. */
  chrome: "browser" | "app";
  url?: string;
  tabs?: PreviewTab[];
  sidebar?: PreviewNavGroup[];
  /** Plain-text gloss of the content shown inside the frame. */
  content?: string;
}

export interface HandoffParty {
  name: string;
  /** A person, or an AI agent (Claude, Codex, …). Defaults to "human". */
  kind?: "human" | "agent";
  role?: string;
}

/**
 * A session-handoff record — the structured baton passed between work sessions: AI↔AI (Claude/Codex),
 * AI↔human, or human↔human. Sits at the top of a doc. The human reads who / what's done / what's next;
 * the agent picking the work up gets `{ from, to, status, context, done, next, questions, refs }` as
 * data, so it continues without re-deriving state. Dual-representation applied to "where we left off".
 */
export interface HandoffNode extends KnowledgeNode {
  kind: "handoff";
  from: HandoffParty;
  to?: HandoffParty;
  date?: KDate;
  /** Reuses the shared lifecycle: "in-progress" (work continues), "blocked", "done" (complete). */
  status?: Status;
  /** The current state / background. */
  context?: string;
  /** What's been completed. */
  done?: string[];
  /** What's next / action items for the receiver. */
  next?: string[];
  /** Open questions / blockers. */
  questions?: string[];
}

/* --------------------------------------------------------------------- helpers ---- */

const QUARTER = /^\d{4}-Q[1-4]$/i;
const YEAR = /^\d{4}$/;
const MONTH = /^\d{4}-\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Infer a `KDate` (iso + precision) from an authored date string. */
export function parseKDate(input: string): KDate {
  const iso = input.trim();
  if (YEAR.test(iso)) return { iso, precision: "year" };
  if (QUARTER.test(iso)) return { iso: iso.toUpperCase(), precision: "quarter" };
  if (MONTH.test(iso)) return { iso, precision: "month" };
  if (DAY.test(iso)) return { iso, precision: "day" };
  return { iso, precision: "datetime" };
}
