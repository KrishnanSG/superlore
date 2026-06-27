# Release notes standard

How superlore writes release notes — for every release of `superlore`, `superlore-cli`, and the
editor extension. The goal: a developer understands **what changed, what breaks, how to migrate, how
to use the new things, and whether to upgrade** in under 30 seconds. The mechanics live in the
[`superlore-release`](../skills/superlore-release/SKILL.md) skill — run it to produce a release; this
file is the standard it follows.

## Every release has

1. **An upgrade recommendation** (one line) — _Recommended for everyone_ · _Recommended, with
   migration_ · _Optional_ · _Required / security_ — with a one-clause _why_.
2. **Breaking changes + migration notes** — before/after, the exact change, a codemod if possible.
   If there are none, say so: **"No breaking changes."**
3. **New / Improved / Fixed / Security**, written from the reader's side ("you can now…", "this
   fixes…"), never raw commit subjects. New features link to their doc page.
4. **A 30–60s release reel** — shows the one headline change; reads muted; MP4 for social + an
   optimized GIF (<5 MB) for inline; hosted in the repo and reused on every surface.

## One source, three surfaces

- **Docs changelog (canonical)** — `apps/docs/content/docs/changelog.mdx`, authored with the
  dual-representation `Release` component. Humans read the card; agents read the typed `release` node
  over the MCP. Newest entry on top.
- **GitHub Release** — mirrors the same notes (recommendation → breaking+migration → new/improved/
  fixed/security → reel) and ends with **"Full notes: https://superlore.vercel.app/docs/changelog"**.
- **Social (optional)** — the reel + the headline, via the launch/growth flow ([`GROWTH.md`](./GROWTH.md)).

## Versioning

Follows [`CONTRIBUTING.md#versioning--releases`](../CONTRIBUTING.md#versioning--releases): breaking →
major (minor while `0.x`), features → minor, fixes → patch. Keep each `package.json` `version` and the
CLI `VERSION` constant in sync. The two publishable packages version **independently**.

## Don't

- Don't ship a release without stating the upgrade recommendation and whether anything breaks.
- Don't paste commit logs as notes.
- Don't claim a reel exists if it wasn't captured — script it and capture it (or hand off the recipe).
- Don't let the docs changelog and the GitHub Release drift — the docs page is the source of truth.
