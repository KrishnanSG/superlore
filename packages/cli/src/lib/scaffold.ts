import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { type SuperloreJson, serializeSuperloreJson } from "../config.js";
import { SUPERLORE_VIOLET } from "./constants.js";
import { escapeForJsx, writeContent } from "./content/index.js";

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
  const authEnabled = config.auth?.enabled ?? false;
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
          // Relaxed ranges (not exact pins) — this lands in the user's own repo, so let them take
          // patches/minors freely. superlore's peerDependencies already fence the majors.
          "fumadocs-core": "^16.8.2",
          "fumadocs-mdx": "^14.3.1",
          "fumadocs-ui": "^16.8.2",
          superlore: "^0.9.0",
          "lucide-react": "^1.21.0",
          ...(mcpEnabled
            ? // mcp-handler pins an EXACT sdk peer (1.26.0); npm errors on anything else (pnpm only
              // warns). Pin the sdk to match so `npm install` resolves cleanly for every package manager.
              { "@modelcontextprotocol/sdk": "1.26.0", "mcp-handler": "^1.1.0" }
            : {}),
          // Auth.js v5 powers the optional Google SSO gate (superlore/auth). Self-disabling
          // without AUTH_GOOGLE_ID, so it's harmless until the env is set.
          ...(authEnabled ? { "next-auth": "^5.0.0-beta.25" } : {}),
          next: "^16.2.4",
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
          typescript: "^6.0.3",
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
          paths: { "@/*": ["./*"], "collections/*": ["./.source/*"] },
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
  // superlore ships compiled ESM — consume it as a normal package (no transpilePackages).
};

export default withMDX(config);
`,
  );

  write(
    "source.config.ts",
    `import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { superloreFrontmatterSchema } from "superlore/frontmatter";
import { remarkSuperlore } from "superlore/mdx";

// Extend the superlore frontmatter schema in ONE place if you add custom fields.
export const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: superloreFrontmatterSchema },
});

export default defineConfig({
  mdxOptions: {
    // Markdown-first authoring, one plugin: \`\`\`superlore-canvas fences → <Canvas>, \`- [ ]\` task
    // lists → <Checklist>, and \`> [!NOTE]\` GitHub alerts → Callouts. Write natural markdown.
    remarkPlugins: [remarkSuperlore],
  },
});
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
import { RootProvider } from "superlore/ui";
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
    `import { redirect } from "next/navigation";

// A superlore KB *is* its docs — there's no separate marketing home to maintain. Land visitors
// straight in the docs (full nav, header, sidebar, search). Replace this with a custom landing
// only if you actually want one.
export default function HomePage() {
  redirect("/docs");
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
    `import { docs } from "collections/server";
import { loader, lucideIconsPlugin } from "superlore/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});
`,
  );

  // Search backend — Fumadocs' ⌘K dialog fetches /api/search; without this route, search returns
  // nothing. Indexes the same content source the site renders and the MCP serves.
  write(
    "app/api/search/route.ts",
    `import { source } from "@/lib/source";
import { createFromSource } from "superlore/search";

export const { GET } = createFromSource(source);
`,
  );

  // Ship a CLAUDE.md so the owner's agent authors in superlore MDX (dual-representation components),
  // not raw markdown, and looks up patterns via the superlore-docs MCP. This is the adoption lever:
  // the agent maintaining this KB should produce rich, structured, agent-readable docs by default.
  write(
    "CLAUDE.md",
    `# CLAUDE.md — ${config.name}

This repo is a **superlore** knowledge base: author once in MDX, and humans get a clean visual site
while agents read the same structured content over MCP. **One corpus. Humans and agents.**

## Author in superlore MDX — not raw markdown

When you create or edit anything in \`content/docs/\`, **use superlore's dual-representation
components** wherever one fits. Each renders beautifully for humans AND serializes to typed data the
MCP serves — so a diagram is never a flat picture an agent has to guess at; the agent gets the data
behind it. Default to a component over plain prose, a bullet list, or an ASCII diagram:

- **Canvas** (a fenced \`\`\`superlore-canvas JSON block) — architecture, system maps, request flows,
  decision flows. The agent reads the typed { nodes, edges, groups } graph.
- **Timeline / Schedule** — dated milestones, roadmaps, history, on-call.
- **Board** — now / next / later, kanban.
- **Decision** — architecture decision records (context · decision · consequences).
- **Table / Comparison** — structured rows, option/criteria matrices.
- **Roster / EntityCard** — people, teams, services, any entity.
- **Checklist / Steps** — runbooks, procedures, onboarding.
- **Releases** — changelog, version history.
- **KeyFacts · StatGrid · FeatureList · MetaBar · PageHero · SectionHead** — editorial structure.

## Look up patterns over MCP

The superlore docs are available to you as an MCP server (\`superlore-docs\`, registered by the
superlore Claude plugin). Use it for exact component props, the full Canvas vocabulary, and authoring
patterns — \`search\`, \`get_page\`, \`list\`, \`navigate\`, \`get_component_data\`. Full reference:
https://superlore.vercel.app/docs. Don't guess a component's props — query the MCP or the docs.

## Layout

- \`content/docs/**/*.mdx\` — the corpus. A \`meta.json\` per folder sets nav order, title, and icon.
- \`superlore.json\` — KB config (type, MCP, auth). \`app/api/[transport]/route.ts\` — the MCP endpoint.
- \`/\` redirects to \`/docs\` — a superlore KB *is* its docs.

## Run

- \`superlore dev\` — preview locally · \`superlore build\` — production build.
- \`superlore connect\` — install the editor extension for the live dual-view preview + comments.

**The contract:** every component must render for humans *and* serialize for agents. Keep it — it's
the whole point.
`,
  );

  // Starter content — a full, realistic, populated structure for the KB's type (company / product
  // docs / personal), authored with real superlore components so a fresh scaffold renders rich and
  // serves clean knowledge to agents. The owner keeps the structure and replaces the dummy content.
  writeContent(write, config);

  // Optional auth gate (Auth.js v5 + Google SSO via superlore/auth). Self-disabling without
  // AUTH_GOOGLE_ID, so the scaffolded site still runs locally with no env set. The MCP inherits
  // the gate because it's enforced in proxy.ts, in front of every route — including /api/mcp.
  if (authEnabled) {
    writeAuth(write, config);
  }

  if (mcpEnabled) {
    const mcpPath = config.mcp?.path ?? "/api/mcp";
    // The route segment after /api defines the path; with basePath "/api" and a [transport]
    // segment, mcp-handler serves Streamable HTTP at /api/mcp by default.
    write(
      "app/api/[transport]/route.ts",
      `import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getComponentData, getPage, list, navigate, search } from "superlore/mcp";
import { buildIndexFromSource } from "superlore/source";
import type { KKind } from "superlore";
import { source } from "@/lib/source";

// Your KB's MCP endpoint. Served at ${mcpPath} — the same structured content the site renders,
// exposed to agents. The index is built straight from your content \`source\`: author once, and
// humans read the pages while agents query this corpus. No scraping, no drift.
const index = buildIndexFromSource(source);

const json = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search",
      "Full-text search across the knowledge base.",
      { query: z.string(), limit: z.number().int().positive().optional() },
      async ({ query, limit }) => json(search(index, query, limit)),
    );
    server.tool(
      "get_page",
      "Get a page's full structured content by path.",
      { path: z.string() },
      async ({ path }) => json(getPage(index, path)),
    );
    server.tool(
      "list",
      "List knowledge nodes, filtered by kind / tag / entityType.",
      { kind: z.string().optional(), tag: z.string().optional(), entityType: z.string().optional() },
      async ({ kind, tag, entityType }) =>
        json(list(index, { kind: kind as KKind | undefined, tag, entityType })),
    );
    server.tool(
      "navigate",
      "Follow relations from a page path / node id / entity ref.",
      { target: z.string() },
      async ({ target }) => json(navigate(index, target)),
    );
    server.tool(
      "get_component_data",
      "Get the structured data behind a rendered component (its knowledge face).",
      { id: z.string() },
      async ({ id }) => json(getComponentData(index, id)),
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

  // When the gate is on, ship a commented .env.example so the owner knows exactly which env vars
  // turn it on. Without these set, superlore/auth passes every request through (local dev works).
  if (authEnabled) {
    write(
      ".env.example",
      `# Auth.js v5 + Google SSO. The gate is OFF until AUTH_GOOGLE_ID is set, so local dev works with
# this file empty. Copy to .env.local and fill in to enable it on a deploy.
AUTH_SECRET=            # \`openssl rand -base64 32\`
AUTH_GOOGLE_ID=         # presence of this turns the gate ON
AUTH_GOOGLE_SECRET=
AUTH_URL=               # the deploy's canonical URL, e.g. https://your-kb.vercel.app
AUTH_TRUST_HOST=true
${
  config.auth?.allowedDomain
    ? `AUTH_ALLOWED_DOMAIN=${config.auth.allowedDomain}`
    : "# AUTH_ALLOWED_DOMAIN=example.com   # restrict sign-in to one workspace domain (optional)"
}
# AUTH_ALLOWED_EMAILS=you@example.com   # comma-separated allowlist that bypasses the domain check
# LOCAL=true                            # force the gate OFF locally even when configured
`,
    );
  }

  const authReadme = authEnabled
    ? `\n\n## Auth\n\nThis KB ships a Google SSO gate (Auth.js v5). It is **off until you set \`AUTH_GOOGLE_ID\`**, so local dev runs open. Copy \`.env.example\` to \`.env.local\` and fill it in to enable it. The gate lives in \`proxy.ts\`, in front of every route — so the MCP inherits it too.`
    : "";

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
    }${authReadme}
`,
  );
}

/** The file-writer closure `writeSkeleton` hands to its content/auth helpers. */
type WriteFn = (rel: string, body: string) => void;

/**
 * Scaffold the optional auth gate — Auth.js v5 + Google SSO via `superlore/auth`. Three files:
 * the auth instance (`auth.ts`), the Auth.js route handler, and the Next 16 `proxy.ts` that gates
 * every route. `createAuthProxy` is self-disabling (no `AUTH_GOOGLE_ID` → passthrough), so this is
 * safe to ship and the local dev server still runs without any env. Used by company- and personal-KBs.
 */
function writeAuth(write: WriteFn, config: SuperloreJson): void {
  const allowedDomain = config.auth?.allowedDomain;

  write(
    "auth.ts",
    `import { createSuperloreAuth } from "superlore/auth";

// Auth.js v5 + Google SSO. Allowlists can come from env (AUTH_ALLOWED_DOMAIN / AUTH_ALLOWED_EMAILS)
// or be passed explicitly here. Off until AUTH_GOOGLE_ID is set, so local dev needs no config.
export const { handlers, auth, signIn, signOut } = createSuperloreAuth(${
      allowedDomain ? `{\n  allowedDomain: ${JSON.stringify(allowedDomain)},\n}` : "{}"
    });
`,
  );

  write(
    "app/api/auth/[...nextauth]/route.ts",
    `import { handlers } from "@/auth";

export const { GET, POST } = handlers;
`,
  );

  write(
    "proxy.ts",
    `import { auth } from "@/auth";
import { createAuthProxy } from "superlore/auth";

// Next.js 16 middleware lives in proxy.ts. The gate is self-disabling: with no AUTH_GOOGLE_ID
// (or LOCAL=true) every request passes through, so local dev and public deploys stay open.
export default createAuthProxy(auth);

export const config = {
  // Run on everything except static assets (the helper also skips the auth dance + icons).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`,
  );

  // superlore/auth points the gate at /auth/signin and /auth/error. NextAuth won't render its
  // built-in pages once a custom path is set, so ship minimal ones — otherwise a gated deploy
  // would redirect to a 404. params/searchParams are async in Next 16.
  write(
    "app/auth/signin/page.tsx",
    `import { signIn } from "@/auth";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await props.searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl ?? "/" });
        }}
        className="w-full max-w-sm rounded-lg border border-fd-border bg-fd-card p-6 text-center"
      >
        <h1 className="text-lg font-semibold text-fd-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-fd-muted-foreground">
          This knowledge base is private. Continue with Google to read it.
        </p>
        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-kp-accent-border bg-kp-accent px-4 py-2 text-sm font-medium text-white"
        >
          Continue with Google
        </button>
      </form>
    </main>
  );
}
`,
  );

  write(
    "app/auth/error/page.tsx",
    `export default async function AuthErrorPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-fd-border bg-fd-card p-6 text-center">
        <h1 className="text-lg font-semibold text-fd-foreground">Can't sign in</h1>
        <p className="mt-1 text-sm text-fd-muted-foreground">
          {error === "AccessDenied"
            ? "That account isn't allowed to access this knowledge base."
            : "Something went wrong signing in. Try again."}
        </p>
        <a
          href="/auth/signin"
          className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground no-underline"
        >
          Back to sign in
        </a>
      </div>
    </main>
  );
}
`,
  );
}
