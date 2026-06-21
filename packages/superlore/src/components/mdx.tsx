import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";
import { Isolate } from "./error-boundary";
import {
  Accordion,
  AccordionGroup,
  Badge,
  Card,
  CardGroup,
  Check,
  Column,
  Columns,
  Danger,
  Frame,
  Icon,
  Info,
  Note,
  Step,
  Steps,
  Tab,
  Tabs,
  Tile,
  Tip,
  Tooltip,
  Tree,
  Warning,
} from "./mintlify";
import {
  FeatureList,
  KeyFacts,
  MetaBar,
  PageHero,
  Pill,
  PillGroup,
  SectionHead,
  StatGrid,
} from "./polish";
import { Diagram, Mermaid } from "./diagram";
import { Canvas, Whiteboard } from "./canvas";
import { Walkthrough } from "./walkthrough";
import { Timeline } from "./timeline";
import { EntityCard } from "./entity-card";
import { DataTable, Table } from "./table";
import { Board, Kanban } from "./board";
import { Changelog, Release, Releases } from "./releases";
import { Schedule } from "./schedule";
import { Decision } from "./decision";
import { Comparison } from "./comparison";
import { Roster } from "./roster";
import { Checklist, Runbook } from "./checklist";
import { Example } from "./example";

/**
 * Every superlore block renders inside an {@link Isolate} error boundary, so one malformed block
 * (bad props, a thrown render, an invalid canvas spec) fails *in place* with a small inline card
 * instead of taking the whole page down. The wrapper lives in this server module deliberately:
 * the block is created here (server context) and passed to the client boundary as `children`, so
 * server components stay server-rendered — we isolate them without forcing them onto the client.
 */
type AnyComponent = ComponentType<Record<string, unknown>>;

function withIsolate(name: string, C: AnyComponent): AnyComponent {
  const Wrapped = (props: Record<string, unknown>) => (
    <Isolate name={name}>{<C {...props} />}</Isolate>
  );
  // Preserve namespaced sub-components (e.g. `Tree.Folder` / `Tree.File`): wrapping a component in
  // a new function would otherwise drop its static properties, leaving `Tree.File` undefined at
  // render (a prerender-time crash). Copy C's own statics, then stamp our displayName.
  Object.assign(Wrapped, C);
  Wrapped.displayName = `Isolate(${name})`;
  return Wrapped;
}

/** The raw superlore-authored components, before isolation. */
const superloreComponents = {
  // Mintlify-compatible primitives
  Icon,
  Info,
  Note,
  Tip,
  Check,
  Warning,
  Danger,
  Card,
  CardGroup,
  Columns,
  Column,
  Frame,
  Tile,
  Badge,
  Tooltip,
  Steps,
  Step,
  Tabs,
  Tab,
  Accordion,
  AccordionGroup,
  Tree,
  // Editorial / polish
  PageHero,
  StatGrid,
  MetaBar,
  Pill,
  PillGroup,
  FeatureList,
  KeyFacts,
  SectionHead,
  // Rich visualization
  Diagram,
  Mermaid,
  Canvas,
  Whiteboard,
  Walkthrough,
  // Structural-knowledge differentiators (dual-representation)
  Timeline,
  EntityCard,
  Table,
  DataTable,
  // Knowledge structures (dual-representation)
  Board,
  Kanban,
  Release,
  Releases,
  Changelog,
  Schedule,
  Decision,
  Comparison,
  Roster,
  Checklist,
  Runbook,
  // Docs helper — preview + view-code frame (presentational, no knowledge face)
  Example,
} satisfies MDXComponents;

/** The same map, each component wrapped in a render firewall. Built once at module load. */
const isolatedComponents = Object.fromEntries(
  Object.entries(superloreComponents).map(([name, C]) => [
    name,
    withIsolate(name, C as unknown as AnyComponent),
  ]),
) as MDXComponents;

/**
 * The superlore MDX component map. Spread this into your app's `useMDXComponents`. Importing it
 * pulls in every component module, which registers their knowledge faces (the side-effecting
 * `registerKnowledge` calls) — so the build-time extractor and the MCP see the full set.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...isolatedComponents,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
