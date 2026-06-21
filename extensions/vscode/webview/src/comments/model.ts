/**
 * The comment data model shared by the overlay, the rail, and the host sidecar.
 *
 * A comment is a FigJam-style pin dropped on the rendered preview. It anchors to a `data-kp-block`
 * id (stamped by rehype-kp-block-ids) and, when the click lands on a Canvas node, to that node's id
 * — plus a best-effort source line. That context is what lets an AI agent act on the comment
 * without seeing the picture: "on node `u1` at line 42, do X".
 */

export interface CommentAnchor {
  /** The `data-kp-block` id of the block the pin sits in. */
  blockId: string;
  /** A human label for the block — the Canvas title, else a snippet of its text. */
  blockLabel: string;
  /** The Canvas node id under the pin, if any (`react-flow__node[data-id]`). */
  nodeId?: string;
  /** That node's visible text, trimmed. */
  nodeLabel?: string;
  /** 1-based source line, resolved best-effort from `nodeId` (or the block). May be absent. */
  line?: number;
  /** Pin position as a fraction of the block's box, so it re-anchors after re-layout. */
  fx: number;
  fy: number;
  /**
   * For a pin dropped on a Canvas: the point in React-Flow *flow* coordinates (the untransformed
   * board space). Rendering re-applies the board's live pan/zoom transform, so the pin tracks the
   * node as the board is panned or zoomed. Absent for non-canvas blocks (those use `fx`/`fy`).
   */
  flow?: { x: number; y: number };
}

export interface CommentReply {
  author: string;
  body: string;
  createdAt: string;
}

export interface KComment {
  id: string;
  /** Stable display number (#1, #2, …) in placement order. */
  seq: number;
  author: string;
  body: string;
  createdAt: string;
  resolved: boolean;
  anchor: CommentAnchor;
  replies?: CommentReply[];
}

/** The on-disk sidecar — versioned, agent-friendly. Written next to the source as `<base>_comments.json`. */
export interface CommentsFile {
  superlore: "1";
  kind: "superlore-comments";
  file: string;
  updatedAt: string;
  comments: KComment[];
}

let counter = 0;
export function newCommentId(): string {
  counter += 1;
  return `c-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Initials for the avatar — first letters of the first two words, uppercased. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** "just now" / "3m" / "2h" / "5d" / a date — compact, FigJam-style. */
export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** The sidecar path the host writes — `<base>_comments.json` next to the source. */
export function sidecarName(fileName: string): string {
  const base = fileName.replace(/\.(superlore\.mdx|mdx|markdown|md|superlore)$/i, "");
  return `${base}_comments.json`;
}

export function toFile(fileName: string, comments: KComment[]): CommentsFile {
  return {
    superlore: "1",
    kind: "superlore-comments",
    file: fileName,
    updatedAt: new Date().toISOString(),
    comments,
  };
}

/**
 * Build the "Copy to Agent" prompt: the unresolved comments rendered as an actionable instruction
 * list, each carrying its source line + element context AND its stable `id`. Pasting this into a
 * coding agent (Cursor, Windsurf, Claude Code) is enough for it to make the edits *and* close the
 * loop — it writes a reply back into the sidecar and resolves the comment, so the author sees the
 * outcome when they reopen the preview. The agent never has to see the board.
 */
export function buildAgentPrompt(fileName: string, comments: KComment[]): string {
  const open = comments.filter((c) => !c.resolved);
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const sidecar = sidecarName(base);
  const lines: string[] = [];
  lines.push(`# Review comments on \`${base}\``);
  lines.push("");
  lines.push(
    `Apply the following review comments to the superlore source file \`${base}\`. Each comment ` +
      `references the element it's about and, where known, the exact source line. Edit the MDX to ` +
      `satisfy each comment, preserving superlore's dual-representation contract (every component must ` +
      `still render for humans and serialize for the MCP). Make the smallest change that resolves ` +
      `the comment.`,
  );
  lines.push("");
  if (open.length === 0) {
    lines.push("_(No open comments — everything is resolved.)_");
    return lines.join("\n");
  }
  open.forEach((c, i) => {
    const a = c.anchor;
    const loc = a.line ? `line ${a.line}` : `block “${a.blockLabel}”`;
    const on = a.nodeLabel
      ? ` on node “${a.nodeLabel}”${a.nodeId ? ` (\`${a.nodeId}\`)` : ""}`
      : a.blockLabel
        ? ` in “${a.blockLabel}”`
        : "";
    lines.push(`${i + 1}. **[${loc}]**${on} — ${c.body}  _(comment id: \`${c.id}\`)_`);
    for (const r of c.replies ?? []) lines.push(`   ↳ ${r.author || "reply"}: ${r.body}`);
  });
  lines.push("");
  lines.push(`## Close the loop in \`${sidecar}\``);
  lines.push("");
  lines.push(
    `After you address a comment, open the sidecar \`${sidecar}\` (it sits next to \`${base}\`), ` +
      `find the comment by its \`id\`, and:`,
  );
  lines.push(
    `- Append a reply to its \`replies\` array: ` +
      `\`{ "author": "Agent", "body": "<what you changed, one line>", "createdAt": "<current ISO-8601 timestamp>" }\`.`,
  );
  lines.push(
    `- Set \`"resolved": true\` **only if** the change fully addresses the comment; leave it ` +
      `\`false\` (and say why in the reply) if it's partial or needs the author's confirmation.`,
  );
  lines.push(
    `- Keep the rest of the file intact. Each entry is ` +
      `\`{ id, seq, author, body, createdAt, resolved, anchor, replies }\`; only touch \`replies\` ` +
      `and \`resolved\`.`,
  );
  lines.push("");
  lines.push(`Then summarise what you changed per comment.`);
  return lines.join("\n");
}

/** Resolve a best-effort 1-based source line for an anchor, from the raw MDX source. */
export function resolveLine(source: string, nodeId?: string): number | undefined {
  if (!nodeId || !source) return undefined;
  const lines = source.split("\n");
  const esc = nodeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`["']?id["']?\\s*:\\s*["']${esc}["']`);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i]!)) return i + 1;
  }
  return undefined;
}
