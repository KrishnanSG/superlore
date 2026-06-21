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
  // `superlore` ships source (.ts/.tsx) for frictionless local consumption — Next transpiles it.
  transpilePackages: ["superlore"],
  // This is a pnpm-workspace app that imports a sibling package's source. Pin BOTH the Turbopack
  // root and the output-file-tracing root to the monorepo root so they agree (Next 16 requires
  // them equal) and `superlore` (which lives outside apps/docs) stays in scope. Without the explicit
  // tracing root, Vercel injects the build dir as the tracing root and the two conflict — the build
  // then fails to resolve `superlore`.
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
