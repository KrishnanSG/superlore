"use client";

import * as runtime from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { evaluate } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import { rehypeCode, rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins/rehype-code";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { DocsBody } from "superlore/ui";
import { getMDXComponents, cn } from "superlore";
import { AlertTriangle, Cloud, Code2, Download, Eye, FileText, Share2, Upload } from "lucide-react";
import { remarkSuperloreCanvas } from "@/lib/remark-superlore-canvas.mjs";
import { rehypeKpBlockIds } from "@/lib/rehype-kp-block-ids.mjs";
import { SuperloreMark } from "@/lib/logo";
import { CommentRail, type CommentGroup } from "./comment-rail";
import { MdxEditor } from "./mdx-editor";
import { EmptyState } from "./empty-state";
import { fromSidecar, groupByAnchor, newCommentId, toSidecar, type Comment } from "./comments";

type MdxComponent = ComponentType<{ components?: Record<string, unknown> }>;
type Status = "empty" | "compiling" | "ready" | "error";

/** A block discovered in the rendered DOM, in document order. */
interface BlockInfo {
  id: string;
  quote: string;
  order: number;
}

const EXAMPLE = `---
title: Checkout platform — technical spec
summary: A worked architecture spec rendered live in the Viewer — the diagram and the prose behind it.
---

# Checkout platform — technical spec

This is a real-shaped **specification document**, rendered live in the Viewer. The architecture is
a superlore whiteboard, not a picture — the agent gets the same nodes, edges and regions you see.
Everything below the diagram explains it the way an engineer would write it up.

<Note title="Dual representation">
  Author the diagram once. Humans get this interactive board; agents get the structured graph
  behind it over MCP. One corpus.
</Note>

## Architecture

\`\`\`superlore-canvas
{
  "title": "Checkout — request to settlement",
  "layout": "auto",
  "direction": "down",
  "height": 720,
  "groups": [
    { "id": "edge", "label": "Edge", "frame": true, "intent": "gray" },
    { "id": "app", "label": "Application tier", "frame": true, "intent": "blue" },
    { "id": "cart", "label": "Cart & pricing", "frame": true, "parent": "app", "intent": "blue" },
    { "id": "order", "label": "Order & payment", "frame": true, "parent": "app", "intent": "purple" },
    { "id": "data", "label": "Data tier", "frame": true, "intent": "green" },
    { "id": "async", "label": "Async / events", "frame": true, "intent": "orange" },
    { "id": "external", "label": "External providers", "frame": true, "intent": "teal" }
  ],
  "nodes": [
    { "id": "client", "kind": "circle", "intent": "gray", "label": "Browser / app" },
    { "id": "cdn", "kind": "icon", "icon": "globe", "group": "edge", "intent": "gray", "label": "CDN + WAF" },
    { "id": "gw", "kind": "icon", "icon": "shield", "group": "edge", "intent": "blue", "label": "API gateway" },

    { "id": "cartsvc", "kind": "rounded", "group": "cart", "intent": "blue", "label": "Cart service" },
    { "id": "price", "kind": "rounded", "group": "cart", "intent": "blue", "label": "Pricing & promos" },
    { "id": "inv", "kind": "rounded", "group": "cart", "intent": "blue", "label": "Inventory check" },

    { "id": "ordersvc", "kind": "rounded", "group": "order", "intent": "purple", "label": "Order service" },
    { "id": "saga", "kind": "diamond", "group": "order", "intent": "purple", "label": "Payment authorized?" },
    { "id": "paysvc", "kind": "rounded", "group": "order", "intent": "purple", "label": "Payment service" },
    { "id": "idem", "kind": "annotation", "group": "order", "label": "idempotency key per attempt" },

    { "id": "ordersdb", "kind": "cylinder", "group": "data", "intent": "green", "label": "Orders DB (primary)" },
    { "id": "replica", "kind": "cylinder", "group": "data", "intent": "green", "label": "Read replica" },
    { "id": "redis", "kind": "cylinder", "group": "data", "intent": "green", "label": "Redis — hot carts" },

    { "id": "bus", "kind": "icon", "icon": "activity", "group": "async", "intent": "orange", "label": "Event bus" },
    { "id": "fulfil", "kind": "process", "group": "async", "intent": "orange", "label": "Fulfilment worker" },
    { "id": "email", "kind": "process", "group": "async", "intent": "orange", "label": "Receipt / email" },
    { "id": "dlq", "kind": "card", "group": "async", "intent": "red", "label": "Dead-letter queue" },

    { "id": "psp", "kind": "icon", "icon": "credit-card", "group": "external", "intent": "teal", "label": "Card processor" },
    { "id": "tax", "kind": "icon", "icon": "calculator", "group": "external", "intent": "teal", "label": "Tax / VAT API" }
  ],
  "edges": [
    { "from": "client", "to": "cdn", "label": "HTTPS" },
    { "from": "cdn", "to": "gw", "label": "cache miss" },
    { "from": "gw", "to": "cartsvc", "label": "/cart", "rel": "links" },
    { "from": "cartsvc", "to": "price", "rel": "depends-on" },
    { "from": "cartsvc", "to": "inv", "rel": "depends-on" },
    { "from": "cartsvc", "to": "redis", "label": "read/write", "rel": "depends-on" },
    { "from": "price", "to": "tax", "kind": "dashed", "label": "quote", "rel": "see-also" },

    { "from": "gw", "to": "ordersvc", "label": "/checkout", "rel": "links" },
    { "from": "ordersvc", "to": "saga", "label": "place order" },
    { "from": "saga", "to": "paysvc", "label": "yes" },
    { "from": "paysvc", "to": "psp", "label": "authorize", "rel": "depends-on" },
    { "from": "saga", "to": "dlq", "kind": "dashed", "label": "no → compensate", "rel": "blocks" },

    { "from": "ordersvc", "to": "ordersdb", "label": "writes", "rel": "depends-on" },
    { "from": "ordersdb", "to": "replica", "kind": "dashed", "label": "replication" },
    { "from": "ordersvc", "to": "bus", "label": "OrderPlaced", "rel": "links" },
    { "from": "bus", "to": "fulfil" },
    { "from": "bus", "to": "email" },
    { "from": "fulfil", "to": "dlq", "kind": "dashed", "label": "on failure", "rel": "see-also" }
  ]
}
\`\`\`

## How a checkout flows

A request enters through the **edge** — the CDN absorbs static load and the WAF screens it, then the
**API gateway** authenticates and routes. From there the system splits into two concerns.

<Note title="Cart vs. order">
  The **cart & pricing** region is read-heavy and latency-sensitive, so it leans on Redis. The
  **order & payment** region is write-heavy and correctness-sensitive, so it runs a saga.
</Note>

### Cart & pricing

The cart service composes a live cart from three dependencies — **pricing & promos**, an
**inventory check**, and **Redis** for the hot-cart cache. Tax is quoted from an external VAT API on
a dashed (best-effort) path; a quote failure degrades gracefully rather than blocking the cart.

### Order & payment (the saga)

Placing an order is a distributed transaction. The **order service** opens a saga; the
\`Payment authorized?\` decision gates the happy path to the **payment service** and the card
processor. If authorization fails, the saga emits a compensating action toward the dead-letter
queue rather than leaving a half-written order. Each attempt carries an **idempotency key** so a
retried request never double-charges.

### Data & events

Orders are written to the **primary** and served from a **read replica**. On success the order
service publishes \`OrderPlaced\` to the **event bus**, which fans out to the **fulfilment** and
**receipt** workers. Anything that fails its handler lands in the **dead-letter queue** for replay.

## Rollout

<Timeline items={[
  { date: "2026-Q2", title: "Saga + idempotency keys", status: "done" },
  { date: "2026-Q3", title: "Move reads to the replica", status: "in-progress" },
  { date: "2026-Q3", title: "Redis hot-cart cache", status: "in-progress" },
  { date: "2026-Q4", title: "Event-driven fulfilment + DLQ replay", status: "planned" },
]} />

<Note title="Try the Viewer">
  Toggle **Edit** to change this source and watch the board re-render live. Hover any block to add a
  comment, then **Export** the comments as a JSON sidecar.
</Note>
`;

const SAMPLE_CALLOUTS = `---
title: Release notes
summary: Prose with callouts, rendered live.
---

# Release v2.4

A quick tour of the **prose** components.

<Note title="Heads up">Author once in MDX — humans get this clean page, agents get the structure behind it.</Note>

## What changed

- Faster cold starts
- New canvas intents
- Block-level comments in the Viewer

<Note title="Migration" >No action needed — the change is backward compatible.</Note>
`;

const SAMPLE_CANVAS = `---
title: System map
summary: A whiteboard rendered from structured data.
---

# System map

The agent never sees a picture — it gets the nodes and edges behind it.

\`\`\`superlore-canvas
{
  "title": "Request path",
  "nodes": [
    { "id": "cdn", "kind": "rounded", "label": "CDN", "intent": "gray" },
    { "id": "edge", "kind": "rounded", "label": "Edge", "intent": "blue" },
    { "id": "api", "kind": "rounded", "label": "API", "intent": "violet" },
    { "id": "db", "kind": "cylinder", "label": "Primary DB", "intent": "green" },
    { "id": "cache", "kind": "cylinder", "label": "Cache", "intent": "amber" }
  ],
  "edges": [
    { "from": "cdn", "to": "edge", "label": "miss" },
    { "from": "edge", "to": "api", "label": "render" },
    { "from": "api", "to": "cache", "kind": "dashed", "label": "read" },
    { "from": "api", "to": "db", "label": "write" }
  ]
}
\`\`\`
`;

interface Sample {
  label: string;
  filename: string;
  source: string;
}

const SAMPLES: readonly Sample[] = [
  { label: "Migration plan", filename: "migration-plan.mdx", source: EXAMPLE },
  { label: "Release notes", filename: "release-notes.mdx", source: SAMPLE_CALLOUTS },
  { label: "System map", filename: "system-map.mdx", source: SAMPLE_CANVAS },
];

// Highlight fenced code with Fumadocs' own Shiki plugin — the SAME one the docs build uses — so the
// runtime preview feeds `<CodeBlock>` (from getMDXComponents) the Shiki HAST it expects, identical to
// a published page. The no-WASM JS regex engine works in the browser without a wasm fetch; Shiki's
// default lazy loading pulls each grammar on demand, so every bundled language highlights.
const shikiEngine = createJavaScriptRegexEngine({ forgiving: true });
const codeOptions = { ...rehypeCodeDefaultOptions, engine: shikiEngine };

async function compileMdx(source: string): Promise<MdxComponent> {
  const mod = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, remarkSuperloreCanvas],
    rehypePlugins: [rehypeSlug, [rehypeCode, codeOptions], rehypeKpBlockIds],
  });
  return mod.default as MdxComponent;
}

/** Pull a short, single-line quote from a block element for anchor labels / sidecar. */
function quoteOf(el: HTMLElement): string {
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.length > 64 ? `${text.slice(0, 63)}…` : text;
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Best-effort title from frontmatter, falling back to the filename. */
function titleFor(source: string, name: string): string {
  const m = source.match(/^---\n([\s\S]*?)\n---/);
  const t = m?.[1]
    ?.match(/^title:\s*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, "");
  return t ?? name.replace(/\.(md|mdx|markdown)$/i, "");
}

export function ViewerClient() {
  const [status, setStatus] = useState<Status>("empty");
  const [Content, setContent] = useState<MdxComponent | null>(null);
  const [source, setSource] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  /** Mobile-only: which pane the editor shows (split is desktop). */
  const [mobilePane, setMobilePane] = useState<"source" | "preview">("source");
  const inputRef = useRef<HTMLInputElement>(null);
  const sidecarInputRef = useRef<HTMLInputElement>(null);

  // ── Comment state ────────────────────────────────────────────────────
  const [comments, setComments] = useState<Comment[]>([]);
  const [composingFor, setComposingFor] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [importNote, setImportNote] = useState<string>("");
  /** Share menu (bundle vs comments-only + the Cloud hook). */
  const [shareOpen, setShareOpen] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);
  /** A bundle's embedded comments, held until the freshly loaded doc's blocks are scanned. */
  const pendingComments = useRef<unknown>(null);

  const load = useCallback(async (src: string, name: string) => {
    setStatus("compiling");
    setSource(src);
    setFilename(name);
    setComments([]);
    setComposingFor(null);
    setImportNote("");
    setBlocks([]);
    setEditing(false);
    setTitle(titleFor(src, name));
    try {
      const C = await compileMdx(src);
      setContent(() => C);
      setStatus("ready");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const text = await file.text();
      // A superlore bundle (.superlore.json) carries the MDX source + comments in one file.
      if (/\.json$/i.test(file.name)) {
        try {
          const data = JSON.parse(text) as { source?: unknown; filename?: unknown };
          if (data && typeof data.source === "string") {
            pendingComments.current = data; // applied once the loaded doc's blocks are scanned
            await load(
              data.source,
              (typeof data.filename === "string" && data.filename) ||
                file.name.replace(/\.superlore\.json$/i, ".mdx"),
            );
            return;
          }
        } catch {
          /* not a bundle — fall through and treat it as a document */
        }
      }
      await load(text, file.name);
    },
    [load],
  );

  // ── Live re-compile as the source is edited (debounced). ──────────────
  // The edited source IS the document: title, comment anchors and export all
  // ride `source`. Compile errors are surfaced over the preview without tearing
  // down the last good render (so comments don't vanish on a transient typo).
  useEffect(() => {
    if (!editing) return;
    const handle = window.setTimeout(() => {
      setTitle(titleFor(source, filename));
      void compileMdx(source)
        .then((C) => {
          setContent(() => C);
          setError("");
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
        });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [source, editing, filename]);

  // ── Scan the rendered DOM for commentable blocks, in document order. ────
  const rescan = useCallback(() => {
    const root = docRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-kp-block]"));
    const next: BlockInfo[] = els.map((el, i) => ({
      id: el.getAttribute("data-kp-block") ?? `block-${i}`,
      quote: quoteOf(el),
      order: i,
    }));
    setBlocks((prev) => {
      // Avoid churn if nothing meaningful changed (ids + quotes identical).
      if (
        prev.length === next.length &&
        prev.every((p, i) => p.id === next[i]?.id && p.quote === next[i]?.quote)
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    // Initial scan + a couple of follow-ups for async components (canvas/diagram layout).
    rescan();
    const t1 = setTimeout(rescan, 250);
    const t2 = setTimeout(rescan, 1200);
    const root = docRef.current;
    const ro = root ? new ResizeObserver(() => rescan()) : null;
    if (root && ro) ro.observe(root);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
  }, [status, Content, rescan, editing]);

  // ── Gutter affordance: highlight hovered block + an "add comment" button. ─
  useEffect(() => {
    if (status !== "ready") return;
    const root = docRef.current;
    if (!root) return;

    let current: HTMLElement | null = null;
    const onOver = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-kp-block]");
      if (target && target !== current && root.contains(target)) {
        if (current) current.removeAttribute("data-kp-hover");
        current = target;
        current.setAttribute("data-kp-hover", "");
      }
    };
    const onLeave = () => {
      if (current) current.removeAttribute("data-kp-hover");
      current = null;
    };
    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-kp-add]");
      if (!btn) return;
      e.preventDefault();
      const block = btn.closest<HTMLElement>("[data-kp-block]");
      const id = block?.getAttribute("data-kp-block");
      if (!id) return;
      setComposingFor(id);
    };

    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("click", onClick);
      if (current) current.removeAttribute("data-kp-hover");
    };
  }, [status, Content, editing]);

  // Stamp/refresh an "add comment" button into each block (idempotent).
  useEffect(() => {
    if (status !== "ready") return;
    const root = docRef.current;
    if (!root) return;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-kp-block]"))) {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      if (el.querySelector(":scope > [data-kp-add]")) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-kp-add", "");
      btn.setAttribute("aria-label", "Add comment");
      btn.title = "Add comment";
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>';
      el.appendChild(btn);
    }
  }, [status, Content, blocks, editing]);

  // Reflect which blocks have comments / are being composed (gutter dot).
  useEffect(() => {
    if (status !== "ready") return;
    const root = docRef.current;
    if (!root) return;
    const counts = new Map<string, number>();
    for (const c of comments) counts.set(c.anchorId, (counts.get(c.anchorId) ?? 0) + 1);
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-kp-block]"))) {
      const id = el.getAttribute("data-kp-block") ?? "";
      const n = counts.get(id) ?? 0;
      if (n > 0) el.setAttribute("data-kp-commented", String(n));
      else el.removeAttribute("data-kp-commented");
      if (composingFor === id) el.setAttribute("data-kp-active", "");
      else el.removeAttribute("data-kp-active");
    }
  }, [status, comments, composingFor, blocks, editing]);

  // ── Comment mutations ──────────────────────────────────────────────────
  const addComment = useCallback((anchorId: string, body: string, author: string) => {
    const root = docRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-kp-block="${CSS.escape(anchorId)}"]`);
    const quote = el ? quoteOf(el) : "";
    setComments((prev) => [
      ...prev,
      {
        id: newCommentId(),
        anchorId,
        quote,
        body,
        author: author || undefined,
        createdAt: new Date().toISOString(),
        resolved: false,
      },
    ]);
    setComposingFor(null);
  }, []);

  const editComment = useCallback((id: string, body: string, author: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, body, author: author || undefined } : c)),
    );
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleResolved = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
  }, []);

  const focusBlock = useCallback((anchorId: string) => {
    const root = docRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-kp-block="${CSS.escape(anchorId)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.setAttribute("data-kp-flash", "");
    window.setTimeout(() => el.removeAttribute("data-kp-flash"), 1100);
  }, []);

  // ── Export / import ──────────────────────────────────────────────────
  const exportSidecar = useCallback(() => {
    const base = (filename || "document").replace(/\.(md|mdx|markdown)$/i, "");
    downloadJson(`${base}.superlore-comments.json`, toSidecar(comments, { filename, title }));
  }, [comments, filename, title]);

  // Bundle the doc AND its comments into one file — the seamless "send it to a teammate" path. The
  // object is a valid comment sidecar with the MDX `source` embedded, so opening it restores both.
  const exportBundle = useCallback(() => {
    const base = (filename || "document").replace(/\.(md|mdx|markdown)$/i, "");
    downloadJson(`${base}.superlore.json`, { ...toSidecar(comments, { filename, title }), source });
  }, [comments, filename, title, source]);

  // Apply a parsed sidecar (manual import, or the comments carried inside a bundle) to live blocks.
  const importComments = useCallback(
    (raw: unknown) => {
      const liveIds = new Set(blocks.map((b) => b.id));
      const { comments: imported, missing } = fromSidecar(raw, liveIds);
      setComments(imported);
      setImportNote(
        missing.size > 0
          ? `Imported ${imported.length} comment${imported.length === 1 ? "" : "s"}; ${missing.size} need relocation (their block is gone).`
          : `Imported ${imported.length} comment${imported.length === 1 ? "" : "s"}.`,
      );
    },
    [blocks],
  );

  const onImportFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      try {
        importComments(JSON.parse(await file.text()));
      } catch (e) {
        setImportNote(`Couldn't import: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [importComments],
  );

  // A bundle carries its comments inline; apply them once the loaded doc's blocks are scanned.
  useEffect(() => {
    if (status === "ready" && blocks.length > 0 && pendingComments.current) {
      importComments(pendingComments.current);
      pendingComments.current = null;
    }
  }, [status, blocks, importComments]);

  // ── Build ordered comment groups for the rail (document order). ────────
  const groups = useMemo<CommentGroup[]>(() => {
    const byAnchor = groupByAnchor(comments);
    const liveIds = new Set(blocks.map((b) => b.id));
    const result: CommentGroup[] = [];
    const used = new Set<string>();

    // Live blocks first, in document order.
    for (const b of blocks) {
      const cs = byAnchor.get(b.id);
      if (cs && cs.length > 0) {
        result.push({ anchorId: b.id, quote: b.quote, comments: cs, missing: false });
        used.add(b.id);
      } else if (composingFor === b.id) {
        result.push({ anchorId: b.id, quote: b.quote, comments: [], missing: false });
        used.add(b.id);
      }
    }
    // Orphaned anchors (block gone) — surfaced at the end, flagged for relocation.
    for (const [anchorId, cs] of byAnchor) {
      if (used.has(anchorId)) continue;
      if (!liveIds.has(anchorId)) {
        result.push({ anchorId, quote: cs[0]?.quote ?? "", comments: cs, missing: true });
      }
    }
    return result;
  }, [comments, blocks, composingFor]);

  if (status === "ready" && Content) {
    const toolbarBtn =
      "inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1 text-xs text-fd-muted-foreground transition hover:border-kp-accent-border hover:text-fd-foreground";

    // The live preview — renders into docRef so comment gutters/anchors keep working.
    // In edit mode a transient compile error is overlaid without tearing the render down.
    const preview = (
      <div className="relative">
        {editing && error && (
          <div
            role="alert"
            className="sticky top-14 z-10 mb-4 flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--kp-danger)_45%,var(--color-fd-border))] bg-[color-mix(in_oklab,var(--kp-danger)_10%,var(--color-fd-card))] px-3 py-2"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-kp-danger" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fd-foreground">
                Compile error — showing last good render
              </p>
              <pre className="mt-1 overflow-x-auto font-mono text-[11px] whitespace-pre-wrap text-fd-muted-foreground">
                {error}
              </pre>
            </div>
          </div>
        )}
        <DocsBody>
          <div ref={docRef} className="kp-viewer-doc">
            <Content components={getMDXComponents()} />
          </div>
        </DocsBody>
      </div>
    );

    return (
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Document column */}
        <div className="min-w-0">
          <div className={cn("mx-auto w-full px-5 py-8", editing ? "max-w-none" : "max-w-3xl")}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-fd-border pb-3">
              <span className="inline-flex items-center gap-2 font-mono text-xs text-fd-muted-foreground">
                <FileText className="size-3.5" /> {filename || "document.mdx"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-pressed={editing}
                  onClick={() => setEditing((v) => !v)}
                  className={cn(
                    toolbarBtn,
                    editing &&
                      "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text hover:text-kp-accent-text",
                  )}
                >
                  <Code2 className="size-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => sidecarInputRef.current?.click()}
                  className={toolbarBtn}
                >
                  <Upload className="size-3" /> Import
                </button>
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={shareOpen}
                    onClick={() => setShareOpen((v) => !v)}
                    className={toolbarBtn}
                  >
                    <Share2 className="size-3" /> Share
                  </button>
                  {shareOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close share menu"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setShareOpen(false)}
                      />
                      <div className="absolute right-0 z-50 mt-1.5 w-72 rounded-lg border border-fd-border bg-fd-card p-1.5 shadow-lg">
                        <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-fd-muted-foreground uppercase">
                          Sending to a teammate?
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            exportBundle();
                            setShareOpen(false);
                          }}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-fd-accent"
                        >
                          <Download className="mt-0.5 size-3.5 shrink-0 text-kp-accent-text" />
                          <span>
                            <span className="block text-xs font-medium text-fd-foreground">
                              Bundle the doc + comments
                            </span>
                            <span className="block text-[11px] text-fd-muted-foreground">
                              One file ({comments.length} comment{comments.length === 1 ? "" : "s"})
                              — they open it and see everything.
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={comments.length === 0}
                          onClick={() => {
                            exportSidecar();
                            setShareOpen(false);
                          }}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-fd-accent disabled:opacity-40"
                        >
                          <FileText className="mt-0.5 size-3.5 shrink-0 text-fd-muted-foreground" />
                          <span>
                            <span className="block text-xs font-medium text-fd-foreground">
                              Comments only
                            </span>
                            <span className="block text-[11px] text-fd-muted-foreground">
                              A sidecar — when they already have the doc.
                            </span>
                          </span>
                        </button>
                        <div className="my-1 border-t border-fd-border" />
                        <a
                          href="/cloud"
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                        >
                          <Cloud className="size-3.5 shrink-0 text-kp-accent-text" />
                          <span>
                            Skip the files —{" "}
                            <span className="font-medium text-kp-accent-text">
                              join superlore Cloud →
                            </span>
                          </span>
                        </a>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("empty");
                    setContent(null);
                    setComments([]);
                    setEditing(false);
                    setSource("");
                  }}
                  className={toolbarBtn}
                >
                  Open another
                </button>
              </div>
            </div>
            {importNote && (
              <p className="mb-4 rounded-md border border-fd-border bg-fd-card px-3 py-2 text-xs text-fd-muted-foreground">
                {importNote}
              </p>
            )}

            {/* Mobile-only source/preview switch (desktop shows both side-by-side). */}
            {editing && (
              <div className="mb-4 inline-flex rounded-md border border-fd-border p-0.5 lg:hidden">
                <button
                  type="button"
                  aria-pressed={mobilePane === "source"}
                  onClick={() => setMobilePane("source")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs transition",
                    mobilePane === "source"
                      ? "bg-kp-accent-weak text-kp-accent-text"
                      : "text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  <Code2 className="size-3" /> Source
                </button>
                <button
                  type="button"
                  aria-pressed={mobilePane === "preview"}
                  onClick={() => setMobilePane("preview")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs transition",
                    mobilePane === "preview"
                      ? "bg-kp-accent-weak text-kp-accent-text"
                      : "text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  <Eye className="size-3" /> Preview
                </button>
              </div>
            )}

            {/* Stable grid: the editor pane is inserted only in edit mode, but the preview cell
                keeps the same tree position in both modes so its (manually DOM-stamped) comment
                gutters are never torn down by a remount. */}
            <div
              className={cn("grid grid-cols-1 gap-6 lg:items-start", editing && "lg:grid-cols-2")}
            >
              {editing && (
                <div
                  key="editor"
                  className={cn(mobilePane === "source" ? "block" : "hidden", "lg:block")}
                >
                  <MdxEditor value={source} onChange={setSource} hasError={!!error} />
                </div>
              )}
              <div
                key="preview"
                className={cn(
                  "min-w-0",
                  editing && mobilePane !== "preview" ? "hidden lg:block" : "block",
                )}
              >
                {preview}
              </div>
            </div>

            <input
              ref={sidecarInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {/* Comment rail */}
        <div className="hidden border-l border-fd-border lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] py-5">
            <CommentRail
              groups={groups}
              composingFor={composingFor}
              onSubmitNew={addComment}
              onCancelCompose={() => setComposingFor(null)}
              onEdit={editComment}
              onDelete={deleteComment}
              onToggleResolved={toggleResolved}
              onFocusBlock={focusBlock}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      dragging={dragging}
      status={status}
      error={error}
      mark={<SuperloreMark className="size-7 text-kp-accent-text" />}
      samples={SAMPLES.map((s) => ({
        label: s.label,
        onLoad: () => void load(s.source, s.filename),
      }))}
      onDragStateChange={setDragging}
      onDrop={(file) => void onFile(file)}
      onChooseFile={() => inputRef.current?.click()}
      onLoadExample={() => void load(EXAMPLE, "example.mdx")}
      fileInput={
        <input
          ref={inputRef}
          type="file"
          accept=".md,.mdx,.markdown,text/markdown,.json,application/json"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      }
    />
  );
}
