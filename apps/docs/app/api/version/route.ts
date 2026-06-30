import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// The superlore version these docs were built against — i.e. the version the site renders, the MCP
// serves, and every /docs/components/* reference page describes. Because `apps/docs` pins
// `superlore: workspace:*` and the site redeploys on each release, this is effectively "latest".
//
// Stable machine contract: GET /api/version → { "name": "superlore", "version": "x.y.z" }.
// Tooling (the authoring skill) hits this to compare against a KB's *installed* superlore and decide
// whether to suggest — or, for a trivial patch, just run — an upgrade. Keep the shape stable.

function readVersionFrom(pkgJsonPath: string): string | null {
  try {
    const pkg: unknown = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    if (pkg && typeof pkg === "object" && (pkg as { name?: unknown }).name === "superlore") {
      const version = (pkg as { version?: unknown }).version;
      return typeof version === "string" ? version : null;
    }
    return null;
  } catch {
    return null;
  }
}

function resolveSuperloreVersion(): string {
  const candidates: string[] = [];

  // 1. Node resolution of the installed package, then walk up to its real package.json. (The dist
  //    dir's own package.json, if any, is skipped by the name check in readVersionFrom.)
  try {
    const require = createRequire(import.meta.url);
    let dir = dirname(require.resolve("superlore"));
    for (let i = 0; i < 8; i++) {
      candidates.push(join(dir, "package.json"));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // Resolution can fail if the package is bundled — fall through to on-disk guesses.
  }

  // 2. Common on-disk locations: the app's hoisted node_modules and the monorepo workspace.
  candidates.push(
    join(process.cwd(), "node_modules", "superlore", "package.json"),
    join(process.cwd(), "..", "..", "packages", "superlore", "package.json"),
  );

  for (const path of candidates) {
    const version = readVersionFrom(path);
    if (version) return version;
  }
  return "unknown";
}

// Fixed for a given deploy — compute once and serve statically (refreshed on the next build).
export const dynamic = "force-static";

const version = resolveSuperloreVersion();

export function GET() {
  return Response.json(
    { name: "superlore", version },
    {
      headers: {
        "cache-control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    },
  );
}
