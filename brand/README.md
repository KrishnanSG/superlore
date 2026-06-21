# superlore brand

The visual identity for superlore. Keep it clean and flat, with light and dark as equals.

## The mark

`superlore-mark.svg` — **"Fold."** A single flat surface folded into a structured, dimensional
body. The **lit face is the human view**, the **half-tone face the machine's** — one source,
two readings. You author once; superlore folds that one corpus into shape. The name says it:
**superlore = corpus**, a body of knowledge.

- `superlore-mark.svg` — the glyph on a transparent background (brand violet).
- `superlore-mark-tile.svg` — the glyph on an ink tile, for app icons.
- `apps/docs/app/icon.svg` — the favicon: the same mark on a transparent background (no tile).

The mark is two polygons — the lit face at full strength, the folded face at 50% — so it
scales cleanly and recolours by swapping the fill (or set `fill="currentColor"` to inherit
text colour). Light and dark are co-equal.

## Colour

| Token       | Hex       | Use                                           |
| ----------- | --------- | --------------------------------------------- |
| Violet      | `#6D5CF0` | the single accent — links, the mark, emphasis |
| Deep violet | `#4B3DC4` | pressed / depth / gradients                   |
| Ink         | `#0B0C0E` | dark background                               |
| Paper       | `#E7E9ED` | foreground on ink                             |
| Muted       | `#8A9099` | secondary text                                |

Violet-indigo reads as "AI-native knowledge" — it's the brand, owned with intent.
Light theme is a true peer of dark — derive it from the same tokens, don't branch in JS.

## Wordmark

"superlore" in a tight geometric sans, title case, set in the **foreground** colour — the mark
carries the single violet accent, so the word stays neutral (one colour moment per lockup).
A monospace, letter-spaced `SUPERLORE` is the secondary lockup for code contexts. In the lockup,
the mark sits at the wordmark's cap height, with ~0.3× cap of clear space between them.

## Voice

Identity (frozen): **"The company knowledge base your agents run on."**
Tagline: **"One corpus. Humans and agents."**
Tone: plain, confident, specific. No emoji in core UI.
