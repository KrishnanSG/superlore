---
name: superlore
description: >
  The company knowledge base your agents run on. Your agents author rich, structured docs —
  canvases, boards, timelines — that compound into one corpus every agent reads over MCP. Calm,
  editorial, with light and dark as co-equal first-class themes. Brand accent is "superlore Violet"
  (#6D5CF0). Tokens below show the DARK values; the co-equal light values are in ## Colors.
colors:
  bg: "#0B0C0E"
  bgElev: "#0F1013"
  surface: "#131519"
  surface2: "#181B21"
  borderSubtle: "#1B1E24"
  border: "#262A31"
  borderStrong: "#383F49"
  text: "#E7E9ED"
  text2: "#AEB4BE"
  text3: "#6E747E"
  accent: "#6D5CF0"
  accentHover: "#8877F5"
  accentInk: "#FFFFFF"
  accentText: "#9A8CFF"
  accentWeak: "#181333"
  accentBorder: "#342A6B"
  agentFrom: "#6D5CF0"
  agentTo: "#8B5CF0"
  success: "#46C46A"
  warning: "#F2C94C"
  danger: "#F2495C"
typography:
  display:
    {
      fontFamily: "Inter",
      fontSize: "32px",
      fontWeight: 680,
      lineHeight: "37px",
      letterSpacing: "-0.025em",
    }
  h1:
    {
      fontFamily: "Inter",
      fontSize: "26px",
      fontWeight: 660,
      lineHeight: "32px",
      letterSpacing: "-0.022em",
    }
  h2:
    {
      fontFamily: "Inter",
      fontSize: "21px",
      fontWeight: 640,
      lineHeight: "28px",
      letterSpacing: "-0.018em",
    }
  h3:
    {
      fontFamily: "Inter",
      fontSize: "17px",
      fontWeight: 620,
      lineHeight: "24px",
      letterSpacing: "-0.012em",
    }
  prose:
    {
      fontFamily: "Inter",
      fontSize: "16px",
      fontWeight: 420,
      lineHeight: "26px",
      letterSpacing: "-0.006em",
    }
  bodyUi:
    {
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: 450,
      lineHeight: "20px",
      letterSpacing: "-0.008em",
    }
  small: { fontFamily: "Inter", fontSize: "13px", fontWeight: 450, lineHeight: "18px" }
  label:
    {
      fontFamily: "JetBrains Mono",
      fontSize: "11px",
      fontWeight: 600,
      lineHeight: "16px",
      letterSpacing: "0.14em",
    }
  mono:
    {
      fontFamily: "JetBrains Mono",
      fontSize: "13.5px",
      fontWeight: 400,
      lineHeight: "21px",
      fontFeature: "tnum",
    }
spacing:
  "0": "0px"
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
rounded:
  sm: "6px"
  md: "9px"
  lg: "14px"
  pill: "9999px"
components:
  buttonPrimary:
    {
      backgroundColor: "{colors.accent}",
      textColor: "{colors.accentInk}",
      rounded: "{rounded.md}",
      typography: "{typography.bodyUi}",
      height: "34px",
      padding: "0 15px",
    }
  buttonSecondary:
    {
      backgroundColor: "transparent",
      textColor: "{colors.text2}",
      border: "{colors.border}",
      rounded: "{rounded.md}",
      height: "34px",
      padding: "0 14px",
    }
  card:
    {
      backgroundColor: "{colors.surface}",
      border: "{colors.border}",
      rounded: "{rounded.lg}",
      padding: "18px",
    }
  callout:
    {
      backgroundColor: "{colors.surface}",
      borderLeft: "{colors.accent}",
      rounded: "{rounded.md}",
      padding: "14px 16px",
    }
  navItem:
    {
      backgroundColor: "transparent",
      textColor: "{colors.text2}",
      rounded: "7px",
      height: "30px",
      padding: "0 10px",
    }
  codeBlock:
    {
      backgroundColor: "{colors.bgElev}",
      border: "{colors.borderSubtle}",
      rounded: "{rounded.md}",
      typography: "{typography.mono}",
      padding: "14px 16px",
    }
  chip:
    {
      rounded: "{rounded.pill}",
      typography: "{typography.label}",
      height: "21px",
      padding: "0 9px",
    }
  agentBadge:
    {
      backgroundColor: "{colors.accentWeak}",
      textColor: "{colors.accentText}",
      border: "{colors.accentBorder}",
      rounded: "{rounded.pill}",
      typography: "{typography.label}",
      height: "20px",
      padding: "0 8px",
    }
---

# superlore — DESIGN.md

> The single source of truth for superlore's visual language. Tokens above show the DARK values;
> light is a co-equal peer (overrides in ## Colors). Mark + colour are in `brand/`.

## Overview

superlore is **the company knowledge base your agents run on** — an agent-native KB where agents
author rich, structured docs that compound into one corpus, read by **humans** as a clean,
interactive, visual KB and by **agents** over a first-class **MCP**. It is a _reading and
reference_ surface (not a dense tracker), so the visual system
favours **calm legibility and editorial structure** over density — while staying in the same
flat, theme-equal family as its sibling products.

**Personality:** clean, editorial, quietly intelligent. A knowledge base should feel
**authoritative and effortless to read** — generous measure, confident headings, structural
components that make complex knowledge legible at a glance. Every component is built to be
_understood by a human and parsed by an agent_ (see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)).

- **Audience:** teams maintaining real, large knowledge bases & product docs — and the agents
  that consume them.
- **Feeling:** "this is the cleanest, most readable KB I've seen, and my agent understands it."
- **Light and dark are co-equal.** Neither is "home"; both are fully first-class and derive from
  the same tokens. Default to the reader's system preference — never branch on theme in JS.
- **Violet is the brand, on purpose.** superlore deliberately owns violet and uses **one** accent,
  with restraint.

## Colors

A single accent — **superlore Violet** `#6D5CF0` — for links, primary actions, focus, selection,
active nav, and agent affordances. Everything else is a cool near-black/near-white neutral
scale. Hierarchy comes from layered surfaces + 1px borders, not colour.

### Neutrals & accent (dark and light — co-equal)

| Token          | Dark      | Light     | Role                                 |
| -------------- | --------- | --------- | ------------------------------------ |
| `bg`           | `#0B0C0E` | `#FCFCFD` | page canvas (never pure black/white) |
| `bgElev`       | `#0F1013` | `#F7F8FA` | sidebar / chrome / code blocks       |
| `surface`      | `#131519` | `#FFFFFF` | cards, callouts, popovers            |
| `surface2`     | `#181B21` | `#F3F4F7` | hover / pressed                      |
| `borderSubtle` | `#1B1E24` | `#EEEFF3` | separators                           |
| `border`       | `#262A31` | `#E3E5EA` | default border                       |
| `borderStrong` | `#383F49` | `#CCD0D8` | hover border / focus base            |
| `text`         | `#E7E9ED` | `#14161A` | primary text                         |
| `text2`        | `#AEB4BE` | `#565E68` | secondary text                       |
| `text3`        | `#6E747E` | `#8A909A` | muted / placeholder / icons          |
| `accent`       | `#6D5CF0` | `#5A47E0` | primary action, active, focus        |
| `accentHover`  | `#8877F5` | `#4B3DC4` | hover                                |
| `accentInk`    | `#FFFFFF` | `#FFFFFF` | text/icon **on** a solid accent fill |
| `accentText`   | `#9A8CFF` | `#5A47E0` | links / accent text on canvas        |
| `accentWeak`   | `#181333` | `#EEEBFE` | selected nav / subtle accent bg      |
| `accentBorder` | `#342A6B` | `#D6CFFA` | accent outlines                      |

> The dark accent carries **white** ink on solid fills; the light accent is deepened so white
> still passes contrast. Use `accentText` for links/accent text on the canvas (not raw `accent`).

### Agent gradient — restrained

`agentFrom → agentTo`: `#6D5CF0 → #8B5CF0`. A tight violet→violet shift for **agent / MCP
affordances only** — the "available to agents" badge, the MCP-connection panel, the
copy-for-agent control. Never a whole-page gradient.

### Semantic

| Role    | Dark      | Light     |
| ------- | --------- | --------- |
| success | `#46C46A` | `#1F9D5E` |
| warning | `#F2C94C` | `#C9921A` |
| danger  | `#F2495C` | `#DC3A4D` |

Callout variants (info / tip / warning / danger) tint `surface` with the relevant colour at
12–16% and take a 2px coloured left border.

## Typography

- **Inter** for UI and prose; **JetBrains Mono** for code, inline data, labels, and the
  monospace lockup. (Fumadocs' defaults map cleanly onto these.)
- Enable Inter `cv05, cv11, ss01`; **tabular figures** (`tnum`) for numbers/dates.
- Scale (see YAML): `display` 32 · `h1` 26 · `h2` 21 · `h3` 17 · **`prose` 16/26** (comfortable
  reading) · `bodyUi` 14 (chrome) · `small` 13 · `label` 11 mono uppercase `+0.14em` · `mono` 13.5.
- Headings track tight (−0.018 to −0.025em); prose is relaxed (−0.006em, 1.6 line-height).
  Reading is the priority — never compress prose like UI text.

## Layout & Spacing

- **4px base grid.** Use the `spacing` scale; avoid arbitrary values.
- **KB shell:** left **nav tree ~280px** (`bgElev`, `borderSubtle` right edge) · a content
  column · an optional right **table-of-contents ~220px**. A slim top bar holds search + theme.
- **Reading measure:** prose caps at **~720px** (~70ch). Full-bleed structural components
  (boards, wide tables, diagrams) may break out to the content width but **scroll inside their
  own container** — the page body never scrolls horizontally.
- **Search-first.** `⌘K` opens search over the whole corpus; it's the primary navigation.

## Elevation & Depth

**Flat, theme-equal — hierarchy via surface steps + 1px borders, not shadows.**

- `e0` (default): no shadow; `surface` over `bg` + `borderSubtle`.
- `e1` (dropdowns, popovers, the search panel): `border` + `0 10px 34px rgba(0,0,0,.5)` dark /
  `0 10px 30px rgba(20,30,55,.10)` light.
- `e2` (command/search palette, dialogs): same family, larger; scrim `rgba(0,0,0,.5)`.
- **Focus ring:** `0 0 0 1px var(bg)` + `0 0 0 3px color-mix(accent 55%, transparent)`. Always
  visible, never removed.

## Shapes

- Radii (`rounded`): `sm 6` (chips/kbd) · `md 9` (buttons, inputs, callouts, code) · `lg 14`
  (cards, panels, dialogs) · `pill` (chips, avatars).
- Iconography: **Lucide**-style, 1.5px stroke, 16px default, `currentColor`.
- No decorative borders or glow except the reserved agent affordances. Consistent corners;
  never mix radii on one element.

## Components

Defined in the YAML; these are the KB-specific primitives. Every one is **dual-representation**
— it renders here _and_ serializes to the MCP (see ARCHITECTURE §2). Visually they signal
nothing special; the knowledge face is invisible to the human reader.

- **Prose** — the rendered MDX body: 16/26 `text`, headings on the scale, links `accentText`
  with a 1px underline on hover, `accentWeak` selection. Generous vertical rhythm.
- **Callout** — `info / tip / warning / danger`. `surface` (or tinted) + 2px coloured left
  border, icon + title (`bodyUi` 600) + body. Default/info uses the accent.
- **Card / CardGroup** — `lg` radius, `border`, hover lifts the border to `accentBorder`.
  Optional icon, title, description, href. Grid 1–4 columns, responsive.
- **Steps** — numbered vertical sequence with a connecting rail; numbers in `mono`.
- **Tabs / CodeGroup** — segmented control (`surface2` active), content below; code uses the
  `codeBlock` token with a copy button and a language label.
- **Structural (the visual-KB differentiators)** — **Timeline**, **Board/Kanban**,
  **EntityCard** (person/thing with fields), **Table**, **Diagram** (Mermaid, theme-aware).
  These are why a superlore KB feels structured rather than flat — and each hands an agent the
  data behind it, not a picture.
- **Search (`⌘K`)** — centered `e2` overlay, ~640px, query + grouped results, arrow-key
  selection (`accentWeak` highlight), `kbd` hints.
- **Agent badge / MCP panel** — the one place the brand gradient appears: a small
  `agentBadge` ("Readable by agents") and the connect-your-agent panel. Restrained, never loud.
- **Theme toggle, Tooltip, Avatar, Breadcrumb, TOC, Empty/Loading(skeleton)/Error** — all from
  the same tokens.

## Do's and Don'ts

**Do**

- Design and verify light and dark together, as equals; neither is an afterthought.
- Use exactly one accent (violet); reach for neutrals + borders for hierarchy.
- Prioritise reading: comfortable prose measure, relaxed line-height, confident headings.
- Use `mono` + tabular figures for code, data, and labels.
- Keep the agent gradient strictly for MCP/agent affordances.
- Keep focus rings; design the `⌘K` search path first.

**Don't**

- Don't use pure `#000` / `#FFF`, heavy drop-shadows, glassmorphism, or multi-colour gradients
  in the core UI.
- Don't put dark text on the violet fill (use white `accentInk`); don't use raw `accent` for
  body-size text on the canvas (use `accentText`).
- Don't compress prose like UI chrome — a KB lives or dies on readability.
- Don't introduce new fonts; Inter + JetBrains Mono only.
- Don't make a component render-only — if it can't serialize for the MCP, it isn't done.
