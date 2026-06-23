---
"superlore-cli": minor
---

`superlore connect` now installs the editor extension from the **Open VSX registry** (by extension id) so the editor manages and **auto-updates** it — no more hand-installed `.vsix` going stale. It falls back to the hosted `.vsix` per editor when a marketplace doesn't carry it (e.g. VS Code proper) or when `--vsix` is passed, so existing flows keep working.
