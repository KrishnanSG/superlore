import * as React from "react";
import { z } from "zod";
import { Icon } from "./mintlify";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type {
  FeatureListNode,
  Field,
  KeyFactsNode,
  KValue,
  StatGridNode,
} from "../knowledge/primitives";

/** Coerce an authored value (string / number / MDX node) to a plain scalar for the knowledge face. */
function asValue(v: unknown, ctx: ExtractCtx): KValue {
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (v == null) return null;
  return ctx.text(v);
}
function asText(v: unknown, ctx: ExtractCtx): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return ctx.text(v);
}

/* ------------------------------------------------------- PageHero ---- */

type PageHeroProps = {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  actions?: React.ReactNode;
};

export function PageHero({ kicker, title, description, icon, actions }: PageHeroProps) {
  return (
    <div className="kp-page-hero not-prose">
      {kicker && (
        <div className="kp-page-hero__kicker">
          {icon && <Icon icon={icon} size={12} />}
          {kicker}
        </div>
      )}
      <h1 className="kp-page-hero__title">{title}</h1>
      {description && <p className="kp-page-hero__description">{description}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------- StatGrid ---- */

type Stat = { label: string; value: React.ReactNode; hint?: React.ReactNode };

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="kp-stat-grid not-prose">
      {stats.map((s, i) => (
        <div className="kp-stat-card" key={i}>
          <div className="kp-stat-card__label">{s.label}</div>
          <div className="kp-stat-card__value">{s.value}</div>
          {s.hint && <div className="mt-1 text-xs text-fd-muted-foreground">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- MetaBar ------ */

type MetaItem = { icon?: string; label: React.ReactNode; value: React.ReactNode };

export function MetaBar({ items }: { items: MetaItem[] }) {
  return (
    <div className="not-prose my-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-fd-border py-3 text-sm text-fd-muted-foreground">
      {items.map((it, i) => (
        <div key={i} className="inline-flex items-center gap-1.5">
          {it.icon && <Icon icon={it.icon} size={14} color="currentColor" />}
          <span className="font-medium text-fd-foreground">{it.label}:</span>
          <span>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------- Pill / PillGroup */

type PillColor = "violet" | "neutral" | "success" | "warning" | "danger";

const pillColors: Record<PillColor, string> = {
  violet: "bg-kp-accent-weak text-kp-accent-text border-kp-accent-border",
  neutral: "bg-fd-muted text-fd-muted-foreground border-fd-border",
  success: "bg-kp-success/12 text-kp-success border-kp-success/30",
  warning: "bg-kp-warning/12 text-kp-warning border-kp-warning/30",
  danger: "bg-kp-danger/12 text-kp-danger border-kp-danger/30",
};

export function Pill({
  color = "violet",
  icon,
  children,
  className,
}: {
  color?: PillColor;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        pillColors[color],
        className,
      )}
    >
      {icon && <Icon icon={icon} size={11} color="currentColor" />}
      {children}
    </span>
  );
}

export function PillGroup({ children }: { children: React.ReactNode }) {
  return <div className="not-prose my-3 flex flex-wrap gap-1.5">{children}</div>;
}

/* ----------------------------------------------- FeatureList */

type FeatureItem = {
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  href?: string;
};

export function FeatureList({ items }: { items: FeatureItem[] }) {
  return (
    <div className="not-prose my-4 divide-y divide-fd-border overflow-hidden rounded-lg border border-fd-border bg-fd-card">
      {items.map((it, i) => {
        const body = (
          <div className="flex items-start gap-3 p-4 transition hover:bg-fd-muted/50">
            {it.icon && (
              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-kp-accent-weak text-kp-accent-text">
                <Icon icon={it.icon} size={18} color="currentColor" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-fd-foreground">{it.title}</div>
              {it.description && (
                <div className="mt-0.5 text-sm text-fd-muted-foreground">{it.description}</div>
              )}
            </div>
            {it.href && (
              <span className="mt-1 text-fd-muted-foreground">
                <Icon icon="chevron-right" size={16} color="currentColor" />
              </span>
            )}
          </div>
        );
        return it.href ? (
          <a key={i} href={it.href} className="block text-inherit no-underline">
            {body}
          </a>
        ) : (
          <div key={i}>{body}</div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------- KeyFacts */

export function KeyFacts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="not-prose my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="min-w-0 rounded-lg border border-fd-border bg-fd-card p-3">
          <dt className="text-xs font-semibold tracking-wider break-words text-fd-muted-foreground uppercase">
            {it.label}
          </dt>
          <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere] break-words text-fd-foreground">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------------------------------- SectionHead */

export function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="not-prose my-8 first:mt-0">
      {eyebrow && (
        <div className="mb-1 text-xs font-bold tracking-[0.12em] text-kp-accent-text uppercase">
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground">{title}</h2>
      {description && <p className="mt-1 text-fd-muted-foreground">{description}</p>}
    </div>
  );
}

/* ============================================================ knowledge faces === */

registerKnowledge("StatGrid", {
  schema: z.object({
    stats: z.array(
      z.object({ label: z.string(), value: z.unknown(), hint: z.unknown().optional() }),
    ),
  }),
  toKnowledge: (props, ctx) => {
    const stats = props.stats.map((s) => ({
      label: s.label,
      value: asValue(s.value, ctx),
      hint: s.hint != null ? asText(s.hint, ctx) : undefined,
    }));
    return {
      kind: "statgrid",
      id: ctx.nextId("stats"),
      stats,
    } satisfies StatGridNode;
  },
});

registerKnowledge("KeyFacts", {
  schema: z.object({
    items: z.array(z.object({ label: z.string(), value: z.unknown() })),
  }),
  toKnowledge: (props, ctx) => {
    const fields: Field[] = props.items.map((it) => ({
      key: it.label,
      value: asValue(it.value, ctx),
    }));
    return { kind: "keyfacts", id: ctx.nextId("facts"), fields } satisfies KeyFactsNode;
  },
});

registerKnowledge("MetaBar", {
  schema: z.object({
    items: z.array(
      z.object({ icon: z.string().optional(), label: z.unknown(), value: z.unknown() }),
    ),
  }),
  toKnowledge: (props, ctx) => {
    const fields: Field[] = props.items.map((it) => ({
      key: asText(it.label, ctx),
      value: asValue(it.value, ctx),
    }));
    return { kind: "keyfacts", id: ctx.nextId("meta"), fields } satisfies KeyFactsNode;
  },
});

registerKnowledge("FeatureList", {
  schema: z.object({
    items: z.array(
      z.object({
        icon: z.string().optional(),
        title: z.unknown(),
        description: z.unknown().optional(),
        href: z.string().optional(),
      }),
    ),
  }),
  toKnowledge: (props, ctx) => {
    const items = props.items.map((it) => ({
      title: asText(it.title, ctx),
      description: it.description != null ? asText(it.description, ctx) : undefined,
      href: it.href,
    }));
    const refs = props.items
      .filter((it) => typeof it.href === "string")
      .map((it) => ctx.resolveRef(it.href as string, "links", asText(it.title, ctx)));
    return {
      kind: "featurelist",
      id: ctx.nextId("features"),
      items,
      refs: refs.length ? refs : undefined,
    } satisfies FeatureListNode;
  },
});
