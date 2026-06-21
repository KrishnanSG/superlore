/**
 * _data.ts — the ONE source the reimagined landing shares.
 *
 * Every spec / config here is extracted verbatim from the existing `app/page.tsx` +
 * `app/dual-rep-split.tsx`, so the hero, ContractFork, BreadthStrip, ReleaseSurface, KBSurface and
 * MachineFacePanel all render the SAME knowledge — never a second, drifting mock-up. Types come
 * straight from the `superlore` package (`CanvasSpec`, `TimelineItemInput`, `EntityCardProps`); no
 * `any`. The typed graph the MCP serves is computed from the real spec via `parseCanvasSpec`.
 */
import {
  parseCanvasSpec,
  type CanvasSpec,
  type TimelineItemInput,
  type EntityCardProps,
  type BoardColumnInput,
  type DataTableColumn,
  type ReleaseChangeInput,
  type ChecklistProps,
  type DecisionProps,
} from "superlore";

/* ───────────────────────────────────── URL-shortener architecture (hero + forks) ──
   The dual-rep centrepiece spec — a system engineers recognise. This is the board the hero
   splits, the ContractFork forks, and the ReleaseSurface embeds. Same `CanvasSpec` shape used
   everywhere (framed groups + intent; nodes with kind/icon/label/group; edges with from/to/label/rel). */
export const systemSpec: CanvasSpec = {
  title: "URL shortener",
  direction: "right",
  groups: [
    { id: "edge", label: "Edge", frame: true, intent: "gray" },
    { id: "svc", label: "Services", frame: true, intent: "blue" },
    { id: "data", label: "Data", frame: true, intent: "green" },
  ],
  nodes: [
    { id: "gw", kind: "icon", icon: "shield", label: "API gateway", group: "edge" },
    { id: "create", kind: "rounded", label: "Shorten API", group: "svc" },
    { id: "keygen", kind: "rounded", label: "Key generator", group: "svc" },
    { id: "redirect", kind: "rounded", label: "Redirect service", group: "svc" },
    { id: "hit", kind: "diamond", label: "Cache hit?", group: "svc" },
    { id: "cache", kind: "cylinder", label: "Redis cache", group: "data" },
    { id: "db", kind: "cylinder", label: "Links DB", group: "data" },
    { id: "analytics", kind: "cylinder", label: "Click analytics", group: "data" },
  ],
  edges: [
    { from: "gw", to: "create", label: "POST /shorten" },
    { from: "create", to: "keygen" },
    { from: "keygen", to: "db", label: "store", rel: "depends-on" },
    { from: "gw", to: "redirect", label: "GET /:slug" },
    { from: "redirect", to: "hit" },
    { from: "hit", to: "cache", label: "yes" },
    { from: "hit", to: "db", label: "no", rel: "depends-on" },
    { from: "redirect", to: "analytics", label: "emit", rel: "links" },
  ],
};

/* ─────────────────────────────────────── Agentic-AI app architecture (The Turn) ──
   The dense, "consolidated-from-a-dozen-FigJam-boards" reference board the WallToCanvas morph
   resolves into: a real agentic application — request flows from a client through an edge gateway
   into an agent runtime (planner → loop → tool router, fenced by guardrails), which fans out to
   tools/MCP (incl. superlore KB as a first-class tool), a RAG retrieval stack, a model layer, and a
   memory tier, all watched by an eval/observability frame. 7 framed regions, ~20 nodes, typed +
   labelled edges. The export name stays `q3Spec` so every importer (the-turn.tsx) keeps working;
   the FLIP-clone mapping in the-turn.tsx targets the node ids below. */
export const q3Spec: CanvasSpec = {
  title: "Agentic application — reference architecture",
  layout: "auto",
  // Landscape (left→right): the request flow reads client → edge → runtime → tools/RAG/models/memory,
  // which fills a wide frame the way real architecture diagrams are drawn (and the way The Turn's
  // stage is shaped) — instead of a tall, narrow top-down stack that leaves the frame mostly empty.
  direction: "right",
  groups: [
    { id: "client", label: "Client", icon: "app-window", frame: true, intent: "gray" },
    { id: "edge", label: "Edge · Gateway", icon: "shield", frame: true, intent: "blue" },
    { id: "runtime", label: "Agent runtime", icon: "bot", frame: true, intent: "purple" },
    { id: "tools", label: "Tools · MCP", icon: "wrench", frame: true, intent: "orange" },
    { id: "rag", label: "Retrieval · RAG", icon: "search", frame: true, intent: "teal" },
    { id: "models", label: "Models", icon: "sparkle", frame: true, intent: "pink" },
    { id: "memory", label: "Memory", icon: "database", frame: true, intent: "green" },
    {
      id: "obs",
      label: "Eval · Observability",
      icon: "activity",
      frame: true,
      dashed: true,
      intent: "yellow",
    },
  ],
  nodes: [
    // Client
    {
      id: "web",
      kind: "icon",
      icon: "app-window",
      intent: "gray",
      label: "Web / chat UI",
      group: "client",
    },
    // Edge · Gateway
    { id: "gw", kind: "icon", icon: "route", intent: "blue", label: "API gateway", group: "edge" },
    { id: "rate", kind: "rounded", intent: "blue", label: "Rate limit", group: "edge" },
    { id: "auth", kind: "icon", icon: "key-round", intent: "blue", label: "Auth", group: "edge" },
    // Agent runtime
    { id: "planner", kind: "rounded", intent: "purple", label: "Planner", group: "runtime" },
    { id: "loop", kind: "rounded", intent: "accent", label: "Agent loop", group: "runtime" },
    { id: "router", kind: "diamond", intent: "purple", label: "Tool router", group: "runtime" },
    {
      id: "guard",
      kind: "rounded",
      intent: "red",
      dashed: true,
      label: "Guardrails",
      group: "runtime",
    },
    // Tools · MCP
    {
      id: "tsearch",
      kind: "icon",
      icon: "globe",
      intent: "orange",
      label: "Web search",
      group: "tools",
    },
    {
      id: "tcode",
      kind: "icon",
      icon: "terminal",
      intent: "orange",
      label: "Code exec",
      group: "tools",
    },
    {
      id: "tsuperlore",
      kind: "icon",
      icon: "book-marked",
      intent: "accent",
      label: "superlore KB (MCP)",
      group: "tools",
    },
    // Retrieval · RAG
    { id: "embed", kind: "rounded", intent: "teal", label: "Embedder", group: "rag" },
    { id: "vdb", kind: "cylinder", intent: "teal", label: "Vector DB", group: "rag" },
    { id: "rerank", kind: "rounded", intent: "teal", label: "Reranker", group: "rag" },
    // Models
    { id: "mrouter", kind: "diamond", intent: "pink", label: "LLM router", group: "models" },
    {
      id: "claude",
      kind: "icon",
      icon: "sparkle",
      intent: "accent",
      label: "Claude",
      group: "models",
    },
    // Memory
    { id: "stm", kind: "rounded", intent: "green", label: "Short-term", group: "memory" },
    { id: "ltm", kind: "cylinder", intent: "green", label: "Long-term store", group: "memory" },
    {
      id: "cache",
      kind: "icon",
      icon: "database-zap",
      intent: "green",
      label: "Prompt cache",
      group: "memory",
    },
    // Eval · Observability
    { id: "trace", kind: "rounded", intent: "yellow", label: "Tracing", group: "obs" },
    { id: "eval", kind: "rounded", intent: "yellow", label: "Evals", group: "obs" },
  ],
  edges: [
    // Request path: client → edge → runtime
    { from: "web", to: "gw", label: "request", intent: "blue" },
    { from: "gw", to: "rate" },
    { from: "rate", to: "auth" },
    { from: "auth", to: "planner", label: "authed", intent: "blue" },
    // Runtime control flow, fenced by guardrails
    { from: "planner", to: "loop", label: "plan" },
    { from: "loop", to: "router", label: "act" },
    { from: "guard", to: "loop", label: "fence", rel: "blocks", intent: "red" },
    // Tool calls
    { from: "router", to: "tsearch", label: "tool call", intent: "orange" },
    { from: "router", to: "tcode", intent: "orange" },
    { from: "router", to: "tsuperlore", label: "query KB", rel: "depends-on", intent: "accent" },
    // Retrieval / RAG
    { from: "tsuperlore", to: "embed", label: "retrieve", intent: "teal" },
    { from: "embed", to: "vdb", label: "search", intent: "teal" },
    { from: "vdb", to: "rerank", intent: "teal" },
    { from: "rerank", to: "loop", label: "context", rel: "links", intent: "teal" },
    // Model layer
    { from: "loop", to: "mrouter", label: "generate", intent: "pink" },
    { from: "mrouter", to: "claude", intent: "pink" },
    { from: "claude", to: "loop", kind: "dashed", label: "tokens" },
    // Memory reads / writes
    { from: "loop", to: "stm", label: "scratch", rel: "links", intent: "green" },
    { from: "loop", to: "ltm", label: "recall", rel: "depends-on", intent: "green" },
    { from: "mrouter", to: "cache", kind: "dashed", label: "cache", intent: "green" },
    // Observability taps the runtime + models
    {
      from: "loop",
      to: "trace",
      kind: "dashed",
      label: "spans",
      rel: "mentions",
      intent: "yellow",
    },
    { from: "claude", to: "eval", kind: "dashed", rel: "mentions", intent: "yellow" },
  ],
};

/* ────────────────────────────────────────────── "Pick a job queue" decision (KB) ──
   The decision spec, verbatim from page.tsx showcaseSteps[2]. */
export const queueSpec: CanvasSpec = {
  title: "Pick a job queue",
  direction: "down",
  nodes: [
    { id: "q", kind: "diamond", intent: "accent", label: "Which queue?" },
    { id: "a", kind: "card", intent: "blue", label: "Managed (SQS)" },
    { id: "b", kind: "card", intent: "purple", label: "Self-host (Redis)" },
    { id: "pick", kind: "rounded", intent: "green", label: "Chosen: SQS" },
  ],
  edges: [
    { from: "q", to: "a" },
    { from: "q", to: "b" },
    { from: "a", to: "pick", label: "no ops to run", rel: "links" },
  ],
};

/* ─────────────────────────────────────────────────── Onboarding timeline (KB/strip) ──
   The milestone timeline, verbatim from page.tsx `milestoneTimeline`. */
export const milestoneTimeline: TimelineItemInput[] = [
  {
    date: "2024-01",
    title: "Sign up",
    body: "Email + password, magic-link optional.",
    status: "done",
  },
  {
    date: "2024-02",
    title: "Verify email",
    body: "Confirmation gate before the workspace opens.",
    status: "done",
  },
  {
    date: "2024-03",
    title: "Set up profile",
    body: "Name, avatar, role — the minimum to feel real.",
    status: "in-progress",
  },
  {
    date: "2024-04",
    title: "Invite the team",
    body: "Seat invites, then the loop closes.",
    status: "planned",
  },
];

/* ──────────────────────────────────────────── Accounts EntityCard config (KB/strip) ──
   The Accounts service entity, verbatim from page.tsx's <EntityCard …> usage. */
export const accountsEntity: EntityCardProps = {
  type: "service",
  slug: "accounts",
  title: "Accounts service",
  icon: "database",
  summary: "Owns sign-up, verification, and the accounts store.",
  fields: [
    { key: "Owner", value: "Platform team" },
    { key: "Endpoints", value: "6", type: "number" },
    { key: "Store", value: "accounts (Postgres)" },
    { key: "SLA", value: "99.95%" },
  ],
  refs: [
    { rel: "part-of", target: "#onboarding", label: "Onboarding flow" },
    { rel: "related", target: "#mcp", label: "MCP server" },
  ],
};

/* ───────────────────────────────────────────────────── MCP config (MachineFace) ──
   The mcp.json snippet, verbatim from page.tsx `mcpSnippet`. */
export const mcpSnippet = `// Point any MCP client at your knowledge base.
{
  "mcpServers": {
    "superlore": {
      "url": "https://your-kb.dev/api/mcp"
    }
  }
}

// First-class tools over the same content:
search(query)            // ranked full-text hits
get_page(path)           // a page's structured content
list({ kind, tag })      // nodes by kind / tag
navigate(target)         // relations + backlinks
get_component_data(id)   // the graph behind a component`;

/** One MCP tool surfaced as a mono signature + one-line description (MachineFacePanel). */
export interface McpTool {
  /** Full mono signature, e.g. `search(query)`. */
  signature: string;
  /** The argument/return type chip, e.g. `query: string`. */
  typeChip: string;
  /** One-line human description. */
  desc: string;
}

/* The 5 real tools, verbatim from page.tsx mcpSnippet (signatures + descriptions). The
   `get_component_data` row is the anchor the MachineFacePanel beams back toward the hero board. */
export const mcpTools: readonly McpTool[] = [
  { signature: "search(query)", typeChip: "query: string", desc: "ranked full-text hits" },
  { signature: "get_page(path)", typeChip: "path: string", desc: "a page's structured content" },
  { signature: "list({ kind, tag })", typeChip: "{ kind?, tag? }", desc: "nodes by kind / tag" },
  { signature: "navigate(target)", typeChip: "target: string", desc: "relations + backlinks" },
  {
    signature: "get_component_data(id)",
    typeChip: "id: string",
    desc: "the graph behind a component",
  },
];

/* ───────────────────────────────────────── The typed graph the MCP serves (dual-rep) ──
   Mirrors dual-rep-split.tsx's `graphJson()` but returns the OBJECT (not a string) plus a
   per-node array, so the hero can map JSON rows AND stamp `data-node-id` per row. */

/** One node row as the MCP graph exposes it (only present keys, like the real serializer). */
export interface SystemGraphNode {
  id: string;
  kind?: string;
  label?: string;
  group?: string;
}

/** One edge row as the MCP graph exposes it. */
export interface SystemGraphEdge {
  from: string;
  to: string;
  label?: string;
  rel?: string;
}

/** The full `get_component_data("url-shortener")` envelope. */
export interface SystemGraph {
  kind: "diagram";
  syntax: "canvas";
  graph: {
    nodes: SystemGraphNode[];
    edges: SystemGraphEdge[];
  };
}

/**
 * Compute the typed `{ nodes, edges }` graph the MCP returns for the system board, from the SAME
 * `systemSpec` via `parseCanvasSpec`. Returns the OBJECT (mirrors dual-rep-split.tsx, which
 * stringifies it). The `nodes` array doubles as the row source for the hero JSON lane (one row per
 * node, each carrying its `id` for `data-node-id` anchoring).
 */
export function systemGraph(): SystemGraph {
  const c = parseCanvasSpec(systemSpec);
  return {
    kind: "diagram",
    syntax: "canvas",
    graph: {
      nodes: c.nodes.map((n) => ({
        id: n.id,
        ...(n.kind ? { kind: n.kind } : {}),
        ...(n.label ? { label: n.label } : {}),
        ...(n.group ? { group: n.group } : {}),
      })),
      edges: c.edges.map((e) => ({
        from: e.from,
        to: e.to,
        ...(e.label ? { label: e.label } : {}),
        ...(e.rel ? { rel: e.rel } : {}),
      })),
    },
  };
}

/** The ordered node ids of the system board — the trace sequence shared by hero + ContractFork. */
export const systemNodeIds: readonly string[] = systemSpec.nodes?.map((n) => n.id) ?? [];

/* ─────────────────────────────────────────── Sales pipeline board (strip + KB surface) ──
   The iconic company-KB surface: a live kanban of prospects by stage with PoC/deal values, the
   single screen the team scans before every planning call. Rendered with the real <Board>; each
   card's stage, value, and next step is data the agent reads, never a picture. Companies are
   fictional. Shared by BreadthStrip's `pipeline.mdx` tile and the KBSurface use-case page. */
export const salesPipeline: BoardColumnInput[] = [
  {
    title: "Prospecting",
    status: "planned",
    cards: [
      {
        title: "Northwind Retail",
        body: "Intro call booked — map the merchandising data flow first.",
        tags: ["~$120K"],
      },
      {
        title: "Vantage Bank",
        body: "Warm referral; awaiting security questionnaire before discovery.",
        tags: ["~$300K"],
      },
    ],
  },
  {
    title: "Artifact Ready",
    status: "in-progress",
    cards: [
      {
        title: "Atlas Air",
        body: "Demo dataset + planted anomalies built; sending the artifact this week.",
        tags: ["~$180K"],
      },
      {
        title: "Cedar Foods",
        body: "Tailored deck ready; schedule the walkthrough with ops.",
        tags: ["~$95K"],
      },
    ],
  },
  {
    title: "Demo",
    status: "in-progress",
    cards: [
      {
        title: "Helix Health",
        body: "Live demo done; following up on the readmissions use case.",
        tags: ["~$250K"],
      },
      {
        title: "Meridian Logistics",
        body: "Second demo for the wider team — bring forecasting scenarios.",
        tags: ["~$140K"],
      },
    ],
  },
  {
    title: "Pre-PoC",
    status: "in-progress",
    cards: [
      {
        title: "Summit Insurance",
        body: "Scoping the PoC success criteria with their data lead.",
        tags: ["~$220K"],
      },
      {
        title: "Brightwave Energy",
        body: "Negotiating data access + the 6-week PoC plan.",
        tags: ["~$160K"],
      },
    ],
  },
  {
    title: "PoC",
    status: "done",
    cards: [
      {
        title: "Polaris Telecom",
        body: "PoC live on churn data; mid-point review next Tuesday.",
        tags: ["$200K"],
      },
      {
        title: "Aster Manufacturing",
        body: "Anomaly detection running; expansion conversation started.",
        tags: ["$110K"],
      },
    ],
  },
];

/* ─────────────────────────────────────────────────── Standup status board (strip) ──
   The meetings-continuity superpower: every standup is recorded as a "Status per Person" table so
   context is never lost. Rendered with the real <Table>; each row is typed data the agent can query
   ("who's blocked?"), never a transcript to OCR. Columns + rows feed BreadthStrip's `standup.mdx`. */
export const standupColumns: DataTableColumn[] = [
  { key: "person", label: "Person" },
  { key: "domain", label: "Domain" },
  { key: "update", label: "Update" },
  { key: "blockers", label: "Blockers" },
];

export const standupRows: Record<string, string>[] = [
  {
    person: "Maya Chen",
    domain: "Engineering",
    update: "Shipped the MCP search ranking; reviewing the canvas serializer PR.",
    blockers: "—",
  },
  {
    person: "Dev Patel",
    domain: "DevOps",
    update: "Migrated CI to the new runner; preview deploys are 2x faster.",
    blockers: "Waiting on prod secrets rotation",
  },
  {
    person: "Ren Ito",
    domain: "Frontend",
    update: "Landed the dual-rep table; starting on the org-chart canvas tile.",
    blockers: "—",
  },
  {
    person: "John",
    domain: "QA",
    update: "Wrote smoke suite for the redirect path; all green on staging.",
    blockers: "—",
  },
];

/* ─────────────────────────────────────────── Links API 2.4 release changes (ReleaseSurface) ──
   The product-docs use case ships a REAL `<Releases><Release …></Releases>` changelog (not a
   hand-rolled <ul>). These typed `ReleaseChangeInput[]` entries are derived 1:1 from the
   per-node `changelog` story in `release-surface.tsx` (rate limits, key collisions, cache-first
   redirect, partitioning, async analytics …), each given a sensible change `type` so the agent's
   `{ kind:"release", changes:[{ type, text }] }` face can answer "every security/fixed change in
   2.4" without parsing prose. Consumed by ReleaseSurface via `<Release version="2.4" …>`. */
export const linksApiReleaseChanges: ReleaseChangeInput[] = [
  { type: "security", text: "Per-key rate limits and stricter auth scopes on /shorten." },
  { type: "fixed", text: "Reject malformed and duplicate target URLs up front." },
  { type: "changed", text: "Base62 keyspace widened; retry on key collisions." },
  { type: "added", text: "302s served from cache; sub-millisecond p99 on hot slugs." },
  {
    type: "added",
    text: "Cache lookup before the DB, with negative-result caching for unknown slugs.",
  },
  { type: "changed", text: "Links partitioned by key prefix for faster reads." },
  { type: "changed", text: "Click events now emitted async — no redirect-path latency." },
];

/* ─────────────────────────────────────────── KB · Runbooks on-call grid (KBSurface) ──
   The Runbooks section of the company-KB surface: a Signal → Sev → First-action triage grid an
   on-call engineer scans during an incident. Rendered with the real `<Table>`; each row is typed
   data the agent can query ("what's the first action for a redirect 5xx spike?"), never a picture.
   Lifted here so KBSurface imports rather than inlines them (single source). */
export const kbRunbookColumns: DataTableColumn[] = [
  { key: "signal", label: "Signal" },
  { key: "sev", label: "Sev" },
  { key: "action", label: "First action" },
];

export const kbRunbookRows: Record<string, string>[] = [
  {
    signal: "Redirect 5xx rate > 1% for 5m",
    sev: "SEV-1",
    action: "Fail over to the DB read path; page the on-call.",
  },
  {
    signal: "Redis cache hit-rate drops below 80%",
    sev: "SEV-2",
    action: "Re-warm hot slugs from the publish stream; check evictions.",
  },
  {
    signal: "Shorten API p99 latency > 400ms",
    sev: "SEV-2",
    action: "Inspect keygen retries; throttle abusive keys at the gateway.",
  },
  {
    signal: "Click-analytics consumer lag > 10m",
    sev: "SEV-3",
    action: "Scale the async worker; backlog is non-blocking for redirects.",
  },
];

/* ─────────────────────────────────────────── KB · Onboarding checklist (KBSurface) ──
   The Onboarding section renders a real `<Checklist items={…}>`. Typed as `ChecklistProps["items"]`
   so the shape can never drift from the component. Grouped + owned, with the early steps already
   done — the agent gets `{ kind:"checklist", items:[{ text, done, owner, group }] }` and can COUNT
   progress ("how far is a new hire?") rather than infer it from strike-through. */
export const kbOnboardingChecklist: ChecklistProps["items"] = [
  { text: "Accept the workspace invite", done: true, owner: "New hire", group: "Day 1" },
  {
    text: "Set up your profile (name, avatar, role)",
    done: true,
    owner: "New hire",
    group: "Day 1",
  },
  { text: "Pair with your onboarding buddy", done: true, owner: "Buddy", group: "Day 1" },
  { text: "Read the architecture overview", done: false, owner: "New hire", group: "Week 1" },
  {
    text: "Clone the repos and run the stack locally",
    done: false,
    owner: "New hire",
    group: "Week 1",
  },
  { text: "Ship your first PR", done: false, owner: "New hire", group: "Week 1" },
];

/* ─────────────────────────────────────────── KB · "Adopt a managed job queue" ADR (KBSurface) ──
   The Engineering section pairs the system Canvas with this real `<Decision>` ADR. Typed as
   `DecisionProps`; status accepted. The human reads the rationale; the agent gets
   `{ kind:"decision", status, context, decision, consequences, refs }` and can follow the chain
   via `navigate`. Lifted to `_data` so BreadthStrip + KBSurface share one source (no drift). */
export const kbQueueDecision: DecisionProps = {
  title: "Adopt a managed job queue",
  identifier: "ADR-014",
  status: "accepted",
  date: "2024-05",
  context:
    "Async work (analytics rollups, cache warming, link expiry) outgrew in-process timers. We need durable, retryable background jobs without a team to run queue infrastructure.",
  decision:
    "Adopt a managed queue (SQS) over self-hosting Redis/RQ — no brokers to operate, native dead-letter queues, and IAM-scoped access that fits the existing deploy.",
  consequences: [
    "No queue infrastructure to patch, scale, or page on.",
    "Per-message cost at high volume; batch where it matters.",
    "Some vendor lock-in — workers stay queue-agnostic behind a thin adapter.",
  ],
  refs: [
    { rel: "related", target: "#analytics", label: "Click analytics" },
    { rel: "related", target: "#mcp", label: "MCP server" },
  ],
};
