import type { SuperloreJson } from "../../config.js";
import type { WriteFn } from "./util.js";

/**
 * Scaffold a **personal KB** — a private, queryable replica of how one person thinks, works, and
 * writes. The pages embody that idea using real superlore components (so they render rich and
 * serialize to clean knowledge for the MCP), and are placeholder prose the owner replaces. The
 * working-style page uses the Canvas to map how this person approaches a task — a flow the agent reads.
 */
export function writePersonalContent(write: WriteFn, config: SuperloreJson): void {
  // Sidebar order for the replica.
  write(
    "content/docs/meta.json",
    `${JSON.stringify(
      {
        title: config.name,
        root: true,
        icon: "User",
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
    { rel: "see-also", target: "/docs/working-style", label: "How I work" },
    { rel: "see-also", target: "/docs/voice", label: "How I write" },
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

## How I approach a task

This is the loop I run on anything non-trivial. An agent working for me should follow the same path.

\`\`\`superlore-canvas
{
  "title": "How I approach a task",
  "layout": "row",
  "nodes": [
    { "id": "outcome", "kind": "rounded", "intent": "accent", "icon": "target", "label": "Name the outcome", "body": "Goal + done-condition, in writing." },
    { "id": "decompose", "kind": "rounded", "intent": "blue", "icon": "split", "label": "Decompose", "body": "Reversible steps, sequenced." },
    { "id": "risk", "kind": "diamond", "intent": "orange", "label": "Riskiest part?" },
    { "id": "spike", "kind": "rounded", "intent": "orange", "icon": "flask-conical", "label": "Spike it cheap", "body": "Prove the unknown first." },
    { "id": "ship", "kind": "rounded", "intent": "green", "icon": "rocket", "label": "Ship small", "body": "Smallest reversible change." },
    { "id": "reflect", "kind": "rounded", "intent": "purple", "icon": "repeat", "label": "Reflect", "body": "What did I learn? Write it down." }
  ],
  "edges": [
    { "from": "outcome", "to": "decompose", "intent": "accent" },
    { "from": "decompose", "to": "risk", "intent": "blue" },
    { "from": "risk", "to": "spike", "label": "unknown", "intent": "orange" },
    { "from": "risk", "to": "ship", "label": "clear", "intent": "green" },
    { "from": "spike", "to": "ship", "intent": "green" },
    { "from": "ship", "to": "reflect", "intent": "purple" },
    { "from": "reflect", "to": "outcome", "kind": "dashed", "intent": "muted", "label": "next slice" }
  ]
}
\`\`\`

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
