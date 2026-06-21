"use client";

import type { ReactNode } from "react";
import { cn } from "superlore";
import { FileText, MessageSquarePlus, Sparkles } from "lucide-react";

interface SampleChip {
  label: string;
  onLoad: () => void;
}

/**
 * The Viewer's upload empty state — a polished, on-brand drop target. The superlore mark sits in a
 * gradient ring that breathes (a slow pulse) and sweeps a soft violet conic glow; both motions are
 * scoped to this component and disabled under `prefers-reduced-motion`. Light and dark are co-equal
 * (everything rides `--kp-*` / `--color-fd-*` tokens). Drag-over intensifies the ring.
 */
export function EmptyState({
  dragging,
  status,
  error,
  mark,
  samples,
  fileInput,
  onDragStateChange,
  onDrop,
  onChooseFile,
  onLoadExample,
}: {
  dragging: boolean;
  status: "empty" | "compiling" | "ready" | "error";
  error: string;
  mark: ReactNode;
  samples: readonly SampleChip[];
  fileInput: ReactNode;
  onDragStateChange: (dragging: boolean) => void;
  onDrop: (file: File | undefined) => void;
  onChooseFile: () => void;
  onLoadExample: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-2xl flex-col items-center justify-center px-5 py-16">
      {/* Component-scoped keyframes. Disabled under prefers-reduced-motion. */}
      <style>{`
        @keyframes kp-vw-breathe {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.06); opacity: 0.9; }
        }
        @keyframes kp-vw-sweep { to { transform: rotate(360deg); } }
        @keyframes kp-vw-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .kp-vw-ring { animation: kp-vw-breathe 4.2s ease-in-out infinite; }
        .kp-vw-sweep { animation: kp-vw-sweep 9s linear infinite; }
        .kp-vw-mark { animation: kp-vw-float 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kp-vw-ring, .kp-vw-sweep, .kp-vw-mark { animation: none; }
        }
      `}</style>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          onDragStateChange(true);
        }}
        onDragLeave={() => onDragStateChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDragStateChange(false);
          onDrop(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border p-14 text-center transition-colors duration-200",
          dragging
            ? "border-kp-accent bg-kp-accent-weak"
            : "border-fd-border bg-fd-card hover:border-kp-accent-border",
        )}
      >
        {/* Soft brand wash behind everything; lifts on drag-over. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-200",
            dragging ? "opacity-100" : "opacity-60 group-hover:opacity-100",
          )}
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, var(--kp-accent) 9%, transparent), transparent 70%)",
          }}
        />

        {/* The mark inside a breathing gradient ring with a slow conic sweep. */}
        <span className="relative grid size-20 place-items-center">
          <span
            aria-hidden
            className="kp-vw-ring absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--kp-accent) 22%, transparent), transparent)",
            }}
          />
          <span aria-hidden className="absolute inset-0 overflow-hidden rounded-full">
            <span
              className="kp-vw-sweep absolute inset-[-40%]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--kp-agent-to) 38%, transparent) 90deg, transparent 200deg)",
              }}
            />
          </span>
          <span
            className="relative grid size-14 place-items-center rounded-2xl border border-kp-accent-border"
            style={{
              background:
                "linear-gradient(145deg, color-mix(in oklab, var(--kp-accent-weak) 90%, var(--color-fd-card)), var(--color-fd-card))",
            }}
          >
            <span className="kp-vw-mark">{mark}</span>
          </span>
        </span>

        <span className="relative text-lg font-semibold text-fd-foreground">
          Drop a superlore <code className="font-mono text-kp-accent-text">.mdx</code>
          <span className="text-fd-muted-foreground"> or plain </span>
          <code className="font-mono">.md</code>
        </span>
        <span className="relative max-w-sm text-sm leading-relaxed text-fd-muted-foreground">
          See it rendered instantly — every component, the full theme, even whiteboards. Add inline
          comments, edit the source live, and export it. Runs locally in your browser; nothing is
          uploaded.
        </span>

        <span
          className={cn(
            "relative font-mono text-[11px] tracking-wider uppercase transition-colors",
            dragging ? "text-kp-accent-text" : "text-fd-muted-foreground/70",
          )}
        >
          {dragging ? "Release to render" : "Drag and drop anywhere here"}
        </span>

        {fileInput}
      </label>

      <div className="mt-5 flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={onLoadExample}
          className="inline-flex items-center gap-1.5 rounded-md bg-kp-accent px-3.5 py-2 font-medium text-white transition hover:bg-kp-accent-hover"
        >
          <Sparkles className="size-3.5" /> Load an example
        </button>
        <button
          type="button"
          onClick={onChooseFile}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3.5 py-2 text-fd-foreground transition hover:border-kp-accent-border"
        >
          <FileText className="size-3.5" /> Choose a file
        </button>
      </div>

      {samples.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[10px] tracking-wider text-fd-muted-foreground/70 uppercase">
            Try
          </span>
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.onLoad}
              className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs text-fd-muted-foreground transition hover:border-kp-accent-border hover:text-kp-accent-text"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] text-fd-muted-foreground">
        <MessageSquarePlus className="size-3" /> Block-level comments + JSON export, all client-side
      </p>

      {status === "compiling" && (
        <p className="mt-6 animate-pulse text-sm text-fd-muted-foreground">Rendering…</p>
      )}
      {status === "error" && (
        <div className="mt-6 w-full rounded-lg border border-[color-mix(in_oklab,var(--kp-danger)_50%,var(--color-fd-border))] bg-[color-mix(in_oklab,var(--kp-danger)_8%,var(--color-fd-card))] p-4">
          <p className="text-sm font-semibold text-fd-foreground">Couldn&apos;t render that file</p>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-fd-muted-foreground">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
