---
"superlore": patch
---

Code blocks now keep their tokyo-night midnight background even when the host strips Shiki's inline CSS variables. The always-dark rule depended on `--shiki-dark-bg` / `--shiki-dark`; some hosts (notably a VS Code/Cursor webview) drop those inline custom properties, leaving the code block with the grey wrapper background instead of the midnight surface. Each `var()` now carries a literal tokyo-night fallback (`#1a1b26` / `#c0caf5`), so code renders on the midnight surface everywhere.
