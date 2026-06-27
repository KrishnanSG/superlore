# superlore reels

Programmatic release reels with [Remotion](https://remotion.dev) — React → MP4, on-brand (renders
the real superlore palette + mark), deterministic, and re-renderable for every release. Used by the
[`superlore-release`](../skills/superlore-release/SKILL.md) flow; see the standard in
[`docs/RELEASE_NOTES.md`](../docs/RELEASE_NOTES.md).

**Standalone on purpose** — this is _not_ a pnpm-workspace member (it lives outside the `apps/*`,
`packages/*` globs) so Remotion's heavy native deps never bloat the docs deploy or CI. It has its own
`node_modules`.

## Render the 0.12 reel

```bash
cd reels
npm install            # one-time
npm run studio         # preview/iterate at localhost:3000
npm run render         # → apps/docs/public/releases/0.12.mp4
npm run poster         # → apps/docs/public/releases/0.12.png
```

The rendered `0.12.mp4` + poster are committed under `apps/docs/public/releases/` and referenced by
the changelog `Release` `media` and the GitHub release.

## Add a reel for the next release

Copy `src/Release012.tsx` → `src/Release0xx.tsx`, update the copy/features, register it as a new
`<Composition>` in `src/Root.tsx`, and point the `render`/`poster` scripts at the new output path.
Keep it ~24–40s, reads muted, brand violet `#6D5CF0`.
