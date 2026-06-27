# superlore — sidebar collapse + theme-system plan

Research-backed plan (top-10 docs teardowns + docs-library theming + fumadocs source). Feeds the next beta.

## Part A — Sidebar collapse → "mini" rail

### The verified finding (read from fumadocs source, not docs)

fumadocs-ui 16.8.2 (what superlore runs) has **no mini icon-rail mode**. `collapsible: true` does one
thing: it slides the whole `#nd-sidebar` fully off-screen and sets the grid column to `0px`, then a
4px left-edge hot-zone floats the **entire** sidebar back as a hover overlay. There is no icon-only
state, and no prop to enable one — a mini rail **cannot** come from config.

This matches the whole genre: **Stripe, Vercel, GitHub, Docusaurus, Mintlify, Nextra, Linear, Notion,
Slack all _hide_ (or group-collapse) the docs sidebar — none ship an icon rail.** The reason is
structural: a docs sidebar is a deep, nested, variable tree, and a tree node has no stable iconic
identity. An icon rail needs _few, fixed, iconic destinations_ — that's an **app-shell** pattern (VS
Code's Activity Bar, Vercel's dashboard), not a docs pattern.

### Recommendation — split it in two

1. **Docs tree → keep hide+peek, but polish it** (this is the modern best-in-class docs behavior):
   - **Persist** collapsed state to `localStorage` (today it's lost on reload).
   - **`⌘\` shortcut** to toggle (Notion/Linear convention) + **click-to-pin** the peek so it isn't twitchy.
   - **Snappier** slide/hot-zone timing in our scoped CSS. All additive over fumadocs — no fork.
2. **A true icon rail belongs only on the flat top-level switcher / Viewer app-shell** (each item = one
   destination with a real icon — VS Code's two-part model). Bespoke ~64px always-mounted column beside
   `--fd-sidebar-col`. Deferred — it's an app-shell milestone, not a docs-tree fix.

> Net: ship the docs-tree polish now; the user's "mini rail" instinct is right — but for the **tab/Viewer**
> surface, not the nested docs tree. (Open question for you below.)

## Part B — Theme system

### Axes a theme locks (accent + font stay orthogonal overrides)

Type pairing · accent loudness · surface/background · depth (flat floor, restrained shadow optional) ·
radius · density/reading-width · nav chrome · decoration. **Color is never a theme axis** — every
named-preset vendor (Mintlify, GitBook, ReadMe) keeps brand color a separate knob so a preset works in
any brand.

### Five new themes (beyond `default` + `mint`) — distinct on type + surface + chrome, not recolors

| Theme        | Identity                                      | Inspired by      | Type                        | Base                       | Signature                                      |
| ------------ | --------------------------------------------- | ---------------- | --------------------------- | -------------------------- | ---------------------------------------------- |
| **ledger**   | Editorial Ivory — authority through restraint | Anthropic/Claude | Serif body + geometric sans | warm cream / warm-charcoal | serif prose, rationed accent, flat title hero  |
| **prism**    | Polished Light, three-column reference        | Stripe           | airy light sans + mono      | white + cool gray          | pinned code/structured-rep rail beside prose   |
| **geist**    | Swiss border-first, color as punctuation      | Vercel/Geist     | Sans + Mono duality         | near-monochrome            | 1px hairlines, no shadows, mono labels         |
| **obsidian** | Dark-first dense console                      | Linear           | Inter + Inter Display       | near-black `#08090a`       | leans into Releases/Timeline, dense flat list  |
| **paste**    | Accessible system, one super-family           | Twilio/Paste     | one variable super-family   | semantic tokens            | guaranteed contrast, ≤3 weights, sentence case |

### Picker (mirror the named-preset model superlore is already wired for)

```jsonc
{
  "theme": "geist", // the look bundle
  "accent": "#6D5CF0", // orthogonal — works on any theme (already drives the palette)
  "font": { "sans": "Inter", "mono": "JetBrains Mono" }, // optional override (today declared, NOT consumed — wire it)
  "appearance": { "default": "system" }, // optional behavioral axis
}
```

### Two prerequisite fixes the research surfaced

- **The theme stamp is hardcoded.** `apps/docs/app/layout.tsx` does `theme === "mint" ? "mint" : undefined`
  — a new theme name silently renders nothing. Generalize to pass any validated theme through.
- **`font` config is dead.** `SuperloreFont` is declared but the layout hardwires Inter/JetBrains. Wire
  `siteConfig.font` → `--font-sans`/`--font-mono`, with each theme shipping a default pairing.

### Build model (keep current, it's right)

Each theme = CSS scoped to `[data-sl-theme="<name>"]` in `superlore/css`, base tokens in `:root`/`.dark`,
inert when unselected. Split `superlore.css` per-theme as the count grows. Each theme defines light **and**
dark (mirrored tokens, no JS branch). Radius/density via tokens. **Dual-rep untouched** — themes are
presentation-only; the MCP face is identical across themes. Self-hosted fonts vendored as woff2 (CSP-safe).

## Part C — Phasing

- **Next beta:** generalize the theme stamp + wire `font`; ship **`geist`** first (lowest risk — border-first
  _is_ the house style); sidebar polish (persist + `⌘\` + pin + snappier); document mint + the theme system;
  story/example per theme; verify light+dark.
- **+1:** `ledger` + `paste` (introduce the font-vendoring pipeline); split `superlore.css` per theme.
- **+2:** `prism` (code-rail layout) + `obsidian` (Releases-led); the bespoke icon rail for the Viewer shell.

### Risks

fumadocs DOM coupling (centralize chrome selectors, snapshot-test on upgrades) · CSS growth (split per theme) ·
font weight/CSP (prefer system/variable where identity survives) · semver (widening `theme` union + consuming
`font` is a public-surface change → version bump) · dual-rep leakage (guard: no theme PR touches the content model).
