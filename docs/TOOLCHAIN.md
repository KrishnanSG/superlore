# superlore — engineering toolchain

_The opinionated tooling for the monorepo. `CODING_STANDARDS.md` is the conventions; this is the
machinery that runs them. Grounded in a proven monorepo setup (`turbo.json`, `eslint.base.mjs`,
`tsconfig.base.json`), plus the four things a *published OSS library* additionally needs:
a package build, tests, semver/release, and CI._

## Recommended toolchain

| Concern                | Tool                                                               | Why                                                                                                   |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Monorepo orchestration | **Turborepo ^2.5**                                                 | Task graph + caching for build/lint/typecheck/test.                                                   |
| Package manager        | **pnpm 10.13.1**                                                   | Pinned via `packageManager`; Node ≥20 (machine: Node 25).                                             |
| Language               | **TypeScript ~6.0**                                                | Matches the Fumadocs stack; strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`.             |
| Library build          | **tsup ^8** (esbuild) + `esbuild-plugin-preserve-directives`       | Fast ESM build that **preserves `"use client"`** per-file — required for RSC libs.                    |
| CSS distribution       | **Tailwind v4** preset shipped as `superlore/css` with `@source`   | Library CSS self-declares its class sources → zero-config consumer scanning.                          |
| Unit/component tests   | **Vitest ^3** + `@testing-library/react` + `jsdom`                 | RSC-friendly, ESM-native; one runner for components + MCP.                                            |
| MCP test harness       | **`@modelcontextprotocol/sdk` `InMemoryTransport`**                | Client↔server linked pair, no process spawn.                                                          |
| Lint                   | **ESLint 9 flat** + typescript-eslint + react/react-hooks/jsx-a11y | Shared `eslint.base.mjs`; **two** configs (library vs app).                                           |
| Format                 | **Prettier ^3** + `prettier-plugin-tailwindcss`                    | Class sorting on v4 via `tailwindStylesheet` pointing at the theme CSS.                               |
| Pre-commit             | **husky ^9** + **lint-staged ^17**                                 | eslint --fix + prettier on staged files.                                                              |
| Commit lint            | **commitlint ^19** + config-conventional                           | Conventional Commits; relaxed footer rules for the `Co-Authored-By` trailer.                          |
| Versioning/release     | **Changesets ^2**                                                  | One published package (`superlore`); `apps/*` + `templates/*` are private, auto-skipped.              |
| Publish auth           | **npm Trusted Publishing (OIDC)**                                  | GA since Jul 2025; no `NPM_TOKEN`, auto-provenance. Bare `superlore` avoids the scoped-OIDC E404 bug. |
| CI                     | **GitHub Actions**                                                 | install → typecheck → lint → test → build.                                                            |
| Stories                | **Storybook**                                                      | Deferred — `apps/docs` is the Phase-1 proving ground (per decision). Backfill later.                  |

## How the package ships

- **ESM-only.** The audience is Next 16 / React 19; dual-shipping CJS adds risk for no gain.
  State it in the README.
- **`exports` map:** `.` (components), `./css` (theme preset, raw CSS asset), `./mcp`, `./auth`.
  No deep imports into `dist`.
- **`"use client"` per file.** Keep `src/index.ts` a directive-free re-export barrel; put the
  directive at the top of each interactive component. tsup `splitting: true` + the
  preserve-directives plugin emit it per chunk. A build smoke test greps `dist` to confirm.
- **Tailwind scanning:** `superlore/css` carries `@source` relative to the shipped CSS so consumers
  get class scanning for free. Documented fallback for edge cases:
  `@source "../node_modules/superlore/dist";` in the consumer's global.css.
- **Peer deps:** react, react-dom, next (optional), tailwindcss (optional).

## Test strategy

- jsdom for render-face/component tests; `// @vitest-environment node` per-file for MCP/server.
- **Structural components: the three-part test** — render face (Testing Library), knowledge face
  (serializer output equals expected `KnowledgeNode`, contains no markup), MCP parity (same data
  via `get_component_data` over `InMemoryTransport`). The parity test is what guarantees the two
  faces never drift.
- Coverage floor: 70% lines on `packages/superlore/src`.

## CI

- `ci.yml` (push/PR): pnpm install (frozen) → `turbo run typecheck lint test build`.
- `release.yml` (main): build `superlore` → `changesets/action` with OIDC publish
  (`permissions: id-token: write`, no token). Configure the trusted publisher on npmjs for
  `superlore` ← this repo + `release.yml`; npm CLI ≥ 11.5.1.

## Gotchas (carry these forward)

1. **tsup + `"use client"`** — needs the preserve-directives plugin + `splitting: true`; a barrel
   with a hoisted directive mislabels server components. Verify emitted `dist/*.js` headers.
2. **Tailwind v4 + node_modules** — v4 skips `node_modules`; the library-side `@source` is the
   fix but has edge cases — document the consumer fallback.
3. **OIDC scoped E404** — bites _scoped_ names; bare `superlore` is fine, but keep npm CLI ≥ 11.5.1.
4. **prettier-plugin-tailwindcss v4** — needs `tailwindStylesheet` in the Prettier config or
   class sorting silently no-ops.
5. **Two ESLint configs** — never apply Next rules to the library (false RSC/route errors) or
   library rules to the app.
6. **MCP↔serializer drift** — highest-value failure mode; the parity test is mandatory, not
   optional.
