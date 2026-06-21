import * as React from "react";
import { z } from "zod";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { Person, RelKind, RosterNode } from "../knowledge/primitives";

/**
 * Roster — a team roster of people with optional reporting lines. The human reads cards grouped by
 * who-reports-to-whom; the agent gets `{ kind:"roster", people:[{ id,name,role,reportsTo }] }` —
 * each person addressable as `entity:person/${slug}`, the org tree expressed as `reportsTo` edges,
 * so "who reports to X?" or "everyone with tag Y" is a query, not prose-reading.
 */

type RosterRef = { rel?: string; target: string; label?: string };

export interface RosterPersonInput {
  name: string;
  role?: string;
  slug?: string;
  email?: string;
  /** The name (or slug) of the person this one reports to — defines the org line. */
  reportsTo?: string;
  tags?: string[];
  refs?: RosterRef[];
}

export interface RosterProps {
  people: RosterPersonInput[];
  /** Accessible name for the roster. */
  label?: string;
}

function initials(name: string): string {
  return name
    .split(/[\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonCard({ p, reports }: { p: RosterPersonInput; reports: number }) {
  return (
    <article className="flex items-start gap-3 rounded-lg border border-fd-border bg-fd-card p-3">
      <div
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-kp-accent-weak font-mono text-xs font-semibold text-kp-accent-text"
      >
        {initials(p.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <div className="truncate font-semibold text-fd-foreground">{p.name}</div>
          {reports > 0 && (
            <span className="shrink-0 rounded-full bg-fd-muted px-1.5 text-[10px] text-fd-muted-foreground tabular-nums">
              {reports} {reports === 1 ? "report" : "reports"}
            </span>
          )}
        </div>
        {p.role && <div className="text-sm text-fd-muted-foreground">{p.role}</div>}
        {p.email && (
          <a
            href={`mailto:${p.email}`}
            className="text-xs text-kp-accent-text no-underline hover:underline"
          >
            {p.email}
          </a>
        )}
        {(p.tags?.length || p.refs?.length) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {p.tags?.map((t) => (
              <span
                key={t}
                className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground"
              >
                {t}
              </span>
            ))}
            {p.refs?.map((r, ri) => (
              <a
                key={ri}
                href={r.target}
                className="rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[11px] text-kp-accent-text no-underline"
              >
                {r.label ?? r.target}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function Roster({ people, label = "Roster" }: RosterProps) {
  // Resolve reporting lines by matching reportsTo against either name or slug.
  const byKey = new Map<string, RosterPersonInput>();
  for (const p of people) {
    byKey.set(p.name, p);
    if (p.slug) byKey.set(p.slug, p);
  }
  const reportsCount = new Map<string, number>();
  for (const p of people) {
    if (p.reportsTo && byKey.has(p.reportsTo)) {
      const mgr = byKey.get(p.reportsTo)!;
      reportsCount.set(mgr.name, (reportsCount.get(mgr.name) ?? 0) + 1);
    }
  }

  // Roots = people who don't report to anyone in the roster. Render each root then its reports,
  // indented, so the org structure reads at a glance.
  const childrenOf = new Map<string, RosterPersonInput[]>();
  const roots: RosterPersonInput[] = [];
  for (const p of people) {
    const mgr = p.reportsTo ? byKey.get(p.reportsTo) : undefined;
    if (mgr && mgr.name !== p.name) {
      const arr = childrenOf.get(mgr.name) ?? [];
      arr.push(p);
      childrenOf.set(mgr.name, arr);
    } else {
      roots.push(p);
    }
  }

  return (
    <section aria-label={label} className="not-prose my-6 space-y-4">
      {roots.map((root, ri) => {
        const reports = childrenOf.get(root.name) ?? [];
        return (
          <div key={ri} className="space-y-2">
            <PersonCard p={root} reports={reportsCount.get(root.name) ?? 0} />
            {reports.length > 0 && (
              <div className="ml-4 grid gap-2 border-l border-fd-border pl-4 sm:grid-cols-2">
                {reports.map((c, ci) => (
                  <PersonCard key={ci} p={c} reports={reportsCount.get(c.name) ?? 0} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------- knowledge face --- */

const refSchema = z.object({
  rel: z.string().optional(),
  target: z.string(),
  label: z.string().optional(),
});

const rosterSchema = z.object({
  label: z.string().optional(),
  people: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      slug: z.string().optional(),
      email: z.string().optional(),
      reportsTo: z.string().optional(),
      tags: z.array(z.string()).optional(),
      refs: z.array(refSchema).optional(),
    }),
  ),
});

registerKnowledge("Roster", {
  schema: rosterSchema,
  toKnowledge: (p: z.infer<typeof rosterSchema>, ctx: ExtractCtx) => {
    // First pass: mint a stable id per person, keyed by both name and slug for reportsTo lookup.
    const idByKey = new Map<string, string>();
    const entries = p.people.map((person) => {
      const id = ctx.nextId(person.slug || person.name);
      idByKey.set(person.name, id);
      if (person.slug) idByKey.set(person.slug, id);
      return { person, id };
    });

    return {
      kind: "roster",
      id: ctx.nextId(p.label ?? "roster"),
      title: p.label,
      people: entries.map(
        ({ person, id }): Person => ({
          id,
          name: person.name,
          role: person.role,
          slug: person.slug,
          email: person.email,
          reportsTo: person.reportsTo ? idByKey.get(person.reportsTo) : undefined,
          tags: person.tags,
          refs: person.refs?.map((r) =>
            ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
          ),
        }),
      ),
    } satisfies RosterNode;
  },
});
