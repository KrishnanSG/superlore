import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  buildAgentPrompt,
  initials,
  newCommentId,
  relativeTime,
  resolveLine,
  type CommentAnchor,
  type KComment,
} from "./model";

/* ── tiny inline icons (no icon dep in the webview) ──────────────────────── */
const I = (p: { d: string; size?: number }) => (
  <svg
    width={p.size ?? 14}
    height={p.size ?? 14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={p.d} />
  </svg>
);
const CheckIcon = () => <I d="M20 6 9 17l-5-5" />;
const XIcon = () => <I d="M18 6 6 18M6 6l12 12" />;
const ReplyIcon = () => <I d="M9 17l-5-5 5-5M4 12h11a4 4 0 0 1 4 4v3" />;
const TrashIcon = () => <I d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const SparkIcon = () => <I d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3L12 3Z" />;
const CommentIcon = () => <I d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />;

/* ── avatar (stable hue per author) ──────────────────────────────────────── */
function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const h = hueOf(name || "?");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(140deg, hsl(${h} 42% 42%), hsl(${(h + 28) % 360} 46% 30%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ── composer ────────────────────────────────────────────────────────────── */
function Composer({
  placeholder,
  submitLabel,
  initial = "",
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  initial?: string;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const submit = () => {
    const t = body.trim();
    if (t) onSubmit(t);
  };
  return (
    <div className="kp-cmt-composer">
      <textarea
        ref={ref}
        rows={2}
        value={body}
        placeholder={placeholder}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
          e.stopPropagation();
        }}
      />
      <div className="kp-cmt-composer-row">
        <span className="kp-cmt-hint">
          <kbd>↵</kbd> send
        </span>
        <button type="button" className="kp-cmt-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="kp-cmt-btn" onClick={submit} disabled={!body.trim()}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── a comment thread card (used in popover + rail) ──────────────────────── */
function ThreadCard({
  comment,
  onReply,
  onResolve,
  onDelete,
}: {
  comment: KComment;
  onReply: (body: string) => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const [replying, setReplying] = useState(false);
  return (
    <div className="kp-cmt-thread">
      <div className="kp-cmt-head">
        <Avatar name={comment.author} />
        <div className="kp-cmt-meta">
          <span className="kp-cmt-author">{comment.author || "Anonymous"}</span>
          <span className="kp-cmt-time">{relativeTime(comment.createdAt)}</span>
        </div>
        <div className="kp-cmt-actions">
          <button
            type="button"
            title={comment.resolved ? "Reopen" : "Resolve"}
            className={comment.resolved ? "kp-cmt-ic kp-cmt-ic-on" : "kp-cmt-ic"}
            onClick={onResolve}
          >
            <CheckIcon />
          </button>
          <button type="button" title="Delete" className="kp-cmt-ic" onClick={onDelete}>
            <TrashIcon />
          </button>
        </div>
      </div>
      <p className="kp-cmt-body">{comment.body}</p>
      {(comment.replies?.length ?? 0) > 0 && (
        <div className="kp-cmt-replies">
          {comment.replies!.map((r, i) => (
            <div key={i} className="kp-cmt-reply">
              <Avatar name={r.author} size={20} />
              <div className="kp-cmt-reply-main">
                <div className="kp-cmt-meta">
                  <span className="kp-cmt-author">{r.author || "Anonymous"}</span>
                  <span className="kp-cmt-time">{relativeTime(r.createdAt)}</span>
                </div>
                <p className="kp-cmt-body">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {replying ? (
        <Composer
          placeholder="Reply…"
          submitLabel="Reply"
          onSubmit={(b) => {
            onReply(b);
            setReplying(false);
          }}
          onCancel={() => setReplying(false)}
        />
      ) : (
        <button type="button" className="kp-cmt-reply-btn" onClick={() => setReplying(true)}>
          <ReplyIcon /> Reply
        </button>
      )}
    </div>
  );
}

/* ── anchoring helpers ───────────────────────────────────────────────────── */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function labelForBlock(block: Element): string {
  const wb =
    block.querySelector('[aria-label^="Whiteboard:"]') ??
    (block.matches('[aria-label^="Whiteboard:"]') ? block : null);
  if (wb) return (wb.getAttribute("aria-label") ?? "").replace(/^Whiteboard:\s*/, "").trim();
  const t = (block.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.slice(0, 44) || "block";
}

/** The live pan/zoom frame of a Canvas block: the React-Flow pane rect + its viewport transform. */
function flowFrame(
  block: Element,
): { left: number; top: number; right: number; bottom: number; k: number; tx: number; ty: number } | null {
  const rf = block.querySelector(".react-flow");
  const vp = block.querySelector(".react-flow__viewport");
  if (!rf || !vp) return null;
  const m = new DOMMatrixReadOnly(getComputedStyle(vp as Element).transform);
  const r = rf.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, k: m.a || 1, tx: m.e, ty: m.f };
}

function anchorFromPoint(
  x: number,
  y: number,
  wrap: HTMLElement,
  source: string,
): { anchor: CommentAnchor; left: number; top: number } | null {
  const els = document.elementsFromPoint(x, y);
  let block: Element | null = null;
  for (const el of els) {
    const b = (el as Element).closest?.("[data-kp-block]");
    if (b && wrap.contains(b)) {
      block = b;
      break;
    }
  }
  if (!block) return null;
  const rect = block.getBoundingClientRect();
  const fx = clamp((x - rect.left) / rect.width, 0, 1);
  const fy = clamp((y - rect.top) / rect.height, 0, 1);

  let nodeEl: Element | null = null;
  for (const el of els) {
    const n = (el as Element).closest?.(".react-flow__node");
    if (n) {
      nodeEl = n;
      break;
    }
  }
  const nodeId = nodeEl?.getAttribute("data-id") ?? undefined;
  const nodeLabel = nodeEl
    ? (nodeEl.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || undefined
    : undefined;

  // On a Canvas, also capture flow coordinates so the pin tracks pan/zoom.
  const ff = flowFrame(block);
  const flow = ff
    ? { x: (x - ff.left - ff.tx) / ff.k, y: (y - ff.top - ff.ty) / ff.k }
    : undefined;

  const wrapRect = wrap.getBoundingClientRect();
  return {
    anchor: {
      blockId: block.getAttribute("data-kp-block") ?? "",
      blockLabel: labelForBlock(block),
      nodeId,
      nodeLabel,
      line: resolveLine(source, nodeId),
      fx,
      fy,
      flow,
    },
    left: rect.left - wrapRect.left + fx * rect.width,
    top: rect.top - wrapRect.top + fy * rect.height,
  };
}

interface Placed {
  left: number;
  top: number;
  missing: boolean;
}

/* ── the overlay: pins, popovers, click-to-place ─────────────────────────── */
export function CommentLayer({
  wrapRef,
  source,
  comments,
  onChange,
  author,
  commentMode,
  setCommentMode,
  selectedId,
  setSelectedId,
  renderNonce,
  onToggleRail,
}: {
  wrapRef: RefObject<HTMLDivElement | null>;
  source: string;
  comments: KComment[];
  onChange: (next: KComment[]) => void;
  author: string;
  commentMode: boolean;
  setCommentMode: (b: boolean) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  renderNonce: number;
  onToggleRail: () => void;
}) {
  const [positions, setPositions] = useState<Record<string, Placed>>({});
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<{ left: number; top: number; anchor: CommentAnchor } | null>(
    null,
  );
  const [tick, setTick] = useState(0);

  // Recompute pin positions relative to the doc wrap (layout-space, so scroll doesn't matter).
  // A canvas pin re-applies the board's live pan/zoom transform (and clips when off-board); a
  // plain-block pin uses its stored fraction of the block box.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const next: Record<string, Placed> = {};
    for (const c of comments) {
      const block = wrap.querySelector(`[data-kp-block="${CSS.escape(c.anchor.blockId)}"]`);
      if (!block) {
        next[c.id] = { left: 0, top: 0, missing: true };
        continue;
      }
      const ff = c.anchor.flow ? flowFrame(block) : null;
      if (ff && c.anchor.flow) {
        const sx = ff.left + ff.tx + c.anchor.flow.x * ff.k;
        const sy = ff.top + ff.ty + c.anchor.flow.y * ff.k;
        // Clip: hide the pin when its node is panned/zoomed outside the board's viewport.
        const off = sx < ff.left - 2 || sx > ff.right + 2 || sy < ff.top - 2 || sy > ff.bottom + 2;
        next[c.id] = { left: sx - wrapRect.left, top: sy - wrapRect.top, missing: off };
        continue;
      }
      const r = block.getBoundingClientRect();
      next[c.id] = {
        left: r.left - wrapRect.left + c.anchor.fx * r.width,
        top: r.top - wrapRect.top + c.anchor.fy * r.height,
        missing: false,
      };
    }
    setPositions(next);
  }, [comments, renderNonce, tick, wrapRef]);

  // Re-measure on the things that move pins: canvas ELK settling (timers after a render), window
  // resize, the doc reflowing (ResizeObserver), and — crucially — a board being panned/zoomed,
  // which mutates the `.react-flow__viewport` transform. All bumps are rAF-throttled.
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setTick((t) => t + 1);
      });
    };
    const wrap = wrapRef.current;
    const ro = wrap ? new ResizeObserver(schedule) : null;
    if (wrap && ro) ro.observe(wrap);
    window.addEventListener("resize", schedule);
    const mos: MutationObserver[] = [];
    wrap?.querySelectorAll(".react-flow__viewport").forEach((vp) => {
      const mo = new MutationObserver(schedule);
      mo.observe(vp, { attributes: true, attributeFilter: ["style"] });
      mos.push(mo);
    });
    const timers = [120, 400, 900, 1600].map((ms) => window.setTimeout(schedule, ms));
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
      mos.forEach((m) => m.disconnect());
      timers.forEach(clearTimeout);
    };
  }, [renderNonce, comments.length, wrapRef]);

  // `C` toggles comment mode; Esc cancels placing / mode / selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (e.key === "Escape") {
        setPlacing(null);
        setCommentMode(false);
        setSelectedId(null);
        return;
      }
      if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setPlacing(null);
        setCommentMode(!commentMode);
      }
      // `]` toggles the comments rail (FigJam-ish).
      if (e.key === "]" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onToggleRail();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentMode, setCommentMode, setSelectedId, onToggleRail]);

  const placeAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const hit = anchorFromPoint(clientX, clientY, wrap, source);
      setCommentMode(false);
      if (!hit) return;
      setPlacing({ left: hit.left, top: hit.top, anchor: hit.anchor });
    },
    [source, setCommentMode, wrapRef],
  );

  const addComment = (anchor: CommentAnchor, body: string) => {
    const seq = comments.reduce((m, c) => Math.max(m, c.seq), 0) + 1;
    const c: KComment = {
      id: newCommentId(),
      seq,
      author,
      body,
      createdAt: new Date().toISOString(),
      resolved: false,
      anchor,
    };
    onChange([...comments, c]);
    setPlacing(null);
    setSelectedId(c.id);
  };

  const mutate = (id: string, fn: (c: KComment) => KComment) =>
    onChange(comments.map((c) => (c.id === id ? fn(c) : c)));

  const wrap = wrapRef.current;

  return (
    <>
      {/* click-catcher in comment mode */}
      {commentMode && (
        <div
          className="kp-cmt-catcher"
          onClick={(e) => placeAt(e.clientX, e.clientY)}
          title="Click anywhere on the board to comment"
        />
      )}

      {/* pins */}
      <div className="kp-cmt-overlay">
        {comments.map((c) => {
          const p = positions[c.id];
          if (!p || p.missing) return null;
          const selected = selectedId === c.id;
          return (
            <div
              key={c.id}
              className="kp-cmt-pin-wrap"
              style={{ left: p.left, top: p.top }}
              onMouseEnter={() => setHoverId(c.id)}
              onMouseLeave={() => setHoverId((h) => (h === c.id ? null : h))}
            >
              <button
                type="button"
                className={`kp-cmt-pin${c.resolved ? " kp-cmt-pin-done" : ""}${
                  selected ? " kp-cmt-pin-sel" : ""
                }`}
                onClick={() => setSelectedId(selected ? null : c.id)}
                aria-label={`Comment ${c.seq} by ${c.author}`}
              >
                <Avatar name={c.author} size={26} />
              </button>

              {/* hover preview (compact) */}
              {hoverId === c.id && !selected && (
                <div className="kp-cmt-popover kp-cmt-popover-hover">
                  <div className="kp-cmt-head">
                    <Avatar name={c.author} />
                    <div className="kp-cmt-meta">
                      <span className="kp-cmt-author">{c.author || "Anonymous"}</span>
                      <span className="kp-cmt-time">{relativeTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <p className="kp-cmt-body">{c.body}</p>
                </div>
              )}

              {/* selected thread (interactive) */}
              {selected && (
                <div className="kp-cmt-popover">
                  <ThreadCard
                    comment={c}
                    onReply={(b) =>
                      mutate(c.id, (x) => ({
                        ...x,
                        replies: [
                          ...(x.replies ?? []),
                          { author, body: b, createdAt: new Date().toISOString() },
                        ],
                      }))
                    }
                    onResolve={() => mutate(c.id, (x) => ({ ...x, resolved: !x.resolved }))}
                    onDelete={() => {
                      onChange(comments.filter((x) => x.id !== c.id));
                      setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* the new-comment composer at the placed point */}
        {placing && wrap && (
          <div className="kp-cmt-pin-wrap" style={{ left: placing.left, top: placing.top }}>
            <span className="kp-cmt-pin kp-cmt-pin-new">
              <Avatar name={author} size={26} />
            </span>
            <div className="kp-cmt-popover">
              <div className="kp-cmt-place-ctx">
                {placing.anchor.nodeLabel
                  ? `on “${placing.anchor.nodeLabel}”`
                  : `in “${placing.anchor.blockLabel}”`}
                {placing.anchor.line ? ` · line ${placing.anchor.line}` : ""}
              </div>
              <Composer
                placeholder="Comment…"
                submitLabel="Comment"
                onSubmit={(b) => addComment(placing.anchor, b)}
                onCancel={() => setPlacing(null)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── the rail (right drawer) ─────────────────────────────────────────────── */
export function CommentRail({
  comments,
  fileName,
  open,
  onClose,
  onChange,
  selectedId,
  onSelect,
  onCopyToAgent,
}: {
  comments: KComment[];
  fileName: string;
  open: boolean;
  onClose: () => void;
  onChange: (next: KComment[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCopyToAgent: (prompt: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  if (!open) return null;

  const q = query.trim().toLowerCase();
  const list = comments
    .filter((c) => showResolved || !c.resolved)
    .filter(
      (c) =>
        !q ||
        c.body.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        (c.anchor.nodeLabel ?? "").toLowerCase().includes(q),
    )
    .sort((a, b) => a.seq - b.seq);

  const openCount = comments.filter((c) => !c.resolved).length;

  const mutate = (id: string, fn: (c: KComment) => KComment) =>
    onChange(comments.map((c) => (c.id === id ? fn(c) : c)));

  return (
    <aside className="kp-cmt-rail">
      <div className="kp-cmt-rail-head">
        <input
          className="kp-cmt-search"
          placeholder="Search comments…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="kp-cmt-ic"
          title={showResolved ? "Hide resolved" : "Show resolved"}
          onClick={() => setShowResolved((s) => !s)}
        >
          <CheckIcon />
        </button>
        <button type="button" className="kp-cmt-ic" title="Close" onClick={onClose}>
          <XIcon />
        </button>
      </div>

      <button
        type="button"
        className="kp-cmt-copy"
        disabled={openCount === 0}
        onClick={() => onCopyToAgent(buildAgentPrompt(fileName, comments))}
      >
        <SparkIcon /> Copy to Agent
        {openCount > 0 ? <span className="kp-cmt-copy-n">{openCount}</span> : null}
      </button>

      <div className="kp-cmt-rail-list">
        {list.length === 0 ? (
          <p className="kp-cmt-empty">
            <CommentIcon />
            <span>
              Press <kbd>C</kbd> and click the board to leave a comment. Each one is saved next to
              the file with its line and node — ready for an agent.
            </span>
          </p>
        ) : (
          list.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`kp-cmt-card${selectedId === c.id ? " kp-cmt-card-sel" : ""}${
                c.resolved ? " kp-cmt-card-done" : ""
              }`}
              onClick={() => onSelect(c.id)}
            >
              <div className="kp-cmt-card-top">
                <span className="kp-cmt-seq">#{c.seq}</span>
                <span className="kp-cmt-card-ctx">
                  {c.anchor.nodeLabel || c.anchor.blockLabel}
                  {c.anchor.line ? ` · L${c.anchor.line}` : ""}
                </span>
                <button
                  type="button"
                  className={c.resolved ? "kp-cmt-ic kp-cmt-ic-on" : "kp-cmt-ic"}
                  title={c.resolved ? "Reopen" : "Resolve"}
                  onClick={(e) => {
                    e.stopPropagation();
                    mutate(c.id, (x) => ({ ...x, resolved: !x.resolved }));
                  }}
                >
                  <CheckIcon />
                </button>
              </div>
              <div className="kp-cmt-head">
                <Avatar name={c.author} size={22} />
                <div className="kp-cmt-meta">
                  <span className="kp-cmt-author">{c.author || "Anonymous"}</span>
                  <span className="kp-cmt-time">{relativeTime(c.createdAt)}</span>
                </div>
              </div>
              <p className="kp-cmt-body">{c.body}</p>
              {(c.replies?.length ?? 0) > 0 && (
                <span className="kp-cmt-replies-n">
                  {c.replies!.length} repl{c.replies!.length === 1 ? "y" : "ies"}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
