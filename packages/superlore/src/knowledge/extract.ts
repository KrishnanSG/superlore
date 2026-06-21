import type { ExtractCtx } from "./registry";
import { serializeComponent } from "./registry";
import type { KnowledgeNode, KnowledgePage, PageFrontmatter, RelKind } from "./primitives";

export interface CreateExtractCtxOptions {
  pageId: string;
  /** Returns true if `target` resolves within the corpus index. Default: paths/anchors/entities. */
  isInternal?: (target: string) => boolean;
}

function slugify(hint: string | undefined): string {
  if (!hint) return "node";
  const s = hint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "node";
}

/** Best-effort plain-text extraction from MDX children (strings / arrays / React elements). */
export function plainText(children: unknown): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(plainText).join("");
  if (typeof children === "object" && "props" in (children as Record<string, unknown>)) {
    const props = (children as { props?: { children?: unknown } }).props;
    return plainText(props?.children);
  }
  return "";
}

/** Create the build-time context: stable id minting, text flattening, ref resolution. */
export function createExtractCtx(opts: CreateExtractCtxOptions): ExtractCtx {
  const seen = new Map<string, number>();
  const isInternal =
    opts.isInternal ??
    ((t: string) => t.startsWith("/") || t.startsWith("#") || t.startsWith("entity:"));
  return {
    pageId: opts.pageId,
    nextId: (hint) => {
      const base = slugify(hint);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return n === 1 ? base : `${base}-${n}`;
    },
    text: plainText,
    resolveRef: (target, rel: RelKind = "links", label) => ({
      rel,
      target,
      label,
      internal: isInternal(target),
    }),
  };
}

export interface AuthoredComponent {
  name: string;
  props: unknown;
}

/**
 * Serialize a page from its frontmatter + an ordered list of authored component instances.
 *
 * Phase-1 scaffold: the caller supplies the ordered components. Phase 2 replaces the caller with
 * a build-time walk of the compiled MDX AST (the fumadocs-mdx pipeline) that collects every JSX
 * element whose tag is in the knowledge registry, then runs this same serialization — see
 * docs/COMPONENTS.md §4. Keeping the serialization here means render and MCP read one source.
 */
export function serializePage(
  frontmatter: PageFrontmatter,
  path: string,
  authored: AuthoredComponent[],
  ctx?: ExtractCtx,
): KnowledgePage {
  const cx = ctx ?? createExtractCtx({ pageId: path });
  const nodes: KnowledgeNode[] = [];
  for (const a of authored) {
    const node = serializeComponent(a.name, a.props, cx);
    if (node) nodes.push(node);
  }
  return {
    kind: "prose",
    id: path,
    path,
    title: frontmatter.title,
    summary: frontmatter.summary,
    tags: frontmatter.tags,
    refs: frontmatter.refs,
    frontmatter,
    nodes,
  };
}
