import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { type SuperloreJson, serializeSuperloreJson } from "../config.js";
import { SUPERLORE_VIOLET } from "./constants.js";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve `templates/starter` relative to the installed CLI. Walks up from the CLI's own location
 * looking for the monorepo's `templates/starter` (dev) — published installs would ship the
 * template inside the package, but in-repo the workspace copy is the reference.
 */
export function findStarterTemplate(): string | undefined {
  let dir = here;
  for (;;) {
    const candidate = join(dir, "templates", "starter");
    if (existsSync(candidate)) return candidate;
    // Also allow a template bundled inside the package (published layout).
    const bundled = join(dir, "template");
    if (existsSync(bundled)) return bundled;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * A template is "real" (worth copying) only if it has more than just a README — otherwise the
 * minimal skeleton is a better starting point. The in-repo `templates/starter` is currently a
 * placeholder README, so this guards against scaffolding an empty project.
 */
export function isUsableTemplate(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir).filter((name) => name !== "README.md" && !name.startsWith("."));
  return entries.length > 0;
}

/** Whether the target directory is safe to scaffold into (missing or empty). */
export function isEmptyDir(dir: string): boolean {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).filter((n) => !n.startsWith(".")).length === 0;
}

export interface ScaffoldOptions {
  /** Absolute target directory. */
  dir: string;
  /** The validated config to write as superlore.json. */
  config: SuperloreJson;
}

/** Result of a scaffold: which strategy ran and the absolute project root. */
export interface ScaffoldResult {
  root: string;
  source: "template" | "skeleton";
}

/**
 * Scaffold a new superlore KB into `dir`. Copies `templates/starter` when it's a usable template;
 * otherwise writes a minimal Next 16 + `superlore` app skeleton. Always (over)writes a `superlore.json`
 * built from the answers, so the config matches what the user chose regardless of strategy.
 */
export function scaffold(options: ScaffoldOptions): ScaffoldResult {
  const root = resolve(options.dir);
  mkdirSync(root, { recursive: true });

  const template = findStarterTemplate();
  let source: ScaffoldResult["source"];
  if (template && isUsableTemplate(template)) {
    cpSync(template, root, { recursive: true });
    source = "template";
  } else {
    writeSkeleton(root, options.config);
    source = "skeleton";
  }

  // The config is authoritative: write it last so it reflects the answers either way.
  writeFileSync(join(root, "superlore.json"), serializeSuperloreJson(options.config), "utf8");

  return { root, source };
}

/** Minimal Next 16 + Fumadocs + `superlore` skeleton — enough to `dev`, `build`, and render. */
function writeSkeleton(root: string, config: SuperloreJson): void {
  const accent = config.accent ?? SUPERLORE_VIOLET;
  const mcpEnabled = config.mcp?.enabled ?? true;
  const slug =
    config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "superlore-kb";

  const write = (rel: string, body: string): void => {
    const file = join(root, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body, "utf8");
  };

  write(
    "package.json",
    `${JSON.stringify(
      {
        name: slug,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          postinstall: "fumadocs-mdx",
        },
        dependencies: {
          "fumadocs-core": "16.8.2",
          "fumadocs-mdx": "14.3.1",
          "fumadocs-ui": "16.8.2",
          superlore: "^0.1.0",
          "lucide-react": "^1.21.0",
          ...(mcpEnabled
            ? { "@modelcontextprotocol/sdk": "^1.29.0", "mcp-handler": "^1.1.0" }
            : {}),
          next: "16.2.4",
          "next-themes": "^0.4.6",
          react: "^19.2.5",
          "react-dom": "^19.2.5",
          zod: "^4.4.3",
        },
        devDependencies: {
          "@tailwindcss/postcss": "^4.2.2",
          "@types/node": "^25.6.0",
          "@types/react": "^19.2.14",
          "@types/react-dom": "^19.2.3",
          postcss: "^8.5.10",
          tailwindcss: "^4.2.2",
          typescript: "6.0.3",
        },
      },
      null,
      2,
    )}\n`,
  );

  write(
    "tsconfig.json",
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          module: "esnext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          jsx: "preserve",
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          skipLibCheck: true,
          incremental: true,
          paths: { "@/*": ["./*"] },
          plugins: [{ name: "next" }],
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules", ".next", "out"],
      },
      null,
      2,
    )}\n`,
  );

  write(
    "next.config.mjs",
    `import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // \`superlore\` ships source (.ts/.tsx) for frictionless consumption — Next transpiles it.
  transpilePackages: ["superlore"],
};

export default withMDX(config);
`,
  );

  write(
    "source.config.ts",
    `import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { superloreFrontmatterSchema } from "superlore/frontmatter";

// Extend the superlore frontmatter schema in ONE place if you add custom fields.
export const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: superloreFrontmatterSchema },
});

export default defineConfig();
`,
  );

  write(
    "postcss.config.mjs",
    `const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
`,
  );

  write(
    "app/global.css",
    `@import "tailwindcss";
/* superlore theme tokens (light + dark, co-equal). Re-skin the whole KB from one accent. */
@import "superlore/css";

:root {
  /* Brand accent — superlore derives the hover/weak/border/text family for both themes. */
  --kp-accent: ${accent};
}
`,
  );

  write(
    "app/layout.tsx",
    `import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider";
import "./global.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Light and dark are co-equal; default to the system preference.
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
`,
  );

  write(
    "app/page.tsx",
    `import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: "42rem", margin: "0 auto", padding: "6rem 1.5rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>${escapeForJsx(config.name)}</h1>
      <p style={{ marginTop: "0.75rem", opacity: 0.7 }}>
        One corpus. Humans and agents. Start in <Link href="/docs">the docs</Link>.
      </p>
    </main>
  );
}
`,
  );

  write(
    "app/docs/layout.tsx",
    `import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} nav={{ title: "${escapeForJsx(config.name)}" }}>
      {children}
    </DocsLayout>
  );
}
`,
  );

  write(
    "app/docs/[[...slug]]/page.tsx",
    `import { notFound } from "next/navigation";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import { getMDXComponents } from "superlore";
import { source } from "@/lib/source";

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}
`,
  );

  write(
    "lib/source.ts",
    `import { loader } from "fumadocs-core/source";
import { docs } from "@/.source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
`,
  );

  write(
    "content/docs/index.mdx",
    `---
title: Welcome
description: The home of your superlore knowledge base.
summary: Landing page for the ${config.name} knowledge base.
tags: [getting-started]
---

# Welcome to ${config.name}

This is your superlore KB. Author once in MDX — humans get this clean, interactive site, and
agents read the same structured content over MCP.

Edit \`content/docs/index.mdx\` to make it yours, then run \`superlore dev\`.
`,
  );

  if (mcpEnabled) {
    const mcpPath = config.mcp?.path ?? "/api/mcp";
    // The route segment after /api defines the path; with basePath "/api" and a [transport]
    // segment, mcp-handler serves Streamable HTTP at /api/mcp by default.
    write(
      "app/api/[transport]/route.ts",
      `import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getComponentData, getPage, list, navigate, search } from "superlore/mcp";

// Your KB's MCP endpoint. Served at ${mcpPath} — the same structured content the site renders,
// exposed to agents. Build the index from your content source and pass it to each tool.
// See the superlore docs (Agents & MCP) for wiring the index from \`source\`.

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search",
      "Full-text search across the knowledge base.",
      { query: z.string(), limit: z.number().int().positive().optional() },
      async ({ query, limit }) => json(search(/* index */ {} as never, query, limit)),
    );
    server.tool(
      "get_page",
      "Get a page's full structured content by path.",
      { path: z.string() },
      async ({ path }) => json(getPage(/* index */ {} as never, path)),
    );
    server.tool(
      "list",
      "List knowledge nodes, filtered by kind / tag / entityType.",
      { kind: z.string().optional(), tag: z.string().optional(), entityType: z.string().optional() },
      async (args) => json(list(/* index */ {} as never, args)),
    );
    server.tool(
      "navigate",
      "Follow relations from a page path / node id / entity ref.",
      { target: z.string() },
      async ({ target }) => json(navigate(/* index */ {} as never, target)),
    );
    server.tool(
      "get_component_data",
      "Get the structured data behind a rendered component (its knowledge face).",
      { id: z.string() },
      async ({ id }) => json(getComponentData(/* index */ {} as never, id)),
    );
  },
  {},
  { basePath: "/api" },
);

export { handler as GET, handler as POST };
`,
    );
  }

  write(
    ".gitignore",
    `node_modules
.next
.source
out
*.tsbuildinfo
.env*.local
`,
  );

  write(
    "README.md",
    `# ${config.name}

A superlore knowledge base. One corpus. Humans and agents.

## Develop

\`\`\`sh
pnpm install   # or npm / yarn / bun
superlore dev     # preview the site locally
\`\`\`

## Build

\`\`\`sh
superlore build
\`\`\`

Config lives in \`superlore.json\`. Author content in \`content/docs/\`.${
      mcpEnabled ? `\n\nThe MCP endpoint is served at \`${config.mcp?.path ?? "/api/mcp"}\`.` : ""
    }
`,
  );
}

/** Escape a string for safe inlining inside a JSX text/attribute literal. */
function escapeForJsx(value: string): string {
  return value.replace(/[\\"]/g, "\\$&").replace(/[{}]/g, "");
}
