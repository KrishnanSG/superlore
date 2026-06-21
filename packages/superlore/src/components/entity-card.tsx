import * as React from "react";
import { z } from "zod";
import { Icon } from "./mintlify";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { EntityNode, Field, FieldType, KValue, RelKind } from "../knowledge/primitives";

/**
 * EntityCard — a typed *thing* (person, service, dataset, concept) with fields and relations.
 * The highest-leverage knowledge face: it turns a superlore KB into a queryable graph. The agent
 * gets `list(entityType)`, `get(entity:type/slug)`, and `navigate(rel)` over the same data the
 * human reads on the card.
 */

type EntityRef = { rel?: string; target: string; label?: string };

export interface EntityCardProps {
  type: string;
  slug: string;
  title: string;
  summary?: string;
  icon?: string;
  fields?: { key: string; value: React.ReactNode; type?: FieldType }[];
  refs?: EntityRef[];
}

function asValue(v: unknown, ctx: ExtractCtx): KValue {
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (v == null) return null;
  return ctx.text(v);
}

export function EntityCard({ type, title, summary, icon, fields, refs }: EntityCardProps) {
  return (
    <section className="not-prose my-5 rounded-lg border border-fd-border bg-fd-card p-4">
      <header className="flex items-start gap-3">
        {icon && (
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-kp-accent-weak text-kp-accent-text">
            <Icon icon={icon} size={20} color="currentColor" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-fd-foreground">{title}</h3>
            <span className="shrink-0 rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-[10px] tracking-wider text-fd-muted-foreground uppercase">
              {type}
            </span>
          </div>
          {summary && <p className="mt-1 text-sm text-fd-muted-foreground">{summary}</p>}
        </div>
      </header>

      {fields && fields.length > 0 && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((f, i) => (
            <div key={i} className="min-w-0">
              <dt className="text-xs font-semibold tracking-wider text-fd-muted-foreground uppercase">
                {f.key}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 text-sm [overflow-wrap:anywhere] break-words text-fd-foreground",
                  f.type === "number" && "font-mono tabular-nums",
                )}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {refs && refs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-fd-border pt-3">
          {refs.map((r, i) => (
            <a
              key={i}
              href={r.target.startsWith("entity:") ? `#${r.target}` : r.target}
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

const fieldTypeEnum = z.enum(["text", "number", "bool", "date", "enum", "code", "ref"]);

const entitySchema = z.object({
  type: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  icon: z.string().optional(),
  fields: z
    .array(z.object({ key: z.string(), value: z.unknown(), type: fieldTypeEnum.optional() }))
    .optional(),
  refs: z
    .array(
      z.object({ rel: z.string().optional(), target: z.string(), label: z.string().optional() }),
    )
    .optional(),
});

registerKnowledge("EntityCard", {
  schema: entitySchema,
  toKnowledge: (p, ctx) => {
    const fields: Field[] = (p.fields ?? []).map((f) => ({
      key: f.key,
      value: asValue(f.value, ctx),
      type: f.type,
    }));
    return {
      kind: "entity",
      id: ctx.nextId(p.slug || p.title),
      title: p.title,
      summary: p.summary,
      entityType: p.type,
      slug: p.slug,
      fields,
      refs: p.refs?.map((r) => ctx.resolveRef(r.target, (r.rel as RelKind) ?? "related", r.label)),
    } satisfies EntityNode;
  },
});
