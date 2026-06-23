/**
 * `superlore/search` — the docs search backend.
 *
 * Fumadocs' search dialog (⌘K, on by default in {@link RootProvider}) fetches `/api/search`. A KB
 * must serve that route or search silently returns nothing. Re-exported here so a consumer wires it
 * from the single superlore surface:
 *
 * ```ts
 * // app/api/search/route.ts
 * import { source } from "@/lib/source";
 * import { createFromSource } from "superlore/search";
 * export const { GET } = createFromSource(source);
 * ```
 *
 * `createFromSource` builds an Orama index from the loader `source` — the same content the site
 * renders and the MCP serves. Server-only (it runs in the route handler).
 */
export {
  createFromSource,
  createSearchAPI,
  createI18nSearchAPI,
} from "fumadocs-core/search/server";
