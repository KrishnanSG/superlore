# CODING_STANDARDS.md — superlore

The enforceable conventions for everyone — human or agent — writing code in this repo. This is
the **source of truth**; CI, ESLint, Prettier, and commitlint enforce the mechanical parts. The
agent-facing projection of these rules lives in `.claude/skills/superlore-contributor/` (it points
here; it does not duplicate). Read `CLAUDE.md` first — these are its non-negotiables made
enforceable.

> One superlore, one standard. If a rule here conflicts with habit, the rule wins.

---

## 1. The non-negotiable: dual-representation

This is the moat. It is rule #1 because it is the whole product.

- **Every structural component implements two faces from one authored instance:** a **render
  face** (the React component a human sees) and a **knowledge face** (a typed serializer that
  produces a `KnowledgeNode` the MCP exposes to agents). See `docs/COMPONENTS.md`.
- **A render-only component is not done.** PRs that add a structural component without a
  knowledge face are rejected. A CI check fails the build if a component is registered for MDX
  (`getMDXComponents`) but has no `registerKnowledge` entry.
- **The knowledge face is data, never prose.** No `"a chart showing…"` strings; agents get the
  underlying records + relations. Test asserts the serialized JSON contains no markup
  (`/<svg|class=/`).
- **Colocate the serializer with the component** (`timeline/timeline.tsx` holds both faces and
  the `registerKnowledge` call). Colocation is what prevents drift.
- **No drift between the in-process serializer and what the MCP serves** — this is the single
  highest-value failure mode. Every structural component ships the three-part test (render face,
  knowledge face, MCP parity). See §4 and `docs/COMPONENTS.md`.
- Purely inline/layout components (Icon, Columns, Frame, PageHero) are explicit exceptions —
  they emit no node; their children pass through. The agent affordances (AgentBadge, McpPanel,
  CopyForAgent) are also exceptions because they are _about_ the knowledge channel, not content
  in it. Document the exception in the file; never silently skip a serializer.

## 2. TypeScript

- `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride` + `verbatimModuleSyntax`
  (inherited from `tsconfig.base.json`). Repo targets TS `~6.0`.
- **No `any`.** Use `unknown` + narrowing; `satisfies` for config objects; generics over casts.
- **Type-only imports** (`import type …`), `separate-type-imports` — enforced and autofixed.
- The public API is exported through the package `exports` map. **No deep imports** into
  `superlore/dist/...`; if something should be public, export it from a barrel.

## 3. Tokens, not literals

- Colour / spacing / radius come from design tokens (CSS `--*` vars and Tailwind v4
  `@theme inline`). **No raw hex** in components — lint + review gate. Brand violet `#6D5CF0`
  lives **only** in the token layer (`src/theme/`).
- **Light and dark are co-equal**, both first-class from one token set, via `[data-theme]` /
  `.dark`; default to the reader's system preference. **Never branch on theme in
  JS** — both themes are pure CSS-token swaps. (Mermaid is the one sanctioned exception: it has
  no CSS surface, so it reads `resolvedTheme` and swaps `themeVariables`.)
- Use `mono` + tabular figures (`tnum`) for code, data, dates, and labels.

## 4. Component authoring

- **Reuse lives in `packages/superlore`.** Never copy-paste a component into `apps/*` or
  `templates/*`. This package _is_ the reusable layer.
- One component per directory: `timeline/{timeline.tsx, timeline.test.tsx, index.ts}` (+
  `*.stories.tsx` when Storybook lands).
- `"use client"` only on genuinely interactive leaves. **Barrels (`index.ts`) stay
  directive-free** so the build emits `"use client"` per chunk (see `docs/TOOLCHAIN.md`).
- Compose classes with `cn` (`tailwind-merge`); no bespoke string concatenation of conditional
  classes.
- Every new/changed structural component ships: a knowledge face, a test, a docs example in
  `apps/docs` (and a Storybook story once Storybook is set up).

## 5. Accessibility

- `eslint-plugin-jsx-a11y` recommended is enforced. Interactive components expose roles/labels
  (a Timeline is a `role="list"` with an `aria-label`; a Board's columns are labelled regions).
- Keyboard-operable; visible focus rings via tokens (never remove focus); respect
  `prefers-reduced-motion`.
- The `⌘K` search path is a first-class, keyboard-driven surface — design it, don't bolt it on.

## 6. Next.js 16 + Fumadocs (this is NOT the Next in your training data)

- `params`, `searchParams`, `cookies()`, `headers()` are **async** — always `await`.
- Middleware is **`proxy.ts`**, not `middleware.ts`. The auth gate lives there.
- **Check installed docs under `node_modules/next/dist/docs/` before writing Next code.**
- `apps/docs` consumes `superlore` as a `workspace:*` dep and Next `transpilePackages: ["superlore"]`.
  The published package is built (tsup), not source-linked, before release.

## 7. Files & naming

- `kebab-case` file names; `PascalCase` components/types; `camelCase` functions/vars;
  `SCREAMING_SNAKE` for true constants.
- Tests are `*.test.ts(x)` colocated with source. No `__tests__` dirs.
- One default export per route file (Next convention); named exports everywhere else.

## 8. Testing

- **Vitest** for unit/component (jsdom) and MCP (node env per-file). Coverage floor 70% lines on
  `packages/superlore/src`.
- Structural components require the **three-part test**: render face (Testing Library), knowledge
  face (serializer output equals the expected `KnowledgeNode`, contains no markup), and MCP
  parity (the same data comes back through `get_component_data` over `InMemoryTransport`).
- `apps/docs` gets a Playwright smoke test (render + theme toggle) — deferred to Phase 4.

## 9. Commits, branches, releases

- **Conventional Commits**: `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`,
  `test: …`, `build: …`, `ci: …`. Enforced by commitlint on `commit-msg`.
- Commit messages **must end with** the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  (commitlint body/footer line-length rules are relaxed so long trailers never trip).
- Branch off `main`; never commit straight to `main`. PRs run the full CI matrix.
- Any change touching the published package needs a **changeset** (`pnpm changeset`).

## 10. MCP contract

- The MCP is a first-class surface, not an afterthought. Any change to the content model must
  keep the tools coherent: `search`, `get_page`/`get_section`, `list`, `navigate`,
  `get_component_data`.
- New structural component → confirm `get_component_data` returns its knowledge face and add the
  parity test.

---

### Why a doc _and_ a skill

`CODING_STANDARDS.md` is canonical: diffable, reviewable in PRs, enforced by CI. A skill cannot
be the source of truth because it is invisible in review and would drift. But superlore's thesis is
agent-authored work, so a thin `superlore-contributor` skill _references_ this file ("before
authoring a component, read CODING_STANDARDS.md; every structural component needs both faces + a
test + a changeset"). The doc owns the rules; the skill is the agent projection of them — the
same one-superlore-two-projections idea the product is built on.
