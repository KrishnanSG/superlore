/**
 * WhySuperlore — the founder story / "why this exists" beat, placed right after the hero.
 *
 * The emotional anchor of the page: the real pain (AI hands back walls of Markdown; the whiteboard
 * that carried the thinking became an unreadable screenshot), the shift (docs are read by agents
 * now; everyone else just bolts an MCP onto the old way), and the proof (we moved our whole company
 * into one corpus). First-person, from Krishnan — kept tight, not a wall of text.
 *
 * Server component: static prose + a next/image portrait, wrapped in the client `Reveal`. All colour
 * via the global.css token bridge; hierarchy via surface + 1px borders, no shadows; no emoji.
 */

import Image from "next/image";
import { Bot, Network, Shapes } from "lucide-react";

import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

const BELIEFS = [
  {
    icon: Bot,
    title: "Agent-native, not retrofitted",
    body: "AI writes, reads, and maintains your docs now. superlore is built for that first — and still beautiful for the people who read it.",
  },
  {
    icon: Shapes,
    title: "Whiteboards, inside the doc",
    body: "Brainstorms live as structured data — exact nodes, edges, and relations an agent can query, not a flat image. The board is the graph.",
  },
  {
    icon: Network,
    title: "One corpus, shared context",
    body: "Every team's knowledge in one place, one MCP call from any agent. The company's shared memory — not fifteen scattered wikis.",
  },
];

export function WhySuperlore() {
  return (
    <Reveal
      as="section"
      className="relative z-10 mx-auto w-full max-w-6xl px-6 py-[clamp(80px,10vw,128px)]"
    >
      {/* Editorial head — mono eyebrow + tight h2 + ≤680px deck. */}
      <header className="max-w-[680px]">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-kp-accent-text uppercase">
          <FoldMark size={13} className="text-kp-accent-text" />
          Why superlore
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-[2.5rem] sm:leading-[1.08]">
          Documentation broke the day AI started writing it.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-pretty text-fd-muted-foreground sm:text-[1.05rem]">
          Half your docs are read by{" "}
          <strong className="font-semibold text-fd-foreground">agents</strong> now, not people.
          Every other tool just bolts an MCP onto the old way of writing them. superlore rethinks
          the document itself — for a world where AI writes, reads, and maintains it.
        </p>
      </header>

      {/* The founder note — first person, portrait set apart. Quote rule in accent, prose ≤62ch. */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
        <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5">
          {/* Portrait with a soft violet aura — the anecdote's anchor, given a little presence. */}
          <div className="relative shrink-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-5 z-0"
              style={{
                background:
                  "radial-gradient(55% 55% at 50% 40%, color-mix(in oklab, var(--kp-accent) 30%, transparent), transparent 72%)",
                filter: "blur(14px)",
              }}
            />
            <Image
              src="/creator.jpg"
              alt="Krishnan S G, creator of superlore"
              width={120}
              height={120}
              className="relative z-10 size-20 rounded-2xl border border-kp-accent-border object-cover shadow-sm ring-1 ring-fd-background lg:size-28"
            />
          </div>
          <div className="relative z-10">
            <p className="text-[15px] font-semibold tracking-tight text-fd-foreground">
              Krishnan S G
            </p>
            <p className="text-sm text-fd-muted-foreground">Creator of superlore</p>
          </div>
        </div>

        <blockquote className="relative border-l-2 border-kp-accent-border pl-6 sm:pl-7">
          {/* Decorative opening quote — signals "this is the founder, in his words." */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-6 -left-1 font-serif text-[5rem] leading-none text-kp-accent-text/20 select-none"
          >
            &ldquo;
          </span>
          <div className="max-w-[60ch] space-y-4 text-[15px] leading-[1.7] text-pretty text-fd-foreground sm:text-base">
            <p>
              For years, every project started at a{" "}
              <strong className="font-semibold">whiteboard</strong> — FigJam, Excalidraw, a wall and
              a marker. I&apos;d plan the whole shape of a thing{" "}
              <em className="text-kp-accent-text not-italic">before</em> a line of code; the board
              <em className="not-italic"> was</em> the understanding.
            </p>
            <p>
              Then Claude started shipping whole tickets end-to-end — brilliant at it. But ask for
              the spec and you get a flawless{" "}
              <span className="text-fd-muted-foreground">wall of Markdown</span>: flat, and only as
              useful as you have time to read. The thinking that lived on the whiteboard flattened
              with it.
            </p>
            <p>
              So <strong className="font-semibold">I built superlore</strong> and moved the whole
              company in — engineering, product, roadmaps, sales, every meeting transcript — into{" "}
              <strong className="font-semibold">one knowledge base</strong>: every brainstorm on a
              canvas <em className="text-kp-accent-text not-italic">inside the doc</em>, the whole
              context one MCP call away. Now Claude doesn&apos;t show up like an intern you re-brief
              every morning —{" "}
              <strong className="font-semibold text-kp-accent-text">
                it pulls that context and works like an employee who&apos;s been here for years.
              </strong>
            </p>
          </div>
        </blockquote>
      </div>

      {/* What changed — three beliefs, asymmetric to the founder note above (not a hero card grid). */}
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-3">
        {BELIEFS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-fd-card p-6">
            <div className="flex size-9 items-center justify-center rounded-lg border border-kp-accent-border bg-kp-accent-weak text-kp-accent-text">
              <Icon className="size-[18px]" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-fd-foreground">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
