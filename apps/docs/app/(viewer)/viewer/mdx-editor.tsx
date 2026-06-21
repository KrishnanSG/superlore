"use client";

import { useRef } from "react";
import { cn } from "superlore";
import { Code2 } from "lucide-react";

/**
 * The MDX source editor pane for the Viewer's Edit mode. A styled `<textarea>` (no heavy
 * code-editor dependency) with a mono face, a window-style header, and an error-aware border.
 * Tab inserts two spaces rather than moving focus, so editing MDX feels code-like.
 */
export function MdxEditor({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (next: string) => void;
  hasError: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-fd-card transition-colors",
        hasError
          ? "border-[color-mix(in_oklab,var(--kp-danger)_45%,var(--color-fd-border))]"
          : "border-fd-border",
      )}
    >
      <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/40 px-3 py-2">
        <Code2 className="size-3.5 text-kp-accent-text" />
        <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
          MDX source
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 font-mono text-[10px]",
            hasError ? "text-kp-danger" : "text-kp-success",
          )}
        >
          <span
            className={cn("size-1.5 rounded-full", hasError ? "bg-kp-danger" : "bg-kp-success")}
            aria-hidden
          />
          {hasError ? "error" : "live"}
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="MDX source editor"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart, selectionEnd } = el;
            const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
            onChange(next);
            // Restore caret just past the inserted indent on the next frame.
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = selectionStart + 2;
            });
          }
        }}
        className="min-h-[60vh] w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-fd-foreground outline-none lg:min-h-[calc(100vh-12rem)]"
        style={{ tabSize: 2 }}
      />
    </div>
  );
}
