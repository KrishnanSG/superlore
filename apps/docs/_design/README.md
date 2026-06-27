# mint theme — design preview

A high-fidelity, self-contained preview of a Mintlify-grade (and better) look for superlore docs.

- **`mint-preview.html`** — open it (or the published artifact) to click through. Live theme toggle
  (light/dark, co-equal) and a Docs ⇄ Changelog switch. It is a **design target**, not wired into the
  app yet — nothing published, nothing deployed.

## What it demonstrates

The two surfaces the migration most regressed, rebuilt to target:

1. **Chrome + content page** — sticky top navbar (logo · Docs/Changelog tabs · ⌘K search · links ·
   violet CTA · theme toggle), grouped sidebar (uppercase labels + per-item icons + active accent),
   airy type scale (confident H1, comfortable leading, ~744px column), breadcrumb, right TOC. Plus the
   component language from the spec: icon-forward Cards with hover lift, left-bar tinted Callouts,
   numbered Steps with a connector, framed media, tokyo-night code with filename + copy.
2. **Changelog redesign** — jump strip, tag filter, and each release as a **sticky version/date/tag
   rail + rich body** (gradient headline, highlight cards, typed Added/Improved/Fixed changes).

## The superlore edge (the "better" half)

Not a Mintlify clone — it keeps superlore's identity: the **Canvas renders as a real typed
node-and-edge graph** (not a screenshot), an **agent-native affordance** ("Copy for agent"), and the
brand violet `#6D5CF0`. Familiar on the surface, superlore underneath.

## How it becomes real (`theme: "mint"` in `superlore.json`)

Per the spec, this is library-level work in the `superlore` package (opt-in, zero `.mdx` edits):
a `mint` token set, a configurable top navbar / banner / footer, the component skins above, and the
`Release` API accepting **rich MDX children** alongside `changes[]` (the one API change that unlocks
the changelog while keeping the queryable MCP knowledge face). Default theme stays untouched.
