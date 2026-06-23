---
"superlore": minor
---

`SuperloreDoc` now stamps a small, floating "Powered by superlore" badge in the doc's bottom-right corner (links to the superlore site) — subtle branding on every embedded/runtime-rendered doc. It's on by default and opt-out per doc with `badge={false}`. The badge is anchored to the doc surface (not the host viewport), so it never overlaps a host app's chrome. `BuiltWithSuperlore` gained a `label` prop (defaults to "Built with"; the embed badge uses "Powered by").
