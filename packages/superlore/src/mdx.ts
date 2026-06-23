/**
 * `superlore/mdx` — remark plugins for authoring superlore content.
 *
 * Loaded by `fumadocs-mdx` when it evaluates `source.config.ts` (under raw Node ESM), so this module
 * stays dependency-free and React-free: a manual tree walk, no `unist-util-visit`, no component
 * imports. Register it in `defineConfig({ mdxOptions: { remarkPlugins: [remarkSuperloreCanvas] } })`.
 */

/** Minimal mdast-ish node shape — enough to walk and rewrite without pulling in unist types. */
interface MdNode {
  type: string;
  lang?: string;
  value?: string;
  children?: MdNode[];
  [key: string]: unknown;
}

/**
 * remark plugin: turn a fenced ` ```superlore-canvas ` JSON block into `<Canvas json="…" />`.
 *
 * This is the headline authoring path — a human or an agent writes a whiteboard as a plain code
 * block, and superlore renders it for humans while serializing the same graph for the MCP. Without
 * this, the fenced block falls through to the syntax highlighter, which has no `superlore-canvas`
 * grammar and fails the build. Ship it in every superlore KB's `source.config.ts`.
 */
export function remarkSuperloreCanvas() {
  return (tree: MdNode): void => {
    const walk = (node: MdNode): void => {
      if (!node || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (!child) continue;
        if (child.type === "code" && child.lang === "superlore-canvas") {
          node.children[i] = {
            type: "mdxJsxFlowElement",
            name: "Canvas",
            attributes: [{ type: "mdxJsxAttribute", name: "json", value: child.value }],
            children: [],
          } as unknown as MdNode;
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
