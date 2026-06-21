import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import {
  parseKDate,
  type DecisionNode,
  type DecisionStatus,
  type Ref,
  type RelKind,
} from "../knowledge/primitives";

/**
 * Decision — an architecture / decision record (ADR). The human reads the rationale; the agent
 * gets `{ kind:"decision", status, context, decision, consequences, refs }` — and the
 * `supersedes` / `superseded-by` links ride the shared `refs[]`, so an agent can follow a decision
 * chain with `navigate`.
 */

type DecisionRef = { rel?: string; target: string; label?: string };

export interface DecisionProps {
  title: string;
  status: DecisionStatus;
  /** Author-facing identifier, e.g. "ADR-007". */
  identifier?: string;
  date?: string;
  context?: React.ReactNode;
  decision: React.ReactNode;
  consequences?: React.ReactNode[];
  supersedes?: DecisionRef;
  supersededBy?: DecisionRef;
  refs?: DecisionRef[];
}

const statusCls: Record<DecisionStatus, string> = {
  proposed: "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
  accepted: "border-kp-success/40 bg-kp-success/10 text-kp-success",
  rejected: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger",
  superseded: "border-fd-border bg-fd-muted text-fd-muted-foreground",
};

export function Decision({
  title,
  status,
  identifier,
  date,
  context,
  decision,
  consequences,
  supersedes,
  supersededBy,
  refs,
}: DecisionProps) {
  const chain: { rel: string; r: DecisionRef }[] = [];
  if (supersedes) chain.push({ rel: "supersedes", r: supersedes });
  if (supersededBy) chain.push({ rel: "superseded-by", r: supersededBy });

  return (
    <section className="not-prose my-6 rounded-lg border border-fd-border bg-fd-card p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {identifier && (
          <span className="rounded-md border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-xs text-fd-muted-foreground">
            {identifier}
          </span>
        )}
        <h3 className="flex-1 text-base font-semibold text-fd-foreground">{title}</h3>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide capitalize",
            statusCls[status],
          )}
        >
          {status}
        </span>
        {date && (
          <span className="font-mono text-xs text-fd-muted-foreground tabular-nums">{date}</span>
        )}
      </header>

      {context != null && (
        <div className="mt-4">
          <div className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
            Context
          </div>
          <div className="mt-1 text-sm text-fd-foreground/90">{context}</div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
          Decision
        </div>
        <div className="mt-1 text-sm text-fd-foreground">{decision}</div>
      </div>

      {consequences && consequences.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
            Consequences
          </div>
          <ul className="mt-1.5 space-y-1">
            {consequences.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fd-foreground/90">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-kp-accent" />
                <span className="min-w-0 flex-1">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(chain.length > 0 || refs?.length) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-fd-border pt-3">
          {chain.map(({ rel, r }, i) => (
            <a
              key={`c${i}`}
              href={r.target}
              className="inline-flex items-center gap-1 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[11px] text-kp-accent-text no-underline"
            >
              <span className="opacity-70">{rel}</span>
              {r.label ?? r.target}
            </a>
          ))}
          {refs?.map((r, i) => (
            <a
              key={`r${i}`}
              href={r.target}
              className="inline-flex items-center gap-1 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 text-[11px] text-kp-accent-text no-underline"
            >
              {r.rel && <span className="opacity-70">{r.rel}</span>}
              {r.label ?? r.target}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- knowledge face --- */

const statusEnum = z.enum(["proposed", "accepted", "rejected", "superseded"]);

const refSchema = z.object({
  rel: z.string().optional(),
  target: z.string(),
  label: z.string().optional(),
});

const decisionSchema = z.object({
  title: z.string(),
  status: statusEnum,
  identifier: z.string().optional(),
  date: z.string().optional(),
  context: z.unknown().optional(),
  decision: z.unknown(),
  consequences: z.array(z.unknown()).optional(),
  supersedes: refSchema.optional(),
  supersededBy: refSchema.optional(),
  refs: z.array(refSchema).optional(),
});

registerKnowledge("Decision", {
  schema: decisionSchema,
  toKnowledge: (p: z.infer<typeof decisionSchema>, ctx: ExtractCtx) => {
    const refs: Ref[] = [];
    if (p.supersedes)
      refs.push(ctx.resolveRef(p.supersedes.target, "supersedes", p.supersedes.label));
    if (p.supersededBy)
      refs.push(ctx.resolveRef(p.supersededBy.target, "superseded-by", p.supersededBy.label));
    for (const r of p.refs ?? [])
      refs.push(ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label));

    return {
      kind: "decision",
      id: ctx.nextId(p.identifier ?? p.title),
      title: p.title,
      status: p.status,
      identifier: p.identifier,
      date: p.date != null ? parseKDate(p.date) : undefined,
      context: p.context != null ? ctx.text(p.context) || undefined : undefined,
      decision: ctx.text(p.decision),
      consequences:
        p.consequences != null
          ? p.consequences.map((c) => ctx.text(c)).filter((c) => c.length > 0)
          : undefined,
      refs: refs.length > 0 ? refs : undefined,
    } satisfies DecisionNode;
  },
});
