"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "superlore";
import {
  Check,
  CheckCheck,
  MapPin,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { Comment } from "./comments";

/* ── Composer ──────────────────────────────────────────────────────────── */

function Composer({
  initialBody = "",
  initialAuthor = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialBody?: string;
  initialAuthor?: string;
  submitLabel: string;
  onSubmit: (body: string, author: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [author, setAuthor] = useState(initialAuthor);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed, author.trim());
  };

  return (
    <div className="rounded-md border border-kp-accent-border bg-fd-card p-2.5">
      <textarea
        ref={ref}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        rows={3}
        placeholder="Add a comment…"
        className="w-full resize-y rounded-sm border border-fd-border bg-fd-background px-2 py-1.5 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground focus:border-kp-accent-border"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Name (optional)"
          className="min-w-0 flex-1 rounded-sm border border-fd-border bg-fd-background px-2 py-1 font-mono text-xs text-fd-foreground outline-none placeholder:text-fd-muted-foreground focus:border-kp-accent-border"
        />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-2 py-1 text-xs text-fd-muted-foreground transition hover:text-fd-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim()}
          className="text-kp-accent-ink rounded-sm bg-kp-accent px-2.5 py-1 text-xs font-medium transition hover:bg-kp-accent-hover disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-fd-muted-foreground">
        ⌘↵ to save · Esc to cancel
      </p>
    </div>
  );
}

/* ── A single comment card ─────────────────────────────────────────────── */

function CommentCard({
  comment,
  missing,
  onEdit,
  onDelete,
  onToggleResolved,
}: {
  comment: Comment;
  missing: boolean;
  onEdit: (body: string, author: string) => void;
  onDelete: () => void;
  onToggleResolved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const when = new Date(comment.createdAt);
  const time = Number.isNaN(when.getTime())
    ? ""
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  if (editing) {
    return (
      <Composer
        initialBody={comment.body}
        initialAuthor={comment.author ?? ""}
        submitLabel="Save"
        onSubmit={(body, author) => {
          onEdit(body, author);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "group/card rounded-md border bg-fd-card p-2.5 transition",
        comment.resolved
          ? "border-fd-border opacity-65"
          : "border-fd-border hover:border-kp-accent-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-fd-foreground">
            {comment.author || "Anonymous"}
          </span>
          {time && (
            <span className="shrink-0 font-mono text-[10px] text-fd-muted-foreground">{time}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/card:opacity-100">
          <button
            type="button"
            title={comment.resolved ? "Reopen" : "Resolve"}
            onClick={onToggleResolved}
            className="rounded-sm p-1 text-fd-muted-foreground transition hover:bg-fd-muted hover:text-kp-success"
          >
            {comment.resolved ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
          </button>
          <button
            type="button"
            title="Edit"
            onClick={() => setEditing(true)}
            className="rounded-sm p-1 text-fd-muted-foreground transition hover:bg-fd-muted hover:text-fd-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={onDelete}
            className="rounded-sm p-1 text-fd-muted-foreground transition hover:bg-fd-muted hover:text-kp-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm break-words whitespace-pre-wrap text-fd-foreground">
        {comment.body}
      </p>
      {comment.resolved && (
        <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-kp-success uppercase">
          <CheckCheck className="size-3" /> Resolved
        </span>
      )}
      {missing && (
        <span
          title="The block this comment was anchored to is no longer in the document."
          className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-kp-warning/40 bg-kp-warning/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-kp-warning uppercase"
        >
          <MapPin className="size-3" /> Needs relocation
        </span>
      )}
    </div>
  );
}

/* ── A group of comments for one anchored block ────────────────────────── */

export interface CommentGroup {
  anchorId: string;
  quote: string;
  /** Vertical offset (px) of the block within the doc scroll container; undefined if missing. */
  top?: number;
  comments: Comment[];
  missing: boolean;
}

export function CommentRail({
  groups,
  composingFor,
  onSubmitNew,
  onCancelCompose,
  onEdit,
  onDelete,
  onToggleResolved,
  onFocusBlock,
}: {
  groups: CommentGroup[];
  composingFor: string | null;
  onSubmitNew: (anchorId: string, body: string, author: string) => void;
  onCancelCompose: () => void;
  onEdit: (id: string, body: string, author: string) => void;
  onDelete: (id: string) => void;
  onToggleResolved: (id: string) => void;
  onFocusBlock: (anchorId: string) => void;
}) {
  const hasAny = groups.some((g) => g.comments.length > 0) || composingFor !== null;

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-fd-border px-3 pb-2.5">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
          Comments
        </span>
        <span className="font-mono text-[11px] text-fd-muted-foreground">
          {groups.reduce((n, g) => n + g.comments.length, 0)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3">
        {!hasAny && (
          <p className="px-1 text-xs leading-relaxed text-fd-muted-foreground">
            Hover any block in the document and click the{" "}
            <MessageSquarePlus className="inline size-3 align-text-bottom" /> to start a thread.
            Comments stay in your browser — export them as a sidecar to share.
          </p>
        )}

        <div className="flex flex-col gap-4 pb-10">
          {groups.map((g) => {
            const showComposer = composingFor === g.anchorId;
            if (g.comments.length === 0 && !showComposer) return null;
            return (
              <div key={g.anchorId} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onFocusBlock(g.anchorId)}
                  className="group/anchor flex w-full items-center gap-1.5 text-left"
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      g.missing ? "bg-kp-warning" : "bg-kp-accent",
                    )}
                  />
                  <span className="truncate font-mono text-[10px] text-fd-muted-foreground transition group-hover/anchor:text-kp-accent-text">
                    {g.quote ? `“${g.quote}”` : g.anchorId}
                  </span>
                </button>
                <div className="flex flex-col gap-1.5 border-l border-fd-border pl-2.5">
                  {g.comments.map((c) => (
                    <CommentCard
                      key={c.id}
                      comment={c}
                      missing={g.missing}
                      onEdit={(body, author) => onEdit(c.id, body, author)}
                      onDelete={() => onDelete(c.id)}
                      onToggleResolved={() => onToggleResolved(c.id)}
                    />
                  ))}
                  {showComposer && (
                    <Composer
                      submitLabel="Comment"
                      onSubmit={(body, author) => onSubmitNew(g.anchorId, body, author)}
                      onCancel={onCancelCompose}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export { Composer };
