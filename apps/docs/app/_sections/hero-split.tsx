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

export function HeroSplit() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-[0_1px_0_var(--kp-border),0_30px_70px_-36px_rgba(0,0,0,0.30)] lg:grid-cols-2">
        {/* LEFT — the human render. The live landscape board reads cut/tiny on phones, so it is
            DESKTOP-ONLY; mobile gets a compact, legible caption card in its place (a sibling
            lg:hidden). Desktop (≥lg) is unchanged. */}
        <div className="hidden flex-col border-b border-fd-border lg:flex lg:border-r lg:border-b-0">
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

        {/* MOBILE-ONLY stand-in for the human render — a simple, legible caption card (no cut
            board). Reads as the human face of the same authored block; the JSON pane below it is
            the agent face. */}
        <div className="flex flex-col border-b border-fd-border lg:hidden">
          <div className="flex items-center gap-2.5 border-b border-fd-border bg-fd-muted/50 px-4 py-2.5">
            <FoldMark size={13} className="text-kp-accent-text" />
            <span className="font-mono text-[11px] tracking-wide text-fd-foreground">
              brainstorming.mdx
            </span>
            <span className="ml-auto font-mono text-[10px] tracking-[0.08em] text-fd-muted-foreground uppercase opacity-70">
              Human · rendered
            </span>
          </div>
          <div className="flex flex-col gap-2 bg-fd-background px-4 py-5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-kp-accent-text">
              Canvas
            </span>
            <p className="text-[13.5px] leading-relaxed text-pretty text-fd-foreground">
              Your team reads an interactive architecture canvas — nodes, edges, and groups they can
              pan and explore.
            </p>
            <p className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
              The same block, serialized for agents below.
            </p>
          </div>
        </div>

        {/* RIGHT — the agent's context: the same doc as typed, syntax-highlighted knowledge. */}
        <div className="relative flex flex-col bg-fd-card">
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

      <p className="mt-4 text-center font-mono text-[11px] tracking-wide text-fd-muted-foreground">
        One authored block. The board your team reads <span className="text-fd-foreground">is</span>{" "}
        the typed graph your agents read over MCP.
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
