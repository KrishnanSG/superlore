import { useEffect, useRef, useState, type ComponentType } from "react";
import { compileMdxSource } from "superlore/runtime";
import { DocsBody } from "fumadocs-ui/page";
import { getMDXComponents, PageHero, BuiltWithSuperlore } from "superlore";
import { rehypeKpBlockIds } from "./lib/rehype-kp-block-ids.mjs";
import { getVsCodeApi } from "./vscode-api";
import { CommentLayer, CommentRail } from "./comments/comment-layer";
import type { KComment } from "./comments/model";
import type { HostMessage } from "./messages";

type MdxComponent = ComponentType<{ components?: Record<string, unknown> }>;
type Status = "empty" | "compiling" | "ready" | "error";

/** Frontmatter we render in the page hero (everything else is ignored here). */
interface Frontmatter {
  title?: string;
  description?: string;
}

interface Compiled {
  Content: MdxComponent;
  frontmatter: Frontmatter;
}

/**
 * Compile through superlore's runtime renderer — the SAME pipeline a published page uses (frontmatter
 * + GFM + the superlore-canvas fence + Shiki code, fed to Fumadocs' `<CodeBlock>` via getMDXComponents).
 * We append the webview-only block-id rehype plugin so comment pins anchor to blocks. superlore owns
 * the pipeline, so the preview can never drift from the docs build. (The runtime `evaluate` inside is
 * why the webview CSP needs 'unsafe-eval'.)
 */
async function compileMdx(source: string): Promise<Compiled> {
  const { Content, frontmatter } = await compileMdxSource(source, {
    rehypePlugins: [rehypeKpBlockIds],
  });
  return { Content: Content as MdxComponent, frontmatter: frontmatter as Frontmatter };
}

function baseName(p: string): string {
  return p.split(/[\\/]/).pop() ?? p;
}

/**
 * The page hero's eyebrow — the file's containing section (e.g. `components/board.mdx` → "Components").
 * The extension has no nav config, so a file directly under `docs`/`content` gets no eyebrow.
 */
function kickerFor(path: string): string | undefined {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const parent = parts[parts.length - 2];
  if (!parent || parent === "docs" || parent === "content") return undefined;
  return parent.charAt(0).toUpperCase() + parent.slice(1).replace(/-/g, " ");
}

const vscode = getVsCodeApi();

export function Preview(): React.ReactNode {
  const [status, setStatus] = useState<Status>("empty");
  // Keep the last good render: on a compile error we surface the message over the previous render
  // instead of tearing it down (mirrors the Viewer).
  const [Content, setContent] = useState<MdxComponent | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [fm, setFm] = useState<Frontmatter>({});
  const [error, setError] = useState<string>("");
  const [renderNonce, setRenderNonce] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── commenting state ──────────────────────────────────────────────────────
  const [comments, setComments] = useState<KComment[]>([]);
  const [author, setAuthor] = useState<string>("You");
  const [commentMode, setCommentMode] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Persist on every change (the host writes `<base>_comments.json`).
  const updateComments = (next: KComment[]) => {
    setComments(next);
    vscode?.postMessage({ type: "saveComments", comments: next });
  };

  // Open rail → reserve space so content reflows beside it instead of hiding behind it.
  useEffect(() => {
    document.body.classList.toggle("kp-rail-open", railOpen);
    return () => document.body.classList.remove("kp-rail-open");
  }, [railOpen]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>): void => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "init") {
        if (msg.author) setAuthor(msg.author);
      } else if (msg.type === "comments") {
        // Hydrate the sidecar for the document the host just loaded.
        setComments(Array.isArray(msg.comments) ? msg.comments : []);
        setSelectedId(null);
      } else if (msg.type === "update") {
        const { source: src, fileName: name } = msg;
        setFileName(name);
        setSource(src);
        setStatus((prev) => (prev === "ready" ? prev : "compiling"));
        void compileMdx(src)
          .then(({ Content: C, frontmatter }) => {
            setContent(() => C);
            setFm(frontmatter);
            setStatus("ready");
            setError("");
            setRenderNonce((n) => n + 1);
          })
          .catch((e: unknown) => {
            setError(e instanceof Error ? e.message : String(e));
            // Only flip to a hard error state if we have nothing to show yet.
            setStatus((prev) => (prev === "ready" ? prev : "error"));
          });
      }
      // `theme` messages are owned by <App> (main.tsx).
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (status === "empty") {
    return (
      <div className="kp-ext-empty">
        <p>Open a superlore .mdx file and run “superlore: Open Preview”.</p>
      </div>
    );
  }

  if (status === "error" && !Content) {
    return (
      <div className="kp-ext-doc-wrap">
        <CompileError error={error} />
      </div>
    );
  }

  const heroTitle = fm.title ?? baseName(fileName).replace(/\.(md|mdx|markdown)$/i, "");
  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="kp-ext-doc-wrap" ref={wrapRef}>
      <div className="kp-ext-toolbar">
        <span className="kp-ext-filename">{baseName(fileName) || "document.mdx"}</span>
        <span className="kp-ext-toolbar-spacer" />
        <button
          type="button"
          className={`kp-ext-tool-btn${commentMode ? " kp-ext-tool-btn-on" : ""}`}
          title="Comment (press C, then click the board)"
          onClick={() => setCommentMode(!commentMode)}
        >
          <ToolCommentIcon /> Comment <kbd className="kp-ext-kbd">C</kbd>
        </button>
        <button
          type="button"
          className={`kp-ext-tool-btn${railOpen ? " kp-ext-tool-btn-on" : ""}`}
          title="Show comments"
          onClick={() => setRailOpen(!railOpen)}
        >
          Comments
          {openCount > 0 && <span className="kp-ext-tool-badge">{openCount}</span>}
        </button>
      </div>
      {error && Content && <CompileError error={error} stale />}
      <DocsBody>
        <div className="kp-viewer-doc">
          {/* The branded page hero from frontmatter — the same treatment the docs site renders, so
              the preview matches the published page (not just the MDX body). */}
          <PageHero kicker={kickerFor(fileName)} title={heroTitle} description={fm.description} />
          {Content && <Content components={getMDXComponents()} />}
        </div>
      </DocsBody>

      {/* Floating "Powered by superlore" branding — bottom-right of the doc surface, low-key. */}
      <BuiltWithSuperlore
        label="Powered by"
        className="absolute right-5 bottom-5 z-10 opacity-60 transition-opacity hover:opacity-100"
      />

      <CommentLayer
        wrapRef={wrapRef}
        source={source}
        comments={comments}
        onChange={updateComments}
        author={author}
        commentMode={commentMode}
        setCommentMode={setCommentMode}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        renderNonce={renderNonce}
        onToggleRail={() => setRailOpen((o) => !o)}
      />
      <CommentRail
        comments={comments}
        fileName={fileName}
        open={railOpen}
        onClose={() => setRailOpen(false)}
        onChange={updateComments}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          const wrap = wrapRef.current;
          const c = comments.find((x) => x.id === id);
          const block =
            c && wrap ? wrap.querySelector(`[data-kp-block="${CSS.escape(c.anchor.blockId)}"]`) : null;
          block?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        onCopyToAgent={(text) =>
          vscode?.postMessage({ type: "copyToClipboard", text, label: "comments" })
        }
      />
    </div>
  );
}

function ToolCommentIcon(): React.ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function CompileError({ error, stale }: { error: string; stale?: boolean }): React.ReactNode {
  return (
    <div role="alert" className="kp-ext-error">
      <p className="kp-ext-error-title">
        {stale ? "Compile error — showing last good render" : "Couldn’t render this document"}
      </p>
      <pre className="kp-ext-error-body">{error}</pre>
    </div>
  );
}
