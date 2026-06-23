# superlore-cli

## 0.7.1

### Patch Changes

- 07c2e5c: `superlore connect`'s `.vsix` fallback now resolves the latest extension from the **Open VSX** API instead of a self-hosted file, so it can never serve a stale build. The self-hosted, bot-committed `.vsix` (and the workflow that committed it on every push) is retired — Open VSX is the single source of truth. Manual-install guidance now points at the editor's Extensions panel / Open VSX.

## 0.7.0

### Minor Changes

- 74a9649: `superlore connect` now installs the editor extension from the **Open VSX registry** (by extension id) so the editor manages and **auto-updates** it — no more hand-installed `.vsix` going stale. It falls back to the hosted `.vsix` per editor when a marketplace doesn't carry it (e.g. VS Code proper) or when `--vsix` is passed, so existing flows keep working.
