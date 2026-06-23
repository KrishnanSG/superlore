import type { SuperloreJson } from "../../config.js";
import type { WriteFn } from "./util.js";

/**
 * Scaffold a **company KB** — a private, agent-native knowledge base for a team or company. Not a
 * single welcome page: a realistic, populated structure (Engineering · Product · Team) the owner
 * keeps and replaces section by section. Every page is authored with real superlore components, so
 * it renders rich for humans and serializes to clean knowledge for the MCP. The architecture pages
 * use the Canvas as it's meant to be used — a system the agent reads as data, not a picture.
 */
export function writeCompanyContent(write: WriteFn, config: SuperloreJson): void {
  // Root sidebar order: the home, then the three sections as folders.
  write(
    "content/docs/meta.json",
    `${JSON.stringify(
      {
        title: config.name,
        root: true,
        icon: "BookOpen",
        pages: ["index", "engineering", "product", "team"],
      },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/index.mdx",
    `---
title: Home
description: The home of the ${config.name} knowledge base — for humans and the agents working beside them.
summary: Overview of the ${config.name} company knowledge base — what lives here, how it's organized, and how an agent should use it to answer questions and act on the team's behalf.
tags: [overview, home, getting-started]
---

<PageHero
  kicker="Company knowledge base"
  title="${config.name}"
  description="One corpus, two readers. Humans get this clean, navigable site; agents read the same structured content over MCP and act the way the team would."
  icon="book-open"
/>

<Note title="This is a starter structure">
  Everything here is **placeholder content** that shows the shape of a good company KB. Keep the
  structure, then replace each page with what's true for your team. Run \`superlore dev\` to preview as
  you go.
</Note>

## What lives here

<FeatureList
  items={[
    { icon: "layers", title: "Engineering", description: "System architecture, the decisions behind it, and the runbooks that keep it up.", href: "/docs/engineering/architecture" },
    { icon: "rocket", title: "Product", description: "The roadmap and what shipped — now, next, and later.", href: "/docs/product/roadmap" },
    { icon: "users", title: "Team", description: "How to onboard, and who owns what.", href: "/docs/team/onboarding" },
  ]}
/>

## How the company fits together

A map of the domains and how they depend on each other. Edit the canvas — the agent reads the same
graph the diagram is drawn from.

\`\`\`superlore-canvas
{
  "title": "${config.name} — domains",
  "layout": "flow",
  "direction": "down",
  "groups": [
    { "id": "surface", "label": "Customer surface", "frame": true, "intent": "blue" },
    { "id": "core", "label": "Core platform", "frame": true, "intent": "purple" },
    { "id": "data", "label": "Data & insight", "frame": true, "intent": "green" },
    { "id": "ops", "label": "Operations", "frame": true, "intent": "gray" }
  ],
  "nodes": [
    { "id": "web", "kind": "rect", "intent": "blue", "group": "surface", "icon": "globe", "label": "Web app" },
    { "id": "api", "kind": "rect", "intent": "blue", "group": "surface", "icon": "plug", "label": "Public API" },
    { "id": "billing", "kind": "rect", "intent": "purple", "group": "core", "icon": "credit-card", "label": "Billing" },
    { "id": "accounts", "kind": "rect", "intent": "purple", "group": "core", "icon": "users", "label": "Accounts" },
    { "id": "workflow", "kind": "rect", "intent": "purple", "group": "core", "icon": "workflow", "label": "Workflow engine" },
    { "id": "warehouse", "kind": "cylinder", "intent": "green", "group": "data", "label": "Warehouse" },
    { "id": "insights", "kind": "rect", "intent": "green", "group": "data", "icon": "line-chart", "label": "Insights" },
    { "id": "oncall", "kind": "rect", "intent": "gray", "group": "ops", "icon": "siren", "label": "On-call" }
  ],
  "edges": [
    { "from": "web", "to": "api", "intent": "blue" },
    { "from": "api", "to": "accounts", "rel": "depends-on" },
    { "from": "api", "to": "workflow", "rel": "depends-on" },
    { "from": "workflow", "to": "billing", "rel": "links" },
    { "from": "workflow", "to": "warehouse", "intent": "green", "rel": "depends-on" },
    { "from": "warehouse", "to": "insights", "intent": "green" },
    { "from": "oncall", "to": "workflow", "kind": "dashed", "intent": "gray", "label": "watches" }
  ]
}
\`\`\`

## How to use this KB

<KeyFacts
  items={[
    { label: "For humans", value: "Browse the sections, or search. Every diagram links to the page behind it." },
    { label: "For agents", value: "Query the MCP — search, get a page, follow relations, read a component's data." },
    { label: "Source of truth", value: "If it isn't written here, it isn't decided. Author once; both readers stay in sync." },
    { label: "Keep it current", value: "Update the doc in the same PR as the change. Stale knowledge is worse than none." },
  ]}
/>
`,
  );

  // ───────────────────────────── Engineering ─────────────────────────────

  write(
    "content/docs/engineering/meta.json",
    `${JSON.stringify(
      { title: "Engineering", icon: "Layers", pages: ["architecture", "decisions", "runbooks"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/engineering/architecture.mdx",
    `---
title: Architecture
description: How the platform is built — the services, the request path, and where the data lives.
summary: The system architecture — services and their tiers, the synchronous request path, and the data stores. The canvas is the authoritative diagram; the agent reads the same nodes and edges.
tags: [engineering, architecture, system-design]
---

<SectionHead
  eyebrow="Engineering"
  title="Architecture"
  description="The system, as a diagram the humans read and the agent queries. Replace the services with yours."
/>

This is placeholder architecture for a generic SaaS platform. Redraw the canvas to match your real
system — the agent answers "how does X work?" from this graph, so keep it honest.

\`\`\`superlore-canvas
{
  "title": "Request path",
  "direction": "right",
  "groups": [
    { "id": "client", "label": "Client", "frame": true, "intent": "gray" },
    { "id": "edge", "label": "Edge", "frame": true, "intent": "blue" },
    { "id": "app", "label": "Services", "frame": true, "intent": "purple" },
    { "id": "data", "label": "Data", "frame": true, "intent": "green" },
    { "id": "async", "label": "Async", "frame": true, "intent": "orange" }
  ],
  "nodes": [
    { "id": "user", "kind": "circle", "group": "client", "label": "User" },
    { "id": "cdn", "kind": "icon", "icon": "globe", "group": "edge", "label": "CDN + WAF" },
    { "id": "gw", "kind": "icon", "icon": "shield", "group": "edge", "label": "API Gateway" },
    { "id": "api", "kind": "rect", "intent": "purple", "group": "app", "label": "API service" },
    { "id": "workflow", "kind": "rect", "intent": "purple", "group": "app", "label": "Workflow engine" },
    { "id": "cachehit", "kind": "diamond", "group": "app", "label": "Cache hit?" },
    { "id": "worker", "kind": "rect", "intent": "orange", "group": "app", "label": "Background worker" },
    { "id": "cache", "kind": "cylinder", "intent": "red", "group": "data", "label": "Redis" },
    { "id": "db", "kind": "cylinder", "intent": "green", "group": "data", "label": "Postgres" },
    { "id": "queue", "kind": "parallelogram", "intent": "orange", "group": "async", "label": "Job queue" }
  ],
  "edges": [
    { "from": "user", "to": "cdn", "label": "HTTPS", "intent": "blue" },
    { "from": "cdn", "to": "gw", "intent": "blue" },
    { "from": "gw", "to": "api", "label": "authenticated", "rel": "links" },
    { "from": "api", "to": "cachehit", "intent": "purple" },
    { "from": "cachehit", "to": "cache", "label": "lookup", "intent": "red", "rel": "depends-on" },
    { "from": "cachehit", "to": "db", "label": "miss", "kind": "dashed", "intent": "green" },
    { "from": "api", "to": "workflow", "rel": "depends-on" },
    { "from": "workflow", "to": "queue", "label": "enqueue", "intent": "orange" },
    { "from": "queue", "to": "worker", "intent": "orange" },
    { "from": "worker", "to": "db", "label": "write", "intent": "green", "rel": "depends-on" }
  ]
}
\`\`\`

## Services

<Table
  caption="The services in the request path above"
  columns={[
    { key: "service", label: "Service", type: "text" },
    { key: "owner", label: "Owner", type: "text" },
    { key: "store", label: "Data store", type: "text" },
    { key: "sla", label: "SLA", type: "text" }
  ]}
  rows={[
    { service: "API service", owner: "Platform", store: "Postgres + Redis", sla: "99.95%" },
    { service: "Workflow engine", owner: "Platform", store: "Postgres", sla: "99.9%" },
    { service: "Background worker", owner: "Platform", store: "Job queue", sla: "best effort" }
  ]}
/>

<KeyFacts
  items={[
    { label: "Language", value: "Replace with yours — e.g. TypeScript / Go" },
    { label: "Runtime", value: "Where it runs — e.g. containers on your cloud" },
    { label: "Primary store", value: "Postgres" },
    { label: "Cache", value: "Redis" },
  ]}
/>
`,
  );

  write(
    "content/docs/engineering/decisions.mdx",
    `---
title: Decisions
description: The architectural decisions behind how things are built — and why.
summary: Architecture decision records (ADRs). Each captures the context, the call, and its consequences so an agent can reason about why the system is the way it is.
tags: [engineering, decisions, adr]
---

<SectionHead
  eyebrow="Engineering"
  title="Decisions"
  description="Why the system looks the way it does. Add an ADR whenever a choice is hard to reverse."
/>

These are placeholder ADRs. Keep the format — context, decision, consequences — so both a new hire
and an agent can understand not just *what* was chosen but *why*.

<Decision
  title="Postgres as the primary store"
  status="accepted"
  identifier="ADR-001"
  date="2024-01-15"
  context={<>We needed a primary store with strong consistency, relational queries, and an operational track record the team already had.</>}
  decision={<>Use a single Postgres cluster as the system of record; reach for other stores only when a workload clearly outgrows it.</>}
  consequences={[
    "One backup, failover, and migration story to learn.",
    "Relational integrity by default; JSONB where we need flexibility.",
    "We accept vertical-scaling limits until a workload proves it needs more.",
  ]}
/>

<Decision
  title="Redis cache in front of reads"
  status="accepted"
  identifier="ADR-002"
  date="2024-03-02"
  context={<>Hot read paths were hitting Postgres harder than necessary as traffic grew.</>}
  decision={<>Add a Redis cache with a read-through pattern on the hottest endpoints; treat it as disposable.</>}
  consequences={[
    "Lower p99 on cached endpoints.",
    "A cache-invalidation discipline we have to keep honest.",
    "The system must stay correct when the cache is cold or down.",
  ]}
  refs={[{ rel: "see", target: "/docs/engineering/architecture", label: "Where the cache sits" }]}
/>
`,
  );

  write(
    "content/docs/engineering/runbooks.mdx",
    `---
title: Runbooks
description: What to do when things break — and who's on call.
summary: Operational runbooks for common incidents, as ordered checklists, plus the on-call rotation. An agent can walk these steps or hand them to the person on call.
tags: [engineering, operations, runbooks, on-call]
---

<SectionHead
  eyebrow="Engineering"
  title="Runbooks"
  description="Calm, ordered steps for the bad days. Replace with your real incident procedures."
/>

## Runbook: elevated error rate

<Checklist
  label="Elevated 5xx on the API"
  items={[
    { text: "Confirm the alert against the dashboard — is it real and ongoing?", group: "Assess" },
    { text: "Check the most recent deploy; roll back if the timeline lines up", group: "Assess" },
    { text: "Check Redis and Postgres health and connection counts", group: "Assess" },
    { text: "If a dependency is down, shed load and post status", group: "Mitigate" },
    { text: "Once stable, capture a timeline for the post-incident review", group: "Recover" },
  ]}
/>

## On-call rotation

<Schedule
  label="On-call this cycle"
  events={[
    { date: "2024-06-03", title: "Primary — replace with a name", body: "Carries the pager; first responder." },
    { date: "2024-06-10", title: "Secondary — replace with a name", body: "Backup; escalation point." },
    { date: "2024-06-17", title: "Primary — replace with a name", body: "Carries the pager; first responder." },
  ]}
/>

<Tip title="Keep runbooks executable">
  A good runbook is a list someone half-asleep can follow. If a step needs judgement, say what to
  weigh. The agent can read these too — keep them concrete.
</Tip>
`,
  );

  // ─────────────────────────────── Product ───────────────────────────────

  write(
    "content/docs/product/meta.json",
    `${JSON.stringify(
      { title: "Product", icon: "Rocket", pages: ["roadmap", "releases"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/product/roadmap.mdx",
    `---
title: Roadmap
description: What we're building — now, next, and later.
summary: The product roadmap as a board (now / next / later) and a timeline of milestones. An agent can answer "what's planned" and "what's in flight" from this structured data.
tags: [product, roadmap, planning]
---

<SectionHead
  eyebrow="Product"
  title="Roadmap"
  description="Where the work is heading. Replace the cards and milestones with yours."
/>

<Board
  label="Now / Next / Later"
  columns={[
    { title: "Now", status: "in-progress", cards: [
      { title: "Faster onboarding", body: "Cut time-to-first-value for new accounts.", status: "in-progress", tags: ["growth"] },
      { title: "Audit log", body: "Per-account, exportable.", status: "in-progress", tags: ["enterprise"] }
    ] },
    { title: "Next", status: "planned", cards: [
      { title: "SSO for teams", body: "SAML + SCIM.", status: "planned", tags: ["enterprise"] },
      { title: "Usage-based billing", body: "Meter and invoice on usage.", status: "planned", tags: ["billing"] }
    ] },
    { title: "Later", status: "planned", cards: [
      { title: "Public API v2", body: "Cleaner resources, better pagination.", status: "planned", tags: ["platform"] }
    ] }
  ]}
/>

## Milestones

<Timeline
  label="Product milestones"
  items={[
    { date: "2024-Q1", title: "GA launch", body: "First generally-available release.", status: "done", tags: ["launch"] },
    { date: "2024-Q2", title: "Enterprise readiness", body: "Audit log, roles, SSO groundwork.", status: "in-progress", tags: ["enterprise"] },
    { date: "2024-Q3", title: "Self-serve growth", body: "Onboarding and usage-based billing.", status: "planned", tags: ["growth"] },
  ]}
/>
`,
  );

  write(
    "content/docs/product/releases.mdx",
    `---
title: Releases
description: What shipped, version by version.
summary: The release history with versioned, categorized changes (added / changed / fixed). An agent can answer "what changed in 1.2?" from this structured changelog.
tags: [product, releases, changelog]
---

<SectionHead
  eyebrow="Product"
  title="Releases"
  description="The changelog, as structured data. Replace with your real release notes."
/>

<Releases
  version="1.2.0"
  date="2024-05-20"
  status="done"
  title="Audit log (beta)"
  summary="Per-account audit logging, plus reliability fixes."
  changes={[
    { type: "added", text: "Exportable audit log for account admins." },
    { type: "changed", text: "Faster account switching." },
    { type: "fixed", text: "Rare double-charge on retried payments." },
  ]}
/>

<Releases
  version="1.1.0"
  date="2024-04-02"
  status="done"
  title="Onboarding refresh"
  changes={[
    { type: "added", text: "Guided setup for new accounts." },
    { type: "fixed", text: "Invite emails occasionally landing in spam." },
  ]}
/>
`,
  );

  // ──────────────────────────────── Team ─────────────────────────────────

  write(
    "content/docs/team/meta.json",
    `${JSON.stringify(
      { title: "Team", icon: "Users", pages: ["onboarding", "people"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/team/onboarding.mdx",
    `---
title: Onboarding
description: Your first week — what to set up, who to meet, and where to start.
summary: The new-hire onboarding path as ordered steps and a first-week checklist. An agent can guide a new teammate through setup using these steps.
tags: [team, onboarding, getting-started]
---

<SectionHead
  eyebrow="Team"
  title="Onboarding"
  description="Welcome. This is the path from day one to your first shipped change. Replace with yours."
/>

<Steps>
  <Step>
    ### Get access
    Accounts, repos, and the password manager. If something's missing, ask in the team channel.
  </Step>
  <Step>
    ### Set up your machine
    Clone the repo, install dependencies, and get the app running locally.
  </Step>
  <Step>
    ### Read the architecture
    Skim [Architecture](/docs/engineering/architecture) and the [Decisions](/docs/engineering/decisions) so the system isn't a black box.
  </Step>
  <Step>
    ### Ship something small
    Pick a starter issue. The goal of week one is a merged PR, however small.
  </Step>
</Steps>

## First-week checklist

<Checklist
  label="Your first week"
  items={[
    { text: "Access to repos, cloud, and the password manager", group: "Day 1" },
    { text: "App running locally", group: "Day 1" },
    { text: "Met your onboarding buddy", group: "Day 1" },
    { text: "Read the architecture and recent decisions", group: "Week 1" },
    { text: "Opened your first PR", group: "Week 1" },
    { text: "Added yourself to the team page", group: "Week 1" },
  ]}
/>
`,
  );

  write(
    "content/docs/team/people.mdx",
    `---
title: People
description: Who's on the team and what they own.
summary: The team roster — who's here, their role, and who they report to — plus an example entity card. An agent can answer "who owns X?" from this structured directory.
tags: [team, people, directory]
---

<SectionHead
  eyebrow="Team"
  title="People"
  description="Who to ask about what. Replace these placeholders with your real team."
/>

<Roster
  label="The team"
  people={[
    { name: "Replace Me", role: "Engineering lead", tags: ["platform"] },
    { name: "Replace Me", role: "Product", reportsTo: "Replace Me", tags: ["roadmap"] },
    { name: "Replace Me", role: "Engineer", reportsTo: "Replace Me", tags: ["platform"] },
    { name: "Replace Me", role: "Design", reportsTo: "Replace Me", tags: ["product"] },
  ]}
/>

## Example: a person, as structured data

<EntityCard
  type="person"
  slug="engineering-lead"
  title="Engineering lead"
  summary="One line on what they own and how to reach them."
  icon="user"
  fields={[
    { key: "Owns", value: "Platform & architecture" },
    { key: "Time zone", value: "UTC+0" },
    { key: "Best reached", value: "Async, in the team channel" },
  ]}
  refs={[{ rel: "see", target: "/docs/engineering/architecture", label: "What they own" }]}
/>
`,
  );
}
