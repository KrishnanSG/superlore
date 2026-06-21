# superlore — roadmap

Phased plan from scaffold to launch. Status as of 2026-06-19. See `docs/HANDOFF.md` for the
narrative, `docs/ARCHITECTURE.md` for the design these phases implement, `docs/COMPONENTS.md`
for the component catalog, and `docs/VISION.md` for the north-star bets (visuals-first; superlore
as the rich viewer for agent-authored docs) that phases 2, 3, and 6 build toward.

## Phase 0 — Foundation ✅ (done)

Name, brand, and thesis locked; repo scaffolded.

- [x] Name **superlore** (npm `superlore` verified free), tagline, positioning.
- [x] Brand: mark (Concept A), superlore violet `#6D5CF0`, `DESIGN.md`, `brand/` assets.
- [x] OSS skeleton: README, MIT LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, templates.
- [x] Project docs: HANDOFF, ARCHITECTURE, DESIGN, ROADMAP, CLAUDE.md.
- [x] Monorepo placeholders + workspace config.

## Phase 1 — Workspace & core extraction

Stand up tooling and lift the proven layer into `packages/superlore`.

- [ ] Workspace: pnpm + Turborepo, TS (strict), ESLint + Prettier, Storybook.
- [ ] Extract the shared component library (Mintlify-compat shims + polish components).
- [ ] Extract & generalise the design-token layer into a swappable theme preset.
- [ ] Extract pluggable auth (Auth.js v5 + Google SSO; optional gate).
- [ ] Render everything in `apps/docs` to prove the package works end-to-end.

## Phase 2 — Content model + MCP (the native part)

The differentiator. Design these together.

- [ ] Typed content model: MDX + frontmatter schema → derived structured index + relation graph.
- [ ] MCP server: `search`, `get_page`/`get_section`, `list`, `navigate`, `get_component_data`.
- [ ] **Dual-representation contract**: every component gets a knowledge face.
- [ ] Port the rich structural components (timeline, board, entity card, table, diagram).
- [ ] **Rich visualization, first-class** (see `docs/VISION.md` Bet 1): stronger `Diagram`, a
      `Canvas`/`Whiteboard` auto-laid-out from MDX, and `Chart` (data+picture) — each serializing
      to a graph/series knowledge face, never an opaque image.
- [ ] Auth parity: the MCP inherits the site's public/gated policy.

## Phase 3 — Authoring & deploy skills

The zero-knowledge, "vibe your docs" UX.

- [ ] `npm create superlore` starter template (`templates/starter`).
- [ ] **Scaffold** skill — stand up a new KB.
- [ ] **Author** skill — generate/edit content from intent ("vibe").
- [ ] **Ingest** skill (public, clone-into-any-agent) — make an agent emit superlore-style `.mdx`
      instead of flat `.md`, promoting prose into cards/boards/timelines/diagrams. The adoption
      wedge — see `docs/VISION.md` Bet 2.
- [ ] **Deploy** skill — ship to Vercel (or anywhere) in one go. Deployment stays the user's.

## Phase 4 — OSS polish & launch

- [ ] Build superlore's own docs in `apps/docs` with superlore — the canonical, self-contained,
      MCP-enabled, public reference (also teaches agents how to build superlore-style docs).
- [ ] Examples + a great getting-started.
- [ ] Make the repo public; publish `superlore` to npm.
- [ ] Launch: LinkedIn + community posts; position as the go-to KB/wiki tool.

## Phase 5 — Showcase

- [ ] A gallery where teams **submit** their KBs / product docs.
- [ ] "Built with superlore" program to seed virality.

## Phase 6 — superlore Viewer & the comment loop (the wedge)

The lowest-friction on-ramp: turn the boring `.md` files agents already produce into rich,
visual, reviewable documents. See `docs/VISION.md` Bet 2.

- [ ] **Drag-and-drop viewer** — drop a superlore `.mdx` (or plain `.md`) and instantly render it
      with every superlore component + the violet theme. Client-side, **ephemeral by default**
      (render-only, nothing stored).
- [ ] **Inline comments** on the rendered doc, **exportable** as a portable JSON sidecar.
- [ ] **Hand-back loop** — feed exported comments back to the authoring agent; review becomes an
      agent-compatible step.
- [ ] Decide the superlore file story (`.mdx` vs a branded alias) and the comment/export format.

## Ongoing

Community, docs, accessibility, performance, and breadth of structural components.
