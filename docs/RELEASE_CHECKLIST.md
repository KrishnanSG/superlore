# Release hygiene checklist

The gate every superlore release passes before it's "good for production." Nothing ships unless its
row is green. Pair this with the notes standard in [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) and the
[`superlore-release`](../skills/superlore-release/SKILL.md) skill.

## The surfaces (and how they ship)

| Surface       | Package / location                        | Ships via                                           | "Updated" means                                      |
| ------------- | ----------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| **Core**      | `superlore` (`packages/superlore`)        | `pnpm --filter superlore publish` → npm             | published to npm **`latest`**                        |
| **Renderer**  | `superlore/runtime` (subpath of core)     | with core                                           | core is published (same artifact)                    |
| **CLI**       | `superlore-cli` (`packages/cli`)          | `pnpm --filter superlore-cli publish` → npm         | npm `latest` == repo `version` == `VERSION` constant |
| **Viewer**    | `/viewer` route in `apps/docs`            | Vercel deploy of the docs app                       | deployed app consumes the **published** core         |
| **Docs site** | `apps/docs`                               | Vercel deploy                                       | builds against published core; 54+ routes prerender  |
| **Extension** | `superlore-preview` (`extensions/vscode`) | `extension-publish.yml` → GitHub Release `.vsix`    | bundles current published core/runtime               |
| **Plugin**    | `.claude-plugin` + `skills/`              | marketplace served from the repo **default branch** | merged to `main`; `plugin.json` version bumped       |

> The renderer is not a separate package — it's `superlore/runtime`, a subpath of core. The Viewer and
> the extension are **consumers** of the published core, so they're only as current as what's on npm
> `latest`. Publishing core is therefore the keystone: do it first, then redeploy/rebuild consumers.

## Per-release gate (tick every box)

**Versioning**

- [ ] Version bumped per semver (CONTRIBUTING) for each package that changed.
- [ ] `package.json` `version` **and** the CLI `VERSION` constant (`packages/cli/src/index.ts`) in sync.
- [ ] `.claude-plugin/plugin.json` `version` bumped if anything under `skills/` or `.claude-plugin/` changed.

**CI is green** (the `ci` workflow runs `pnpm turbo run typecheck lint test build` on every PR)

- [ ] `typecheck` clean across the workspace (no `any`, strict).
- [ ] `lint` clean.
- [ ] `test` green (package unit tests + CLI vitest + `superlore/mdx-lint`).
- [ ] `build` green (every package + `apps/docs` `next build`, all routes prerender).
- [ ] `e2e` workflow green (Playwright key-page render, light + dark).

**Publish-safety (catches the src→dist export trap)**

- [ ] `pnpm --filter <pkg> pack` and install the tarball in a scratch project; **import every export**
      and render a canvas/checklist/callout; confirm `"use client"` directives survive and
      `superlore/runtime.css` + theme CSS are present. (Use `pnpm`, never `npm` — only pnpm applies the
      `publishConfig.exports` src→dist swap.)
- [ ] No public-surface change (exports, component props, `superlore.json` schema, MCP tools) without a
      version bump.

**Notes + reel** (see RELEASE_NOTES.md)

- [ ] Upgrade recommendation written; breaking changes have migration notes (or "No breaking changes").
- [ ] New/Improved/Fixed/Security written reader-first; new features link their doc page.
- [ ] 30–60s reel built (Remotion → MP4 — on-brand, deterministic, CI-renderable) — or its absence justified.
- [ ] `Release` entry added to `apps/docs/content/docs/changelog.mdx` (newest on top).

**Ship + verify** — publishing is automated: **Changesets + npm Trusted Publishing (OIDC)** on merge to
`main` (no npm token), gated by `e2e`. `superlore` + `superlore-cli` publish; docs/extension are ignored.

- [ ] **Add a changeset** (`pnpm changeset`) for each changed package — versions are computed, not
      hand-edited. (Sync the CLI `VERSION` constant by hand.) Merge opens a "Version Packages" PR;
      merging **that** publishes to npm + tags + cuts the GitHub Release.
- [ ] Revert any branch-only dev wiring before the prod merge (see below), then deploy `apps/docs`.
- [ ] GitHub Release body mirrors the notes and ends with the docs-changelog link.
- [ ] Rebuild/republish the extension if it depends on a changed core API.
- [ ] Merge to `main` so the plugin marketplace serves the new `plugin.json`.
- [ ] `post-publish` smoke test green; spot-check prod: `/docs`, `/docs/changelog`, `/llms.txt`, `/api/mcp`, the Viewer.

## Branch-only dev wiring — MUST revert before a production merge

`apps/docs` currently consumes the **local workspace** core for fast iteration. Production must consume
the **published** package. Before merging `docs/mint-theme` → `main`:

- [ ] `apps/docs/package.json`: `"superlore": "workspace:*"` → `"^0.12.x"` (the published version).
- [ ] `apps/docs/next.config.mjs`: drop `transpilePackages: ["superlore"]`.
- [ ] `apps/docs/app/global.css`: the `@source "../app"`/`"../content"` globs stay; the package ships its
      own compiled CSS — confirm no `@source` points into `node_modules/superlore/src`.

## Recommended CI hardening (not yet in `ci.yml`)

The current `ci` job runs typecheck/lint/test/build — good. Add a **`pack-verify`** job so the tarball
trap can never reach npm again:

```yaml
pack-verify:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v5
    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v6
      with: { node-version: 22, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter superlore build
    - run: pnpm --filter superlore pack --pack-destination /tmp
    # install the tarball into a scratch app and assert every subpath export resolves,
    # "use client" survives, and runtime.css + theme CSS are present.
    - run: node scripts/verify-tarball.mjs /tmp/superlore-*.tgz
```

Also worth gating: a **`publish` dry-run on tags** (so `release.yml` can't publish a broken artifact),
and a **link-check** of the docs build output.

## Current state (snapshot — verify before acting)

- Core `superlore`: repo `0.12.0-beta.7`; npm `latest` **0.11.1**, `beta` `0.12.0-beta.7`. → production
  users are still on 0.11.1; **0.12 must be promoted to `latest`** to be "live."
- CLI `superlore-cli`: repo `0.7.3`; npm `latest` **0.7.2**. → **0.7.3 not published yet.**
- Plugin: repo `1.3.0`; live only **after merge to `main`** (marketplace serves the default branch).
- Extension `superlore-preview`: `0.4.10`.
- Docs/Viewer: on the branch they consume the **workspace** core (dev wiring above) — revert before prod.
