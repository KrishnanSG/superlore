"use client";

/**
 * THE NEW STANDARD — MachineFacePanel (landing section).
 *
 * "The new documentation standard, built for agents." Author once; every agent reads the same
 * structured source over MCP (one URL, the typed graph — not a screenshot), and it renders RIGHT
 * IN THE EDITOR your team already uses — so adopting it is a no-brainer.
 *
 * DESIGN — a left-copy / right-visual split. The left rail carries the editorial head (eyebrow,
 * h2, ≤640px deck). The right is the FOCAL VISUAL: a designed "endpoint" card for `/api/mcp`
 * (window-chrome header + the breathing endpoint chip), a three-node connection diagram
 * — any agent client → one MCP URL → the typed graph — drawn with the page's agent-gradient
 * beam idiom, and the FIVE real tools rendered as designed rows (lucide glyph · mono signature ·
 * real type chip · terse desc) with hover + hairline dividers. Below the focal card, a slim
 * EDITORS ROW MENTIONS that it also lives in your editor — the three official editor marks + the
 * honest one-liner.
 *
 * The card carries one of the page's TWO rationed `.kp-agent-gradient` affordances as a 2px TOP
 * HAIRLINE; the connection beam reuses the same gradient. All colour flows through the global.css
 * token bridge / `color-mix(... var(--kp-*) ...)`; no raw hex (except VS Code's own brand fills),
 * no theme branching in JS. `prefers-reduced-motion` is a HARD gate on the breathing glow.
 */

import { useId } from "react";
import {
  Search,
  FileText,
  ListTree,
  Workflow,
  Boxes,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "../reveal";
import { FoldMark } from "../_fold-mark";
import { mcpTools } from "../_data";

/* The three editor targets. Each `Logo` is the editor's OFFICIAL brand mark, inlined as SVG (no
   external request — a strict runtime CSP blocks those). VS Code is its full-colour ribbon; Cursor
   and Windsurf are their official monochrome glyphs in `currentColor`. */
const editors = [
  { name: "VS Code", Logo: VsCodeMark },
  { name: "Cursor", Logo: CursorMark },
  { name: "Windsurf", Logo: WindsurfMark },
] as const;

/* A lucide glyph per tool, in signature order, so each row reads as a designed entry rather than a
   list item. Order matches `mcpTools` (search · get_page · list · navigate · get_component_data). */
const TOOL_ICONS: readonly LucideIcon[] = [Search, FileText, ListTree, Workflow, Boxes];

export function MachineFacePanel() {
  return (
    <section className="border-t border-fd-border bg-fd-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-[clamp(56px,10vw,128px)]">
        <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* ── Left rail: editorial head, sticky on desktop so the visual scrolls beside it. ── */}
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-kp-accent-text uppercase">
                The new standard
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-balance text-fd-foreground sm:text-4xl">
                The new documentation standard, built for agents.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-pretty text-fd-muted-foreground">
                Author once; every agent reads the same structured source over MCP — one URL, the
                typed graph, not a screenshot. And it renders right in the editor your team already
                uses, so adopting it is a no-brainer.
              </p>

              {/* A small "readable by agents" lockup grounds the copy in the brand mark. */}
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-kp-accent-border bg-kp-accent-weak px-3 py-1">
                <FoldMark size={13} className="text-kp-accent-text" />
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-kp-accent-text uppercase">
                  Readable by agents
                </span>
              </div>
            </div>
          </Reveal>

          {/* ── Right: the FOCAL VISUAL — the MCP endpoint card + tools, then the editors mention. ── */}
          <Reveal delay={80}>
            <div className="flex flex-col gap-5">
              {/* DESKTOP: the full MCP card (connection diagram + five designed tool rows). */}
              <div className="hidden lg:block">
                <McpCard />
              </div>
              {/* MOBILE: a compact "MCP compatible" card — endpoint + one-liner + tool names. The
                  full diagram + tool rows are too heavy on a phone; this keeps just the proof. */}
              <McpCardCompact />
              <EditorsRow />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────── focal visual: the MCP endpoint card ──
   A designed "endpoint" surface: window-chrome header carrying the live `/api/mcp` chip, a
   three-node connection diagram (agent client → one MCP URL → typed graph) on the agent-gradient
   beam, then the five REAL tools as rows. The card's 2px top hairline is one of the page's TWO
   rationed agent-gradient affordances. */

function McpCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
      {/* Agent-gradient 2px top hairline — one of only two agent-gradient uses site-wide. */}
      <div
        aria-hidden
        className="kp-agent-gradient pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 opacity-90"
      />

      {/* Window-chrome header: terminal glyph + endpoint label on the left, the breathing chip right. */}
      <div className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/40 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-md border border-kp-accent-border bg-kp-accent-weak text-kp-accent-text">
            <Terminal className="size-3.5" />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
            MCP server
          </span>
        </div>
        <EndpointChip />
      </div>

      {/* The connection diagram — any agent client → one MCP URL → the typed graph. */}
      <ConnectionDiagram />

      {/* The five real tools — designed rows with a glyph, mono signature, type chip, and desc,
          separated by hairline dividers and lit by a calm accent wash on hover. */}
      <div className="border-t border-fd-border">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
            First-class tools
          </span>
          <span className="font-mono text-[11px] text-fd-muted-foreground">
            {mcpTools.length} over one corpus
          </span>
        </div>
        <style>{`
          .kp-tool-row {
            transition: background-color 140ms ease, box-shadow 140ms ease;
          }
          .kp-tool-row:hover {
            background-color: color-mix(in oklab, var(--kp-accent) 7%, transparent);
            box-shadow: inset 2px 0 0 0 var(--kp-accent);
          }
        `}</style>
        <ul className="px-2 pb-3 sm:px-3">
          {mcpTools.map((t, i) => {
            const Icon = TOOL_ICONS[i] ?? Boxes;
            return (
              <li key={t.signature} className="border-t border-fd-border/70 first:border-t-0">
                <div className="kp-tool-row group flex items-center gap-3.5 rounded-lg px-3 py-3.5 sm:px-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-muted/50 text-fd-muted-foreground transition-colors group-hover:border-kp-accent-border group-hover:bg-kp-accent-weak group-hover:text-kp-accent-text">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <code className="font-mono text-[13px] font-medium text-fd-foreground">
                        {t.signature}
                      </code>
                      <span className="rounded-md border border-fd-border bg-fd-muted/60 px-1.5 py-px font-mono text-[10.5px] text-fd-muted-foreground">
                        {t.typeChip}
                      </span>
                    </div>
                    <span className="truncate text-[13px] leading-snug text-fd-muted-foreground">
                      {t.desc}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────── mobile-compact MCP card (lg:hidden) ──
   A phone doesn't need the full diagram + five designed rows. Keep the proof: the MCP server
   header + live endpoint chip, a one-liner that it's compatible with any agent client, and the
   tool names as compact chips. */
function McpCardCompact() {
  return (
    <div className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card lg:hidden">
      <div aria-hidden className="kp-agent-gradient h-0.5 w-full opacity-90" />
      <div className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-md border border-kp-accent-border bg-kp-accent-weak text-kp-accent-text">
            <Terminal className="size-3.5" />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
            MCP server
          </span>
        </div>
        <EndpointChip />
      </div>
      <div className="space-y-3 px-4 py-4">
        <p className="text-[13.5px] leading-relaxed text-pretty text-fd-muted-foreground">
          Compatible with any agent client — Claude, Cursor, Windsurf — over one MCP URL. The typed
          graph, not a screenshot.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {mcpTools.map((t) => (
            <li
              key={t.signature}
              className="rounded-md border border-fd-border bg-fd-muted/50 px-2 py-1 font-mono text-[11px] text-fd-muted-foreground"
            >
              {t.signature.split("(")[0]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── the connection diagram ──
   Three nodes on one horizontal rail — any agent client → one MCP URL → the typed graph —
   joined by the agent-gradient beam. The middle (MCP URL) node is the emphasised, accent-tinted
   hub; the flanking nodes are calm neutral surfaces. Stacks to a vertical rail on narrow widths. */

function ConnectionDiagram() {
  return (
    <div className="relative px-5 py-7 sm:px-8 sm:py-9">
      {/* The beam: a horizontal agent-gradient hairline behind the row on wider widths, masked to
          fade at both ends so the nodes sit ON it rather than being cut by a hard line. */}
      <style>{`
        .kp-conn-beam {
          mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
        }
      `}</style>
      <div
        aria-hidden
        className="kp-conn-beam kp-agent-gradient pointer-events-none absolute top-1/2 right-6 left-6 hidden h-px -translate-y-1/2 opacity-90 sm:block"
      />
      <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <DiagramNode label="Any agent client" sub="Claude · Cursor · …" />
        <ConnArrow />
        <DiagramNode label="One MCP URL" sub="/api/mcp" accent />
        <ConnArrow />
        <DiagramNode label="The typed graph" sub="not a screenshot" />
      </div>
    </div>
  );
}

function DiagramNode({
  label,
  sub,
  accent = false,
}: {
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative z-10 flex flex-1 flex-col items-center rounded-xl border px-3 py-3 text-center backdrop-blur-sm ${
        accent ? "border-kp-accent-border bg-kp-accent-weak" : "border-fd-border bg-fd-card"
      }`}
    >
      <span
        className={`text-[12.5px] font-semibold tracking-tight ${
          accent ? "text-kp-accent-text" : "text-fd-foreground"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-0.5 font-mono text-[10.5px] ${
          accent ? "text-kp-accent-text/80" : "text-fd-muted-foreground"
        }`}
      >
        {sub}
      </span>
    </div>
  );
}

/* The connector between nodes: a vertical chevron when stacked, a horizontal flow-dot run when
   inline (the beam carries the line; this dot signals direction without a second hard rule). */
function ConnArrow() {
  return (
    <span aria-hidden className="relative z-10 flex shrink-0 items-center justify-center">
      <span className="kp-conn-dot block size-1.5 rounded-full bg-[var(--kp-accent)] opacity-80 sm:size-2" />
    </span>
  );
}

/* ──────────────────────────────────────── official editor marks (inline SVG) ──
   Each ~26px. VS Code keeps its full-colour three-tone ribbon (its own brand blues). Cursor and
   Windsurf use their official monochrome glyphs in `currentColor`, tinted toward the accent via
   `text-kp-accent-text`. Exact brand geometry, inlined — never a fetched asset. */

/** VS Code — the official full-colour angular ribbon mark. */
function VsCodeMark() {
  return (
    <svg viewBox="0 0 32 32" width={24} height={24} role="img" aria-label="Visual Studio Code">
      <path
        d="M29.01,5.03,23.244,2.254a1.742,1.742,0,0,0-1.989.338L2.38,19.8A1.166,1.166,0,0,0,2.3,21.447c.025.027.05.053.077.077l1.541,1.4a1.165,1.165,0,0,0,1.489.066L28.142,5.75A1.158,1.158,0,0,1,30,6.672V6.605A1.748,1.748,0,0,0,29.01,5.03Z"
        fill="#0065a9"
      />
      <path
        d="M29.01,26.97l-5.766,2.777a1.745,1.745,0,0,1-1.989-.338L2.38,12.2A1.166,1.166,0,0,1,2.3,10.553c.025-.027.05-.053.077-.077l1.541-1.4A1.165,1.165,0,0,1,5.41,9.01L28.142,26.25A1.158,1.158,0,0,0,30,25.328V25.4A1.749,1.749,0,0,1,29.01,26.97Z"
        fill="#007acc"
      />
      <path
        d="M23.244,29.747a1.745,1.745,0,0,1-1.989-.338A1.025,1.025,0,0,0,23,28.684V3.316a1.024,1.024,0,0,0-1.749-.724,1.744,1.744,0,0,1,1.989-.339l5.765,2.772A1.748,1.748,0,0,1,30,6.6V25.4a1.748,1.748,0,0,1-.991,1.576Z"
        fill="#1f9cf0"
      />
    </svg>
  );
}

/** Cursor — the official monochrome mark. */
function CursorMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      role="img"
      aria-label="Cursor"
      fill="currentColor"
      className="text-kp-accent-text"
    >
      <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
    </svg>
  );
}

/** Windsurf — the official monochrome mark. */
function WindsurfMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      role="img"
      aria-label="Windsurf"
      fill="currentColor"
      className="text-kp-accent-text"
    >
      <path d="M23.55 5.067c-1.2038-.002-2.1806.973-2.1806 2.1765v4.8676c0 .972-.8035 1.7594-1.7597 1.7594-.568 0-1.1352-.286-1.4718-.7659l-4.9713-7.1003c-.4125-.5896-1.0837-.941-1.8103-.941-1.1334 0-2.1533.9635-2.1533 2.153v4.8957c0 .972-.7969 1.7594-1.7596 1.7594-.57 0-1.1363-.286-1.4728-.7658L.4076 5.1598C.2822 4.9798 0 5.0688 0 5.2882v4.2452c0 .2147.0656.4228.1884.599l5.4748 7.8183c.3234.462.8006.8052 1.3509.9298 1.3771.313 2.6446-.747 2.6446-2.0977v-4.893c0-.972.7875-1.7593 1.7596-1.7593h.003a1.798 1.798 0 0 1 1.4718.7658l4.9723 7.0994c.4135.5905 1.05.941 1.8093.941 1.1587 0 2.1515-.9645 2.1515-2.153v-4.8948c0-.972.7875-1.7594 1.7596-1.7594h.194a.22.22 0 0 0 .2204-.2202v-4.622a.22.22 0 0 0-.2203-.2203Z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────── below: lives in your editor (mention) ──
   A slim secondary card under the MCP focal card: the three official editor marks + the honest
   one-liner. Deliberately calmer than the MCP card — no gradient hairline — so the MCP stays hero. */

function EditorsRow() {
  return (
    <div className="rounded-2xl border border-fd-border bg-fd-muted/30 px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-fd-muted-foreground uppercase">
          Lives in your editor
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {editors.map(({ name, Logo }) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-2.5 py-1.5"
            >
              <Logo />
              <span className="text-[13px] font-medium text-fd-foreground">{name}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3.5 text-[13px] leading-relaxed text-pretty text-fd-muted-foreground">
        One <span className="font-medium text-fd-foreground">superlore preview extension</span> runs
        in VS Code — and Cursor and Windsurf are VS Code-compatible forks, so the same extension
        renders superlore live there too.
      </p>
    </div>
  );
}

/**
 * The `/api/mcp` endpoint chip — the page's ONE reserved standing motion: a slow, low-amplitude
 * breathing glow on opacity + box-shadow, all token-derived. `prefers-reduced-motion` collapses it
 * to a static, dimly-lit chip (no animation). Single-class selectors only.
 */
function EndpointChip() {
  const id = useId().replace(/[:]/g, "");
  const cls = `kp-mcp-endpoint-${id}`;
  return (
    <>
      <style>{`
        .${cls} {
          box-shadow: 0 0 0 0 color-mix(in oklab, var(--kp-accent) 0%, transparent);
          animation: ${cls}-breathe 4.8s ease-in-out infinite;
        }
        @keyframes ${cls}-breathe {
          0%, 100% {
            opacity: 0.82;
            box-shadow: 0 0 0 0 color-mix(in oklab, var(--kp-accent) 0%, transparent);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 12px 1px color-mix(in oklab, var(--kp-accent) 28%, transparent);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .${cls} {
            animation: none;
            opacity: 0.9;
            box-shadow: none;
          }
        }
      `}</style>
      <span
        className={`${cls} inline-flex items-center gap-1.5 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2.5 py-1 font-mono text-[11px] tracking-wide text-kp-accent-text`}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--kp-accent)]" />
        /api/mcp
      </span>
    </>
  );
}
