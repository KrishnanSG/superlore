# Contributing to superlore

Thanks for your interest! superlore aims to be **the company knowledge base your agents run on**, and it's
built in the open. This guide covers how to get involved.

> **Heads up:** superlore is pre-1.0, so the public API can still shift between minor versions.
> Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [`docs/ROADMAP.md`](./docs/ROADMAP.md)
> before diving in.

## Ways to help

- **Discuss** — open or join an issue to shape direction before large changes.
- **Report bugs** — use the bug template; include a minimal repro.
- **Request features** — use the feature template; describe the problem, not just the solution.
- **Code** — pick up an issue (ideally one labelled `good first issue`) and open a PR.
- **Showcase** — once the gallery is live, submit a KB you built with superlore.

## Development setup

This is a pnpm + Turborepo monorepo (Node ≥ 20, pnpm ≥ 10).

```bash
pnpm install      # install workspace deps
pnpm build        # build the publishable packages (superlore + superlore-cli)
pnpm dev          # run superlore's own docs app (built with superlore)
```

> See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for what's shipped and what's next.

## Conventions

- **TypeScript strict, no `any`** — prefer `unknown` + narrowing; type-only imports.
- **Tokens, not literals** — colour/spacing from [`DESIGN.md`](./DESIGN.md), never raw hex.
  Light and dark are co-equal; default to system; never branch on theme in JS.
- **The dual-representation rule** — every component must render for humans _and_ serialize to
  structured knowledge for the MCP. A render-only component is not complete. This is the moat.
- **Reuse lives in `packages/superlore`** — don't copy-paste components into apps.
- **Accessibility** — keyboard paths, visible focus rings, semantic HTML.

## Commit & PR

- Use clear, conventional-style messages (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Keep PRs focused; describe the change and link the issue.
- Add or update a Storybook story / example for any new or changed component.
- Be kind and constructive — see [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Versioning & releases

superlore follows [semver](https://semver.org). The two publishable packages version
**independently**: `superlore` (core) and `superlore-cli`.

- **Pre-1.0 (`0.x`)** — bump the **minor** (`0.x.0`) for new features or new public exports
  (backward-compatible — e.g. adding the `superlore/ui · source · config · next` subpaths shipped
  as `0.2.0`); bump the **patch** (`0.x.y`) for fixes with no API change (e.g. a CLI banner tweak →
  `superlore-cli@0.1.1`). Breaking changes also bump the minor while in `0.x`.
- **Post-1.0** — **major** for breaking changes (removed/renamed exports, changed signatures,
  dropped peer ranges), **minor** for backward-compatible features, **patch** for fixes.
- **Never change a published package's public surface** — its exports, component props, the
  `superlore.json` schema, or the MCP tools — without a version bump.
- Keep each `package.json` `version` and the CLI's `VERSION` constant
  (`packages/cli/src/index.ts`) in sync.
- Conventional commits map to bumps: `feat:` → minor, `fix:` → patch, `feat!:` /
  `BREAKING CHANGE:` → major.
- **Publish** with `pnpm --filter <pkg> publish` (it applies the `src` → `dist` export swap; npm
  2FA required), then tag the release.
- **Write the notes to the standard** in [`docs/RELEASE_NOTES.md`](./docs/RELEASE_NOTES.md): an
  upgrade recommendation, breaking changes + migration notes, New/Improved/Fixed/Security, and a
  30–60s reel. Run the [`superlore-release`](./skills/superlore-release/SKILL.md) skill to produce the
  docs-changelog entry and the GitHub Release together — the docs changelog is the source of truth;
  the GitHub Release links back to it.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
