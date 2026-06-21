# superlore Preview (VS Code extension)

Live preview for superlore `.mdx` files — the way Markdown Preview renders Markdown, but rendering
**every** superlore component: the live Canvas/whiteboard (React Flow + ELK), Timeline, Board, Notes,
Tables, and the rest. Open a `.mdx`, run the preview, and the rendered page updates as you type.

It reuses the **exact** render pipeline of the superlore **Viewer** (`apps/docs/app/(viewer)/`): the
same `@mdx-js/mdx` `evaluate` call with `remarkFrontmatter`, `remarkMdxFrontmatter`, `remarkGfm`,
`remarkSuperloreCanvas`, `rehypeSlug`, `rehypeKpBlockIds`, then `<Content components={getMDXComponents()} />`
from the `superlore` package. Compile errors keep the last good render.

## Comments (FigJam-style)

Press **`C`** and click anywhere on the rendered preview to drop a comment pin — like FigJam.
Hover a pin to read it; click it to reply or resolve. Press **`]`** to toggle the **Comments** panel
(it lists every thread with search + resolve, and reserves its own width so the document reflows
beside it rather than hiding behind it).

On a Canvas, a pin is anchored in **flow coordinates**, so it **tracks the node as you pan and
zoom** the board (and clips when the node scrolls off the board). Each comment also captures the
block, the exact **node**, and a best-effort **source line** — so it's actionable, not just a sticky
note. Comments persist next to the file as `<name>_comments.json` (a versioned, agent-friendly
envelope). The author comes from `git config user.name`.

**✦ Copy to Agent** copies the open comments as a ready-to-paste prompt — line numbers, element
labels, and instructions to apply the edits **and close the loop**: the agent appends a reply into
`<name>_comments.json` and flips `resolved: true` when a comment is genuinely done. Drop it into
Cursor / Windsurf / Claude Code; reopen the preview and you see the agent's replies and which threads
it resolved.

**Sharing** is just the file: commit `<name>_comments.json` next to the `.mdx` (or send it along).
Anyone who opens that `.mdx` in this extension gets the comments **auto-loaded** — the host reads the
sidecar on open and hydrates the board. (No account, no server; team-wide live comments are a future
superlore Cloud feature.)

The webview can't touch the filesystem, so the host writes the sidecar (`saveComments`) and owns the
clipboard (`copyToClipboard`).

## Architecture

```
extensions/vscode/
  src/extension.ts          Extension host: command, WebviewPanel, CSP+nonce, theme + live-update messages
  webview/                  Vite + React + Tailwind v4 app (the rendered preview)
    index.html
    src/main.tsx            acquireVsCodeApi(), next-themes provider driven by host theme, posts "ready"
    src/preview.tsx         compileMdx (same as the Viewer) + last-good-render error handling
    src/error-boundary.tsx  Render-time guard
    src/styles.css          Tailwind v4 + fumadocs presets + superlore/css + @source-scan of superlore src
    src/lib/                COPIES of the two Viewer plugins (remark-superlore-canvas, rehype-kp-block-ids)
    src/shims/next-dynamic  Tiny next/dynamic replacement (Canvas uses it; no Next here)
  dist/                     Build output: extension.js + webview/ (loaded via asWebviewUri)
  verify/verify.mjs         Browser-based render verification (Playwright)
```

The two plugins under `webview/src/lib/` are copied verbatim from `apps/docs/lib/` so the extension
is self-contained. They could later be centralized into the `superlore` package and imported from there.

## How CSP, theme, and live update work

- **CSP**: the host sets a strict `Content-Security-Policy` with `default-src 'none'`, a per-load
  **nonce** on every `<script>`, and — critically — **`'unsafe-eval'`** in `script-src`, because the
  webview compiles MDX at runtime via `@mdx-js/mdx` `evaluate` (`new Function`). Assets load only
  from the webview's own origin (`webview.cspSource`, via `asWebviewUri`); fonts/images allow
  `data:`. `connect-src 'none'` — no network.
- **Theme**: the host maps `window.activeColorTheme.kind` to a `dark`/`light` message; the webview
  drives `next-themes` (`attribute="class"`, `forcedTheme`) so the `.dark` class lands on `<html>`
  (superlore dark = the `.dark` class) and `useTheme()` is correct for Mermaid.
- **Live update**: the host posts `{ type: "update", source, fileName }` on open, on
  `onDidChangeTextDocument` for the active doc (debounced ~250ms), and on active-editor change.
- **Fonts** are bundled (`@fontsource` Inter / JetBrains Mono / Caveat) and wired to `--font-mono`
  / `--font-hand` via Tailwind `@theme`, so the theme + Canvas annotations look right with no
  network access (CSP-safe).

## Run it (Extension Development Host — F5)

From the repo root, install + build once:

```bash
pnpm install
pnpm --filter superlore-preview build      # builds the webview (Vite) + the extension host (esbuild)
```

Then launch the Extension Development Host:

1. Open the `extensions/vscode` folder in VS Code (`code extensions/vscode`).
2. Press **F5** (Run → "Run Extension"). A second VS Code window ("Extension Development Host")
   opens. (A `.vscode/launch.json` is included so F5 just works.)
3. In that window, open `apps/docs/content/docs/canvas.mdx`.
4. Run **superlore: Open Preview** — via the Command Palette (Cmd/Ctrl+Shift+P), or the
   **preview icon** in the editor title bar (shown for `.mdx` / `.superlore` / `.superlore.mdx`).
5. The preview opens beside the editor and renders the whole file — headings, the live Canvas
   boards, the Timeline — and re-renders as you edit. Toggle VS Code's color theme and the preview
   follows.

If you change extension/webview source, re-run `pnpm --filter superlore-preview build` and reload the
Extension Development Host window (Cmd/Ctrl+R).

## Install (VS Code · Windsurf · Cursor)

superlore Preview installs in any VS Code-compatible editor. Build the `.vsix` once:

```bash
pnpm install
pnpm --filter superlore-preview build
cd extensions/vscode
npx @vscode/vsce package --no-dependencies     # → superlore-preview-0.1.5.vsix
```

`--no-dependencies` is required (this is a pnpm workspace package); only `dist/`, `README.md`, and
`package.json` ship (see `.vscodeignore`).

**Install via the command line** — each editor ships its own CLI:

```bash
code     --install-extension superlore-preview-0.1.5.vsix   # VS Code
windsurf --install-extension superlore-preview-0.1.5.vsix   # Windsurf
cursor   --install-extension superlore-preview-0.1.5.vsix   # Cursor
```

If the CLI isn't found, install it from the editor first: Command Palette
(Cmd/Ctrl+Shift+P) → **Shell Command: Install '<editor>' command in PATH**.

**Or via the UI** (works in every fork): open the **Extensions** panel → the **"…"** (More Actions)
menu at the top → **Install from VSIX…** → pick `superlore-preview-0.1.5.vsix`.

Then **reload the window** (Command Palette → "Reload Window"), open any superlore `.mdx`
(e.g. `apps/docs/content/docs/canvas.mdx`), and run **superlore: Open Preview** — via the Command
Palette, or the **preview icon** in the editor title bar (shown for `.mdx` / `.superlore` / `.superlore.mdx`).
The preview opens beside the editor and re-renders as you type.

## Build scripts

| Script | What |
| --- | --- |
| `build` | `build:webview` then `build:extension` |
| `build:webview` | `vite build` → `dist/webview/` |
| `build:extension` | `esbuild src/extension.ts` → `dist/extension.js` (CJS, `vscode` external) |
| `typecheck` | `tsc --noEmit` for the host + the webview |
| `watch:extension` | esbuild watch for the host |
| `package` | build + `vsce package --no-dependencies` |

## Verify the render in a browser (no VS Code needed)

The webview is a web page, so you can verify the render headlessly:

```bash
pnpm --filter superlore-preview build:webview
cd extensions/vscode && OUT=verify node verify/verify.mjs
```

It serves `dist/webview`, stubs `acquireVsCodeApi` before the bundle loads, posts the real
`canvas.mdx` as an `update` message in both light and dark, asserts the Canvas boards
(`.react-flow`), headings, and components render with **zero console errors**, and writes
`verify/webview-light.png` / `verify/webview-dark.png`.
