import * as React from "react";
// lucide-react@1.x ships no `exports` map, so the bare `lucide-react/dynamic` subpath fails strict
// ESM resolution in real consumers (bundlers were lenient with our source). Point at the actual ESM
// file so the published, externalized import resolves everywhere.
import { DynamicIcon, dynamicIconImports, type IconName } from "lucide-react/dynamic.mjs";
import {
  Accordion as FumaAccordion,
  Accordions as FumaAccordions,
} from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card as FumaCard, Cards as FumaCards } from "fumadocs-ui/components/card";
import {
  Files as FumaFiles,
  File as FumaFile,
  Folder as FumaFolder,
} from "fumadocs-ui/components/files";
import { Step as FumaStep, Steps as FumaSteps } from "fumadocs-ui/components/steps";
import { Tab as FumaTab, Tabs as FumaTabs } from "fumadocs-ui/components/tabs";
import { z } from "zod";
import { cn } from "../lib/cn";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { CalloutNode, Severity } from "../knowledge/primitives";

/* ---------------------------------------------------------------- Icon ---- */

type IconProps = {
  icon: string | React.ReactNode;
  color?: string;
  size?: number | string;
  className?: string;
};

// Common Font Awesome → lucide name aliases for icons used in ported docs.
const iconAliases: Record<string, IconName> = {
  sparkles: "sparkle",
  "chart-line": "trending-up",
  "line-chart": "trending-up",
  "chart-network": "network",
  "circle-nodes": "network",
  "diagram-project": "workflow",
  "screwdriver-wrench": "wrench",
  "calendar-days": "calendar",
  "envelope-open-text": "mail-open",
  "chart-bar": "bar-chart",
  "magnifying-glass": "search",
  "user-gear": "user-cog",
  // SaaS / enterprise infrastructure vocabulary → the closest crisp lucide glyph, so architecture
  // boards have a real icon set without bundling proprietary cloud marks. Author `icon: "queue"` etc.
  queue: "list-ordered",
  "message-queue": "list-ordered",
  "pub-sub": "radio",
  pubsub: "radio",
  "event-bus": "radio",
  events: "radio",
  "load-balancer": "waypoints",
  "api-gateway": "route",
  gateway: "route",
  cache: "database-zap",
  redis: "database-zap",
  cdn: "radio-tower",
  lambda: "zap",
  serverless: "zap",
  function: "square-function",
  worker: "cog",
  bucket: "archive",
  "object-storage": "archive",
  storage: "hard-drive",
  warehouse: "warehouse",
  "data-warehouse": "warehouse",
  analytics: "gauge",
  microservice: "component",
  service: "component",
  client: "app-window",
  browser: "app-window",
  mobile: "smartphone",
  vault: "key-round",
  secret: "key-round",
  monitoring: "activity",
  observability: "activity",
  kubernetes: "ship-wheel",
  k8s: "ship-wheel",
  container: "container",
  docker: "container",
};

// Treat the imports object as an untyped record — some bundlers wrap it as a
// Proxy or getter, so we only use it for membership checks.
const validIcon = (name: string): name is IconName =>
  Object.prototype.hasOwnProperty.call(
    dynamicIconImports as unknown as Record<string, unknown>,
    name,
  );

export function Icon({ icon, color, size = 16, className }: IconProps) {
  if (typeof icon !== "string") return <>{icon}</>;
  const candidate = iconAliases[icon] ?? icon;
  if (!validIcon(candidate)) return null;
  return (
    <DynamicIcon
      name={candidate}
      size={size}
      color={color}
      className={cn("inline-block align-[-0.125em]", className)}
    />
  );
}

/* -------------------------------------------------------------- Callouts --- */

type CalloutShimProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
};

const calloutFactory = (type: "info" | "warn" | "error" | "success" | "idea") => {
  const CalloutShim = ({ title, children }: CalloutShimProps) => (
    <Callout type={type} title={title}>
      {children}
    </Callout>
  );
  CalloutShim.displayName = `Callout(${type})`;
  return CalloutShim;
};

export const Info = calloutFactory("info");
export const Note = calloutFactory("info");
export const Tip = calloutFactory("idea");
export const Check = calloutFactory("success");
export const Warning = calloutFactory("warn");
export const Danger = calloutFactory("error");

/* ----------------------------------------------------------------- Card --- */

type CardShimProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: string | React.ReactNode;
  href?: string;
  iconType?: string; // accepted for Mintlify compat, no-op
  color?: string;
  children?: React.ReactNode;
  cta?: string;
  arrow?: boolean;
  horizontal?: boolean;
};

export function Card({ title, description, icon, href, children, ...rest }: CardShimProps) {
  const iconNode = typeof icon === "string" ? <Icon icon={icon} size={20} /> : icon;
  return (
    <FumaCard
      title={title ?? ""}
      description={description}
      icon={iconNode}
      href={href}
      {...(rest as object)}
    >
      {children}
    </FumaCard>
  );
}

const gridCols: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function CardGroup({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  children?: React.ReactNode;
}) {
  return <FumaCards className={cn("grid grid-cols-1 gap-4", gridCols[cols])}>{children}</FumaCards>;
}

/* -------------------------------------------------------- Columns / Column */

export function Columns({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  children?: React.ReactNode;
}) {
  return <div className={cn("my-4 grid grid-cols-1 gap-4", gridCols[cols])}>{children}</div>;
}

export function Column({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
}

/* ----------------------------------------------------------------- Frame --- */

type FrameProps = {
  caption?: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
};

export function Frame({ caption, hint, children }: FrameProps) {
  return (
    <figure className="my-6">
      {hint && <div className="mb-2 text-sm text-fd-muted-foreground">{hint}</div>}
      <div className="flex items-center justify-center overflow-hidden rounded-lg border border-fd-border bg-fd-card p-2">
        {children}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ----------------------------------------------------------------- Tile --- */

type TileProps = {
  href?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

export function Tile({ href, title, description, children }: TileProps) {
  const body = (
    <div className="group overflow-hidden rounded-lg border border-fd-border bg-fd-card transition hover:border-fd-primary">
      <div className="flex aspect-video items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-fd-muted)_0_2px,transparent_2px_10px)] p-4">
        {children}
      </div>
      {(title || description) && (
        <div className="p-3">
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="text-sm text-fd-muted-foreground">{description}</div>}
        </div>
      )}
    </div>
  );
  return href ? (
    <a href={href} className="no-underline">
      {body}
    </a>
  ) : (
    body
  );
}

/* ---------------------------------------------------------------- Badge --- */

type BadgeColor = "gray" | "violet" | "green" | "yellow" | "red" | "surface";

const badgeColorMap: Record<string, string> = {
  gray: "bg-fd-muted text-fd-muted-foreground",
  violet: "bg-kp-accent-weak text-kp-accent-text border border-kp-accent-border",
  green: "bg-kp-success/15 text-kp-success",
  yellow: "bg-kp-warning/15 text-kp-warning",
  red: "bg-kp-danger/15 text-kp-danger",
  surface: "bg-fd-card text-fd-foreground border border-fd-border",
};

const badgeSizeMap = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1",
};

export function Badge({
  color = "gray",
  size = "md",
  shape = "rounded",
  icon,
  stroke = false,
  disabled = false,
  className,
  children,
}: {
  color?: BadgeColor | string;
  size?: "xs" | "sm" | "md" | "lg";
  shape?: "rounded" | "pill";
  icon?: string | React.ReactNode;
  stroke?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-1 font-medium align-middle leading-none";
  const color_ = badgeColorMap[color] ?? badgeColorMap.gray;
  const size_ = badgeSizeMap[size];
  const shape_ = shape === "pill" ? "rounded-full" : "rounded-md";
  const stroke_ = stroke ? "border border-current bg-transparent" : "";
  const disabled_ = disabled ? "opacity-50" : "";
  return (
    <span className={cn(base, color_, size_, shape_, stroke_, disabled_, className)}>
      {icon && (typeof icon === "string" ? <Icon icon={icon} size={12} /> : icon)}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- Tooltip --- */

type TooltipProps = {
  tip: string;
  headline?: string;
  cta?: string;
  href?: string;
  children?: React.ReactNode;
};

export function Tooltip({ tip, headline, cta, href, children }: TooltipProps) {
  const title = headline ? `${headline}: ${tip}` : tip;
  return (
    <span title={title} className="cursor-help underline decoration-dotted underline-offset-4">
      {children}
      {cta && href && (
        <>
          {" "}
          <a href={href}>{cta}</a>
        </>
      )}
    </span>
  );
}

/* ----------------------------------------------- Steps / Step with title -- */

export const Steps = FumaSteps;

export function Step({ title, children }: { title?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <FumaStep>
      {title && <h3 className="scroll-m-24">{title}</h3>}
      {children}
    </FumaStep>
  );
}

/* ------------------------------------------------- Tabs / Tab with title -- */

export function Tabs({
  children,
  ...rest
}: React.ComponentProps<typeof FumaTabs> & { children?: React.ReactNode }) {
  const items: string[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as { title?: unknown; value?: unknown };
      const t = props.title ?? props.value;
      if (t && typeof t === "string") items.push(t);
    }
  });
  return (
    <FumaTabs items={items.length ? items : rest.items} {...rest}>
      {children}
    </FumaTabs>
  );
}

export function Tab({
  title,
  value,
  children,
  ...rest
}: {
  title?: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <FumaTab value={value ?? title ?? ""} {...rest}>
      {children}
    </FumaTab>
  );
}

/* --------------------------------------- Accordion / AccordionGroup alias */

export const Accordion = FumaAccordion;
export const AccordionGroup = FumaAccordions;

/* ---------------------------------------------------------------- Tree ---- */

const TreeBase = ({ children }: { children?: React.ReactNode }) => (
  <FumaFiles>{children}</FumaFiles>
);

const TreeFolder = ({
  name,
  defaultOpen,
  children,
}: {
  name: string;
  defaultOpen?: boolean;
  openable?: boolean;
  children?: React.ReactNode;
}) => (
  <FumaFolder name={name} defaultOpen={defaultOpen}>
    {children}
  </FumaFolder>
);

const TreeFile = ({ name }: { name: string }) => <FumaFile name={name} />;

export const Tree = Object.assign(TreeBase, { Folder: TreeFolder, File: TreeFile });

/* ============================================================ knowledge faces ===
   Callouts carry a severity + plain-text body. Children-driven, so the schema is lenient and
   the body is flattened from MDX children at extraction time (docs/COMPONENTS.md §4). The other
   Mintlify shims here are inline/layout (Icon, Columns, Frame, Tile, Tooltip, Badge, Tabs
   container) or get their faces with the build-time AST extractor in Phase 2. */

const calloutShimSchema = z.object({
  title: z.unknown().optional(),
  children: z.unknown().optional(),
});

const calloutFace = (severity: Severity) =>
  ({
    schema: calloutShimSchema,
    toKnowledge: (props: { title?: unknown; children?: unknown }, ctx: ExtractCtx) => {
      const title = typeof props.title === "string" ? props.title : undefined;
      const body = ctx.text(props.children);
      return {
        kind: "callout",
        id: ctx.nextId(title ?? severity),
        title,
        severity,
        body,
        summary: body ? body.slice(0, 200) : undefined,
      } satisfies CalloutNode;
    },
  }) as const;

registerKnowledge("Info", calloutFace("info"));
registerKnowledge("Note", calloutFace("info"));
registerKnowledge("Tip", calloutFace("tip"));
registerKnowledge("Check", calloutFace("success"));
registerKnowledge("Warning", calloutFace("warning"));
registerKnowledge("Danger", calloutFace("danger"));
