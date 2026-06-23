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

/** Flatten an mdast node's inline text (text + inline code + nested inlines) to a plain string. */
function inlineText(node: MdNode): string {
  if (!node) return "";
  if (node.type === "text" || node.type === "inlineCode") return String(node.value ?? "");
  if (Array.isArray(node.children)) return node.children.map(inlineText).join("");
  return "";
}

/**
 * remark plugin: upgrade a plain markdown **task list** (`- [ ]` / `- [x]`) into a dual-representation
 * `<Checklist>` — so an author (or agent) writes the natural markdown and still gets the styled
 * component AND the typed knowledge face the MCP serves. Only fires on a list whose items are ALL
 * task items (GFM sets `checked` to a boolean on those); ordinary lists pass through untouched. Run
 * after `remark-gfm` (which parses the checkboxes). Items carry forward as a JSON string.
 */
export function remarkSuperloreChecklist() {
  return (tree: MdNode): void => {
    const walk = (node: MdNode): void => {
      if (!node || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (!child) continue;
        const items = child.type === "list" ? (child.children ?? []) : [];
        const isTaskList = items.length > 0 && items.every((li) => typeof li.checked === "boolean");
        if (isTaskList) {
          // Flatten the list (incl. nested task sub-lists) so nested items aren't dropped — the agent
          // sees every item a human reading the markdown would. Nested items carry a depth marker so
          // the dual-rep face keeps the structure.
          const data: { text: string; done: boolean }[] = [];
          const collect = (list: MdNode, depth: number): void => {
            for (const li of list.children ?? []) {
              if (typeof li.checked !== "boolean") continue;
              const para = (li.children ?? []).find((c) => c?.type === "paragraph");
              const text = inlineText(para ?? li).trim();
              data.push({
                text: depth > 0 ? `${"— ".repeat(depth)}${text}` : text,
                done: li.checked === true,
              });
              const sub = (li.children ?? []).find((c) => c?.type === "list");
              if (sub) collect(sub, depth + 1);
            }
          };
          collect(child, 0);
          node.children[i] = {
            type: "mdxJsxFlowElement",
            name: "Checklist",
            attributes: [{ type: "mdxJsxAttribute", name: "json", value: JSON.stringify(data) }],
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

const ALERT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;
const ALERT_COMPONENT: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Info",
  warning: "Warning",
  caution: "Danger",
};

/**
 * remark plugin: upgrade a GitHub-style alert blockquote (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`,
 * `[!WARNING]`, `[!CAUTION]`) into the matching superlore Callout (`Note`/`Tip`/`Info`/`Warning`/
 * `Danger`). The natural markdown an author already knows becomes the styled, dual-rep callout — no
 * `<Note>` tag to remember. A plain blockquote (no marker) stays a blockquote.
 */
export function remarkSuperloreCallouts() {
  return (tree: MdNode): void => {
    const walk = (node: MdNode): void => {
      if (!node || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (!child) continue;
        const firstPara = child.type === "blockquote" ? (child.children ?? [])[0] : undefined;
        const marker = firstPara?.type === "paragraph" ? (firstPara.children ?? [])[0] : undefined;
        const m = marker?.type === "text" ? ALERT_RE.exec(String(marker.value)) : null;
        if (child.type === "blockquote" && firstPara && marker && m) {
          const name = ALERT_COMPONENT[m[1]!.toLowerCase()] ?? "Note";
          const rest = String(marker.value).replace(ALERT_RE, "");
          if (rest) {
            marker.value = rest;
          } else {
            const pc = firstPara.children!;
            pc.shift(); // drop the marker text node
            if (pc[0]?.type === "break") pc.shift(); // and the line break after it
            if (pc.length === 0) child.children!.shift(); // empty first paragraph → drop it
          }
          node.children[i] = {
            type: "mdxJsxFlowElement",
            name,
            attributes: [],
            children: child.children ?? [],
          } as unknown as MdNode;
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}

/**
 * The one remark plugin a superlore KB registers: applies every superlore markdown upgrade —
 * `superlore-canvas` fences → `<Canvas>`, task lists → `<Checklist>`, GitHub alerts → Callouts.
 * Register this (after `remark-gfm`) instead of the individual plugins.
 */
export function remarkSuperlore() {
  const canvas = remarkSuperloreCanvas();
  const checklist = remarkSuperloreChecklist();
  const callouts = remarkSuperloreCallouts();
  return (tree: MdNode): void => {
    canvas(tree);
    checklist(tree);
    callouts(tree);
  };
}
