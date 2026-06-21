/**
 * remark plugin: turn a fenced ```superlore-canvas JSON block into <Canvas json="…" />.
 * Lets humans and agents author a whiteboard as a plain code block (the headline path),
 * which superlore renders + serializes. No dependency on unist-util-visit (manual walk).
 */
export function remarkSuperloreCanvas() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child && child.type === "code" && child.lang === "superlore-canvas") {
          node.children[i] = {
            type: "mdxJsxFlowElement",
            name: "Canvas",
            attributes: [{ type: "mdxJsxAttribute", name: "json", value: child.value }],
            children: [],
          };
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
