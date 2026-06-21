# superlore Canvas — Template Library Research

Research catalog of the canonical brainstorming / strategy / planning **frameworks** used across
every function of a startup, each mapped to a **superlore Canvas primitive**, plus an **icon/asset
sourcing + licensing** report and a **prioritized top-15** to build first.

This feeds the Canvas template library. A board = nodes + edges + frames with per-frame layouts
(flow / row / column / grid / free); it can also embed live components: **Comparison**,
**StatGrid**, **Timeline**, **Board (kanban)**, **Decision**.

> Status: research compiled 2026-06-20. Every structure is grounded in the cited source; nothing
> invented. Where a framework has well-known synonyms or contested structure, that is flagged.

## How frameworks map to superlore primitives

Each framework is mapped to the **single best** primitive. The recurring patterns:

- **grid of frames** — the workhorse for one-page canvases with fixed, named blocks (BMC, Lean
  Canvas, SWOT, Value Prop Canvas, Empathy Map, PRD, positioning/messaging/ICP/GTM canvases,
  MEDDIC). Each named block is a frame holding sticky-note/markdown content.
- **flow** (nodes + directed edges) — trees, processes, sequences, loops, architecture, ERDs
  (OKR tree, North-Star tree, Opportunity-Solution Tree, funnels, growth loops, org charts,
  flowcharts, user flows, sitemaps, system/C4 diagrams, 5-Whys).
- **kanban Board** — columns of cards for pipelines/workflows/status (sprint board, sales &
  hiring pipelines, story map, affinity/card-sort clusters, 3-column retros, content calendar).
- **Comparison matrix** — options × criteria scoring tables (RICE, ICE, 2×2 prioritization,
  Kano, RACI, decision matrix, capacity planning, head-to-head battlecards).
- **swimlane** (flow partitioned into lanes) — swimlane process maps, service blueprints,
  sequence diagrams.
- **mind map** (central node radiating branches) — mind maps, Porter's Five Forces, Fishbone.
- **StatGrid** — metric-card dashboards (unit economics / financial model).
- **Timeline** — ordered events on a time axis (storyboard; secondary view for content calendar).
- **free frame** — free-form sticky placement against a backdrop (wireframes, dot voting,
  affinity mapping, impact/effort 2×2 plotting).

Two build implications surfaced by the mapping:

1. One **kanban Board** component, with different column presets, covers sprint boards, sales/
   hiring pipelines, all three-column retros, affinity clusters, and card sorting.
2. One **Comparison/Decision matrix** with a **pluggable cell renderer** covers RICE/ICE
   (numeric + computed), RACI (coded R/A/C/I), weighted decision matrices, and capacity
   allocation (% cells).

---

# Per-function framework catalog

## Strategy / Leadership

### Business Model Canvas

- **Structure** — 9 fixed blocks: Key Partners, Key Activities, Key Resources, Value
  Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue
  Streams. (Value Prop center; customer-facing four on the right; infrastructure four on the left.)
- **When** — Mapping or stress-testing a whole business model on one page.
- **Primitive** — **grid of frames**. The canonical fixed-block canvas.
- Source: https://www.strategyzer.com/library/what-is-a-business-model

### Lean Canvas

- **Structure** — 9 fixed blocks (Ash Maurya's BMC adaptation): Problem, Solution, Key Metrics,
  Unique Value Proposition, Unfair Advantage, Channels, Customer Segments, Cost Structure,
  Revenue Streams. (Swaps BMC's Partners/Activities/Resources/Relationships for
  Problem/Solution/Key Metrics/Unfair Advantage.)
- **When** — Early-stage, problem-first business modeling under high uncertainty.
- **Primitive** — **grid of frames**.
- Source: https://bmtoolbox.net/tools/lean-canvas/

### SWOT

- **Structure** — 2×2 of four quadrants on two axes (Internal/External × Helpful/Harmful):
  Strengths (Internal/Helpful), Weaknesses (Internal/Harmful), Opportunities (External/Helpful),
  Threats (External/Harmful).
- **When** — Quick strategic situation assessment.
- **Primitive** — **grid of frames**. Four named buckets of free text — not options×criteria, so
  not a matrix.
- Source: https://www.mindtools.com/amtbj63/swot-analysis/

### OKR Tree

- **Structure** — Hierarchy of two node types: an Objective (qualitative) parent with 3–5 Key
  Results (measurable) children; cascades Company → Team → Individual (a higher KR can become a
  lower Objective, linking levels).
- **When** — Setting and aligning measurable goals top-to-bottom.
- **Primitive** — **flow**. Directed parent→child hierarchy; edges carry the alignment.
- Source: https://www.whatmatters.com/faqs/okrs-objectives-key-results-explanation-examples

### North-Star Metric Tree

- **Structure** — One top North Star Metric → 3–5 Inputs (driver/lever metrics teams influence)
  → underlying initiatives/Level-2 inputs (Amplitude North Star framework).
- **When** — Orienting all teams around one top metric and the inputs each team owns.
- **Primitive** — **flow**. A directed driver tree; edges express "drives."
- Source: https://amplitude.com/books/north-star/about-north-star-framework

### Porter's Five Forces

- **Structure** — Hub-and-spoke: center = Competitive Rivalry; four surrounding forces feed in —
  Threat of New Entrants, Bargaining Power of Suppliers, Bargaining Power of Buyers, Threat of
  Substitutes. (Suppliers/Buyers are consistently left/right; New Entrants vs Substitutes top/
  bottom varies by source.)
- **When** — Assessing industry attractiveness/profitability before entering or investing.
- **Primitive** — **mind map**. One central node with four radiating force-branches.
- Source: https://www.mindtools.com/at7k8my/porter-s-five-forces/

### Value Proposition Canvas

- **Structure** — Six sections, two sides. Customer Profile (circle): Customer Jobs, Pains,
  Gains. Value Map (square): Products & Services, Pain Relievers, Gain Creators.
- **When** — Designing product/service fit for a specific segment (problem-solution fit).
- **Primitive** — **grid of frames**. Six fixed named sections in two clusters.
- Source: https://www.strategyzer.com/library/the-value-proposition-canvas

### Playing to Win — Strategic Choice Cascade

- **Structure** — Five cascading choices (Lafley & Martin), each constraining the next: Winning
  Aspiration, Where to Play, How to Win, Capabilities, Management Systems.
- **When** — Making integrated choices about where to compete and how to win.
- **Primitive** — **flow**. The directed cascade (with feedback) is the essence; a grid of five
  frames is an acceptable static alternative.
- Source: https://fs.blog/playing-to-win-how-strategy-really-works/

## Product

### RICE Scoring

- **Structure** — Table of initiatives × four factors, combined by formula: Reach (count/period),
  Impact (3 / 2 / 1 / 0.5 / 0.25), Confidence (100% / 80% / 50%), Effort (person-months). RICE =
  (Reach × Impact × Confidence) / Effort; rank high-first.
- **When** — Objectively prioritizing a backlog by value per unit effort.
- **Primitive** — **Comparison matrix**. Rows = initiatives, cols = R/I/C/E + computed score.
- Source: https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/

### ICE Scoring

- **Structure** — Table of ideas × three factors each 1–10: Impact, Confidence, Ease. ICE =
  I × C × E. (Ease is inverse of effort — easier scores higher.)
- **When** — Fast, lightweight relative ranking of ideas/experiments.
- **Primitive** — **Comparison matrix**.
- Source: https://www.productplan.com/glossary/ice-scoring-model/

### 2×2 Prioritization (Value vs Effort)

- **Structure** — 2×2: Value/Impact (Y) × Effort (X). Quadrants: Quick Wins (high value/low
  effort), Big Bets / Major Projects (high/high), Fill-ins / Maybes (low/low), Time Sinks /
  Money Pit / Thankless Tasks (low value/high effort).
- **When** — Quick triage — do now vs defer vs drop.
- **Primitive** — **Comparison matrix** (a canonical 2×2 on two named criteria). For free
  sticky-plotting against continuous axes, a **free frame** with a 2×2 backdrop is the alternate.
- Source: https://www.savio.io/product-roadmap/value-vs-effort-matrix/

### Kano Model

- **Structure** — Five feature categories — Must-be (Basic/Threshold), One-dimensional
  (Performance/Satisfier), Attractive (Delighter), Indifferent, Reverse — on two axes: X =
  functionality (None→Best), Y = satisfaction (Dissatisfied→Delighted).
- **When** — Classifying features by how presence/quality affects satisfaction.
- **Primitive** — **Comparison matrix**. The actionable artifact is the per-feature category
  table (+ optional functional/dysfunctional survey scores).
- Source: https://www.qualtrics.com/articles/strategy-research/kano-analysis/

### Opportunity-Solution Tree

- **Structure** — Four-level tree (Teresa Torres): Desired Outcome (root) → Opportunities
  (customer needs/pains) → Solutions → Assumption Tests. _(Canonical bottom level is "Assumption
  Tests," not "Experiments.")_
- **When** — Continuous discovery — linking outcome → opportunities → solutions → de-risking tests.
- **Primitive** — **flow**. Directed parent→child tree.
- Source: https://www.producttalk.org/opportunity-solution-trees/

### User Journey Map

- **Structure** — Grid (NN/g): columns = Stages/Phases (Awareness, Consideration, Purchase,
  Service…); rows/lanes = Actions, Thoughts, Emotions, Touchpoints & Channels; framed by a Lens
  (persona + scenario) above and Insights/Opportunities below.
- **When** — Visualizing an end-to-end experience to surface pain points and opportunities.
- **Primitive** — **grid of frames** (phases × lanes; each cell holds notes). The multi-lane grid,
  not a single time axis, is the defining structure.
- Source: https://www.nngroup.com/articles/customer-journey-mapping/

### User Story Map

- **Structure** — Horizontal hierarchy (Jeff Patton): Backbone (top row) of user Activities in
  narrative order → Tasks/Steps under each → Details/Stories as cards in vertical columns →
  sliced horizontally into Releases (MVP first).
- **When** — Collaborative release planning across the whole user journey.
- **Primitive** — **kanban Board**. Steps = columns along the backbone; story cards stack within;
  release slices = row groupings.
- Source: https://www.mindtheproduct.com/getting-started-with-user-story-mapping-jeff-patton/

### Jobs-to-be-Done (Forces of Progress)

- **Structure** — No single canonical "JTBD canvas." Two canonical structures: (1) **Job Story** —
  "When [situation], I want to [motivation], so I can [expected outcome]"; (2) **Forces of
  Progress** — a four-force tug-of-war: pro-switch = Push of the Situation + Pull of the New
  Solution; anti-switch = Anxiety of the New Solution + Habit of the Present.
- **When** — Understanding the progress a customer "hires" a product for, and switching forces.
- **Primitive** — **grid of frames**. Forces of Progress = four named buckets (a single 3-slot
  frame for the Job Story variant).
- Source: https://jtbd.info/the-forces-of-progress-4408bf995153

### PRD Canvas

- **Structure** — Fixed named blocks (Miro/monday/Aha): Overview/Background, Objectives & Goals,
  Success Metrics, Target Audience, Features & Requirements, User Experience, Assumptions &
  Dependencies, Out of Scope, Open Questions.
- **When** — Aligning a team on purpose, scope, and requirements before build.
- **Primitive** — **grid of frames**. Section names vary by org; the structure is always named blocks.
- Source: https://miro.com/templates/prd/

## Engineering

### System Architecture Diagram

- **Structure** — Free graph of labeled component nodes + directed/annotated edges: services
  (rectangles), databases (cylinders), nodes (servers/VMs/containers/serverless), external
  systems, API gateways; connectors annotated with interaction type ("REST call," "replication");
  grouped into tiers/zones (client, service, data).
- **When** — Communicating the big-picture structure of a system.
- **Primitive** — **flow**. Nodes (services/DBs) + directed annotated edges; the agent gets the
  component graph, not a picture.
- Source: https://vfunction.com/blog/architecture-diagram-guide/

### RCA / Root Cause Analysis (report)

- **Structure** — Named sections: Executive Summary → Problem Statement (SMART) → Timeline of
  events → Root Cause + Contributing Factors → Corrective & Preventive Actions (owner + due date)
  → Verification Plan. (Done _visually_ it's usually a Fishbone or 5-Whys; the report itself is
  sectioned.)
- **When** — Documenting confirmed root cause + recurrence-preventing actions after an incident.
- **Primitive** — **grid of frames** (named blocks); embed a **Timeline** frame for the event
  sequence.
- Source: https://plane.so/blog/root-cause-analysis-what-it-is-methods-and-how-to-write-its-report

### Fishbone (Ishikawa)

- **Structure** — Problem "head" (right) + horizontal spine + angled bones, one per cause
  category. Standard manufacturing set = the **6 Ms**: Manpower/People, Methods, Machines,
  Materials, Measurements, Mother Nature/Environment. Sub-causes branch off each bone. (Variants:
  8 Ps, 4 Ss for service.)
- **When** — Brainstorming/organizing potential causes by category before finding the root cause.
- **Primitive** — **mind map**. Central problem node radiating category branches with sub-cause
  twigs.
- Source: https://asq.org/quality-resources/fishbone

### 5-Whys

- **Structure** — Linear chain: Problem → Why 1 → answer → Why 2 → … → ~Why 5 → root cause →
  corrective action. Branches into a tree when an answer has multiple causes.
- **When** — Drilling from symptom to systemic root cause on moderately complex problems.
- **Primitive** — **flow**. Directed causal chain of nodes ending at the root cause.
- Source: https://www.kpifire.com/blog/5-whys-root-cause-analysis/

### RFC / Design Doc / ADR

- **Structure** — ADR (Nygard): Title & ID → Status & Date (Proposed/Accepted/Rejected/
  Superseded) → Context → Decision → Consequences; enhanced templates add Options Considered (2–4
  options with criteria). RFCs/design docs share fixed sections (Problem, Goals, Proposed
  solution, Alternatives, Trade-offs, Decision).
- **When** — Capturing an architectural decision (ADR), gathering feedback (RFC), detailing a
  solution (design doc).
- **Primitive** — **grid of frames** (named blocks); use a **Comparison matrix** sub-frame for the
  "Options Considered" trade-off table.
- Source: https://adr.github.io/adr-templates/

### ERD (Entity-Relationship Diagram)

- **Structure** — Entities (named rectangles) with attributes (PK underlined/flagged, FK flagged),
  connected by verb-labeled relationship lines; crow's-foot notation encodes cardinality (one/
  many) and modality (zero/one minimum).
- **When** — Modeling a relational schema's tables, fields, and relationships/cardinality.
- **Primitive** — **flow**. Entity nodes (with attribute rows) + typed/cardinality-annotated edges.
- Source: https://www.ibm.com/think/topics/entity-relationship-diagram

### Sprint Kanban Board

- **Structure** — Columns of cards = workflow states. Jira defaults: To Do, In Progress, Done;
  common expansion: Backlog → To Do (Sprint Backlog) → In Progress → Review → Done. Cards =
  stories/tasks moving left→right.
- **When** — Tracking work items through workflow states during a sprint.
- **Primitive** — **kanban Board**. Direct match.
- Source: https://www.atlassian.com/agile/kanban/boards

### C4 Model

- **Structure** — Four nested zoom levels: L1 Context (system + external users/systems) → L2
  Container (apps/services/datastores) → L3 Component (inside one container) → L4 Code (optional).
  Each element opens into the next level.
- **When** — Documenting architecture at multiple, linked zoom levels for different audiences.
- **Primitive** — **flow**. Each level is a node/edge diagram; nodes expand into child-level flows.
- Source: https://c4model.com/diagrams

### Sequence / Data-Flow Diagram

- **Structure** — _Sequence (UML):_ participants across the top, each with a vertical dashed
  lifeline; messages = horizontal arrows ordered top→bottom (time = vertical); activation bars on
  lifelines. _DFD:_ external entities, processes, data stores, data flows (arrows); leveled (L0
  context → L1+ decomposed).
- **When** — Sequence: time-ordered message exchange for a scenario. DFD: how data moves/is
  processed/stored.
- **Primitive** — **swimlane** for the sequence diagram (lane = participant lifeline, time axis); a
  standalone DFD is a plain **flow**.
- Sources: https://www.uml-diagrams.org/sequence-diagrams.html ·
  https://www.geeksforgeeks.org/software-engineering/levels-in-data-flow-diagrams-dfd/

## Design / UX

### Wireframe

- **Structure** — Free-form single-screen layout of low-fi boxes standing in for UI regions:
  header, footer, nav bar, sidebar, main content, buttons. Placeholders only (lorem ipsum,
  box-with-X for images); grayscale.
- **When** — Early structure/layout work, free of visual styling.
- **Primitive** — **free frame**. Arbitrary placement of boxes — the explicit match.
- Source: https://www.figma.com/resource-library/what-is-wireframing/

### User Flow

- **Structure** — Directed diagram for one task: entry point → screens/processes (rectangles) →
  decision points (diamonds) → end/outcome (ovals). Standard flowchart symbols.
- **When** — Mapping the exact path(s) and branches a user takes to complete a goal.
- **Primitive** — **flow**. Nodes + directed edges with decision branches.
- Source: https://www.justinmind.com/blog/user-flow/

### Affinity Diagram

- **Structure** — Individual notes (one observation each) clustered into emergent theme groups
  (≈3–10), each labeled. No preset categories — themes form bottom-up (KJ method).
- **When** — Organizing large volumes of qualitative data into emergent themes.
- **Primitive** — **kanban Board** when clusters become labeled columns of note-cards; **free
  frame** when the exercise needs free spatial clustering first (categories not yet known).
- Source: https://www.nngroup.com/articles/affinity-diagram/

### Sitemap

- **Structure** — Tree: single Homepage (root) → categories → subcategories → pages
  (child/grandchild). Parent-child page relationships = navigation structure.
- **When** — Planning a site/app's page hierarchy before building.
- **Primitive** — **flow** (a top-down tree). Strict parent-child edges; mind map is a looser alt.
- Source: https://www.uxpin.com/studio/blog/sitemap-ux/

### Empathy Map

- **Structure** — Persona at center + four quadrants: Says (verbatim quotes), Thinks (inferred),
  Does (observed actions), Feels (emotional state).
- **When** — Synthesizing what a user says/thinks/does/feels before personas.
- **Primitive** — **grid of frames**. Four named blocks in a 2×2.
- Source: https://www.nngroup.com/articles/empathy-mapping/

### Storyboard

- **Structure** — Ordered sequence of panels/frames, each with a visual (sketch/screenshot) +
  caption, telling one scenario beginning → middle → end. Supporting: scenario summary, persona.
- **When** — Narrating a user's end-to-end experience over time, with context and emotion.
- **Primitive** — **Timeline**. Ordered panels along a narrative/time axis.
- Source: https://www.figma.com/resource-library/how-to-create-a-ux-storyboard/

### Service Blueprint

- **Structure** — Horizontal swim lanes stacked top→bottom, separated by named lines. Layers:
  Physical Evidence → Customer Actions → Frontstage (visible) → Backstage (invisible) → Support
  Processes. Separating lines: Line of Interaction, Line of Visibility, Line of Internal
  Interaction. Steps run left→right across all lanes.
- **When** — Mapping a full service across customer-facing and behind-the-scenes activities.
- **Primitive** — **swimlane**. Definitionally lanes with steps flowing across; the lines are lane
  dividers.
- Source: https://www.nngroup.com/articles/service-blueprints-definition/

### Card Sorting

- **Structure** — Cards (content items) sorted into category groups. Variants: Open (users create/
  label categories), Closed (preset fixed categories), Hybrid (preset + add new).
- **When** — Learning how users group content, to inform IA/navigation.
- **Primitive** — **kanban Board**. Columns = categories, cards = items; open/closed = whether
  columns are user-created vs fixed.
- Source: https://www.nngroup.com/articles/card-sorting-definition/

### Crazy 8s

- **Structure** — One sheet folded into 8 boxes; 8 distinct idea sketches in 8 minutes (1/box).
- **When** — Rapidly generating divergent solution concepts in a design sprint.
- **Primitive** — **grid of frames**. Eight fixed frames, each one sketch/idea.
- Source: https://designsprintkit.withgoogle.com/methodology/phase3-sketch/crazy-8s

## Growth / Marketing

### Marketing / Conversion Funnel (AARRR "Pirate Metrics")

- **Structure** — Five sequential stages (Dave McClure): Acquisition, Activation, Retention,
  Referral, Revenue. (Some practitioners reorder Revenue before Referral; AARRR is the canonical
  spelling.)
- **When** — Diagnosing where users drop off across the lifecycle; choosing the next growth lever.
- **Primitive** — **flow**. Linear directed stages with drop-off between nodes.
- Source: https://amplitude.com/blog/pirate-metrics-framework

### Growth Loops

- **Structure** — Closed self-reinforcing cycle (not a funnel): Input → Action/Step(s) → Output →
  Reinvestment (output feeds back to input). Reforge frames each loop by What (trigger), Who
  (actors), Why (motivation). Types: acquisition/viral, engagement/retention, monetization,
  defensibility.
- **When** — Modeling compounding growth where product + distribution + monetization act as one system.
- **Primitive** — **flow** with a return edge (cyclic directed graph). Mind map can't express the
  feedback edge.
- Source: https://www.reforge.com/blog/growth-loops

### Messaging House

- **Structure** — House-shaped hierarchy: Roof = single core message (one sentence); Pillars = 3–4
  supporting themes (columns); Foundation = proof points under each pillar (data, outcomes, quotes).
- **When** — Codifying a brand/product narrative so every team tells the same story with evidence.
- **Primitive** — **grid of frames**. One roof frame, a row of pillar frames, a proof row beneath —
  fixed named regions in a house layout.
- Source: https://umbrex.com/resources/frameworks/marketing-frameworks/message-house-framework/

### Positioning Canvas (April Dunford)

- **Structure** — Five interdependent blocks: Competitive Alternatives, Unique Attributes, Value
  (and proof), Target Customer Segmentation, Market Category. _(Five components — trends are an
  application, not a sixth block.)_
- **When** — Launching, repositioning, or entering a new market.
- **Primitive** — **grid of frames**. Five named, interdependent sections (not a directed sequence).
- Source: https://www.aprildunford.com/post/a-quickstart-guide-to-positioning

### Content Calendar (Editorial Calendar)

- **Structure** — One row per content item; columns: Publish Date, Title/Topic, Content Type,
  Channel, Owner, Status (Ideation → In Progress → Review → Scheduled → Published); extended:
  Pillar, Goal/CTA, keyword, link.
- **When** — Planning, assigning, and tracking content production/publishing across channels.
- **Primitive** — **kanban Board** (by Status — how teams actually run it). **Timeline** is the
  alternate date-axis view.
- Source: https://www.airtable.com/articles/how-to-create-a-content-calendar

### Brand / Marketing Strategy Canvas

- **Structure** — One-page named sections: Mission/Vision, Value Proposition (anchor), Audience/
  Segments, Market/Competitive Analysis, Channels, Objectives/KPIs, Budget Allocation, Timeline/
  Milestones. (Section set varies by template; Value Prop is consistently the anchor.)
- **When** — Putting a whole marketing/brand strategy on one page to align a team.
- **Primitive** — **grid of frames**. BMC-style labeled regions.
- Source: https://xtensio.com/digital-marketing-canvas-template/

### RACE Framework (Smart Insights)

- **Structure** — Lifecycle, often prefixed by Plan ("PRACE"): (Plan) → Reach → Act → Convert →
  Engage. Engage feeds back to Reach.
- **When** — Building a structured digital-marketing plan across the full customer lifecycle.
- **Primitive** — **flow**. Directed lifecycle sequence with a feedback edge.
- Source: https://www.smartinsights.com/essential-guides/using-the-race-framework-to-create-a-simple-digital-marketing-plan-for-your-small-business/

### Bullseye Framework (Traction)

- **Structure** — Three concentric rings over 19 traction channels: Outer = brainstorm all 19;
  Middle = test the 3–4 most promising; Inner = focus the 1 that's working.
- **When** — Systematically choosing which acquisition channel to bet on.
- **Primitive** — **kanban Board** (Brainstorm → Testing → Focus columns of channel cards). The
  literal concentric-rings visual has no superlore primitive; the board captures the actual
  prioritization workflow.
- Source: https://medium.com/@yegg/the-bullseye-framework-for-getting-traction-ef49d05bfd7e

## Sales / GTM

### ICP (Ideal Customer Profile) Canvas

- **Structure** — Named attribute blocks for the best-fit company: Firmographics (industry, size,
  geo), Technographics, Pain Points/Needs, Buying Triggers/Signals, Buyer Personas/Roles,
  Disqualifiers. Often paired with a fit-scoring rubric.
- **When** — Defining who to target before prospecting; aligning sales + marketing.
- **Primitive** — **grid of frames**. One profile in labeled sections (not options compared).
- Source: https://www.kalungi.com/blog/how-to-define-b2b-ideal-customer-profile-template-icp

### Sales Pipeline

- **Structure** — 5–7 sequential stages: Prospecting → Qualification → Discovery/Demo → Proposal →
  Negotiation → Closed Won/Lost (often + Onboarding/Expansion). Deal cards move left→right.
- **When** — Tracking and forecasting open deals; the day-to-day operating view.
- **Primitive** — **kanban Board**. Columns = stages, cards = deals — the canonical representation.
- Source: https://monday.com/blog/crm-and-sales/b2b-sales-pipeline-stages/

### Account Map / Account Planning

- **Structure** — Named components: Account Overview (financials, priorities, news), Stakeholder/
  Relationship Map, Whitespace Analysis (cross/upsell), SWOT/Competitive Context, Objectives (2–3
  quarterly), Action Plan (30/60/90-day with owners/dates).
- **When** — Growing and defending a strategic/enterprise account over time.
- **Primitive** — **grid of frames** for the plan; the stakeholder sub-section is itself a **flow**/
  org-tree.
- Source: https://altify.com/blog/account-planning-template/

### Org Chart / Buying Committee Map

- **Structure** — Hierarchical node map of the account's people, each tagged with a buying role:
  Economic Buyer/Decision-Maker, Champion, Influencer, Technical Buyer, User/End-User, Blocker.
  Arranged by reporting hierarchy; color-coded; influence lines between people.
- **When** — Mapping who decides in a complex deal to multi-thread and navigate politics.
- **Primitive** — **flow**. A directed tree/graph of role-tagged people with reporting + influence
  edges. (Generic org chart is the same primitive.)
- Source: https://tractioncomplete.com/articles/mapping-the-b2b-buying-committee/

### GTM Strategy Canvas

- **Structure** — One-page, ≈10 blocks in three areas: Business Model/Value (Value Proposition,
  ICP/segments); GTM Strategy (Positioning, Channels/Distribution, Pricing, GTM Motion e.g. PLG/
  sales-led, Launch plan); Customer Journey (funnel stages/metrics, often AARRR).
- **When** — Aligning a team on how a product reaches market before launch.
- **Primitive** — **grid of frames** (labeled sections); the embedded journey block can be a flow.
- Source: https://www.threefivetwo.com/2023/12/18/go-to-market-strategy-canvas-template/

### MEDDIC / MEDDPICC Qualification

- **Structure** — Named qualification slots. MEDDIC: Metrics, Economic Buyer, Decision Criteria,
  Decision Process, Identify Pain, Champion. MEDDICC adds Competition. MEDDPICC adds Paper Process
  (procurement/legal) + Competition.
- **When** — Qualifying/de-risking a complex B2B deal.
- **Primitive** — **grid of frames**. Each letter is a named slot of deal evidence (one deal — not
  a matrix).
- Source: https://meddicc.com/meddpicc-sales-methodology-and-process

### Sales Playbook Canvas

- **Structure** — Named sections: ICP/Personas, Messaging/Talk Tracks, Sales Process (table: Stage
  | Entry Criteria | Activities | Exit Criteria), Objection Handling, Competitive Positioning,
  Close Strategies/Next Steps; often organized as discrete "plays" (objective, talk track, asset,
  next step).
- **When** — Codifying how the team sells for repeatable execution and faster ramp.
- **Primitive** — **grid of frames** for the playbook; the sales-process sub-section is a small
  table/kanban.
- Source: https://www.zendesk.com/blog/sales-playbook/

### Battlecard

- **Structure** — One page per competitor; common 8-section anatomy (Klue): Overview, Why We Win
  (3 differentiators), Pricing Snapshot, Objection Responses, Questions to Seed/Landmine Questions,
  Landmines to Avoid, Proof Points, Update Log. (6-section variant: Overview, Strengths, Wedges,
  Landmines, Objections, Proof.)
- **When** — Arming reps to position against a specific competitor in a live deal.
- **Primitive** — **grid of frames** for a single competitor's card; **Comparison matrix** when the
  goal is head-to-head us-vs-them across criteria.
- Source: https://klue.com/blog/sales-battlecard-templates-attack-defend

## Ops / People / Finance

### Org Chart

- **Structure** — Top-down tree: CEO at apex → direct reports → teams, level by level. Box =
  role/person; line = reporting relationship; usually single supervisor per role.
- **When** — Showing reporting lines and chain of command.
- **Primitive** — **flow**. Directed single-parent reporting tree (mind map is too radial).
- Source: https://creately.com/guides/hierarchical-structure-org-charts/

### Swimlane Process Map

- **Structure** — Process flowchart partitioned into parallel lanes; each lane = one actor (role/
  department/system). Steps sit in the performer's lane; arrows crossing lanes mark handoffs;
  sequence runs left→right (or top→bottom).
- **When** — Mapping a multi-role process and making handoffs/accountability explicit.
- **Primitive** — **swimlane**. The exact definition.
- Source: https://www.lucidchart.com/pages/tutorial/swimlane-diagram

### RACI Matrix

- **Structure** — Grid: rows = tasks/deliverables, columns = people/roles; each cell holds R
  (Responsible), A (Accountable — exactly one per task), C (Consulted), I (Informed).
- **When** — Clarifying decision rights and who does what across cross-functional work.
- **Primitive** — **Comparison matrix** with coded cells.
- Source: https://www.cio.com/article/287088/project-management-how-to-design-a-successful-raci-project-plan.html

### Hiring / Recruiting Pipeline

- **Structure** — Ordered columns of candidate cards: Applied → Screening → Interview → Assessment
  → Offer → Hired (Rejected/Withdrawn as exits). Stages customizable.
- **When** — Tracking candidates through the recruiting funnel and seeing per-stage conversion.
- **Primitive** — **kanban Board**. The canonical staged card-flow.
- Source: https://resources.workable.com/hiring-with-workable/how-to-manage-recruiting-pipeline

### Process Flowchart

- **Structure** — Directed graph of ANSI/ISO symbols: oval = Start/End, rectangle = Process,
  diamond = Decision (labeled branches), parallelogram = Input/Output; one start, ≥1 end.
- **When** — Documenting steps/decisions/branches of a single process (no role lanes).
- **Primitive** — **flow**. Typed nodes + directed edges, including decision branches.
- Source: https://www.smartdraw.com/flowchart/flowchart-symbols.htm

### Financial Model / Unit Economics Overview

- **Structure** — Headline metric cards: CAC, LTV (= ARPU × Gross Margin × Avg Lifespan), LTV:CAC
  ratio (~3:1–5:1), Gross Margin %, ARPU, Churn, Payback Period, Runway — each a single computed
  value with a benchmark/target.
- **When** — Showing at a glance whether a customer is profitable and the model is sustainable.
- **Primitive** — **StatGrid**. A dashboard of single-value KPIs with benchmarks.
- Source: https://www.basedash.com/startup-metrics/unit-economics

### OKR / Goal Board

- **Structure** — One section per Objective (qualitative), with 2–5 nested Key Results
  (measurable, with owner, quarter, 0.0–1.0 score, color-coded); Objective rolls up KR scores.
- **When** — Setting and tracking quarterly company/team goals.
- **Primitive** — **grid of frames**. Each Objective is a named frame holding its KR list. _(The
  cross-level OKR **tree** above is the **flow** variant — this board is the single-level tracking
  view.)_
- Source: https://www.atlassian.com/agile/agile-at-scale/okr

### Capacity / Resource Planning Board

- **Structure** — Roster grid: rows = team members (role/skills), columns = time periods (weeks/
  sprints) or projects; cells = allocation/utilization (hours or %) vs capacity; target ~70–85%.
- **When** — Balancing who works on what over time; spotting overload/idle capacity.
- **Primitive** — **Comparison matrix** with %/hours cells. The value is the cross-tab.
- Source: https://monday.com/blog/project-management/capacity-planning-template/

## General Facilitation

### Retro — Start / Stop / Continue

- **Structure** — Three columns of sticky notes: Start (new practices), Stop (discontinue),
  Continue (keep doing).
- **When** — Fast sprint/team retro to decide concrete behavioral changes.
- **Primitive** — **kanban Board** (three fixed columns of cards). **free frame** alt for loose
  sticky placement.
- Source: https://www.retrium.com/retrospective-techniques/start-stop-continue

### Retro — Mad / Sad / Glad

- **Structure** — Three columns capturing emotion: Mad (frustrations), Sad (disappointments/
  improve), Glad (what made the team happy).
- **When** — A retro focused on team morale and sentiment.
- **Primitive** — **kanban Board**. Same three-column structure.
- Source: https://www.retrium.com/retrospective-techniques/mad-sad-glad

### Mind Map

- **Structure** — Central topic; 4–6 main branches (categories); each with 3–10 sub-branches — a
  radial tree of keyword nodes.
- **When** — Brainstorming/organizing ideas around one central concept.
- **Primitive** — **mind map**. Exact match.
- Source: https://creately.com/guides/what-is-a-mind-map/

### Dot Voting

- **Structure** — Idea items (stickies) placed freely; each participant gets N dot stickers placed
  on preferred items; dot tally = priority heat-map; most-dotted win.
- **When** — Democratically prioritizing/narrowing a large set of ideas.
- **Primitive** — **free frame**. Items placed and voted on in place — the canonical free-frame use.
- Source: https://www.nngroup.com/articles/dot-voting/

### Decision Matrix (Weighted Scoring)

- **Structure** — Grid: rows = options, columns = weighted criteria; cells = ratings; row total =
  Σ(score × weight); highest total wins.
- **When** — Choosing among options by scoring against weighted criteria.
- **Primitive** — **Comparison matrix** (maps to the **Decision** component). Textbook definition.
- Source: https://lucid.co/blog/weighted-decision-matrix

### Affinity Diagram / Mapping

- **Structure** — Many stickies (one idea each) moved together into emergent clusters, each labeled
  with a theme. No predefined columns — groupings discovered.
- **When** — Synthesizing a large pile of raw ideas/findings into themes.
- **Primitive** — **free frame** (free spatial re-arrangement; categories not yet known). A
  fixed-column board would presuppose the categories the exercise discovers.
- Source: https://www.nngroup.com/articles/affinity-diagram/

### Brainwriting (6-3-5)

- **Structure** — 6 participants each write 3 ideas in 5 minutes, then pass right; next builds on
  the prior 3; 6 rounds → up to 108 ideas. A worksheet grid (participants × idea slots/rounds).
- **When** — Structured silent brainstorming giving everyone equal voice.
- **Primitive** — **grid of frames** (the fixed worksheet grid). **free frame** for an open board.
- Source: https://en.wikipedia.org/wiki/6-3-5_Brainwriting

### How-Might-We / Impact-Effort

- **Structure** — Two stages: reframe problems into "How Might We…" questions, then plot ideas on
  an Impact-Effort 2×2 (X = Effort low→high, Y = Impact low→high): Quick Wins, Major Projects/Big
  Bets, Fill-Ins, Thankless Tasks/Money Pits.
- **When** — Workshops: reframe problems, then prioritize by payoff vs cost.
- **Primitive** — **free frame** with a 2×2 backdrop (continuous X/Y sticky placement). Use a
  **Comparison matrix** when discrete quadrant buckets suffice.
- Source: https://creately.com/guides/impact-effort-matrix/

### SWOT (as a facilitation tool)

- **Structure** — 2×2 of four named quadrants: Strengths (internal/positive), Weaknesses (internal/
  negative), Opportunities (external/positive), Threats (external/negative).
- **When** — Facilitating a situation assessment across four fixed dimensions.
- **Primitive** — **grid of frames**. (Same framework as under Strategy — one template serves both.)
- Source: https://asana.com/resources/swot-analysis

---

# Icon & Asset Sourcing

The decisive split is **bundle/redistribute** (truly open licenses — MIT, ISC, CC0, Apache-2.0,
CC-BY) vs **reference-only** (cloud-vendor sets, which permit _use in diagrams_ under restrictive
terms-of-use + trademark, not an open license). **All three major cloud vendors are
reference-only.**

## Cloud-vendor architecture icon sets — REFERENCE-ONLY

### AWS Architecture Icons

- **Coverage** — Full AWS service/resource set (compute, storage, DB, networking, analytics, ML,
  security); thousands of assets.
- **Download** — https://aws.amazon.com/architecture/icons/ — PowerPoint toolkit (light + dark) +
  Asset Package; quarterly releases.
- **Formats** — PPTX, SVG, PNG; native libs for draw.io ("AWS4" shapes), Figma, Lucidchart,
  Cloudcraft, Miro.
- **License** — Not open. AWS allows "customers and partners to use these toolkits and assets to
  create architecture diagrams" + whitepapers/presentations. Icons wholly owned by AWS. Governed
  additionally by the AWS Trademark Guidelines (no modification of marks; no use implying confusion
  or for non-AWS products). The widely-repeated third-party "CC-BY-ND 2.0" label is **not**
  corroborated by AWS's own text — treat as folklore.
- **Verdict** — **Reference-only.** Do not bundle. Let users place AWS icons in their own diagrams.
- Sources: https://aws.amazon.com/architecture/icons/ · https://aws.amazon.com/trademark-guidelines/ ·
  https://awsfundamentals.com/aws-icons

### Google Cloud Architecture Icons

- **Coverage** — 200+ GCP product icons (BigQuery, Pub/Sub, Cloud Run, GKE, Cloud SQL, Dataflow,
  Cloud Storage…).
- **Download** — https://cloud.google.com/architecture/icons (also `cloud.google.com/icons`); SVG +
  PNG ZIPs + slide "cards." Community mirror: https://github.com/AwesomeLogos/google-cloud-icons
- **Formats** — SVG, PNG, slide cards.
- **License** — Conflicting public claims. Some secondary sources say Apache-2.0; the community
  mirror states "All rights/licensing/ownership is by Google," and Google's policy treats product
  logos as trademark permission ("may be used freely… to accurately reference Google's technology…
  in architecture diagrams"). The Apache-2.0 claim is **not confirmed** by Google's own asset
  terms.
- **Verdict** — **Reference-only** (treat as proprietary until an explicit LICENSE file is found in
  the official download).
- Source: https://cloud.google.com/architecture/icons

### Microsoft Azure Architecture Icons

- **Coverage** — 705+ Azure product icons (AKS, App Service, SQL Database, Key Vault, Storage,
  Entra ID…); ~quarterly updates.
- **Download** — https://learn.microsoft.com/en-us/azure/architecture/icons/ — single "Download SVG
  icons" ZIP, gated behind an agree-to-terms checkbox.
- **Formats** — **SVG only.** Microsoft explicitly provides no Visio stencils.
- **License (exact)** — "Microsoft permits the use of these icons in architectural diagrams,
  training materials, or documentation. You can copy, distribute, and display the icons only for
  the permitted use unless granted explicit permission by Microsoft. Microsoft reserves all other
  rights." Do: illustrate how products work together, include the product name, use as-is. Don't:
  crop/flip/rotate/distort; don't use Microsoft icons to represent your own product.
- **Verdict** — **Reference-only.** "Copy/distribute/display only for the permitted use" is not a
  product-redistribution grant; no modification; not for superlore's own UI.
- Source: https://learn.microsoft.com/en-us/azure/architecture/icons/

## Vendor-neutral / open-license sets — BUNDLE-SAFE (unless noted)

### Lucide — ISC (+ MIT for Feather-derived icons) — already bundled

- **Coverage HAS** — `database`, `database-backup`, `server`, `server-cog`, `cloud`, `cloud-cog`,
  `network`, `container`, `hard-drive`, `cpu`, `router`, `globe`, `box`, `boxes`, `workflow`,
  `git-branch`, `webhook`, `shield`, `lock`, `key`. ~1,600+ icons.
- **Coverage LACKS (for architecture diagrams)** — no message-queue/pub-sub primitive (no Kafka/
  RabbitMQ/SQS concept — `webhook`/`workflow` are nearest), no load-balancer, no API-gateway, no
  cache (Redis/Memcached), no CDN, no vendor/managed-service icons, no brand/logo coverage. It's a
  generic UI/line set — gives shapes (server, db, cloud, container) but not the named-component
  vocabulary of real diagrams.
- **License** — **ISC**, _not_ MIT as commonly assumed (~120 Feather-derived icons are MIT). Both
  permissive and bundle-safe; attribution notice should say ISC.
- **Verdict** — **Bundle** (foundation layer); supplement for the gaps.
- Sources: https://lucide.dev/license · https://lucide.dev/icons/

### Tabler Icons — MIT

- **Coverage** — 6,100+ generic line icons (24×24, 2px); broader than Lucide; fills generic infra/UI
  gaps; some brand glyphs.
- **License** — MIT, no attribution required. **Bundle-safe.**
- Source: https://github.com/tabler/tabler-icons

### Devicon — MIT (tech/brand logos)

- **Coverage** — Languages, databases, frameworks, dev tools (Postgres, MySQL, MongoDB, Redis,
  Docker, Kubernetes, Terraform…); plain/line/colored/wordmark variants; SVG + icon font.
- **License** — MIT (covers the SVG files); depicted **brand trademarks** remain owned by their
  companies (standard logo caveat). **Bundle-safe (file license)** with trademark caveat.
- Source: https://github.com/devicons/devicon

### Simple Icons — CC0 1.0 (brand logos)

- **Coverage** — 3,000+ single-color brand/company SVG logos (vendors, SaaS, dev tools).
- **License** — CC0 1.0 for the SVG paths. **Critical caveat:** CC0 waives copyright but explicitly
  **does not waive trademark/patent** — logos remain their owners' trademarks; respect brand
  guidelines. **Bundle-safe by license; restricted by use.**
- Sources: https://simpleicons.org · https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md

### Kubernetes Icons (kubernetes/community) — Apache-2.0 OR CC-BY-4.0

- **Coverage** — Control-plane (API server, controller-manager, scheduler, etcd), infra (control
  plane, nodes), 25+ resource types (Pods, Deployments, Services, ConfigMaps…); PNG + SVG,
  labeled/unlabeled.
- **License** — Dual: Apache-2.0 or CC-BY-4.0 (CC-BY needs attribution). The K8s logo/wordmark
  itself is a Linux Foundation trademark. **Bundle-safe.**
- Source: https://github.com/kubernetes/community/tree/main/icons

### Iconify — aggregator; license is PER-SET

- **Coverage** — 200+ sets / ~250k icons (Material, FA, Tabler, Lucide, Devicon, Simple Icons,
  Logos…) behind one API.
- **License** — Framework permissive; **each set keeps its own license** (in its `info.json`).
- **Verdict** — Use as a delivery mechanism; **bundle only the sets whose individual license is
  open**, filtered programmatically by license metadata.
- Source: https://iconify.design/

### svgl — MIT framework; per-logo trademark

- **Coverage** — Curated brand/company SVG logos. **License** — project MIT, but each logo's own
  license/trademark must permit use. **Bundle the code; treat brand marks as reference-only.**
- Source: https://svgl.app/

### Skillicons — MIT

- **Coverage** — ~400 dev/tech icons (README-badge fidelity). **License** — MIT; standard brand
  caveat. **Bundle-safe**, lower priority (Devicon covers the same need at higher quality).
- Source: https://skillicons.dev/

### CNCF Artwork — trademark-governed, NOT open

- **Coverage** — Logos for all CNCF projects (graduated/incubating/sandbox). **License** — Linux
  Foundation Trademark Usage Policy, not an open content license (distinct from the open
  kubernetes/community _icons_ set). **Reference-only** — use project logos in user diagrams; don't
  redistribute as an asset pack.
- Source: https://github.com/cncf/artwork

## Bundle-vs-reference summary

| Set                          | Coverage                                               | License (exact)                                              | Verdict                       |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------- |
| **Lucide**                   | Generic shapes (server, db, cloud, container, network) | ISC (+MIT Feather)                                           | **Bundle** (already shipped)  |
| **Tabler**                   | 6,100+ generic line icons                              | MIT                                                          | **Bundle**                    |
| **Devicon**                  | Languages, DBs, dev-tool logos                         | MIT (logo trademark caveat)                                  | **Bundle**                    |
| **Simple Icons**             | 3,000+ brand logos                                     | CC0 1.0 (trademark NOT waived)                               | **Bundle** (use-restricted)   |
| **Kubernetes Icons**         | K8s control plane + resources                          | Apache-2.0 / CC-BY-4.0                                       | **Bundle**                    |
| **Iconify**                  | 200+ sets / 250k icons                                 | Per-set (varies)                                             | **Bundle open sets only**     |
| **svgl**                     | Brand SVG logos                                        | MIT framework / per-logo trademark                           | Bundle code; brand = ref-only |
| **Skillicons**               | ~400 dev/tech icons                                    | MIT (trademark caveat)                                       | **Bundle** (low priority)     |
| **AWS Architecture Icons**   | All AWS services                                       | Proprietary; diagram-use + trademark                         | **Reference-only**            |
| **Google Cloud Icons**       | 200+ GCP services                                      | Apache-2.0 claim unverified → proprietary                    | **Reference-only**            |
| **Azure Architecture Icons** | 705+ Azure products                                    | "use… only for the permitted use… reserves all other rights" | **Reference-only**            |
| **CNCF Artwork**             | CNCF project logos                                     | LF Trademark Policy (not open)                               | **Reference-only**            |

**Recommended Canvas strategy:** bundle **Lucide + Tabler** (generic infra shapes) + **Devicon +
Simple Icons** (tech/brand logos) + **Kubernetes icons** as the shippable core. For the three cloud
vendors, **do not redistribute the asset packs** — let users drop vendor icons into their own
diagrams (or fetch client-side from the vendor's official source at author time), keeping superlore
clear of redistribution and trademark exposure.

**Key corrections to flag:** (1) Lucide is **ISC**, not MIT. (2) Lucide lacks queue/pub-sub,
load-balancer, API-gateway, cache, and CDN primitives — plan to supplement. (3) All three cloud
vendors are reference-only; the "AWS = CC-BY-ND" and "GCP = Apache-2.0" claims are unverified
folklore. (4) CC0/MIT cover the file, not the trademark — for Simple Icons/Devicon/svgl/Skillicons
the depicted brand marks remain trademarks.

---

# Prioritized top-15 templates to build first

Ranked by **demand × coverage × primitive-reuse** — every primitive superlore already ships gets
exercised early, and the highest-frequency cross-function frameworks come first.

| #   | Template                                       | Function(s)                           | Primitive                       | Why it's prioritized                                                              |
| --- | ---------------------------------------------- | ------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **Business Model Canvas**                      | Strategy                              | grid of frames                  | The iconic 9-block canvas; proves the named-block grid; universally recognized.   |
| 2   | **Lean Canvas**                                | Strategy/Product                      | grid of frames                  | Near-free once BMC exists (same primitive, different 9 labels); startup default.  |
| 3   | **SWOT**                                       | Strategy/Facilitation                 | grid of frames                  | Universal 2×2; one template serves both Strategy and Facilitation.                |
| 4   | **Sprint Kanban Board**                        | Engineering                           | kanban Board                    | Direct map to the live Board component; the most-used eng artifact.               |
| 5   | **Sales Pipeline**                             | Sales/GTM                             | kanban Board                    | Same Board component, stage presets; high-frequency GTM workhorse.                |
| 6   | **RICE / ICE Scoring**                         | Product                               | Comparison matrix               | Exercises the Comparison/Decision component with computed cells; PM staple.       |
| 7   | **2×2 Prioritization (Value vs Effort)**       | Product/Facilitation                  | Comparison matrix (or free 2×2) | Ubiquitous; demonstrates the 2×2 + free-plot pattern reused by Impact-Effort.     |
| 8   | **OKR Tree**                                   | Strategy/Ops                          | flow                            | Flagship flow/tree; aligns with the OKR board variant; high org demand.           |
| 9   | **System Architecture Diagram**                | Engineering                           | flow + icon sets                | Showcase for nodes/edges **and** the icon-sourcing work (Lucide + Devicon + K8s). |
| 10  | **User Journey Map**                           | Design/Product                        | grid of frames (phases × lanes) | High-value UX artifact; proves the grid handles a phases×lanes matrix.            |
| 11  | **Retro (Start/Stop/Continue + Mad/Sad/Glad)** | Facilitation                          | kanban Board                    | Two presets of one Board; every team runs retros; trivial reuse.                  |
| 12  | **Mind Map**                                   | Facilitation                          | mind map                        | Exercises the mind-map primitive; the default brainstorming canvas.               |
| 13  | **Org Chart**                                  | Ops/People (+ Sales buying-committee) | flow                            | One flow/tree template serves org charts and buying-committee maps.               |
| 14  | **Flowchart / Swimlane Process Map**           | Ops/Engineering                       | flow + swimlane                 | Proves the swimlane layout; reused by service blueprint & sequence diagrams.      |
| 15  | **Unit Economics / Financial Dashboard**       | Finance                               | StatGrid                        | The one template that exercises StatGrid; high founder/exec demand.               |

**Primitive coverage check (top-15 hits every shipped primitive):** grid of frames (#1, 2, 3, 10),
kanban Board (#4, 5, 11), Comparison/Decision matrix (#6, 7), flow (#8, 9, 13, 14), swimlane (#14),
mind map (#12), StatGrid (#15), Timeline (covered next by RCA/Storyboard), free frame (covered next
by Dot Voting/Affinity). Building these 15 validates the full primitive set and the icon pipeline
before fanning out to the long tail (Empathy Map, PRD, ERD, Positioning/Messaging/ICP canvases,
MEDDIC, battlecards, service blueprint, C4, growth loops, affinity/dot-voting, etc.).
