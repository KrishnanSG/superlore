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
          "fumadocs-core": "16.8.2",
          "fumadocs-mdx": "14.3.1",
          "fumadocs-ui": "16.8.2",
          superlore: "^0.5.1",
          "lucide-react": "^1.21.0",
          // superlore peers the rendered components pull in: Mermaid (Diagram), themes.
          mermaid: "^11.15.0",
          ...(mcpEnabled
            ? { "@modelcontextprotocol/sdk": "^1.29.0", "mcp-handler": "^1.1.0" }
            : {}),
          // Auth.js v5 powers the optional Google SSO gate (superlore/auth). Self-disabling
          // without AUTH_GOOGLE_ID, so it's harmless until the env is set.
          ...(authEnabled ? { "next-auth": "^5.0.0-beta.25" } : {}),
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
    `import { docs } from "collections/server";
import { loader, lucideIconsPlugin } from "superlore/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});
`,
  );

  // Starter content — a personal KB gets a "digital replica" page set; everything else gets the
  // single welcome page. Authored with real superlore components so it renders rich, not flat.
  if (config.type === "personal-kb") {
    writePersonalContent(write, config);
  } else {
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
  }

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

/**
 * Scaffold a **personal KB** — a private, queryable replica of how one person thinks, works, and
 * writes. The pages embody that idea using real superlore components (so they render rich and
 * serialize to clean knowledge for the MCP), and are placeholder prose the owner replaces.
 */
function writePersonalContent(write: WriteFn, config: SuperloreJson): void {
  // Sidebar order for the replica.
  write(
    "content/docs/meta.json",
    `${JSON.stringify(
      {
        title: config.name,
        root: true,
        pages: ["index", "beliefs", "working-style", "pr-comments", "voice", "stories"],
      },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/index.mdx",
    `---
title: About me
description: Who I am, what I care about, and how to work with me.
summary: Overview of this person — role, focus, what they optimize for, and how an agent should use this KB to act on their behalf.
tags: [overview, about, profile]
---

<PageHero
  kicker="Personal KB"
  title="About me"
  description="A private, queryable replica of how I think, work, and write. Humans read this; my agents read the same content over MCP and act the way I would."
/>

I'm a placeholder. Replace this with a short, honest description of who you are — your role, what
you build, and the through-line in your work. Keep it concrete: an agent should be able to read
this and understand what you'd care about in a decision.

<KeyFacts
  items={[
    { label: "Role", value: "What you do, in five words or fewer" },
    { label: "Focus", value: "The problem you spend most days on" },
    { label: "Optimizes for", value: "Speed, correctness, clarity — pick yours" },
    { label: "Time zone", value: "UTC+0" },
    { label: "Best reached", value: "Async, in writing" },
    { label: "Decides by", value: "Evidence over opinion" },
  ]}
/>

<EntityCard
  type="person"
  slug="me"
  title="Your Name"
  summary="One line that captures how you'd want an agent to introduce you."
  icon="user"
  fields={[
    { key: "Discipline", value: "Engineering" },
    { key: "Superpower", value: "Turning ambiguity into a plan" },
    { key: "Allergic to", value: "Meetings that should have been a doc" },
  ]}
  refs={[
    { rel: "see", target: "/docs/working-style", label: "How I work" },
    { rel: "see", target: "/docs/voice", label: "How I write" },
  ]}
/>

## How to use this KB

Ask it how I'd think about something before you ask me. The pages below are the source of truth
for my beliefs, working style, review bar, voice, and the stories that shaped them.
`,
  );

  write(
    "content/docs/beliefs.mdx",
    `---
title: Beliefs & takes
description: The positions I hold and the principles I keep coming back to.
summary: This person's strongly-held beliefs and operating principles, each phrased as a position an agent can apply when reasoning on their behalf.
tags: [beliefs, principles, takes]
---

<SectionHead
  eyebrow="What I believe"
  title="Beliefs & takes"
  description="Strongly held, loosely coupled. Each is a position you can act on, not a vibe."
/>

These are placeholders — rewrite them as your own. Phrase each as a clear position so an agent can
reason from it.

<KeyFacts
  items={[
    { label: "On shipping", value: "Small and reversible beats big and perfect." },
    { label: "On code", value: "Delete more than you add." },
    { label: "On process", value: "Process is scar tissue — keep only what earned its place." },
    { label: "On disagreement", value: "Disagree in the doc, commit in the room." },
    { label: "On estimates", value: "Confidence intervals, not single numbers." },
    { label: "On tools", value: "Boring tech for load-bearing things." },
  ]}
/>

## A take I'll defend

<Decision
  title="Prefer clarity over cleverness"
  status="accepted"
  identifier="TAKE-01"
  context={<>Clever code feels good to write and is expensive to read. Most code is read far more than it is written.</>}
  decision={<>Optimize for the next person (often future me). If a reviewer has to ask what it does, it isn't done.</>}
  consequences={[
    "Fewer abstractions until they pay rent.",
    "Comments explain why, names explain what.",
    "I'll trade a few keystrokes for a faster read every time.",
  ]}
/>
`,
  );

  write(
    "content/docs/working-style.mdx",
    `---
title: Working style
description: How I plan, decide, focus, and collaborate.
summary: How this person works day to day — how they plan, make decisions, manage focus, and collaborate. Use this to predict how they'd approach a task.
tags: [working-style, how-to, collaboration]
---

<SectionHead
  eyebrow="How I work"
  title="Working style"
  description="If you handed me a task, this is the shape of what I'd do with it."
/>

Placeholder content — make it yours. Be specific enough that an agent could run a task the way you
would.

<FeatureList
  items={[
    { icon: "target", title: "Start from the outcome", description: "I write the goal and the done-condition before touching the work." },
    { icon: "split", title: "Decompose, then sequence", description: "Break into reversible steps; do the riskiest cheap thing first." },
    { icon: "message-square", title: "Default to writing", description: "A short doc beats a meeting. Decisions live in text, not memory." },
    { icon: "gauge", title: "Protect deep work", description: "Mornings are for the hard thing. Coordination batches in the afternoon." },
  ]}
/>

## How I decide

<Decision
  title="Two-way doors don't need a meeting"
  status="accepted"
  identifier="STYLE-01"
  context={<>Many decisions are easily reversible. Treating them as if they aren't is the real cost.</>}
  decision={<>For reversible calls, I pick quickly and move; for one-way doors, I slow down and write the trade-offs out.</>}
  consequences={[
    "Speed on the 80% that's reversible.",
    "Care on the 20% that isn't.",
  ]}
/>

## A day, roughly

<Schedule
  label="Typical working day"
  events={[
    { date: "Weekday", time: "09:00", title: "Deep work", body: "The hardest task of the day, no notifications." },
    { date: "Weekday", time: "12:30", title: "Reviews & async", body: "PRs, comments, written replies." },
    { date: "Weekday", time: "15:00", title: "Collaboration", body: "Pairing, calls, unblock others." },
    { date: "Weekday", time: "17:00", title: "Wind-down", body: "Plan tomorrow's first task." },
  ]}
/>
`,
  );

  write(
    "content/docs/pr-comments.mdx",
    `---
title: How I give PR comments
description: My review bar, the tone I use, and concrete examples of comments I leave.
summary: How this person reviews code — what they block on versus nudge, the tone of their comments, and worked examples an agent can imitate when reviewing on their behalf.
tags: [code-review, feedback, how-to]
---

<SectionHead
  eyebrow="Code review"
  title="How I give PR comments"
  description="What I block on, what I just nudge, and how I phrase it. Replace with your own."
/>

## My review bar

<Checklist
  label="What I look for, in order"
  items={[
    { text: "Correctness — does it do the thing, including the edge cases?", group: "Block on" },
    { text: "Tests that would fail without the change", group: "Block on" },
    { text: "Names and structure I can read in one pass", group: "Block on" },
    { text: "Unnecessary abstraction or dead code", group: "Nudge on" },
    { text: "Comments that explain why, not what", group: "Nudge on" },
    { text: "Nits — formatting, ordering, taste", group: "Optional" },
  ]}
/>

## How I phrase comments

I prefix to signal weight: **blocking:** must change, **suggestion:** take it or leave it,
**nit:** ignore freely, **question:** I genuinely don't know. Examples:

<Example title="A blocking comment">
**blocking:** This drops the error on the floor — if the fetch fails we return \`undefined\` and
the caller renders an empty state as if it were success. Surface it, or handle it explicitly.
</Example>

<Example title="A suggestion">
**suggestion:** This loop reads cleanly, but \`items.flatMap\` would say the same thing in one line.
Your call — not blocking.
</Example>

<Example title="A nit">
**nit:** tiny — can we name this \`pendingCount\` so it matches the others? Ignore if you disagree.
</Example>

<Tip title="Tone">
  Critique the code, never the author. Lead with the why. If I'd want it softened when it lands on
  my own PR, I soften it.
</Tip>
`,
  );

  write(
    "content/docs/voice.mdx",
    `---
title: Voice & writing
description: How I sound in writing — tone, defaults, and what I avoid.
summary: This person's writing voice — tone, structure defaults, and explicit do/don't rules an agent should follow when drafting in their name.
tags: [voice, writing, style]
---

<SectionHead
  eyebrow="How I write"
  title="Voice & writing"
  description="So an agent drafting in my name sounds like me, not like a template."
/>

Placeholder — capture your actual voice. The more specific the do/don't list, the better an agent
can match you.

<KeyFacts
  items={[
    { label: "Tone", value: "Direct, warm, low ceremony" },
    { label: "Sentence length", value: "Short. Then one longer one to breathe." },
    { label: "Person", value: "First person, active voice" },
    { label: "Jargon", value: "Only when it's the precise word" },
  ]}
/>

## Do / don't

<Comparison
  caption="My writing defaults"
  options={["Do", "Don't"]}
  rows={[
    { criterion: "Openers", cells: ["Get to the point in the first line", "Open with filler pleasantries"] },
    { criterion: "Hedging", cells: ["Say what I think", "It might possibly be worth considering"] },
    { criterion: "Structure", cells: ["Lead with the answer, then the why", "Bury the ask at the end"] },
    { criterion: "Emoji", cells: ["Rarely, and never in serious writing", "Decorate every line"] },
  ]}
/>

<Example title="A message in my voice">
Shipping the import fix today. It was dropping rows when a column was empty — now we skip the row
and log it. One follow-up: we should validate on upload so this can't happen again. Want me to take
that next?
</Example>
`,
  );

  write(
    "content/docs/stories.mdx",
    `---
title: Stories
description: Formative moments that explain how I got my defaults.
summary: Formative experiences that shaped this person's beliefs and working style, as a dated timeline an agent can reference for context on why they think the way they do.
tags: [stories, background, timeline]
---

<SectionHead
  eyebrow="Where it comes from"
  title="Stories"
  description="The moments behind the takes. Replace these with your own — dates can be approximate."
/>

An agent that knows *why* you believe something reasons better than one that only knows *what*.
These are placeholders.

<Timeline
  label="Formative moments"
  items={[
    {
      date: "2016",
      title: "The outage that taught me to write things down",
      body: "A fix lived only in one person's head. When they were out, we relearned it the hard way. I've defaulted to docs ever since.",
      status: "done",
      tags: ["process", "writing"],
    },
    {
      date: "2019",
      title: "Shipped small for the first time",
      body: "Replaced a six-month rewrite with weekly reversible changes. It landed. I stopped believing in big-bang.",
      status: "done",
      tags: ["shipping"],
    },
    {
      date: "2022",
      title: "A review that changed how I review",
      body: "Someone critiqued my code without making me feel small. I've tried to give every review that way since.",
      status: "done",
      tags: ["code-review", "tone"],
    },
  ]}
/>
`,
  );
}

/** Escape a string for safe inlining inside a JSX text/attribute literal. */
function escapeForJsx(value: string): string {
  return value.replace(/[\\"]/g, "\\$&").replace(/[{}]/g, "");
}
