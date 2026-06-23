import type { SuperloreJson } from "../../config.js";
import type { WriteFn } from "./util.js";

/**
 * Scaffold **product docs** — public-facing documentation for a product or library. A full, real
 * structure (Overview · Getting started · Concepts · Guides · Reference · Changelog), not a single
 * page. Authored with superlore components so the docs render rich and the same content is queryable
 * over MCP — the "how it works" page uses the Canvas as a real architecture diagram the agent reads.
 */
export function writeProductContent(write: WriteFn, config: SuperloreJson): void {
  write(
    "content/docs/meta.json",
    `${JSON.stringify(
      {
        title: config.name,
        root: true,
        icon: "BookOpen",
        pages: ["index", "getting-started", "concepts", "guides", "reference", "changelog"],
      },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/index.mdx",
    `---
title: Overview
description: What ${config.name} is, who it's for, and where to start.
summary: Overview of ${config.name} — what it does, the value it delivers, and the paths into the docs. The starting point for both a reader and an agent answering "what is this?".
tags: [overview, getting-started]
---

<PageHero
  kicker="Documentation"
  title="${config.name}"
  description="What it is, in one line you'll replace with your own. Author once in MDX — readers get this site, agents get the same content over MCP."
  icon="book-open"
/>

<Note title="This is a starter structure">
  Placeholder docs that show the shape of a good product site. Keep the structure, replace the
  content. Preview with \`superlore dev\`.
</Note>

<StatGrid
  stats={[
    { label: "Set up in", value: "5 min", hint: "From install to first call" },
    { label: "Works with", value: "Any stack", hint: "Replace with your real surface" },
    { label: "Agent-ready", value: "MCP", hint: "The docs, queryable" },
  ]}
/>

## Start here

<FeatureList
  items={[
    { icon: "rocket", title: "Getting started", description: "Install, configure, and make your first call.", href: "/docs/getting-started" },
    { icon: "lightbulb", title: "Concepts", description: "How it works and the core ideas.", href: "/docs/concepts/how-it-works" },
    { icon: "book-open", title: "Guides", description: "Step-by-step for common tasks.", href: "/docs/guides/first-integration" },
    { icon: "settings", title: "Reference", description: "Every option, in one place.", href: "/docs/reference/configuration" },
  ]}
/>
`,
  );

  write(
    "content/docs/getting-started.mdx",
    `---
title: Getting started
description: Install ${config.name}, configure it, and make your first call.
summary: The quickstart for ${config.name} — install, minimal configuration, and a first working call, as ordered steps an agent can also follow.
tags: [getting-started, quickstart, install]
---

<SectionHead
  eyebrow="Getting started"
  title="Quickstart"
  description="From nothing to a working call. Replace the commands and snippet with your real ones."
/>

<Steps>
  <Step>
    ### Install

    \`\`\`bash
    npm install your-package
    \`\`\`
  </Step>
  <Step>
    ### Configure

    Set your API key in the environment:

    \`\`\`bash
    export YOUR_API_KEY=sk_...
    \`\`\`
  </Step>
  <Step>
    ### Make your first call

    \`\`\`ts
    import { Client } from "your-package";

    const client = new Client({ apiKey: process.env.YOUR_API_KEY });
    const result = await client.ping();
    console.log(result);
    \`\`\`
  </Step>
</Steps>

<Tip title="That's it">
  You've made your first call. Next, read [how it works](/docs/concepts/how-it-works) or jump into a
  [guide](/docs/guides/first-integration).
</Tip>
`,
  );

  // ─────────────────────────────── Concepts ───────────────────────────────

  write(
    "content/docs/concepts/meta.json",
    `${JSON.stringify(
      { title: "Concepts", icon: "Lightbulb", pages: ["how-it-works", "core-concepts"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/concepts/how-it-works.mdx",
    `---
title: How it works
description: The path a request takes through ${config.name}, end to end.
summary: How ${config.name} works under the hood — the request path from the caller's app through the API to the result. The canvas is the authoritative diagram; the agent reads the same graph.
tags: [concepts, architecture, how-it-works]
---

<SectionHead
  eyebrow="Concepts"
  title="How it works"
  description="The journey of a request. Redraw the canvas to match your real flow."
/>

\`\`\`superlore-canvas
{
  "title": "Request lifecycle",
  "direction": "right",
  "groups": [
    { "id": "you", "label": "Your app", "frame": true, "intent": "gray" },
    { "id": "svc", "label": "${config.name}", "frame": true, "intent": "accent" },
    { "id": "out", "label": "Result", "frame": true, "intent": "green" }
  ],
  "nodes": [
    { "id": "sdk", "kind": "rect", "intent": "blue", "group": "you", "icon": "code", "label": "SDK / HTTP call" },
    { "id": "auth", "kind": "icon", "icon": "shield", "group": "svc", "label": "Auth" },
    { "id": "validate", "kind": "diamond", "group": "svc", "label": "Valid request?" },
    { "id": "process", "kind": "rect", "intent": "purple", "group": "svc", "label": "Process" },
    { "id": "store", "kind": "cylinder", "intent": "green", "group": "svc", "label": "Store" },
    { "id": "result", "kind": "rounded", "intent": "green", "group": "out", "label": "Response" },
    { "id": "error", "kind": "callout", "intent": "red", "group": "out", "label": "Typed error" }
  ],
  "edges": [
    { "from": "sdk", "to": "auth", "label": "request", "intent": "blue" },
    { "from": "auth", "to": "validate", "rel": "links" },
    { "from": "validate", "to": "process", "label": "yes", "intent": "purple" },
    { "from": "validate", "to": "error", "label": "no", "kind": "dashed", "intent": "red" },
    { "from": "process", "to": "store", "intent": "green", "rel": "depends-on" },
    { "from": "process", "to": "result", "intent": "green" }
  ]
}
\`\`\`

<KeyFacts
  items={[
    { label: "Transport", value: "HTTPS / your SDK" },
    { label: "Auth", value: "API key — replace with your real scheme" },
    { label: "Errors", value: "Typed and predictable, never a bare 500" },
    { label: "Idempotency", value: "Safe to retry — say how, here" },
  ]}
/>
`,
  );

  write(
    "content/docs/concepts/core-concepts.mdx",
    `---
title: Core concepts
description: The handful of ideas that explain everything else.
summary: The core concepts of ${config.name} — the vocabulary a reader (or agent) needs, plus how the approaches compare.
tags: [concepts, glossary]
---

<SectionHead
  eyebrow="Concepts"
  title="Core concepts"
  description="Learn these five words and the rest of the docs make sense. Replace with yours."
/>

<FeatureList
  items={[
    { icon: "box", title: "Resource", description: "The main thing you create and operate on. Define yours." },
    { icon: "key", title: "API key", description: "How a request is authenticated." },
    { icon: "webhook", title: "Webhook", description: "How you hear about events asynchronously." },
    { icon: "repeat", title: "Idempotency key", description: "How a retry stays safe." },
  ]}
/>

## Which approach fits?

<Comparison
  caption="Choosing how to integrate"
  options={["SDK", "Raw HTTP"]}
  rows={[
    { criterion: "Setup time", cells: ["Minutes", "A bit more"] },
    { criterion: "Type safety", cells: [true, false] },
    { criterion: "Control", cells: ["partial", true] },
    { criterion: "Best for", cells: ["Most apps", "Exotic runtimes"] },
  ]}
/>
`,
  );

  // ──────────────────────────────── Guides ────────────────────────────────

  write(
    "content/docs/guides/meta.json",
    `${JSON.stringify(
      { title: "Guides", icon: "BookOpen", pages: ["first-integration"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/guides/first-integration.mdx",
    `---
title: Your first integration
description: A worked, end-to-end example of integrating ${config.name}.
summary: A step-by-step guide to a first real integration with ${config.name}, with a verification checklist an agent can run through.
tags: [guides, integration, tutorial]
---

<SectionHead
  eyebrow="Guides"
  title="Your first integration"
  description="A realistic, end-to-end task. Replace with a real flow your users care about."
/>

<Steps>
  <Step>
    ### Create a resource

    \`\`\`ts
    const item = await client.items.create({ name: "Example" });
    \`\`\`
  </Step>
  <Step>
    ### Handle the response

    Check for the typed error before using the result. Never assume success.
  </Step>
  <Step>
    ### Listen for events

    Register a webhook so you hear about changes you didn't initiate.
  </Step>
</Steps>

## Before you ship

<Checklist
  label="Integration checklist"
  items={[
    { text: "API key stored as a secret, never in code", group: "Security" },
    { text: "Errors handled, not swallowed", group: "Correctness" },
    { text: "Retries use an idempotency key", group: "Correctness" },
    { text: "Webhook signature verified", group: "Security" },
  ]}
/>
`,
  );

  // ─────────────────────────────── Reference ───────────────────────────────

  write(
    "content/docs/reference/meta.json",
    `${JSON.stringify(
      { title: "Reference", icon: "Settings2", pages: ["configuration"] },
      null,
      2,
    )}\n`,
  );

  write(
    "content/docs/reference/configuration.mdx",
    `---
title: Configuration
description: Every configuration option for ${config.name}, in one table.
summary: The full configuration reference for ${config.name} — each option, its type, default, and what it does. An agent can answer "what does option X do?" from this table.
tags: [reference, configuration, options]
---

<SectionHead
  eyebrow="Reference"
  title="Configuration"
  description="The complete list of options. Replace these placeholders with your real surface."
/>

<Table
  caption="Client options"
  columns={[
    { key: "option", label: "Option", type: "code" },
    { key: "type", label: "Type", type: "text" },
    { key: "default", label: "Default", type: "code" },
    { key: "desc", label: "Description", type: "text" }
  ]}
  rows={[
    { option: "apiKey", type: "string", default: "—", desc: "Required. Your secret API key." },
    { option: "baseUrl", type: "string", default: "https://api…", desc: "Override for self-hosted or staging." },
    { option: "timeout", type: "number", default: "30000", desc: "Request timeout in milliseconds." },
    { option: "maxRetries", type: "number", default: "2", desc: "Automatic retries on transient errors." }
  ]}
/>

## A design note

<Decision
  title="Sensible defaults over required config"
  status="accepted"
  identifier="DESIGN-01"
  context={<>Every required option is friction between a developer and their first success.</>}
  decision={<>Only \`apiKey\` is required; everything else has a default that works for most apps.</>}
  consequences={[
    "A working call needs one line of config.",
    "Power users override exactly what they need.",
  ]}
/>
`,
  );

  // ─────────────────────────────── Changelog ───────────────────────────────

  write(
    "content/docs/changelog.mdx",
    `---
title: Changelog
description: What changed in ${config.name}, version by version.
summary: The release history for ${config.name} with versioned, categorized changes. An agent can answer "what changed in version X?" from this structured changelog.
tags: [changelog, releases]
---

<SectionHead
  eyebrow="Changelog"
  title="What's new"
  description="Versioned, categorized changes. Replace with your real release notes."
/>

<Releases>
<Release
  version="1.1.0"
  date="2024-05-20"
  status="done"
  title="Webhooks"
  summary="Asynchronous events, plus reliability fixes."
  changes={[
    { type: "added", text: "Webhooks for resource events." },
    { type: "changed", text: "Lower default timeout to 30s." },
    { type: "fixed", text: "Retries no longer double-create on timeout." },
  ]}
/>
<Release
  version="1.0.0"
  date="2024-04-01"
  status="done"
  title="General availability"
  changes={[{ type: "added", text: "Stable v1 API and the official SDK." }]}
/>
</Releases>
`,
  );
}
