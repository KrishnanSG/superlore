"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { z } from "zod";
import { registerKnowledge, type ExtractCtx } from "../knowledge/registry";
import type { DiagramNode } from "../knowledge/primitives";

/**
 * Theme-aware Mermaid diagram. Renders client-side (dynamic import) so it never blocks SSR, and
 * re-renders on theme change with superlore-violet colours. Mermaid is the one sanctioned place we
 * read the resolved theme in JS — it has no CSS surface to token-swap. Usage in MDX:
 *   <Diagram chart={`sequenceDiagram ...`} />
 *
 * Knowledge face: the lossless `source` is preserved so an agent gets the diagram definition,
 * not a rendered SVG (docs/COMPONENTS.md). A node/edge `graph` extraction lands in Phase 2.
 */
export function Diagram({ chart }: { chart: string }) {
  const id = "kpm" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = resolvedTheme !== "light";
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        fontFamily: "inherit",
        theme: "base",
        themeVariables: dark
          ? {
              background: "#131519",
              primaryColor: "#1b1830",
              primaryBorderColor: "#6d5cf0",
              primaryTextColor: "#e7e9ed",
              secondaryColor: "#181b21",
              tertiaryColor: "#14161c",
              lineColor: "#5d6470",
              textColor: "#cdd2d8",
              fontSize: "14px",
              clusterBkg: "#0f1013",
              clusterBorder: "rgba(109,92,240,0.30)",
              noteBkgColor: "#1b1830",
              noteBorderColor: "#6d5cf0",
              noteTextColor: "#cdd2d8",
            }
          : {
              background: "#ffffff",
              primaryColor: "#eeebfe",
              primaryBorderColor: "#5a47e0",
              primaryTextColor: "#14161a",
              secondaryColor: "#f3f4f7",
              lineColor: "#8a909a",
              textColor: "#14161a",
              fontSize: "14px",
              noteBkgColor: "#eeebfe",
              noteBorderColor: "#5a47e0",
            },
      });
      try {
        const out = await mermaid.render(id, chart.trim());
        if (active) setSvg(out.svg);
      } catch {
        if (active) setSvg("");
      }
    })();
    return () => {
      active = false;
    };
  }, [chart, resolvedTheme, id]);

  return (
    <div
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-5 [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Mermaid alias for authors who prefer the name. */
export const Mermaid = Diagram;

const diagramSchema = z.object({ chart: z.string() });
const diagramFace = {
  schema: diagramSchema,
  toKnowledge: (props: { chart: string }, ctx: ExtractCtx) =>
    ({
      kind: "diagram",
      id: ctx.nextId("diagram"),
      syntax: "mermaid",
      source: props.chart.trim(),
    }) satisfies DiagramNode,
} as const;

registerKnowledge("Diagram", diagramFace);
registerKnowledge("Mermaid", diagramFace);
