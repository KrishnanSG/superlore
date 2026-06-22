import * as React from "react";
import { z } from "zod";
import { Icon } from "./mintlify";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import {
  parseKDate,
  type HandoffNode,
  type HandoffParty,
  type Ref,
  type RelKind,
  type Status,
} from "../knowledge/primitives";

/**
 * Handoff — a session-handoff record for the top of a doc: the structured baton between work
 * sessions (AI↔AI like Claude/Codex, AI↔human, human↔human). A human reads who / what's done /
 * what's next at a glance; the agent that picks the work up gets `{ from, to, status, context,
 * done, next, questions, refs }` as a typed knowledge node and continues without re-deriving state.
 * Dual-representation applied to "where we left off."
 */

type PartyInput = { name: string; kind?: "human" | "agent"; role?: string } | string;
type HandoffRef = { rel?: string; target: string; label?: string };
type HandoffStatus = "in-progress" | "blocked" | "done";
type NormParty = { name: string; kind: "human" | "agent"; role?: string };

export interface HandoffProps {
  /** Who's handing off — a name, or `{ name, kind: "human" | "agent", role }`. */
  from: PartyInput;
  /** Who's receiving. Omit for an open handoff (anyone picking it up). */
  to?: PartyInput;
  date?: string;
  status?: HandoffStatus;
  /** One-line context for the handoff. */
  summary?: React.ReactNode;
  /** Background / current state. */
  context?: React.ReactNode;
  /** What's been completed. */
  done?: React.ReactNode[];
  /** What's next for the receiver. */
  next?: React.ReactNode[];
  /** Open questions / blockers. */
  questions?: React.ReactNode[];
  /** Typed links (related work, the PR, the spec…). */
  refs?: HandoffRef[];
}

function party(p: PartyInput): NormParty {
  return typeof p === "string"
    ? { name: p, kind: "human" }
    : { name: p.name, kind: p.kind ?? "human", role: p.role };
}

const statusCls: Record<HandoffStatus, string> = {
  "in-progress": "border-kp-accent-border bg-kp-accent-weak text-kp-accent-text",
  blocked: "border-kp-danger/40 bg-kp-danger/10 text-kp-danger",
  done: "border-kp-success/40 bg-kp-success/10 text-kp-success",
};
const statusLabel: Record<HandoffStatus, string> = {
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Complete",
};

function Party({ p }: { p: NormParty }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon icon={p.kind === "agent" ? "bot" : "user"} size={14} color="currentColor" />
      <span className="font-medium text-fd-foreground">{p.name}</span>
      {p.role && <span className="text-fd-muted-foreground">· {p.role}</span>}
    </span>
  );
}

function Section({ title, items }: { title: string; items?: React.ReactNode[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
        {title}
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-fd-foreground/90">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-kp-accent" />
            <span className="min-w-0 flex-1">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Handoff({
  from,
  to,
  date,
  status,
  summary,
  context,
  done,
  next,
  questions,
  refs,
}: HandoffProps) {
  const f = party(from);
  const t = to != null ? party(to) : undefined;
  return (
    <section className="not-prose my-6 rounded-lg border border-fd-border bg-fd-card p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-xs text-fd-muted-foreground">
          <Icon icon="arrow-right-left" size={12} color="currentColor" />
          Handoff
        </span>
        <span className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <Party p={f} />
          <Icon icon="arrow-right" size={14} color="currentColor" />
          {t ? (
            <Party p={t} />
          ) : (
            <span className="text-fd-muted-foreground">anyone picking this up</span>
          )}
        </span>
        {status && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
              statusCls[status],
            )}
          >
            {statusLabel[status]}
          </span>
        )}
        {date && (
          <span className="font-mono text-xs text-fd-muted-foreground tabular-nums">{date}</span>
        )}
      </header>

      {summary != null && <p className="mt-3 text-sm text-fd-foreground">{summary}</p>}

      {context != null && (
        <div className="mt-4">
          <div className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
            Context
          </div>
          <div className="mt-1 text-sm text-fd-foreground/90">{context}</div>
        </div>
      )}

      <Section title="Done" items={done} />
      <Section title="Next" items={next} />
      <Section title="Open questions" items={questions} />

      {refs && refs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-fd-border pt-3">
          {refs.map((r, i) => (
            <a
              key={i}
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

/* ============================================================ knowledge face === */

const partySchema = z.union([
  z.string(),
  z.object({
    name: z.string(),
    kind: z.enum(["human", "agent"]).optional(),
    role: z.string().optional(),
  }),
]);
const refSchema = z.object({
  rel: z.string().optional(),
  target: z.string(),
  label: z.string().optional(),
});
const handoffSchema = z.object({
  from: partySchema,
  to: partySchema.optional(),
  date: z.string().optional(),
  status: z.enum(["in-progress", "blocked", "done"]).optional(),
  summary: z.unknown().optional(),
  context: z.unknown().optional(),
  done: z.array(z.unknown()).optional(),
  next: z.array(z.unknown()).optional(),
  questions: z.array(z.unknown()).optional(),
  refs: z.array(refSchema).optional(),
});

function toParty(p: z.infer<typeof partySchema>): HandoffParty {
  return typeof p === "string"
    ? { name: p, kind: "human" }
    : { name: p.name, kind: p.kind ?? "human", role: p.role };
}

registerKnowledge("Handoff", {
  schema: handoffSchema,
  toKnowledge: (p: z.infer<typeof handoffSchema>, ctx: ExtractCtx) => {
    const refs: Ref[] = (p.refs ?? []).map((r) =>
      ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label),
    );
    const list = (xs?: unknown[]) =>
      xs && xs.length ? xs.map((x) => ctx.text(x)).filter((s) => s.length > 0) : undefined;
    return {
      kind: "handoff",
      id: ctx.nextId("handoff"),
      from: toParty(p.from),
      to: p.to != null ? toParty(p.to) : undefined,
      date: p.date != null ? parseKDate(p.date) : undefined,
      status: p.status as Status | undefined,
      summary: p.summary != null ? ctx.text(p.summary) || undefined : undefined,
      context: p.context != null ? ctx.text(p.context) || undefined : undefined,
      done: list(p.done),
      next: list(p.next),
      questions: list(p.questions),
      refs: refs.length ? refs : undefined,
    } satisfies HandoffNode;
  },
});
