import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";
// Import from the lightweight `superlore/frontmatter` subpath (zod only) — the config is loaded by
// fumadocs-mdx under raw Node ESM, so it must not pull in the React component barrel. The schema is
// also re-exported from the package root (`import { superloreFrontmatterSchema } from "superlore"`).
import { superloreFrontmatterSchema } from "superlore/frontmatter";
// The one markdown-upgrade plugin (canvas fences + task lists + GitHub alerts), straight from the
// package — no local copy to drift. Like the schema, `superlore/mdx` is dependency-free, so it's
// safe to load under fumadocs-mdx's raw-Node-ESM evaluation of this config.
import { remarkSuperlore } from "superlore/mdx";

// Typed frontmatter. `superloreFrontmatterSchema` is superlore's documented extension point — it already
// carries Fumadocs' defaults (title, description, icon, full) AND the superlore knowledge-envelope
// fields (summary, tags) that feed the structured index / MCP. Consumers add their own fields in
// ONE place via `.extend({ … })`.
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: superloreFrontmatterSchema.extend({
      // Example of the extension point — a consumer's own field. Optional, backward compatible.
      audience: z.enum(["humans", "agents", "both"]).optional(),
      // Diátaxis page type. Optional, app-level only (NOT in the published `superlore` package).
      // One page, one type — and it doubles as a typed signal the MCP `list` can key off.
      docType: z.enum(["tutorial", "how-to", "concept", "reference"]).optional(),
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    // Markdown-first authoring: ```superlore-canvas → <Canvas>, `- [ ]` task lists → <Checklist>,
    // and `> [!NOTE]` GitHub alerts → Callouts. Runs after fumadocs' built-in remark-gfm.
    remarkPlugins: [remarkSuperlore],
    // Code blocks render in one polished midnight theme (both slots) — always dark, matching the
    // runtime renderer (superlore/runtime) so a built page and a live-rendered string look identical.
    rehypeCodeOptions: { themes: { light: "tokyo-night", dark: "tokyo-night" } },
  },
});
