import type { ComponentType } from "react";
import { KeyFacts, StatGrid } from "../polish";
import { Timeline } from "../timeline";
import { Comparison } from "../comparison";
import { Board } from "../board";
import { Decision } from "../decision";
import { EntityCard } from "../entity-card";
import { Releases } from "../releases";
import { Roster } from "../roster";
import { Schedule } from "../schedule";

/**
 * The components a Canvas node may embed (`kind:"embed"`, `component:"…"`). Curated to the
 * knowledge-bearing, presentational components — so a node can BE a live Timeline / Comparison /
 * StatGrid, and the MCP still sees its typed data (the canvas graph carries the embedded node).
 * Canvas itself is intentionally excluded (no canvas-in-canvas recursion).
 */
type AnyComponent = ComponentType<Record<string, unknown>>;
const as = (c: unknown) => c as AnyComponent;

export const EMBED_COMPONENTS: Record<string, AnyComponent> = {
  KeyFacts: as(KeyFacts),
  StatGrid: as(StatGrid),
  Timeline: as(Timeline),
  Comparison: as(Comparison),
  Board: as(Board),
  Decision: as(Decision),
  EntityCard: as(EntityCard),
  Releases: as(Releases),
  Roster: as(Roster),
  Schedule: as(Schedule),
};

export const EMBEDDABLE_NAMES = Object.keys(EMBED_COMPONENTS);
