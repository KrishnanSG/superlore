# superlore — roadmap

Phased plan from scaffold to launch. Status as of 2026-06-22. See `docs/ARCHITECTURE.md` for the
design these phases implement, `docs/COMPONENTS.md` for the component catalog, `docs/canvas/`
for the shipped Canvas + viewer, and `docs/VISION.md` for the north-star bets (visuals-first;
superlore as the rich viewer for agent-authored docs) that phases 2, 3, and 6 build toward.

## Phase 0 — Foundation ✅ (done)

Name, brand, and thesis locked; repo scaffolded.

- [x] Name **superlore** (npm `superlore` verified free), tagline, positioning.
- [x] Brand: mark (Concept A), superlore violet `#6D5CF0`, `DESIGN.md`, `brand/` assets.
- [x] OSS skeleton: README, MIT LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, templates.
- [x] Project docs: ARCHITECTURE, DESIGN, ROADMAP, CLAUDE.md.
- [x] Monorepo placeholders + workspace config.

## Phase 1 — Workspace & core extraction ✅ (done)

Tooling stood up and the proven layer lifted into `packages/superlore` (published as `superlore`).

- [x] Workspace: pnpm + Turborepo, TS (strict), ESLint + Prettier.
- [x] Extract the shared component library (Mintlify-compat shims + polish components).
- [x] Extract & generalise the design-token layer into a swappable theme preset.
- [x] Extract pluggable auth (Auth.js v5 + Google SSO; optional gate).
- [x] Render everything in `apps/docs` to prove the package works end-to-end.

## Phase 2 — Content model + MCP (the native part) ✅ (done)

The differentiator — shipped.

- [x] Typed content model: MDX + frontmatter schema → derived structured index + relation graph.
- [x] MCP server: `search`, `get_page`/`get_section`, `list`, `navigate`, `get_component_data`
      (six tools).
- [x] **Dual-representation contract**: every component gets a knowledge face.
- [x] Port the rich structural components (timeline, board, entity card, table, diagram).
- [x] **Rich visualization, first-class** (see `docs/VISION.md` Bet 1): the `Canvas` whiteboard,
      auto-designed and auto-laid-out from MDX, serializing to a typed node/edge graph — see
      `docs/canvas/`. Stronger `Chart` (data+picture) still to come.
- [x] Auth parity: the MCP inherits the site's public/gated policy.

## Phase 3 — Authoring & deploy skills

The zero-knowledge, "vibe your docs" UX.

- [ ] `npm create superlore` starter template (`templates/starter`).
- [ ] **Scaffold** skill — stand up a new KB.
- [ ] **Author** skill — generate/edit content from intent ("vibe").
- [ ] **Ingest** skill (public, clone-into-any-agent) — make an agent emit superlore-style `.mdx`
      instead of flat `.md`, promoting prose into cards/boards/timelines/diagrams. The adoption
      wedge — see `docs/VISION.md` Bet 2.
- [ ] **Deploy** skill — ship to Vercel (or anywhere) in one go. Deployment stays the user's.

## Phase 4 — OSS polish & launch (in progress)

- [x] Build superlore's own docs in `apps/docs` with superlore — the canonical, self-contained,
      MCP-enabled, public reference (also teaches agents how to build superlore-style docs).
- [x] Examples + a great getting-started.
- [x] Publish `superlore` to npm (currently `0.3.3`).
- [ ] Make the repo public.
- [ ] Launch: LinkedIn + community posts; position as the go-to KB/wiki tool.

## Phase 5 — Showcase

- [ ] A gallery where teams **submit** their KBs / product docs.
- [ ] "Built with superlore" program to seed virality.

## Phase 6 — superlore Viewer & the comment loop (the wedge) (in progress)

The lowest-friction on-ramp: turn the boring `.md` files agents already produce into rich,
visual, reviewable documents. The viewer ships at `apps/docs/app/(viewer)/viewer`. See
`docs/VISION.md` Bet 2.

- [x] **Drag-and-drop viewer** — drop a superlore `.mdx` (or plain `.md`) and instantly render it
      with every superlore component + the violet theme. Client-side, **ephemeral by default**
      (render-only, nothing stored).
- [x] **Inline comments** on the rendered doc (the comment rail), exportable as a portable JSON
      sidecar.
- [ ] **Hand-back loop** — feed exported comments back to the authoring agent; review becomes an
      agent-compatible step.
- [ ] Decide the superlore file story (`.mdx` vs a branded alias) and finalize the comment/export
      format.

## Ongoing

Community, docs, accessibility, performance, and breadth of structural components.
