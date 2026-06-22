# Canvas — what makes a first-class FigJam experience

_The design bar for superlore Canvas. Researched + distilled so every polish pass builds against the
same target. Pairs with `docs/canvas/as-built.md` (architecture). Last updated 2026-06-19._

The goal isn't "a diagram renderer." It's a whiteboard that feels **professional, fun, and worth
looking at** — you _want_ to read it. These are the properties that get us there, each with the
concrete superlore tactic.

## The principles (and our tactic for each)

1. **Contrast-based palette: neutral chrome + intentional color.** FigJam is the most
   pastel-saturated product in Figma's ecosystem, but it works because the _chrome_ is monochrome
   — the color blocks read as deliberate, and the neutrals read as editorial paper, not
   enterprise SaaS ([source](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/figma/DESIGN.md)).
   → **superlore:** soft FigJam hue tokens (`--kp-hue-*`) on color nodes; everything else is the cool
   neutral `--color-fd-*` scale. Color is earned, never decorative.

2. **Soft, contained depth — not flat, not heavy.** FigJam uses subtle shadows that sit _within_
   the object, giving lift without drama.
   → **superlore:** a resting `--kp-canvas-shadow` + a stronger `--kp-canvas-shadow-hover`, a crisp
   1px token border, and the DESIGN.md focus ring on selection. Depth tuned per theme (deeper on
   dark to read as elevation).

3. **The dotted infinite canvas.** The dot grid is the instant "this is a whiteboard" signal and
   gives spatial grounding to empty space. Subtle, but clearly present.
   → **superlore:** `--kp-canvas-dot` (a step stronger than `border-subtle`), ~22px gap, ~1.4px dots,
   visible in both themes.

4. **Organic, then tidy.** Brainstorms feel human (FigJam stickies sit slightly off-axis), yet a
   "Tidy up" snaps everything to a clean grid for structure
   ([source](https://help.figma.com/hc/en-us/articles/1500004362321-Guide-to-FigJam)).
   → **superlore:** **auto-layout (ELK) is the default tidy** — nothing ever overlaps. A faint,
   id-seeded rotation on `layout:"free"` stickies adds the organic feel without breaking
   determinism. Explicit `x/y` when the author wants exact control.

5. **Connectors are content, not lines.** Clean binding to node sides, crisp arrowheads, labels
   that never collide with nodes, smooth elbows/curves. tldraw/Excalidraw treat connectors as a
   first-class polish surface ([source](https://www.toolpick.dev/blog/excalidraw-vs-tldraw-2026)).
   → **superlore:** 1.75–2px strokes in a confident `--kp-canvas-edge` gray, larger filled
   arrowheads, label chips offset off the path, ELK spacing generous enough that edges don't cut
   through frames; `curved` (bezier) option.

6. **Communication-first readability.** The hand-drawn "sloppiness" in Excalidraw exists to say
   "this is a draft, talk about it" — the diagram serves the conversation
   ([source](https://www.hackdesign.org/toolkit/excalidraw/)).
   → **superlore:** crisp shapes for clarity; the **handwritten `annotation`** kind (Caveat) is our
   one "draft margin note" nod — used for asides, never the structure.

7. **Editorial calm + generous whitespace.** Premium boards breathe. Density without crowding.
   → **superlore:** ELK node/layer spacing on the 4px grid; the container **hugs content** (no dead
   space); fitView tight; the minimap only appears on large boards (clutter otherwise).

8. **Delight in the small moments.** Hover lift, selection emphasis, a restrained entrance — the
   "fun to brainstorm with" feeling lives here.
   → **superlore:** hover border→accent + shadow step, selected ring, optional incident-edge
   highlight on hover; all respect `prefers-reduced-motion`; no emoji, restrained.

9. **Light and dark are co-equal.** Both must feel equally finished (DESIGN.md).
   → **superlore:** every canvas token has a light + dark value; verify both each pass.

## Non-negotiables (the user's bar)

- **It must read as FigJam.** Look _and_ feel. Not "a diagram tool inspired by FigJam" — the
  genuine article: the dotted canvas, soft pastel fills, friendly rounded shapes, gentle depth,
  smooth connectors.
- **Sections/groups are a first-class, ever-present component.** A board is organized by sections.
  Frames (titled sections, pill-tab header, soft fill, clear rounded border) and groups (soft
  tinted regions) must look excellent, nest cleanly, and carry the structure.
- **Novice-proof by opinion.** A naive author (or a basic agent) that writes only `kind` + `label`
  - `group` — _no colors, no sizes, no positions_ — must still get a beautiful, varied, on-brand
    board. The defaults do the design. Zero-styling output is the real test of how opinionated and
    well-built we are on colors, themes, fonts, and spacing.

## Acceptance checklist (a board is "first-class" when…)

- [ ] Dot grid clearly visible yet subtle, both themes.
- [ ] Nodes have soft depth + crisp borders; hover lifts; selection shows the focus ring.
- [ ] No edge label overlaps a node; arrowheads crisp; routing never cuts through a frame.
- [ ] Colorful but coherent — color reads intentional against neutral chrome.
- [ ] Frames/sections (pill header + cool tint) read clearly in light and dark.
- [ ] The board hugs its content; no large dead margins; minimap doesn't overlap content.
- [ ] Looks equally polished in light and dark.
- [ ] You actually _want_ to read it.

## Build process

Author the **framework** (the Canvas component system + these tokens), then **iterate the look
with a dedicated agent against Playwright screenshots** (`scratchpad/shot.mjs` → Read the PNG →
refine), checking the list above in both themes until it clears the bar. Never tune blind.

Sources: [FigJam design teardown](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/figma/DESIGN.md) ·
[Guide to FigJam](https://help.figma.com/hc/en-us/articles/1500004362321-Guide-to-FigJam) ·
[FigJam UX review](https://adamfard.com/blog/figjam-ux-review) ·
[Excalidraw for designers](https://www.hackdesign.org/toolkit/excalidraw/) ·
[tldraw vs Excalidraw 2026](https://www.toolpick.dev/blog/excalidraw-vs-tldraw-2026)
