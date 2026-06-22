import * as vscode from "vscode";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as os from "node:os";
import { join, dirname } from "node:path";
import { CorpusTreeProvider, PageOutlineProvider, readMcpEndpoint } from "./views";

/** A persisted comment (shape mirrors webview/src/comments/model.ts — host treats it opaquely). */
interface StoredComment {
  id: string;
  seq: number;
  author: string;
  body: string;
  createdAt: string;
  resolved: boolean;
  anchor: unknown;
  replies?: unknown[];
}

/** Messages the extension host posts INTO the webview. Mirrored in webview/src/messages.ts. */
type HostMessage =
  | { type: "update"; source: string; fileName: string }
  | { type: "theme"; theme: "dark" | "light" }
  | { type: "init"; author: string }
  | { type: "comments"; fileName: string; comments: StoredComment[] };

/** Messages the webview posts back OUT to the host. */
type WebviewMessage =
  | { type: "ready" }
  | { type: "saveComments"; comments: StoredComment[] }
  | { type: "copyToClipboard"; text: string; label?: string };

const PREVIEWABLE = /\.(mdx|superlore)$/i;
const UPDATE_DEBOUNCE_MS = 250;

/** Map VS Code's active color theme to the superlore theme the webview understands. */
function themeFor(kind: vscode.ColorThemeKind): "dark" | "light" {
  return kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast
    ? "dark"
    : "light";
}

/** True for documents we know how to preview (.mdx / .superlore / .superlore.mdx, or the mdx language). */
function isPreviewable(doc: vscode.TextDocument): boolean {
  return doc.languageId === "mdx" || PREVIEWABLE.test(doc.fileName);
}

/** The comment sidecar path: `<base>_comments.json` next to the source (mirrors model.ts). */
const DOC_EXT = /\.(superlore\.mdx|mdx|markdown|md|superlore)$/i;
function sidecarPath(fileName: string): string {
  return `${fileName.replace(DOC_EXT, "")}_comments.json`;
}

/** Read persisted comments for a document (empty if none / unreadable). */
function readComments(fileName: string): StoredComment[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(sidecarPath(fileName), "utf8"));
    const list =
      Array.isArray(parsed) ? parsed : (parsed as { comments?: unknown })?.comments;
    return Array.isArray(list) ? (list as StoredComment[]) : [];
  } catch {
    return [];
  }
}

/** Write the comment sidecar — a versioned, agent-friendly envelope. */
function writeComments(fileName: string, comments: StoredComment[]): void {
  const file = {
    superlore: "1",
    kind: "superlore-comments",
    file: fileName.split(/[\\/]/).pop() ?? fileName,
    updatedAt: new Date().toISOString(),
    comments,
  };
  try {
    writeFileSync(sidecarPath(fileName), `${JSON.stringify(file, null, 2)}\n`, "utf8");
  } catch (e) {
    void vscode.window.showErrorMessage(`superlore: couldn't save comments — ${String(e)}`);
  }
}

/** Comment author — the git user name, else the OS username. Resolved once. */
let cachedAuthor: string | undefined;
function resolveAuthor(cwd: string): string {
  if (cachedAuthor !== undefined) return cachedAuthor;
  let name = "";
  try {
    name = execFileSync("git", ["config", "user.name"], {
      cwd,
      encoding: "utf8",
      timeout: 1500,
    }).trim();
  } catch {
    /* not a git repo, or git missing */
  }
  if (!name) {
    try {
      name = os.userInfo().username;
    } catch {
      /* ignore */
    }
  }
  cachedAuthor = name || "You";
  return cachedAuthor;
}

export function activate(context: vscode.ExtensionContext): void {
  // A single reused panel — opening the preview again reveals the existing one rather than
  // spawning a second webview (mirrors how Markdown Preview behaves).
  let panel: vscode.WebviewPanel | undefined;
  // The document the panel is currently mirroring; drives which edits trigger a re-render.
  let tracked: vscode.TextDocument | undefined;
  // The doc whose comments we've already pushed to the webview — so a keystroke re-render doesn't
  // clobber in-flight edits, but switching files re-hydrates the sidecar.
  let hydratedFor: string | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const authorCwd = (doc?: vscode.TextDocument): string =>
    (doc ? dirname(doc.fileName) : undefined) ??
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ??
    os.homedir();

  const distRoot = vscode.Uri.joinPath(context.extensionUri, "dist", "webview");

  const post = (message: HostMessage): void => {
    void panel?.webview.postMessage(message);
  };

  const postUpdate = (doc: vscode.TextDocument): void => {
    const changedDoc = doc.fileName !== hydratedFor;
    tracked = doc;
    post({ type: "update", source: doc.getText(), fileName: doc.fileName });
    // Hydrate the sidecar only when the document identity changes (not on every keystroke).
    if (changedDoc) {
      hydratedFor = doc.fileName;
      post({ type: "comments", fileName: doc.fileName, comments: readComments(doc.fileName) });
    }
  };

  const postTheme = (): void => {
    post({ type: "theme", theme: themeFor(vscode.window.activeColorTheme.kind) });
  };

  /** Read the built webview index.html, rewrite asset URLs to webview-safe URIs, and inject CSP. */
  const buildHtml = (webview: vscode.Webview): string => {
    const indexPath = join(distRoot.fsPath, "index.html");
    let html: string;
    try {
      html = readFileSync(indexPath, "utf8");
    } catch {
      return fallbackHtml(
        "Webview bundle not found. Run the build in extensions/vscode " +
          "(`pnpm run build` or `pnpm run build:webview`), then reopen the preview.",
      );
    }

    const nonce = makeNonce();
    const cspSource = webview.cspSource;
    // Strict CSP. `script-src` carries the nonce AND 'unsafe-eval' — the webview compiles MDX at
    // runtime via `new Function` (@mdx-js/mdx `evaluate`), which needs eval. Styles allow inline
    // (superlore + React Flow set inline style attributes). Fonts/images are inlined as data: URIs by
    // the bundle, so data: is permitted there. No network (`connect-src 'none'`).
    const csp = [
      `default-src 'none'`,
      `img-src ${cspSource} data: https:`,
      `font-src ${cspSource} data:`,
      `style-src ${cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}' 'unsafe-eval' ${cspSource}`,
      `connect-src 'none'`,
    ].join("; ");

    // Vite is built with base:"./", so assets are referenced as "./assets/...". Rewrite each to an
    // asWebviewUri(...) and stamp the nonce on every <script>.
    html = html.replace(/(src|href)="(\.?\/?assets\/[^"]+)"/g, (_m, attr: string, rel: string) => {
      const clean = rel.replace(/^\.?\//, "");
      const uri = webview.asWebviewUri(vscode.Uri.joinPath(distRoot, clean));
      return `${attr}="${uri.toString()}"`;
    });
    // Vite stamps `crossorigin` on the emitted <script>/<link>. Against a `vscode-webview://`
    // resource that forces a CORS fetch the webview can't satisfy — so the stylesheet silently
    // fails to load (boards render but lose all colour/shape styling). Strip it.
    html = html.replace(/\s+crossorigin(=(["'])[^"']*\2)?/g, "");
    html = html.replace(/<script\b/g, `<script nonce="${nonce}"`);

    const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
    return html.includes("<head>") ? html.replace("<head>", `<head>${meta}`) : `${meta}${html}`;
  };

  const ensurePanel = (): vscode.WebviewPanel => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Beside, true);
      return panel;
    }
    const created = vscode.window.createWebviewPanel(
      "superlorePreview",
      "superlore Preview",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [distRoot],
      },
    );
    // Tab icon = the superlore Fold mark, not VS Code's generic file glyph.
    created.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "icon.svg");
    created.webview.html = buildHtml(created.webview);

    // The webview posts { type: "ready" } once mounted, so a slow boot never misses content.
    created.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => {
        if (msg?.type === "ready") {
          const editor = vscode.window.activeTextEditor;
          const doc =
            tracked ?? (editor && isPreviewable(editor.document) ? editor.document : undefined);
          post({ type: "init", author: resolveAuthor(authorCwd(doc)) });
          postTheme();
          // Force a fresh hydrate: the initial pre-`ready` push may have been missed.
          hydratedFor = undefined;
          if (doc) postUpdate(doc);
        } else if (msg?.type === "saveComments" && tracked) {
          writeComments(tracked.fileName, msg.comments);
        } else if (msg?.type === "copyToClipboard") {
          void vscode.env.clipboard.writeText(msg.text).then(() => {
            void vscode.window.showInformationMessage(
              `superlore: copied ${msg.label ?? "text"} to the clipboard — paste it to your agent.`,
            );
          });
        }
      },
      undefined,
      context.subscriptions,
    );

    created.onDidDispose(
      () => {
        panel = undefined;
        tracked = undefined;
      },
      undefined,
      context.subscriptions,
    );

    panel = created;
    return created;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("superlore.openPreview", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !isPreviewable(editor.document)) {
        void vscode.window.showWarningMessage(
          "superlore Preview: open a .mdx, .superlore, or .superlore.mdx file first.",
        );
        return;
      }
      ensurePanel();
      // Send current theme + content immediately; the "ready" handshake re-sends if the webview
      // wasn't listening yet.
      postTheme();
      postUpdate(editor.document);
    }),

    // Re-render on edits to the tracked document, debounced.
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!panel || !tracked || e.document !== tracked) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => postUpdate(e.document), UPDATE_DEBOUNCE_MS);
    }),

    // Follow the active editor: switching to another previewable doc mirrors it.
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!panel || !editor || !isPreviewable(editor.document)) return;
      postUpdate(editor.document);
    }),

    // Track VS Code's theme and push it to the webview (superlore dark = the `.dark` class).
    vscode.window.onDidChangeActiveColorTheme(() => postTheme()),
  );

  // ──────────── Activity Bar home (Phase 1): corpus · this page · status ────────────
  const corpus = new CorpusTreeProvider();
  const pageOutline = new PageOutlineProvider();

  // Status bar: present only inside a superlore project; surfaces the KB's MCP endpoint.
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = "superlore.openPreview";
  const refreshStatus = (): void => {
    const mcp = readMcpEndpoint();
    if (mcp) {
      status.text = "$(book) superlore";
      status.tooltip = `superlore knowledge base · MCP at ${mcp}\nClick to open the dual-representation preview`;
      status.show();
    } else {
      status.hide();
    }
  };
  refreshStatus();

  // Re-parse the active doc's outline as it changes, lightly debounced.
  let outlineDebounce: ReturnType<typeof setTimeout> | undefined;
  // The corpus tree follows files appearing / disappearing on disk.
  const watcher = vscode.workspace.createFileSystemWatcher("**/*.mdx");

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("superlore.corpus", corpus),
    vscode.window.registerTreeDataProvider("superlore.page", pageOutline),
    status,
    watcher,

    vscode.commands.registerCommand("superlore.refreshCorpus", () => {
      corpus.refresh();
      pageOutline.refresh();
      refreshStatus();
    }),

    // Welcome-view CTA when no KB is detected — point at the scaffold path.
    vscode.commands.registerCommand("superlore.scaffoldHint", () => {
      void vscode.window
        .showInformationMessage(
          "Scaffold a superlore KB: run `npm create superlore@latest` in a terminal, " +
            "or ask your agent (with the superlore plugin) to set one up.",
          "Open a terminal",
        )
        .then((choice) => {
          if (choice === "Open a terminal") {
            vscode.window.createTerminal("superlore").show();
          }
        });
    }),

    // Jump the active editor to a line picked in the "This page" outline.
    vscode.commands.registerCommand("superlore.revealLine", (line: number) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || typeof line !== "number") return;
      const pos = new vscode.Position(line, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(
        new vscode.Range(pos, pos),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      );
      void vscode.window.showTextDocument(editor.document, {
        viewColumn: editor.viewColumn,
        preserveFocus: false,
      });
    }),

    vscode.window.onDidChangeActiveTextEditor(() => pageOutline.refresh()),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document !== vscode.window.activeTextEditor?.document) return;
      if (outlineDebounce) clearTimeout(outlineDebounce);
      outlineDebounce = setTimeout(() => pageOutline.refresh(), 300);
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      corpus.refresh();
      refreshStatus();
    }),

    watcher.onDidCreate(() => corpus.refresh()),
    watcher.onDidDelete(() => corpus.refresh()),
  );
}

export function deactivate(): void {
  // Panels are disposed via context.subscriptions; nothing else to tear down.
}

function makeNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function fallbackHtml(message: string): string {
  return `<!doctype html><html><body style="font-family:sans-serif;padding:2rem;color:#888">
    <h3>superlore Preview</h3><p>${message}</p></body></html>`;
}
