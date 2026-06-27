import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const withMDX = createMDX();

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// The monorepo root (where pnpm-workspace.yaml lives) so Turbopack resolves the `superlore`
// workspace package and doesn't guess the wrong root.
const workspaceRoot = path.join(projectRoot, "..", "..");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // BRANCH (mint-theme dev): consume the LOCAL workspace `superlore` (workspace:*), whose dev exports
  // point at src/*.tsx — so transpile it. Production consumes the published, prebuilt package and
  // drops this line.
  transpilePackages: ["superlore"],
  // Still a pnpm monorepo, so pin BOTH the Turbopack root and the output-file-tracing root to the
  // workspace root so they agree (Next 16 requires them equal) and file tracing resolves the dist.
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  // Static export omits the MCP route (route handlers need a server). Use the default SSR build
  // for the MCP-enabled deploy; STATIC_EXPORT=1 produces a static, MCP-less site.
  ...(process.env.STATIC_EXPORT
    ? { output: "export", images: { unoptimized: true }, trailingSlash: true }
    : {}),
};

export default withMDX(config);
