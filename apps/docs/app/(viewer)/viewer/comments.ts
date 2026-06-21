/**
 * Viewer comments — the in-memory, client-only data model + the JSON sidecar shape.
 *
 * Comments anchor to `data-kp-block` ids stamped by lib/rehype-kp-block-ids.mjs (which mirrors
 * the MCP `#id` convention from packages/superlore/src/knowledge/extract.ts). Nothing here touches
 * the network or storage — comments live for the life of the rendered document only, preserving
 * the Viewer's "runs locally, nothing uploaded" posture. Export/import is via a Blob the user
 * downloads and re-opens themselves.
 */

export interface Comment {
  id: string;
  /** The `data-kp-block` id of the anchored block. */
  anchorId: string;
  /** A short snapshot of the block's text at comment time — used to relocate on import. */
  quote: string;
  body: string;
  author?: string;
  createdAt: string;
  resolved?: boolean;
}

/** The exported JSON sidecar — versioned, stable contract. */
export interface CommentSidecar {
  superloreViewer: "1";
  kind: "comment-sidecar";
  doc: {
    filename: string;
    title: string;
    exportedAt: string;
  };
  comments: Array<{
    id: string;
    anchor: { blockId: string; quote: string };
    body: string;
    author: string;
    createdAt: string;
    resolved: boolean;
  }>;
}

let counter = 0;
/** Local, collision-resistant comment id (not the block anchor — that comes from the doc). */
export function newCommentId(): string {
  counter += 1;
  return `c-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Group comments by anchor id, preserving document order via the supplied anchor order. */
export function groupByAnchor(comments: Comment[]): Map<string, Comment[]> {
  const map = new Map<string, Comment[]>();
  for (const c of comments) {
    const list = map.get(c.anchorId);
    if (list) list.push(c);
    else map.set(c.anchorId, [c]);
  }
  return map;
}

export function toSidecar(
  comments: Comment[],
  doc: { filename: string; title: string },
): CommentSidecar {
  return {
    superloreViewer: "1",
    kind: "comment-sidecar",
    doc: {
      filename: doc.filename,
      title: doc.title,
      exportedAt: new Date().toISOString(),
    },
    comments: comments.map((c) => ({
      id: c.id,
      anchor: { blockId: c.anchorId, quote: c.quote },
      body: c.body,
      author: c.author ?? "",
      createdAt: c.createdAt,
      resolved: c.resolved ?? false,
    })),
  };
}

export interface ImportResult {
  comments: Comment[];
  /** Anchor ids referenced by imported comments that no longer exist in the document. */
  missing: Set<string>;
}

/**
 * Re-attach an imported sidecar's comments to the live document. Comments whose block id is
 * present are attached directly; those whose block is gone are flagged for relocation (still
 * imported, but their anchor is "orphaned" and the UI surfaces a needs-relocation badge).
 */
export function fromSidecar(raw: unknown, liveBlockIds: Set<string>): ImportResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Not a superlore Viewer sidecar.");
  }
  const obj = raw as Record<string, unknown>;
  if (
    obj.superloreViewer !== "1" ||
    obj.kind !== "comment-sidecar" ||
    !Array.isArray(obj.comments)
  ) {
    throw new Error('Unrecognised sidecar — expected superloreViewer:"1", kind:"comment-sidecar".');
  }
  const comments: Comment[] = [];
  const missing = new Set<string>();
  for (const entry of obj.comments as unknown[]) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const anchor = (e.anchor ?? {}) as Record<string, unknown>;
    const blockId = typeof anchor.blockId === "string" ? anchor.blockId : "";
    if (!blockId) continue;
    if (!liveBlockIds.has(blockId)) missing.add(blockId);
    comments.push({
      id: typeof e.id === "string" && e.id ? e.id : newCommentId(),
      anchorId: blockId,
      quote: typeof anchor.quote === "string" ? anchor.quote : "",
      body: typeof e.body === "string" ? e.body : "",
      author: typeof e.author === "string" && e.author ? e.author : undefined,
      createdAt: typeof e.createdAt === "string" ? e.createdAt : new Date().toISOString(),
      resolved: e.resolved === true,
    });
  }
  return { comments, missing };
}
