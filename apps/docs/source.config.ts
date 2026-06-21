import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";
// Import from the lightweight `superlore/frontmatter` subpath (zod only) — the config is loaded by
// fumadocs-mdx under raw Node ESM, so it must not pull in the React component barrel. The schema is
// also re-exported from the package root (`import { superloreFrontmatterSchema } from "superlore"`).
import { superloreFrontmatterSchema } from "superlore/frontmatter";
import { remarkSuperloreCanvas } from "./lib/remark-superlore-canvas.mjs";

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
    }),
  },
});

export default defineConfig({
  mdxOptions: {
    // Turn fenced ```superlore-canvas JSON blocks into <Canvas json="…" /> (the agent-authoring path).
    remarkPlugins: [remarkSuperloreCanvas],
  },
});
