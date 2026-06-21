/**
 * rehype plugin: assign a stable `data-kp-block` id to every commentable block.
 *
 * Runs AFTER rehype-slug. Walks the HAST and stamps headings, top-level paragraphs,
 * list items, blockquotes, pre/code, and the root element of each block-level MDX
 * component with a deterministic id so the Viewer's comment rail can anchor to blocks
 * and re-rendering the same file yields identical ids.
 *
 * The id scheme MIRRORS packages/superlore/src/knowledge/extract.ts so anchor ids line up
 * with the MCP `#id` convention: `slugify(hint)` + a per-base counter (first occurrence
 * is the bare base, then `-2`, `-3`, …). The hint is the heading text when present,
 * else the tag/component name.
 *
 * No new dependencies — manual walk, matching lib/remark-superlore-canvas.mjs.
 */

const BLOCK_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote", "pre"]);

/** slugify — identical to extract.ts. */
function slugify(hint) {
  if (!hint) return "node";
  const s = hint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "node";
}

/** Flatten visible text from a HAST node (headings → hint). */
function textOf(node) {
  if (!node) return "";
  if (node.type === "text") return node.value || "";
  if (node.type === "comment") return "";
  if (Array.isArray(node.children)) return node.children.map(textOf).join("");
  return "";
}

function isHeading(tag) {
  return (
    tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6"
  );
}

export function rehypeKpBlockIds() {
  return (tree) => {
    const seen = new Map();

    const nextId = (hint) => {
      const base = slugify(hint);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return n === 1 ? base : `${base}-${n}`;
    };

    /**
     * Walk the tree. `topLevel` marks children of the document root (or of a block MDX
     * component) so we only stamp *top-level* paragraphs — not paragraphs nested inside
     * a blockquote or list item, which already get their own anchor on the wrapper.
     */
    const walk = (node, topLevel) => {
      if (!node || !Array.isArray(node.children)) return;
      for (const child of node.children) {
        if (!child) continue;

        if (child.type === "element") {
          const tag = child.tagName;
          const commentable = BLOCK_TAGS.has(tag) && (tag !== "p" || topLevel);

          if (commentable) {
            const props = child.properties || (child.properties = {});
            // Hint: heading text (for stable, meaningful ids) else the tag name.
            const hint = isHeading(tag) ? textOf(child) : tag;
            props["data-kp-block"] = nextId(hint);
            // Headings keep their rehype-slug id as well; we add ours alongside.
          }

          // li / blockquote are themselves anchors; descend but their child <p> is not
          // top-level. pre/code: don't descend into code text.
          if (tag === "pre") continue;
          const childTopLevel = false;
          walk(child, childTopLevel);
        } else if (child.type === "mdxJsxFlowElement") {
          // Block-level MDX component (Note, Timeline, Canvas, …). Stamp the root.
          const attrs = child.attributes || (child.attributes = []);
          const hint = child.name || "component";
          const id = nextId(hint);
          attrs.push({ type: "mdxJsxAttribute", name: "data-kp-block", value: id });
          // Descend so any nested markdown blocks (e.g. a <Note> body paragraph) are
          // reachable, but their paragraphs are not "top-level".
          walk(child, false);
        } else {
          walk(child, topLevel);
        }
      }
    };

    walk(tree, true);
  };
}

export default rehypeKpBlockIds;
