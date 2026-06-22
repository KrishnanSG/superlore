import * as React from "react";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type {
  InterfaceNode,
  PreviewNavGroup,
  PreviewNavItem,
} from "../knowledge/primitives";

/**
 * Preview — a UI mockup as a dual-representation component. The human sees a styled browser/app
 * window (traffic-light chrome, a product topbar with tabs, a contextual sidebar) wrapping live
 * children; the agent gets `{ kind:"interface", url, tabs, sidebar, content }` — the interface as
 * DATA, never a picture to interpret. So "what tabs does the docs site have?" is a query, not OCR.
 *
 * `Skeleton` (faux content lines) and `Menu` (a dropdown / command-menu mock) ship alongside as
 * presentational primitives — the building blocks you drop inside a Preview's content area.
 */

export interface PreviewTabInput {
  label: string;
  active?: boolean;
}

export interface PreviewNavItemInput {
  label: string;
  active?: boolean;
  collapsed?: boolean;
  children?: PreviewNavItemInput[];
}

export interface PreviewNavGroupInput {
  /** Uppercase group label in the sidebar. */
  group?: string;
  items: PreviewNavItemInput[];
}

export interface PreviewProps {
  /** The address shown in the window's URL pill. */
  url?: string;
  /** A page title rendered at the top of the content area. */
  title?: string;
  /** Brand name shown beside a mark in the product topbar. */
  brand?: string;
  /** Top-level tabs (the "worlds"); set `active` on the current one. */
  tabs?: PreviewTabInput[];
  /** Contextual sidebar: groups of nav items, with active / collapsed / nested state. */
  sidebar?: PreviewNavGroupInput[];
  /** Show a faux ⌘K search pill in the topbar. */
  search?: boolean;
  /** Right-aligned topbar slot (e.g. a faux button). */
  actions?: React.ReactNode;
  /** The content area — drop in `<Skeleton/>`, a `<Menu/>`, or real superlore components. */
  children?: React.ReactNode;
}

function NavItemRow({ item }: { item: PreviewNavItemInput }) {
  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-[12.5px]",
          item.active
            ? "bg-kp-accent-weak font-medium text-kp-accent-text"
            : "text-fd-muted-foreground",
        )}
      >
        <span
          className={cn(
            "size-3 shrink-0 rounded-[3px] border",
            item.active ? "border-kp-accent-border bg-kp-accent-weak" : "border-fd-border",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.collapsed && <span className="text-fd-muted-foreground/60">›</span>}
      </div>
      {item.children && item.children.length > 0 && (
        <ul className="mt-0.5 ml-3.5 space-y-0.5 border-l border-fd-border pl-2">
          {item.children.map((c, i) => (
            <NavItemRow key={i} item={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Preview({
  url,
  title,
  brand,
  tabs,
  sidebar,
  search,
  actions,
  children,
}: PreviewProps) {
  const hasTabs = Boolean(tabs && tabs.length > 0);
  const hasSidebar = Boolean(sidebar && sidebar.length > 0);
  const hasTopbar = Boolean(brand || hasTabs || actions || search);

  return (
    <figure className="kp-preview not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
      {/* window chrome — traffic lights + URL pill */}
      <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/40 px-3.5 py-2.5">
        <span className="size-2.5 rounded-full bg-fd-border" />
        <span className="size-2.5 rounded-full bg-fd-border" />
        <span className="size-2.5 rounded-full bg-fd-border" />
        {url && (
          <span className="ml-2 truncate rounded-md border border-fd-border bg-fd-card px-2.5 py-1 font-mono text-[11px] text-fd-muted-foreground">
            {url}
          </span>
        )}
      </div>

      {/* product topbar */}
      {hasTopbar && (
        <div className="flex items-center gap-3.5 border-b border-fd-border px-4 py-2.5">
          {brand && (
            <span className="flex items-center gap-2">
              <span className="size-4 rounded bg-gradient-to-br from-kp-accent to-kp-accent-hover" />
              <span className="text-[13px] font-semibold tracking-tight text-fd-foreground">
                {brand}
              </span>
            </span>
          )}
          {hasTabs && (
            <nav className="flex items-center gap-1">
              {tabs!.map((t, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12.5px]",
                    t.active
                      ? "bg-kp-accent-weak font-medium text-kp-accent-text"
                      : "text-fd-muted-foreground",
                  )}
                >
                  {t.label}
                </span>
              ))}
            </nav>
          )}
          <span className="flex-1" />
          {search && (
            <span className="rounded-md border border-fd-border px-2.5 py-1 font-mono text-[11px] text-fd-muted-foreground">
              ⌘K
            </span>
          )}
          {actions}
        </div>
      )}

      {/* body — optional sidebar + content */}
      <div className="flex min-h-[200px]">
        {hasSidebar && (
          <aside className="w-52 shrink-0 border-r border-fd-border p-3.5">
            {sidebar!.map((g, gi) => (
              <div key={gi} className={gi > 0 ? "mt-4" : undefined}>
                {g.group && (
                  <div className="mb-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-fd-muted-foreground/70 uppercase">
                    {g.group}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {g.items.map((it, ii) => (
                    <NavItemRow key={ii} item={it} />
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        )}
        <div className="min-w-0 flex-1 p-5">
          {title && (
            <div className="mb-3 text-lg font-semibold tracking-tight text-fd-foreground">
              {title}
            </div>
          )}
          {children}
        </div>
      </div>
    </figure>
  );
}

/* ----------------------------------------------------------------- Skeleton ---- */

const SKELETON_WIDTHS = ["92%", "100%", "78%", "64%", "85%", "70%"];

export interface SkeletonProps {
  /** Number of faux text lines (default 3). */
  lines?: number;
  className?: string;
}

/** Faux content lines for a mockup. Presentational + decorative (no knowledge face). */
export function Skeleton({ lines = 3, className }: SkeletonProps) {
  const n = Math.max(1, Math.floor(lines));
  return (
    <div className={cn("not-prose space-y-2.5", className)} aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded bg-fd-border"
          style={{ width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] }}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- Menu ---- */

export interface MenuItemInput {
  label: string;
  /** A muted sub-label under the item. */
  hint?: string;
  /** A keyboard-shortcut hint on the right. */
  shortcut?: string;
  active?: boolean;
}

export interface MenuProps {
  /** Uppercase header label for the menu. */
  label?: string;
  items: MenuItemInput[];
  className?: string;
}

/** A dropdown / command-menu mock. Presentational (no knowledge face). */
export function Menu({ label, items, className }: MenuProps) {
  return (
    <div
      className={cn(
        "kp-menu not-prose w-64 overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-md",
        className,
      )}
    >
      {label && (
        <div className="border-b border-fd-border px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.1em] text-fd-muted-foreground/70 uppercase">
          {label}
        </div>
      )}
      <ul className="py-1">
        {items.map((it, i) => (
          <li
            key={i}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2 text-[13px]",
              it.active && "bg-kp-accent-weak",
            )}
          >
            <span className="size-4 shrink-0 rounded border border-fd-border bg-fd-muted" />
            <span className="min-w-0 flex-1">
              <span className="block text-fd-foreground">{it.label}</span>
              {it.hint && (
                <span className="block font-mono text-[11px] text-fd-muted-foreground/70">
                  {it.hint}
                </span>
              )}
            </span>
            {it.shortcut && (
              <span className="font-mono text-[11px] text-fd-muted-foreground/60">
                {it.shortcut}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================ knowledge face === */

const tabSchema = z.object({ label: z.string(), active: z.boolean().optional() });

const navItemSchema: z.ZodType<PreviewNavItemInput> = z.lazy(() =>
  z.object({
    label: z.string(),
    active: z.boolean().optional(),
    collapsed: z.boolean().optional(),
    children: z.array(navItemSchema).optional(),
  }),
);

const navGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(navItemSchema),
});

const previewSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  brand: z.string().optional(),
  tabs: z.array(tabSchema).optional(),
  sidebar: z.array(navGroupSchema).optional(),
  search: z.boolean().optional(),
  actions: z.unknown().optional(),
  children: z.unknown().optional(),
});

function toNavItem(it: PreviewNavItemInput): PreviewNavItem {
  return {
    label: it.label,
    active: it.active || undefined,
    collapsed: it.collapsed || undefined,
    children: it.children?.length ? it.children.map(toNavItem) : undefined,
  };
}

function toNavGroup(g: PreviewNavGroupInput): PreviewNavGroup {
  return { group: g.group, items: g.items.map(toNavItem) };
}

registerKnowledge("Preview", {
  schema: previewSchema,
  toKnowledge: (p: z.infer<typeof previewSchema>, ctx: ExtractCtx) => {
    const chrome: "browser" | "app" =
      (p.tabs?.length ?? 0) > 0 || (p.sidebar?.length ?? 0) > 0 || p.brand != null
        ? "app"
        : "browser";
    const content = p.children != null ? ctx.text(p.children) || undefined : undefined;
    return {
      kind: "interface",
      id: ctx.nextId(p.title ?? p.url ?? "preview"),
      title: p.title,
      chrome,
      url: p.url,
      tabs: p.tabs?.length
        ? p.tabs.map((t) => ({ label: t.label, active: t.active || undefined }))
        : undefined,
      sidebar: p.sidebar?.length ? p.sidebar.map(toNavGroup) : undefined,
      content,
    } satisfies InterfaceNode;
  },
});
