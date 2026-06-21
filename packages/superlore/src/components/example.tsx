"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Example — a doc-only "preview + view code" frame. Renders its live `children` as the rendered
 * result, with a header bar that toggles a code view of the authored source (`code`). Purely
 * presentational (no knowledge face): it's how the docs show a component working *first*, with the
 * source one click away, so a reader sees the result before any technical detail.
 *
 * Author once: pass the live element as children and the same snippet as `code`.
 */
export interface ExampleProps {
  /** The rendered, live component(s). */
  children: React.ReactNode;
  /** The authored source for the example, shown under "View code". */
  code?: string;
  /** Language label for the code view (default `tsx`). */
  lang?: string;
  /** Optional caption shown in the header bar. */
  title?: string;
}

export function Example({ children, code, lang = "tsx", title }: ExampleProps) {
  const [showCode, setShowCode] = React.useState(false);
  const hasCode = typeof code === "string" && code.trim().length > 0;

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-fd-border bg-fd-card">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium tracking-wide text-fd-muted-foreground">
          {title ?? "Preview"}
        </span>
        {hasCode && (
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            aria-expanded={showCode}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2 py-1 text-xs font-medium transition",
              "text-fd-muted-foreground hover:border-fd-primary hover:text-fd-foreground",
            )}
          >
            <CodeGlyph className="size-3.5" />
            {showCode ? "Hide code" : "View code"}
          </button>
        )}
      </div>

      <div className="p-4">{children}</div>

      {hasCode && showCode && (
        <div className="border-t border-fd-border">
          <pre className="m-0 overflow-x-auto rounded-none bg-fd-secondary/40 p-4 text-[13px] leading-relaxed">
            <code className={`language-${lang}`}>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function CodeGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}
