import { z } from "zod";

/**
 * The superlore frontmatter schema — superlore's documented extension point for page frontmatter.
 *
 * It is Fumadocs' own page defaults (`title`, `description`, `icon`, `full`) plus the superlore
 * knowledge-envelope fields (`summary`, `tags`) that feed the structured index / MCP. Consumers
 * add their own fields in ONE place by calling `.extend({ … })` in `source.config.ts`:
 *
 * ```ts
 * import { superloreFrontmatterSchema } from "superlore";
 *
 * export const docs = defineDocs({
 *   docs: { schema: superloreFrontmatterSchema.extend({ stage: z.string().optional() }) },
 * });
 * ```
 *
 * Defined here (rather than re-exporting Fumadocs' `frontmatterSchema`) so the package owns the
 * contract and has no hard dependency on `fumadocs-mdx/config` — the shape mirrors Fumadocs'
 * `pageSchema`, so it stays a drop-in. Backward compatible: every superlore field is optional.
 */
export const superloreFrontmatterSchema = z.object({
  /** Page title (required by Fumadocs). */
  title: z.string(),
  /** Short human-facing description (Fumadocs default). */
  description: z.string().optional(),
  /** A PascalCase lucide icon name shown in the sidebar (Fumadocs default). */
  icon: z.string().optional(),
  /** Render the page full-width without a table of contents (Fumadocs default). */
  full: z.boolean().optional(),
  /**
   * Hide the "On this page" table of contents while keeping the normal centred layout (superlore).
   * Use it on self-navigating pages — e.g. a `Releases` changelog, whose timeline and per-release
   * rail already do the jumping, so the flat heading dump on the right is just noise.
   */
  hideToc: z.boolean().optional(),
  /** Reserved by Fumadocs' OpenAPI integration; passed through untouched. */
  _openapi: z.looseObject({}).optional(),
  /** Plain-text gloss for search/snippets and the MCP — never markup (superlore). */
  summary: z.string().optional(),
  /** Cross-cutting tags for the structured index (superlore). */
  tags: z.array(z.string()).optional(),
});

/** The parsed shape of {@link superloreFrontmatterSchema}. */
export type SuperloreFrontmatter = z.infer<typeof superloreFrontmatterSchema>;
