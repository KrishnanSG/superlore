import type { ZodType } from "zod";
import type { KId, KnowledgeNode, Ref, RelKind } from "./primitives";

/**
 * Build-time context handed to every serializer. Lets a `toKnowledge` mint stable ids, flatten
 * MDX children to plain text, and resolve cross-references against the corpus index.
 */
export interface ExtractCtx {
  pageId: string;
  nextId: (hint?: string) => KId;
  text: (children: unknown) => string;
  resolveRef: (target: string, rel?: RelKind, label?: string) => Ref;
}

/**
 * A component's knowledge face, colocated with the component (see docs/COMPONENTS.md §4).
 * `schema` validates authored props at build time (fail loud on bad authoring); `toKnowledge`
 * is the serializer producing the structured node the MCP serves.
 */
export interface KnowledgeComponent<P> {
  schema: ZodType<P>;
  toKnowledge: (props: P, ctx: ExtractCtx) => KnowledgeNode;
}

const registry = new Map<string, KnowledgeComponent<unknown>>();

/** Register a component's knowledge face. Called as a side effect from each component file. */
export function registerKnowledge<P>(name: string, def: KnowledgeComponent<P>): void {
  registry.set(name, def as unknown as KnowledgeComponent<unknown>);
}

export function getKnowledgeComponent(name: string): KnowledgeComponent<unknown> | undefined {
  return registry.get(name);
}

export function hasKnowledgeFace(name: string): boolean {
  return registry.has(name);
}

export function knowledgeComponentNames(): string[] {
  return [...registry.keys()];
}

/** Serialize one authored component instance to its knowledge node (validates props first). */
export function serializeComponent(
  name: string,
  props: unknown,
  ctx: ExtractCtx,
): KnowledgeNode | null {
  const def = registry.get(name);
  if (!def) return null;
  const parsed = def.schema.parse(props);
  return def.toKnowledge(parsed, ctx);
}
