---
name: superlore-release
description: Prepare best-in-class release notes for a superlore package, KB, or product — every time, the same way. Gathers what changed since the last release, classifies it (breaking / new / improved / fixed / security), writes developer-grade migration notes for breaking changes and usage notes for new features, decides whether the release is recommended to upgrade, scripts a 30–60s release reel, writes a dual-representation Release entry in the docs changelog, and cuts a GitHub Release that links back to that changelog. Use whenever someone says "cut a release", "prepare release notes", "what changed since the last version", "write the changelog entry", or "draft the GitHub release".
metadata:
  author: superlore
  version: "1.0.1"
---

# Preparing a superlore release

A release is a **product moment**, not a `git tag`. This skill turns "we shipped some stuff" into
release notes a developer can act on in 30 seconds: what changed, what breaks, how to migrate, how to
use the new things, and whether they should upgrade at all — plus a short reel and a clean GitHub
Release that points back to the docs changelog. Do it the **same way every time** so the changelog
reads like one voice.

This works for the **superlore project's own releases** and for **any superlore user** releasing their
package, KB, or product. The home of the notes is the KB's changelog (the dual-representation
`Release` component) — humans read it on the site, agents read the same entries over the MCP.

## The golden flow — do these in order

1. **Find the baseline.** Determine the last released version and gather everything since it:
   `git describe --tags --abbrev=0` for the last tag, then `git log <lastTag>..HEAD --oneline` (or read
   the merged PRs). Conventional-commit prefixes are your raw material: `feat:` → New, `fix:` → Fixed,
   `perf:`/`refactor:` user-visible → Improved, `feat!:` / `BREAKING CHANGE:` → **Breaking**, anything
   security-relevant → Security. Don't list chores, CI, or internal refactors that users can't observe.
2. **Decide the version bump** (semver — see the project's CONTRIBUTING). Breaking → major (or minor
   while `0.x`); new features → minor; fixes only → patch. Keep `package.json` `version` and any
   `VERSION` constant in sync.
3. **Classify every user-visible change** into the five buckets below, and write each entry from the
   **reader's** side ("you can now…", not "added a prop").
4. **Write the upgrade recommendation** (the single most useful line — see below).
5. **Write developer migration notes** for every breaking change (before/after, the exact change).
6. **Script + capture the release reel** (30–60s — see below).
7. **Write the `Release` entry** in the KB's changelog MDX (dual-representation — see below).
8. **Cut the GitHub Release** whose body summarizes the same notes and **links the docs changelog**.
9. **(Optional) Hand the reel + summary to the growth flow** for LinkedIn/X (see `docs/GROWTH.md`).

## The five buckets (what "best-in-class" means here)

- **⚠ Breaking** — anything that can break a consumer: removed/renamed exports, changed component
  props or `superlore.json` schema, changed MCP tools, dropped peer ranges, changed defaults. Each one
  needs a **migration note** (see below). If there are none, say so explicitly ("No breaking changes").
- **New** — new features/exports/components. Each gets a one-line **how-to-use** (a tiny snippet or a
  link to the doc page), not just a name.
- **Improved** — better behavior, perf, polish a user would notice.
- **Fixed** — bugs fixed; name the symptom the user saw, not the internal cause.
- **Security** — anything with a security impact; lead with severity and whether action is required.

## The upgrade recommendation (required, one line)

Every release states, plainly, whether to upgrade and for whom. Pick one:

- **Recommended for everyone** — safe, no breaking changes, worthwhile fixes/features.
- **Recommended, with migration** — worth it, but breaking changes need the steps below first.
- **Optional** — nice-to-have; upgrade when convenient.
- **Required / security** — upgrade now (security fix, or a correctness bug with data impact).

Phrase the _why_ in one clause: _"Recommended for everyone — adds the theme system, no breaking
changes."_ / _"Recommended, with migration — `Release` props changed; ~5 min, see below."_

## Developer migration notes (for every breaking change)

For each breaking change, give the developer exactly what to do — no archaeology:

```md
**`Release` now takes `sections` instead of `groups`.**

- Before: `<Release groups={[…]} />`
- After: `<Release sections={[…]} />` (same shape; rename the prop)
- Why: aligns the human view with the `sections` knowledge face.
- Codemod: `rg -l 'groups=' content | xargs sed -i '' 's/groups=/sections=/g'` (review the diff).
```

Keep it copy-pasteable. If a change is behavioral (not an API rename), describe the old vs new
behavior and the flag/config to restore the old one if any.

## The release reel (30–60s, every release)

A short reel makes the release shareable (changelog hero, GitHub Release, LinkedIn/X). Standard:

- **Length** 30s, 60s hard max. **Show the headline change**, not a feature tour — one "aha".
- **Format** MP4 (H.264, 1280×720 or 1080p) for social; an optimized GIF (<5 MB) for the README/inline.
- **No audio dependency** — it should read muted (captions/labels in-frame); LinkedIn/X autoplay muted.
- **Build it with [Remotion](https://remotion.dev)** (canonical): programmatic React → MP4, so the
  reel is **on-brand** (it renders the real superlore UI + design tokens), **deterministic**,
  version-controlled, and **re-renderable in CI** (`remotion render`). Keep the compositions in the
  repo at `reels/` (a standalone Remotion project, outside the pnpm workspace so its heavy deps don't
  bloat the docs deploy), parameterized by the release data so each version's reel is a prop change.
  - Quick alternative when a bespoke composition isn't worth it: Playwright video capture
    (`newContext({ recordVideo: { dir } })`) driving the dev server through the feature, or a trimmed
    screen recording of `superlore dev`.
- **Host** it in the repo (`/public` or a release asset) and reference it from the `Release` `media`
  (a `video`), the GitHub Release, and the social post — one asset, every surface.

> An agent in this environment usually **cannot render video itself** — script the reel (the shot
> list + the exact UI states) and either run the Playwright capture or hand the human the recipe and
> the trimmed-clip spec. Never claim a reel was produced if it wasn't.

## Write the `Release` entry (dual-representation)

The changelog is the `Releases` / `Release` component — one authored source, a human card + a typed
`release` knowledge node for the MCP. Add the newest entry at the top of the KB's
`content/docs/changelog.mdx` (superlore's own changelog lives there). Use the full surface:

```mdx
<Release
  version="superlore 0.12"
  date="2026-06-27"
  status="shipped"
  title="Themes, reimagined releases, runtime safety"
  summary="A named-theme system (7 themes), a rebuilt release/changelog component, and a render-time safety net."
  areas={["Themes", "Releases", "Runtime"]}
  recommendation="Recommended for everyone — no breaking changes"
  media={{ type: "video", src: "/releases/0.12.mp4", poster: "/releases/0.12.png" }}
  highlights={[
    {
      title: "7-theme system",
      body: "Pick a skin with one flag in superlore.json — zero .mdx edits.",
    },
  ]}
  sections={[
    {
      label: "New",
      changes: [
        {
          text: "Theme system: default · mint · geist · ledger · obsidian · prism · paste.",
          refs: [{ rel: "doc", target: "/docs/themes", label: "Themes" }],
        },
      ],
    },
    { label: "Improved", changes: [{ text: "Sidebar collapse persists; ⌘\\ toggles it." }] },
    {
      label: "Fixed",
      changes: [
        { text: "A bad {token} in prose degrades gracefully instead of blanking the page." },
      ],
    },
    { label: "Breaking", changes: [] },
  ]}
/>
```

If `recommendation` (or any prop you need) isn't yet on the component, **don't invent silent props** —
put the recommendation line in `summary` and flag that the prop should be added (a versioned change to
the package). Keep the human card and the knowledge face in lockstep.

## Publish + the GitHub Release (automated on merge)

superlore publishes via **Changesets + npm Trusted Publishing (OIDC)** — the `release` workflow runs on
merge to `main` with **no npm token** (OIDC provenance), gated by the e2e scaffold-and-build check.
`superlore` and `superlore-cli` version **independently**; `superlore-docs` and `superlore-preview` are
ignored by changesets. So the flow is:

1. **Add a changeset** — don't hand-edit `package.json` versions. `pnpm changeset` → pick the
   package(s), the bump (patch/minor/major), and a one-line summary. (Still sync the CLI `VERSION`
   constant by hand — changesets won't touch a TS constant.)
2. Open your PR. On merge, the `release` workflow publishes to npm and creates the git tag(s)
   `<pkg>@<version>`. (If you hand-bump versions instead of adding a changeset — the current repo
   flow — `changeset publish` still publishes any package whose `package.json` version isn't yet on
   npm, and tags it.)
3. **Cut the GitHub Release by hand with curated notes.** The workflow sets
   `createGithubReleases: false` on the Changesets action **on purpose**: under hand-bumping there is
   no matching `## <version>` section in `CHANGELOG.md`, so the action would dump the whole stale
   file into the release body. So you write the release body yourself and create it:

   ```bash
   gh release create '<pkg>@<version>' --title '<pkg>@<version>' --notes-file notes.md
   # editing an existing one: gh release edit '<pkg>@<version>' --notes-file notes.md
   ```

   The body must contain, in order: the **upgrade recommendation**, **Breaking + migration** (or
   "No breaking changes"), **New / Improved / Fixed / Security**, the **reel** (if any), and a final
   line: **"Full notes: https://superlore.vercel.app/docs/changelog"**.

The docs changelog (`content/docs/changelog.mdx`) is the source of truth; the GitHub Release mirrors
the same entry and links home. _Manual publish fallback if the workflow is unavailable:_
`pnpm --filter <pkg> publish` (applies the src→dist export swap), then the `gh release create` above.

## Remember

- **Reader-first wording.** "You can now…", "This fixes…", "Upgrade if…". Never raw commit subjects.
- **Always state the upgrade recommendation and whether anything breaks** — even when nothing does.
- **One source, many surfaces.** Docs changelog is canonical; GitHub Release + social link to it.
- **Don't claim the reel exists if it wasn't captured.** Script it; produce it or hand off the recipe.
- Bump versions per CONTRIBUTING; keep `package.json` and any `VERSION` constant in sync.
