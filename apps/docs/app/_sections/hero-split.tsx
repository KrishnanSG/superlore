"use client";

/**
 * HeroSplit — the hero centrepiece (the chosen "Option B"): one authored doc, two faces.
 *
 * LEFT  — the human render: a live `<Canvas bare>` of the architecture.
 * RIGHT — the SAME content as the typed knowledge an agent reads via `get_component_data(...)`,
 *         shown as richly syntax-highlighted JSON (JetBrains Mono, line gutter, an editor surface) —
 *         not a flat gray dump.
 *
 * Both lanes derive from the SAME `systemSpec` / `systemGraph()` in `_data`, so the render and the
 * serialization provably can't drift. The syntax palette flows through theme tokens
 * (`--kp-accent-text`, `--kp-code-string`, `--kp-code-number`); light and dark are co-equal.
 */

import type { ReactNode } from "react";
import { Canvas } from "superlore";

import { systemSpec, systemGraph } from "../_data";
import { FoldMark } from "../_fold-mark";

const JSON_SRC = JSON.stringify(systemGraph().graph, null, 2);

/**
 * Tokenize pretty-printed JSON into HTML spans (keys / strings / numbers / booleans). The input is
 * our OWN `_data`, never user input, and is HTML-escaped first — so the `dangerouslySetInnerHTML`
 * below is safe. Returns one HTML string per source line (tokens never straddle a newline in pretty
 * JSON), so the caller can render a line-numbered gutter.
 */
function highlightLines(src: string): string[] {
  const esc = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = esc.replace(
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = "tok-num";
      if (m.startsWith('"')) cls = m.trimEnd().endsWith(":") ? "tok-key" : "tok-str";
      else if (m === "true" || m === "false" || m === "null") cls = "tok-bool";
      return `<span class="${cls}">${m}</span>`;
    },
  );
  return html.split("\n");
}

const LINES = highlightLines(JSON_SRC);
const PANE_HEIGHT = 372;

/* ── MOBILE showcase ──────────────────────────────────────────────────────────────────
   On a phone the desktop split (board beside a wall of JSON) loses the point — the JSON dominates
   and the board reads cut. So mobile leads with a compact shelf of REAL, legible surfaces — the
   "rich, structured docs — canvases, boards, timelines" the headline promises — each carrying the
   same "Readable by agents" badge that makes the dual-rep point without a JSON dump. Desktop (≥lg) is
   untouched. */
const MOBILE_SURFACES: { file: string; title: string; surface: ReactNode }[] = [
  {
    file: "architecture.mdx",
    title: "Architecture",
    surface: <Canvas bare spec={systemSpec} height={240} />,
  },
];

export function HeroSplit() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* DESKTOP — the dual-rep split (board beside the typed JSON). Hidden < lg, where a phone
          turns it into a wall of JSON; mobile gets the surface shelf below instead. Unchanged ≥lg. */}
      <div className="hidden overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-[0_1px_0_var(--kp-border),0_30px_70px_-36px_rgba(0,0,0,0.30)] lg:grid lg:grid-cols-2">
        {/* LEFT — the human render: the live board. */}
        <div className="flex flex-col border-b border-fd-border lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2.5 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
            <FoldMark size={13} className="text-kp-accent-text" />
            <span className="font-mono text-[11px] tracking-wide text-fd-foreground">
              brainstorming.mdx
            </span>
            <span className="ml-auto font-mono text-[10px] tracking-[0.08em] text-fd-muted-foreground uppercase opacity-70">
              Human · rendered
            </span>
          </div>
          <div className="hs-canvas bg-fd-background">
            <Canvas bare spec={systemSpec} height={PANE_HEIGHT} />
          </div>
        </div>

        {/* RIGHT — the agent's context: the same doc as typed, syntax-highlighted knowledge.
            Desktop-only — beside the board it proves "one block, two faces"; alone on a phone it is
            just a wall of JSON, so mobile leads with the board and the caption below states the moat. */}
        <div className="relative hidden flex-col bg-fd-card lg:flex">
          <span
            aria-hidden
            className="kp-agent-gradient absolute inset-x-0 top-0 h-0.5 opacity-90"
          />
          <div className="flex items-center gap-2.5 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
            <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
              get_component_data(
              <span className="text-kp-accent-text">&quot;brainstorming&quot;</span>)
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 font-mono text-[9.5px] font-medium tracking-wide text-kp-accent-text">
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--kp-accent)]" />
              agent · /api/mcp
            </span>
          </div>
          <div className="hs-code h-[220px] overflow-auto bg-fd-muted/15 lg:h-[372px]">
            {LINES.map((line, i) => (
              <div key={i} className="hs-row">
                <span className="hs-ln" aria-hidden>
                  {i + 1}
                </span>
                <code className="hs-tok" dangerouslySetInnerHTML={{ __html: line || " " }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE — a compact shelf of real, legible surfaces (canvas / roster / timeline). Each
          carries the "Readable by agents" badge, so the dual-rep point lands without a JSON dump. */}
      <div className="flex flex-col gap-3.5 lg:hidden">
        {MOBILE_SURFACES.map((s) => (
          <div
            key={s.file}
            className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-[0_1px_0_var(--kp-border),0_18px_40px_-30px_rgba(0,0,0,0.30)]"
          >
            <div className="flex items-center gap-2.5 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
              <FoldMark size={13} className="text-kp-accent-text" />
              <span className="font-mono text-[11px] tracking-wide text-fd-foreground">
                {s.file}
              </span>
              <span className="ml-auto font-mono text-[10px] tracking-[0.08em] text-fd-muted-foreground uppercase opacity-70">
                Readable by agents
              </span>
            </div>
            <div className="px-4 py-4">
              <h3 className="mb-2.5 text-sm font-semibold text-fd-foreground">{s.title}</h3>
              <div className="[&_*]:max-w-full">{s.surface}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 hidden text-center font-mono text-[11px] tracking-wide text-fd-muted-foreground lg:block">
        One authored block. The board your team reads <span className="text-fd-foreground">is</span>{" "}
        the typed graph your agents read over MCP.
      </p>
      <p className="mt-5 text-center font-mono text-[11px] tracking-wide text-pretty text-fd-muted-foreground lg:hidden">
        Every surface renders for your team — and is read by your agents over MCP.
      </p>

      <style>{`
        /* On phones the landscape board is sparse at full height — cap it so the stacked split
           (canvas + the short JSON peek) stays compact. Desktop keeps the full paired height. */
        @media (max-width: 1023px) {
          .hs-canvas > div { height: 300px !important; }
        }
        .hs-code { font-family: var(--font-mono, ui-monospace, monospace); padding: 0.5rem 0; }
        .hs-row { display: grid; grid-template-columns: 2.75rem 1fr; align-items: baseline; }
        .hs-ln {
          user-select: none;
          text-align: right;
          padding-right: 0.85rem;
          font-size: 11px;
          line-height: 1.7;
          color: color-mix(in oklab, var(--color-fd-muted-foreground) 55%, transparent);
        }
        .hs-tok {
          display: block;
          white-space: pre;
          padding-right: 1rem;
          font-size: 11.5px;
          line-height: 1.7;
          /* base = punctuation / braces / commas */
          color: color-mix(in oklab, var(--color-fd-muted-foreground) 90%, var(--color-fd-foreground));
        }
        .hs-tok .tok-key { color: var(--kp-accent-text); }
        .hs-tok .tok-str { color: var(--kp-code-string); }
        .hs-tok .tok-num,
        .hs-tok .tok-bool { color: var(--kp-code-number); }
      `}</style>
    </div>
  );
}
