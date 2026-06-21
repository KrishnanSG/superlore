# Contributing to superlore

Thanks for your interest! superlore aims to be **the company knowledge base your agents run on**, and it's
built in the open. This guide covers how to get involved.

> **Heads up:** superlore is at an early stage — the architecture and brand are locked, and the
> core is being extracted from two production sites. Expect things to move. Read
> [`docs/HANDOFF.md`](./docs/HANDOFF.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
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
pnpm build        # build packages (once tooling lands)
pnpm dev          # run superlore's own docs app (built with superlore)
```

> Tooling is still being stood up (Phase 1 in [`docs/ROADMAP.md`](./docs/ROADMAP.md)). If a
> command above doesn't exist yet, that's expected — check the roadmap for current status.

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

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](./LICENSE).
