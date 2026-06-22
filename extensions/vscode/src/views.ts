import * as vscode from "vscode";
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/**
 * Phase 1 of the first-class extension: a home in the Activity Bar.
 *
 *   • {@link CorpusTreeProvider} — every page in the KB's content dir, foldered, click-to-open.
 *   • {@link PageOutlineProvider} — the active .mdx's knowledge nodes (headings + dual-rep
 *     components + fenced canvases) as a jump-to outline. "What the agent sees for this doc."
 *   • {@link readMcpEndpoint} — the KB's MCP path from superlore.json, for the status bar.
 *
 * Everything here treats the workspace read-only and degrades to an empty tree when no superlore
 * project is present (the views contribute a welcome view for that case).
 */

const PAGE_RE = /\.mdx$/i;
const CONTENT_DIRS = ["content/docs", "content"] as const;
const SKIP = new Set(["node_modules", ".git", ".next", ".source", "dist", "out"]);

/** The KB project root: the nearest workspace folder carrying a `superlore.json`, else the first. */
export function findProjectRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return undefined;
  for (const f of folders) {
    if (existsSync(join(f.uri.fsPath, "superlore.json"))) return f.uri.fsPath;
  }
  return folders[0].uri.fsPath;
}

/** The content directory we list pages from (`content/docs`, then `content`). */
export function findContentDir(): string | undefined {
  const root = findProjectRoot();
  if (!root) return undefined;
  for (const rel of CONTENT_DIRS) {
    const dir = join(root, rel);
    if (existsSync(dir) && safeIsDir(dir)) return dir;
  }
  return undefined;
}

/** The KB's MCP endpoint path (`mcp.path` in superlore.json, default `/api/mcp`), or undefined. */
export function readMcpEndpoint(): string | undefined {
  const root = findProjectRoot();
  if (!root) return undefined;
  const cfg = join(root, "superlore.json");
  if (!existsSync(cfg)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(cfg, "utf8")) as { mcp?: { path?: unknown } };
    const path = parsed?.mcp?.path;
    return typeof path === "string" && path ? path : "/api/mcp";
  } catch {
    return "/api/mcp";
  }
}

function safeIsDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// ───────────────────────────── Corpus tree ─────────────────────────────

interface CorpusNode {
  label: string;
  uri?: vscode.Uri;
  children?: CorpusNode[];
}

export class CorpusTreeProvider implements vscode.TreeDataProvider<CorpusNode> {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  refresh(): void {
    this._onDidChange.fire();
  }

  getTreeItem(node: CorpusNode): vscode.TreeItem {
    const isFile = node.uri !== undefined && node.children === undefined;
    const item = new vscode.TreeItem(
      node.label,
      isFile
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded,
    );
    if (isFile && node.uri) {
      item.resourceUri = node.uri;
      item.iconPath = new vscode.ThemeIcon("file");
      item.contextValue = "superlorePage";
      item.command = {
        command: "vscode.open",
        title: "Open page",
        arguments: [node.uri],
      };
    } else {
      item.iconPath = new vscode.ThemeIcon("folder");
      item.contextValue = "superloreSection";
    }
    return item;
  }

  getChildren(node?: CorpusNode): CorpusNode[] {
    if (node) return node.children ?? [];
    const content = findContentDir();
    return content ? this.scan(content) : [];
  }

  /** Walk a content dir into a foldered tree of `.mdx` pages — folders first, then files, A→Z. */
  private scan(dir: string): CorpusNode[] {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return [];
    }
    const folders: CorpusNode[] = [];
    const files: CorpusNode[] = [];
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      if (name.startsWith(".") || SKIP.has(name)) continue;
      const full = join(dir, name);
      if (safeIsDir(full)) {
        const children = this.scan(full);
        if (children.length) folders.push({ label: prettify(name), children });
      } else if (PAGE_RE.test(name)) {
        files.push({ label: prettify(name.replace(PAGE_RE, "")), uri: vscode.Uri.file(full) });
      }
    }
    return [...folders, ...files];
  }
}

// ──────────────────────────── This-page outline ────────────────────────────

interface OutlineNode {
  label: string;
  line: number;
  icon: string;
  description?: string;
}

/** Codicons for the dual-rep components — the typed knowledge kinds the MCP serves. */
const COMPONENT_ICONS: Record<string, string> = {
  Canvas: "type-hierarchy-sub",
  Board: "layout",
  Timeline: "git-commit",
  Table: "table",
  Comparison: "diff",
  Decision: "git-pull-request",
  EntityCard: "person",
  Roster: "organization",
  Checklist: "checklist",
  Releases: "tag",
  Schedule: "calendar",
  StatGrid: "graph",
  KeyFacts: "key",
  MetaBar: "info",
  FeatureList: "list-unordered",
  Handoff: "arrow-swap",
  Preview: "browser",
  Steps: "list-ordered",
  Step: "circle-small-filled",
};

export class PageOutlineProvider implements vscode.TreeDataProvider<OutlineNode> {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  refresh(): void {
    this._onDidChange.fire();
  }

  getTreeItem(node: OutlineNode): vscode.TreeItem {
    const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon(node.icon);
    item.description = node.description;
    item.command = {
      command: "superlore.revealLine",
      title: "Go to",
      arguments: [node.line],
    };
    return item;
  }

  getChildren(): OutlineNode[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];
    const doc = editor.document;
    if (doc.languageId !== "mdx" && !/\.(mdx|superlore)$/i.test(doc.fileName)) return [];
    return parseOutline(doc.getText());
  }
}

/** Extract headings, dual-rep components, and fenced canvases from MDX source, in document order. */
export function parseOutline(source: string): OutlineNode[] {
  const lines = source.split("\n");
  const out: OutlineNode[] = [];
  let inFrontmatter = false;
  let inCanvasFence = false;
  let inCodeFence = false;

  lines.forEach((raw, i) => {
    const line = raw.trim();

    // Frontmatter block — skip its body.
    if (i === 0 && line === "---") {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line === "---") inFrontmatter = false;
      return;
    }

    // Fenced ```superlore-canvas … ``` — one outline node for the whole block.
    if (inCanvasFence) {
      if (/^```/.test(line)) inCanvasFence = false;
      return;
    }
    if (inCodeFence) {
      if (/^```/.test(line)) inCodeFence = false;
      return;
    }
    if (/^```superlore-canvas\b/.test(line)) {
      out.push({ label: "Canvas", line: i, icon: COMPONENT_ICONS.Canvas, description: "fenced" });
      inCanvasFence = true;
      return;
    }
    if (/^```/.test(line)) {
      inCodeFence = true;
      return;
    }

    // Markdown headings (## … ####). H1 is usually the title — keep it, dim deeper levels.
    const heading = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      const depth = heading[1].length;
      out.push({
        label: heading[2],
        line: i,
        icon: depth <= 2 ? "symbol-class" : "symbol-field",
      });
      return;
    }

    // Dual-rep components: a JSX tag opening the line, e.g. `<Timeline …`.
    const tag = /^<([A-Z][A-Za-z0-9]*)/.exec(line);
    if (tag && COMPONENT_ICONS[tag[1]]) {
      out.push({ label: tag[1], line: i, icon: COMPONENT_ICONS[tag[1]] });
    }
  });

  return out;
}

/** "getting-started" → "Getting started"; leaves already-spaced labels alone. */
function prettify(name: string): string {
  const cleaned = basename(name).replace(/[-_]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
