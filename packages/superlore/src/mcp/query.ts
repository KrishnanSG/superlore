import type { EntityNode, KKind, KnowledgeNode, KnowledgePage, Ref } from "../knowledge/primitives";

/** The prebuilt structured index the MCP serves — no scraping, no React render, no drift. */
export interface SuperloreIndex {
  pages: KnowledgePage[];
}

export interface SearchHit {
  path: string;
  title?: string;
  snippet?: string;
  score: number;
}

function nodeText(node: KnowledgeNode): string {
  const parts: string[] = [node.title ?? "", node.summary ?? "", ...(node.tags ?? [])];
  // Pull a little body text from common node shapes without hard-coding every kind.
  const rec = node as unknown as Record<string, unknown>;
  if (typeof rec.body === "string") parts.push(rec.body);
  if (typeof rec.definition === "string") parts.push(rec.definition);
  return parts.filter(Boolean).join(" ");
}

function pageText(page: KnowledgePage): string {
  return [page.frontmatter.title, page.frontmatter.summary ?? "", ...(page.frontmatter.tags ?? [])]
    .concat(page.nodes.map(nodeText))
    .filter(Boolean)
    .join(" ");
}

/** Lightweight term-frequency search over titles, summaries, tags, and node text. */
export function search(index: SuperloreIndex, query: string, limit = 10): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const page of index.pages) {
    const title = (page.frontmatter.title ?? "").toLowerCase();
    const summary = (page.frontmatter.summary ?? "").toLowerCase();
    const body = pageText(page).toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 3;
      if (summary.includes(t)) score += 2;
      score += body.split(t).length - 1;
    }
    if (score > 0) {
      hits.push({
        path: page.path,
        title: page.frontmatter.title,
        snippet: page.frontmatter.summary,
        score,
      });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getPage(index: SuperloreIndex, path: string): KnowledgePage | null {
  return index.pages.find((p) => p.path === path) ?? null;
}

/** Resolve a node by global id `${path}#${id}` or by a bare node id across the corpus. */
export function getComponentData(index: SuperloreIndex, id: string): KnowledgeNode | null {
  if (id.includes("#")) {
    const [path, nodeId] = id.split("#", 2);
    const page = getPage(index, path ?? "");
    return page?.nodes.find((n) => n.id === nodeId) ?? null;
  }
  for (const page of index.pages) {
    const node = page.nodes.find((n) => n.id === id);
    if (node) return node;
  }
  return null;
}

export interface ListFilter {
  kind?: KKind;
  tag?: string;
  entityType?: string;
}

/** List nodes across the corpus, filtered by kind / tag / entityType. */
export function list(index: SuperloreIndex, filter: ListFilter = {}): KnowledgeNode[] {
  const out: KnowledgeNode[] = [];
  for (const page of index.pages) {
    for (const node of page.nodes) {
      if (filter.kind && node.kind !== filter.kind) continue;
      if (filter.tag && !(node.tags ?? []).includes(filter.tag)) continue;
      if (filter.entityType) {
        if (node.kind !== "entity" || (node as EntityNode).entityType !== filter.entityType)
          continue;
      }
      out.push(node);
    }
  }
  return out;
}

export interface NavigateResult {
  outgoing: Ref[];
  incoming: { from: string; ref: Ref }[];
}

/** Follow relations from a target (a page path, a node id, or an entity ref) and find backlinks. */
export function navigate(index: SuperloreIndex, target: string): NavigateResult {
  const outgoing: Ref[] = [];
  const incoming: { from: string; ref: Ref }[] = [];

  const page = getPage(index, target);
  if (page) {
    outgoing.push(...(page.frontmatter.refs ?? []));
    for (const node of page.nodes) outgoing.push(...(node.refs ?? []));
  } else {
    const node = getComponentData(index, target);
    if (node) outgoing.push(...(node.refs ?? []));
  }

  for (const p of index.pages) {
    for (const ref of p.frontmatter.refs ?? []) {
      if (ref.target === target) incoming.push({ from: p.path, ref });
    }
    for (const node of p.nodes) {
      for (const ref of node.refs ?? []) {
        if (ref.target === target) incoming.push({ from: `${p.path}#${node.id}`, ref });
      }
    }
  }
  return { outgoing, incoming };
}
