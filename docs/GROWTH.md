# superlore launch & growth playbook

Internal strategy for taking superlore to its first ~1,000 GitHub stars and a viral LinkedIn moment.
Grounded in what actually works in 2026 (sources at the bottom). Read the reality check first.

## Reality check (read before the tactics)

- **"0→1,000 in a week" is the exception, not the plan.** A front-page Hacker News launch produces a
  **500–2,000 star surge over ~48h**, but only ~2.3% of Show HN posts reach the front page and the
  median scores ~2 points. With active promotion, **1–3 months to 1,000 stars** is the realistic
  baseline for a genuinely useful tool. Plan for the spike; expect the grind.
- **The 80/20 that drives the result:** (1) a README that proves the magic in a <5 MB demo GIF + a
  one-line install above the fold; (2) one well-framed Show HN with the founder live in comments for
  8 hours; (3) a zero-signup live demo. Everything else is amplification.
- **What backfires (fastest ways to get buried/banned):** asking for upvotes, voting rings, booster
  comments from friends, AI-written HN comments, link-dropping on Reddit, launching a waitlist/landing
  page instead of a real repo + demo. Don't.

## superlore's wedge

The hook is on-trend and technically interesting (what HN/X reward): **"Documentation broke the day
AI started writing it — your docs are read by agents now, and every other tool just bolts an MCP onto
the old way."** The demo must show the **dual representation** — the rendered page beside the typed
structured data the MCP serves. That side-by-side is the "aha" that earns the upvote and the share.

## The single most important move: one great Show HN

- **Title** (8–12 words, no hype words, position as open source):
  - `Show HN: superlore – Author docs in MDX; humans get a site, agents get an MCP`
  - `Show HN: superlore – A FigJam-style canvas in MDX that agents read as a typed graph`
- **First comment within 5 min, from your personal account:** the "docs broke when agents started
  reading them" story, the stack + one or two real decisions (Next 16 + Fumadocs; the
  dual-representation contract; how the Canvas serializes to a graph), and **one honest limitation**.
- **Engagement is the whole game.** Clear the day. Reply to every comment, fast and in depth. When
  criticized, agree with something first, then respond. Active-founder threads live 18–24h; quiet ones
  die in 4–6h.
- **Pre-reqs:** clean front-loaded README; a **zero-signup live demo** (the Viewer is perfect — drop in
  an MDX file, see both faces); link the GitHub repo; infra that survives a 5–30k visitor surge.
- **Timing:** Tue–Thu, **9 AM–12 PM ET**. The first 30–60 minutes decide everything.

## GitHub trending is velocity-based

Trending compares your _current_ star rate to your historical average — a **concentrated burst beats a
week-long trickle**, then Explore recommendations self-feed. So sequence everything into one window:
HN + X + LinkedIn on the same morning, network used to seed the **first-hour** velocity (share the HN
_link_, "take a look" — never "upvote me").

## Channel scorecard

| Channel                               | Verdict             | Note                                                                                                                |
| ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Hacker News (Show HN)**             | #1 driver           | The only reliable trending trigger.                                                                                 |
| **GitHub Trending**                   | Amplifier           | Earned via velocity, not posted. Keep commits/issues active to hold it.                                             |
| **X/Twitter**                         | Yes (changed)       | Single long-form post > threads now; put the repo link in a **reply** (external links suppressed in the main post). |
| **LinkedIn**                          | Underrated for this | B2B "docs + AI" narrative lands. See below.                                                                         |
| **Reddit** (r/selfhosted, r/devtools) | High-risk           | Lead with a war story; link in a comment; obey 90/10; aged account.                                                 |
| **Product Hunt**                      | Secondary           | Social proof + ~1.5k visitors; rallying is allowed here (unlike HN).                                                |
| **Awesome-lists**                     | Passive long-tail   | PRs to awesome-mcp / awesome-docs / awesome-ai-tools → 50–200 stars/mo on autopilot.                                |
| **dev.to / personal blog**            | Durable             | A "why I built this" post; X boosts these links. Feeds AI-discoverability too.                                      |

## LinkedIn (the viral lane for a technical founder)

- **Algorithm now:** a "depth score" — **dwell time + comment quality** drive reach; the **first 60
  minutes** and the **first 2 lines** decide ~80–90% of performance. Hashtags are dead weight (0–2).
- **Format mix:** ~70% **document/carousel** (highest engagement; swiping = dwell time), 30% text.
  Carousels mid-week, text early week. 3–4 posts/week, consistent. Reply to every comment in hour one.
- **Hook openings (first 2 lines) tuned to superlore:**
  1. _"Your documentation broke the day AI started writing your code._ _Nobody noticed, because it
     still looks fine to humans — and that's exactly the problem."_
  2. _"For 15 years we wrote docs for one reader. Now half your 'readers' are agents — and they're
     parsing a screenshot of a diagram and guessing._ _Here's what docs look like when you write for
     both."_
  3. _"I rewrote my docs three times this year and agents still hallucinated our API._ _So I stopped
     writing docs and started writing a corpus. Day 40 of building superlore in public 👇"_
  4. _"What does your AI agent actually 'see' when it reads your docs?_ _If the answer is 'a picture of
     a timeline it has to interpret,' you don't have docs — you have a liability."_
- **Carousel recipe:** slide 1 = the hook; slides 2–8 = the dual-representation idea shown visually
  (human page vs. the clean structured data the MCP serves); last slide = repo link + soft CTA.

## AI-discoverability (GEO) — a real channel for _this_ product

superlore must be the reference implementation of "AI reads your docs." When someone asks
ChatGPT/Claude/Perplexity "best docs tool for AI agents," superlore should surface. LLMs build
recommendations from **consensus across many third-party sources** — so:

- **Earn third-party inclusions**, not more homepage copy: "best MCP/AI-docs tool" roundups,
  vs-Mintlify/Fumadocs comparison posts, and honest answers to real Reddit/forum questions. Highest
  leverage GEO move.
- **Shipped already (dogfood):** `/llms.txt` + `/llms-full.txt` (Claude & Perplexity respect these),
  JSON-LD (`Organization` / `SoftwareApplication` / `SoftwareSourceCode`), per-page canonical + OG,
  sitemap + robots. Write each page answer-first with question-shaped headings — models lift those.

## README → star conversion

Sells in <7 seconds. Order: one-line value prop (≤10 words, problem-first) → **demo GIF immediately**
(5–15s, <5 MB, show the dual representation) → one-line install + live-demo link → features as a
scannable table → 4–7 functional badges (version, **downloads**, **stars**, license) → FAQ (doubles as
GEO fuel). A personal narrative ("I was frustrated with X so I built Y") gets ~3x the engagement of a
feature list. Cross-link the ecosystem repos (skills, starter template) so finding one tool surfaces five.

## Launch week (day by day)

- **T-2 weeks → T-1d:** polish README; record the dual-rep demo GIF; stand up the zero-signup demo;
  publish the "why I built superlore" blog post (T-2d so X/LinkedIn can boost the link); pre-submit
  awesome-list PRs; draft (don't post) the Show HN title + first comment; soft-prime your network.
- **Day 1 (Tue/Wed, 9–10 AM ET):** Show HN + maker first comment. Same morning: one long-form X post
  (repo link in a reply) + a LinkedIn text post (hook #1 or #3). Share the HN link with your network.
  Then sit on HN 6–8 hours answering everything.
- **Day 2 (Thu):** LinkedIn carousel (dual-rep visual); r/selfhosted war-story post; keep replying.
- **Day 3 (Fri):** Product Hunt (secondary, rally allowed) + an X "what I learned" recap.
- **Days 4–7:** ride trending (keep commit/issue activity up); publish "superlore vs Mintlify/Fumadocs
  for AI agents" (feeds GEO); start the build-in-public LinkedIn cadence.
- **Weeks 2–8 (where 1k actually locks in):** awesome-lists drip; ship ecosystem repos; pursue roundup
  inclusions; re-run Show HN only for genuinely new milestones.

## The 20% that drives 80%

1. One Show HN done right (clear title, story-first maker comment, zero-signup demo, founder live 8h).
2. A README that proves the dual-rep magic in a sub-5 MB GIF + one-line install.
3. Your following used to seed first-hour HN velocity (never "upvote me"), then a build-in-public
   LinkedIn cadence (carousels, hook in first 2 lines).
4. GEO as a product feature (llms.txt + JSON-LD — shipped) + third-party comparison/roundup inclusions.
5. Don't fake velocity. It's the fastest way to get buried.

---

_Confidence note:_ HN/LinkedIn/X multipliers (e.g. "1.4 stars/upvote", "carousels ~6.6% engagement")
come from marketing-blog analyses, not primary platform data — directionally reliable, not gospel. The
robust, well-corroborated claims: HN-first sequencing, velocity-based trending, front-loaded README +
zero-signup demo, first-hour engagement windows, and LLMs building recommendations from third-party
consensus. Sources: markepear & daily.dev (Show HN), dev.to "50 repos 0→10k", OSS Insight (trending),
star-history (stars playbook), dataslayer & growleads (LinkedIn 2026), teract/opentweet (X 2026),
presenc.ai & limy.ai (llms.txt 2026), houseofmartech & gen-optima (GEO).
