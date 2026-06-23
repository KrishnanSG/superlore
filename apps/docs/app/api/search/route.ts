import { source } from "@/lib/source";
import { createFromSource } from "superlore/search";

// Fumadocs' ⌘K search dialog (on by default in RootProvider) fetches this route. Without it, search
// silently returns nothing. Builds an Orama index from the same content source the site renders and
// the MCP serves — one corpus, three readers.
export const { GET } = createFromSource(source);
