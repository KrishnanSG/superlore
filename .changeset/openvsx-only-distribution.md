---
"superlore-cli": patch
---

`superlore connect`'s `.vsix` fallback now resolves the latest extension from the **Open VSX** API instead of a self-hosted file, so it can never serve a stale build. The self-hosted, bot-committed `.vsix` (and the workflow that committed it on every push) is retired — Open VSX is the single source of truth. Manual-install guidance now points at the editor's Extensions panel / Open VSX.
