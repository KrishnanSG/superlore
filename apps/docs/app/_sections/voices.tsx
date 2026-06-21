"use client";

/**
 * Voices — social proof, the honest way, as a scrolling testimonials marquee.
 *
 * Notable people are publicly describing the exact gap superlore closes: knowledge that machines can
 * read, context as the bottleneck, docs written for agents, MCP as the connector. The takeaway is
 * "the world is already asking for this; superlore is that" — NOT that any of them endorse superlore. Most
 * haven't tried it, so the section carries a quiet disclaimer and never claims otherwise.
 *
 * Every quote below is real, verbatim, and carries its primary/secondary source URL in a comment so
 * the wall can be audited. If wording couldn't be verified, the quote was dropped. Exactly one card
 * is FIRST-PARTY (superlore's own claim) — it's visibly marked as such and never mixed in as a "voice."
 *
 * Motion: a CSS marquee (duplicate track, translate3d 0 → -50%) edge-masked with `mask-image`, GPU
 * composited via `will-change` + `backface-visibility`. Two rows scroll in OPPOSITE directions. The
 * rail does NOT pause on hover — only the explicit CSS-only (`:has(.vc-pause:checked)`) toggle stops
 * it. `prefers-reduced-motion` is a HARD gate: the animation collapses to a static, hand-scrollable
 * `overflow-x:auto` snap rail (no JS motion/theme branch). Horizontal scroll is contained in each
 * rail, so the page body never scrolls sideways.
 *
 * Colour via the global.css token bridge; hierarchy via surface + 1px borders; no shadows, no emoji.
 */

import { useId } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { Reveal } from "../reveal";
import { FoldMark } from "../_fold-mark";

type Platform = "x" | "linkedin" | "blog";

interface Voice {
  /** Verbatim quote, trimmed fairly with … where long. */
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly initials: string;
  readonly platform: Platform;
  /**
   * Faint secondary line under the name. On X this is the @handle; on a blog/LinkedIn
   * post it's the role/affiliation — so each card reads like its real source post.
   */
  readonly secondary: string;
  /**
   * Filename (without extension) of the author's real, self-hosted avatar under
   * `/public/voices/`. Omit when no genuine photo could be verified — the card then
   * falls back to the initials circle rather than risk showing the wrong face.
   */
  readonly avatar?: string;
  /** Source URL — kept here so the attribution is auditable. */
  readonly source: string;
  /**
   * The single FIRST-PARTY card — superlore's own claim, not an outside voice. Rendered accent-bordered
   * with a `FIRST-PARTY` eyebrow + the Fold mark so it's never mistaken for an endorsement.
   */
  readonly isFirstParty?: boolean;
}

const VOICES: readonly Voice[] = [
  {
    // https://x.com/karpathy/status/1617979122625712128 (Jan 24, 2023)
    quote: "The hottest new programming language is English.",
    author: "Andrej Karpathy",
    role: "AI researcher · ex-Tesla, OpenAI founding team",
    initials: "AK",
    platform: "x",
    secondary: "@karpathy",
    avatar: "karpathy",
    source: "https://x.com/karpathy/status/1617979122625712128",
  },
  {
    // https://www.answer.ai/posts/2024-09-03-llmstxt.html — the /llms.txt proposal.
    quote:
      "Large language models increasingly rely on website information, but face a critical limitation: the context window is too small to handle most websites in their entirety.",
    author: "Jeremy Howard",
    role: "Co-founder, Answer.AI · proposed /llms.txt",
    initials: "JH",
    platform: "blog",
    secondary: "Co-founder, Answer.AI · proposed /llms.txt",
    avatar: "jeremyphoward",
    source: "https://www.answer.ai/posts/2024-09-03-llmstxt.html",
  },
  {
    // https://x.com/tobi/status/1935533422589399127 (Jun 19, 2025)
    // Verbatim text corroborated at https://simonwillison.net/2025/Jun/27/context-engineering/
    quote:
      "I really like the term “context engineering” over prompt engineering. It describes the core skill better: the art of providing all the context for the task to be plausibly solvable by the LLM.",
    author: "Tobi Lütke",
    role: "CEO, Shopify",
    initials: "TL",
    platform: "x",
    secondary: "@tobi",
    avatar: "tobi",
    source: "https://x.com/tobi/status/1935533422589399127",
  },
  {
    // https://x.com/karpathy/status/1937902205765607626 (Jun 25, 2025)
    // Verbatim text corroborated at https://simonwillison.net/2025/Jun/27/context-engineering/
    quote:
      "Context engineering is the delicate art and science of filling the context window with just the right information for the next step.",
    author: "Andrej Karpathy",
    role: "AI researcher · ex-Tesla, OpenAI founding team",
    initials: "AK",
    platform: "x",
    secondary: "@karpathy",
    avatar: "karpathy",
    source: "https://x.com/karpathy/status/1937902205765607626",
  },
  {
    // https://www.langchain.com/blog/the-rise-of-context-engineering ("The rise of 'context
    // engineering'", Jun 23 2025) — Harrison Chase's own definition.
    quote:
      "Context engineering is building dynamic systems to provide the right information and tools in the right format such that the LLM can plausibly accomplish the task.",
    author: "Harrison Chase",
    role: "Co-founder & CEO, LangChain",
    initials: "HC",
    platform: "blog",
    secondary: "Co-founder & CEO, LangChain",
    avatar: "hwchase17",
    source: "https://www.langchain.com/blog/the-rise-of-context-engineering",
  },
  {
    // https://simonw.substack.com/p/how-i-use-llms-to-help-me-write-code — "How I use LLMs to
    // help me write code." Simon Willison's own words.
    quote:
      "Most of the craft of getting good results out of an LLM comes down to managing its context — the text that is part of your current conversation.",
    author: "Simon Willison",
    role: "Creator of Datasette · co-creator of Django",
    initials: "SW",
    platform: "blog",
    secondary: "Creator of Datasette · co-creator of Django",
    avatar: "simonw",
    source: "https://simonw.substack.com/p/how-i-use-llms-to-help-me-write-code",
  },
  {
    // https://www.mintlify.com/blog/knowledge-management-agent-era
    quote:
      "AI agents need to know things, and they need to understand your product, your codebase, and your processes. They do this through documentation.",
    author: "Hahnbee Lee",
    role: "Co-founder, Mintlify",
    initials: "HL",
    platform: "blog",
    secondary: "Co-founder, Mintlify",
    avatar: "hahnbeelee",
    source: "https://www.mintlify.com/blog/knowledge-management-agent-era",
  },
  {
    // https://sequoiacap.com/podcast/training-data-guillermo-rauch/ — Training Data podcast.
    quote:
      "You have to think about a web for end users and humans … But you also have to think about a web for agents.",
    author: "Guillermo Rauch",
    role: "CEO, Vercel",
    initials: "GR",
    platform: "blog",
    secondary: "CEO, Vercel",
    avatar: "rauchg",
    source: "https://sequoiacap.com/podcast/training-data-guillermo-rauch/",
  },
  {
    // https://www.vktr.com/digital-experience/i-spoke-with-sam-altman-what-openais-future-actually-looks-like/
    // Sam Altman on the Big Technology Podcast (published Dec 22, 2025), on AI memory.
    quote:
      "Even if you have the world's best personal assistant, they can't remember every word you've ever said in your life. They can't have read every email. They can't have read every document you've ever written. AI is definitely gonna be able to do that.",
    author: "Sam Altman",
    role: "CEO, OpenAI",
    initials: "SA",
    platform: "blog",
    secondary: "CEO, OpenAI · on the Big Technology Podcast",
    avatar: "sama",
    source:
      "https://www.vktr.com/digital-experience/i-spoke-with-sam-altman-what-openais-future-actually-looks-like/",
  },
  {
    // https://techcrunch.com/2025/09/11/box-ceo-aaron-levie-on-ais-era-of-context/
    // "I think we're in the era of context within AI. What AI models and agents need is context, and
    //  the context that they need to work off is sitting inside your unstructured data." — verbatim.
    quote:
      "What AI models and agents need is context, and the context that they need to work off is sitting inside your unstructured data.",
    author: "Aaron Levie",
    role: "Co-founder & CEO, Box",
    initials: "AL",
    platform: "blog",
    secondary: "Co-founder & CEO, Box",
    avatar: "levie",
    source: "https://techcrunch.com/2025/09/11/box-ceo-aaron-levie-on-ais-era-of-context/",
  },
  {
    // https://techcrunch.com/2026/02/15/the-enterprise-ai-land-grab-is-on-glean-is-building-the-layer-beneath-the-interface/
    // Arvind Jain to TechCrunch on why generic LLMs aren't enough for the enterprise — verbatim.
    quote:
      "So you have to connect the reasoning and generative power of the models with the context inside your company.",
    author: "Arvind Jain",
    role: "Founder & CEO, Glean",
    initials: "AJ",
    platform: "blog",
    secondary: "Founder & CEO, Glean",
    avatar: "jainarvind",
    source:
      "https://techcrunch.com/2026/02/15/the-enterprise-ai-land-grab-is-on-glean-is-building-the-layer-beneath-the-interface/",
  },
  {
    // https://simple.ai/p/what-are-context-graphs — Dharmesh Shah's essay on "context graphs".
    // Full line: "The basic premise is simple but powerful: our systems capture what happened, but
    //  not the why." — verbatim (the words "what" and "why" are italicised in the original).
    quote: "Our systems capture what happened, but not the why.",
    author: "Dharmesh Shah",
    role: "Co-founder & CTO, HubSpot",
    initials: "DS",
    platform: "blog",
    secondary: "Co-founder & CTO, HubSpot",
    avatar: "dharmesh",
    source: "https://simple.ai/p/what-are-context-graphs",
  },
  {
    // https://www.bigtechnology.com/p/microsoft-ai-ceo-mustafa-suleyman — Big Technology interview
    // (Apr 4, 2025). On AI memory; verbatim, fairly trimmed with … across one sentence.
    quote:
      "It's going to remember all the big facts about your life … over time, it's going to start to build a richer understanding of who you are and what you care about.",
    author: "Mustafa Suleyman",
    role: "CEO, Microsoft AI",
    initials: "MS",
    platform: "blog",
    secondary: "CEO, Microsoft AI · on the Big Technology Podcast",
    avatar: "suleyman",
    source: "https://www.bigtechnology.com/p/microsoft-ai-ceo-mustafa-suleyman",
  },
  {
    // https://sacra.com/research/eoghan-mccabe-des-traynor-intercom-ai-customer-service/ — Sacra
    // interview transcript (Jun 27, 2023). Des Traynor on docs as the loop AI learns from; verbatim.
    quote:
      "If a bot sees a question, doesn't know the answer, and sends it to a human, it creates a pretty magical experience if the human can answer the question, or train the bot, and update the documentation all in one fell swoop.",
    author: "Des Traynor",
    role: "Co-founder, Intercom",
    initials: "DT",
    platform: "blog",
    secondary: "Co-founder, Intercom",
    avatar: "destraynor",
    source: "https://sacra.com/research/eoghan-mccabe-des-traynor-intercom-ai-customer-service/",
  },
  {
    // https://x.com/garrytan/status/1963401303591121087 (Sep 3, 2025)
    quote:
      "Exa is the truth — organizing the world's information but for AI agents everywhere is an extreme unlock for human knowledge.",
    author: "Garry Tan",
    role: "President & CEO, Y Combinator",
    initials: "GT",
    platform: "x",
    secondary: "@garrytan",
    avatar: "garrytan",
    source: "https://x.com/garrytan/status/1963401303591121087",
  },
  {
    // FIRST-PARTY — superlore's own claim, clearly marked. Not an endorsement, not an outside voice.
    quote:
      "About 80% of our own docs are read by agents, not people. superlore gives Claude 10× better context than scattered wikis.",
    author: "superlore",
    role: "One corpus. Humans and agents.",
    initials: "Ko",
    platform: "blog",
    secondary: "One corpus. Humans and agents.",
    source: "/",
    isFirstParty: true,
  },
];

/** Small, neutral platform glyphs — no emoji, no brand colour. */
function PlatformMark({ platform }: { platform: Platform }) {
  if (platform === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      <span
        aria-hidden="true"
        className="grid size-3 place-items-center rounded-[3px] border border-current font-mono text-[7px] leading-none font-bold"
      >
        in
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="font-mono text-[8px] font-semibold tracking-[0.12em] uppercase"
    >
      blog
    </span>
  );
}

const PLATFORM_LABEL: Record<Platform, string> = {
  x: "Posted on X",
  linkedin: "Posted on LinkedIn",
  blog: "From a blog post or talk",
};

/**
 * The author's real, self-hosted avatar from `/public/voices/`, presented as a rounded post
 * photo. Authors without a verified photo fall back to the neutral initials circle so we
 * never show the wrong face.
 */
function Avatar({ voice }: { voice: Voice }) {
  if (voice.avatar) {
    return (
      <Image
        src={`/voices/${voice.avatar}.png`}
        alt={voice.author}
        width={80}
        height={80}
        className="size-10 shrink-0 rounded-full border border-fd-border object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-kp-accent-border bg-kp-accent-weak font-mono text-[11px] font-semibold text-kp-accent-text"
    >
      {voice.initials}
    </span>
  );
}

/**
 * One compact, fixed-width card (~320px) styled like the real social post it quotes — author
 * photo + name + faint secondary line, the platform glyph top-right, then the verbatim quote.
 * The whole card links to the original source, so the attribution is honest and clickable. The
 * single FIRST-PARTY card branches: accent surface + `FIRST-PARTY` eyebrow + the Fold mark, so
 * superlore's own claim is never mistaken for an outside endorsement.
 */
function QuoteCard({ voice }: { voice: Voice }) {
  const firstParty = voice.isFirstParty === true;
  return (
    <a
      href={voice.source}
      target={firstParty ? undefined : "_blank"}
      rel={firstParty ? undefined : "noreferrer"}
      className={`group flex h-full w-[300px] shrink-0 snap-start flex-col rounded-xl border p-5 transition-colors sm:w-[340px] ${
        firstParty
          ? "border-kp-accent-border bg-kp-accent-weak"
          : "border-fd-border bg-fd-card hover:border-kp-accent-border"
      }`}
    >
      <figure className="flex h-full flex-col">
        <div className="flex items-center gap-2.5">
          {firstParty ? (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-kp-accent-border bg-fd-card text-kp-accent-text">
                <FoldMark size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-fd-foreground">
                  {voice.author}
                </span>
                <span className="block truncate text-[12px] text-fd-muted-foreground">
                  {voice.secondary}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[8px] font-semibold tracking-[0.14em] text-kp-accent-text uppercase">
                First-party
              </span>
            </>
          ) : (
            <>
              <Avatar voice={voice} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-fd-foreground">
                  {voice.author}
                </span>
                <span className="block truncate text-[12px] text-fd-muted-foreground">
                  {voice.secondary}
                </span>
              </span>
              <span
                className="shrink-0 text-fd-muted-foreground transition-colors group-hover:text-kp-accent-text"
                title={PLATFORM_LABEL[voice.platform]}
              >
                <span className="sr-only">{PLATFORM_LABEL[voice.platform]}</span>
                <PlatformMark platform={voice.platform} />
              </span>
            </>
          )}
        </div>

        <blockquote className="relative mt-4 flex-1 pt-3 text-[15px] leading-snug font-medium tracking-[-0.01em] text-pretty text-fd-foreground">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-0 font-serif text-5xl leading-none text-kp-accent-text/30 select-none"
          >
            &ldquo;
          </span>
          {voice.quote}
        </blockquote>
      </figure>
    </a>
  );
}

/** One marquee row. `reverse` scrolls it right-to-left's opposite for the lower row. */
function MarqueeRow({ voices, reverse }: { voices: readonly Voice[]; reverse?: boolean }) {
  // Two copies make the -50% loop seamless; the duplicate is hidden from a11y + reduced-motion.
  const track = [...voices, ...voices];
  return (
    <div className="vc-rail">
      <ul className={`vc-track list-none px-6 py-1 ${reverse ? "vc-track--rev" : ""}`}>
        {track.map((voice, i) => (
          <li
            key={`${voice.author}-${voice.quote.slice(0, 12)}-${i}`}
            className={i >= voices.length ? "vc-rail-dup" : undefined}
            aria-hidden={i >= voices.length ? true : undefined}
          >
            <QuoteCard voice={voice} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Voices() {
  // Stable, unique ids so the pause checkbox toggles only THIS section's tracks (scoped via :has).
  const sectionId = useId().replace(/[:]/g, "");
  // 16 cards split across two opposite-scrolling rows (≈half each) so wide screens stay full and
  // repeats stay off-screen; the lower row scrolls the opposite direction.
  const half = Math.ceil(VOICES.length / 2);
  const rowTop = VOICES.slice(0, half);
  const rowBottom = VOICES.slice(half);

  return (
    <Reveal as="section" className="relative z-10 py-[clamp(80px,10vw,128px)]">
      {/* scoped, self-contained marquee + reduced-motion CSS (token-only colours, no JS branch) */}
      <style>{`
        .vc-${sectionId} {
          --vc-gap: 1rem;
        }
        .vc-${sectionId} .vc-rail {
          /* edge fade so cards bleed off both sides */
          -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
                  mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
        }
        .vc-${sectionId} .vc-track {
          display: flex;
          gap: var(--vc-gap);
          width: max-content;
          /* GPU-composite the loop so it stays smooth */
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          /* ~112s (was 126s) — scaled with the card count (≈7s/card) so per-card speed stays constant. */
          animation: vc-marquee-${sectionId} 112s linear infinite;
        }
        .vc-${sectionId} .vc-track--rev {
          animation-name: vc-marquee-rev-${sectionId};
        }
        /* No hover pause — the rails keep moving under the cursor. Only the explicit
           pause toggle stops them (CSS-only via :has). */
        .vc-${sectionId}:has(.vc-pause:checked) .vc-track {
          animation-play-state: paused;
        }
        .vc-${sectionId} .vc-ico--play { display: none; }
        .vc-${sectionId} .vc-pause:checked ~ .vc-ico--pause { display: none; }
        .vc-${sectionId} .vc-pause:checked ~ .vc-ico--play { display: inline-block; }
        @keyframes vc-marquee-${sectionId} {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(calc(-50% - (var(--vc-gap) / 2)), 0, 0); }
        }
        @keyframes vc-marquee-rev-${sectionId} {
          from { transform: translate3d(calc(-50% - (var(--vc-gap) / 2)), 0, 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          /* HARD gate: no marquee. Static, hand-scrollable snap rails. */
          .vc-${sectionId} .vc-track { animation: none; }
          .vc-${sectionId} .vc-rail {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: thin;
          }
          .vc-${sectionId} .vc-rail-dup { display: none; }
        }
      `}</style>

      {/* Editorial head — mono eyebrow + tight h2 + ≤640px deck. */}
      <header className="mx-auto w-full max-w-6xl px-6">
        <div className="max-w-[640px]">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kp-accent-text uppercase">
            The shift
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-[2.5rem] sm:leading-[1.08]">
            The whole industry is describing the same gap.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-pretty text-fd-muted-foreground sm:text-[1.05rem]">
            The people building this era keep circling one idea from different angles — your
            knowledge has to be{" "}
            <strong className="font-semibold text-fd-foreground">readable by machines</strong>, not
            just people. They&apos;re naming the problem. superlore is the answer.
          </p>
        </div>
      </header>

      {/* the two opposing rails — horizontal scroll CONTAINED here; page body never scrolls sideways */}
      <div className={`vc-${sectionId} relative mt-12 overflow-hidden`}>
        <MarqueeRow voices={rowTop} />
        <div className="mt-4">
          <MarqueeRow voices={rowBottom} reverse />
        </div>

        {/* Subtle, explicit pause toggle — CSS-only (:has + :checked). The rails do NOT pause on
            hover; only this control stops them. */}
        <label
          className="absolute right-5 -bottom-3.5 z-20 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-fd-border bg-fd-card text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          title="Pause / play auto-scroll"
        >
          <input type="checkbox" className="vc-pause sr-only" aria-label="Pause auto-scroll" />
          <Pause className="vc-ico vc-ico--pause size-3.5" />
          <Play className="vc-ico vc-ico--play size-3.5" />
        </label>
      </div>

      {/* One quiet, confident line — and the honest caption that these aren't endorsements. */}
      <div className="mx-auto mt-12 w-full max-w-6xl px-6">
        <div className="flex flex-col gap-3 border-t border-fd-border pt-7 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[52ch] text-pretty text-fd-muted-foreground">
            Everyone&apos;s circling the same idea: your knowledge has to be readable by machines,
            not just people.{" "}
            <span className="text-fd-foreground">That&apos;s the whole point of superlore.</span>
          </p>
          <p className="shrink-0 font-mono text-[11px] tracking-wide text-fd-muted-foreground">
            Quotes are about the problem space, not endorsements. One card is first-party.
          </p>
        </div>
      </div>
    </Reveal>
  );
}
