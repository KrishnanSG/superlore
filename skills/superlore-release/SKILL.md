---
name: superlore-release
description: Prepare best-in-class release notes for a superlore package, KB, or product — every time, the same way. Gathers what changed since the last release, classifies it (breaking / new / improved / fixed / security), writes developer-grade migration notes for breaking changes and usage notes for new features, decides whether the release is recommended to upgrade, scripts a 30–60s release reel, writes a dual-representation Release entry in the docs changelog, and cuts a GitHub Release that links back to that changelog. Use whenever someone says "cut a release", "prepare release notes", "what changed since the last version", "write the changelog entry", or "draft the GitHub release".
metadata:
  author: superlore
  version: "1.0.0"
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
- **Capture** the real UI: record the new feature in the running app. Repeatable options:
  - Playwright video capture (`context = browser.newContext({ recordVideo: { dir } })`) driving the
    dev server through the feature — deterministic, re-runnable each release.
  - Or a screen recording of `superlore dev` (macOS `screencapture`/QuickTime, or any recorder),
    trimmed to the moment.
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

## Cut the GitHub Release (links back to the docs changelog)

Tag and release with the **same notes**, and always point to the canonical changelog so the two never
drift:

```bash
git tag superlore-v0.12.0 && git push --tags
gh release create superlore-v0.12.0 \
  --title "superlore 0.12 — themes, reimagined releases, runtime safety" \
  --notes-file RELEASE_NOTES_0.12.md   # the buckets + upgrade rec + migration notes
```

The GitHub Release body must contain, in this order: the **upgrade recommendation**, **Breaking +
migration** (or "No breaking changes"), **New / Improved / Fixed / Security**, the **reel** (or a link
to it), and a final line: **"Full notes: https://superlore.vercel.app/docs/changelog"**. Keep it
in sync with the `Release` entry — the docs changelog is the source of truth; the GitHub Release is a
mirror that links home.

## Remember

- **Reader-first wording.** "You can now…", "This fixes…", "Upgrade if…". Never raw commit subjects.
- **Always state the upgrade recommendation and whether anything breaks** — even when nothing does.
- **One source, many surfaces.** Docs changelog is canonical; GitHub Release + social link to it.
- **Don't claim the reel exists if it wasn't captured.** Script it; produce it or hand off the recipe.
- Bump versions per CONTRIBUTING; keep `package.json` and any `VERSION` constant in sync.
