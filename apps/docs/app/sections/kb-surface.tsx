"use client";

/**
 * KBSurface — USE CASE · COMPANY KNOWLEDGE BASE.
 *
 * The chess-flipped mirror of ReleaseSurface: a live superlore knowledge-base page mocked in a slim
 * browser-ish frame, visual on the RIGHT and the editorial copy on the LEFT (via `lg:order-*`).
 * The frame carries a real left nav-tree (~280px, elevated surface, the active item banded in
 * `accent-weak`) and a content column of REAL package components rendering the SAME shared specs
 * the rest of the landing uses. The KB is ONE corpus; the nav sections are facets of it, and each
 * facet shows UNIQUE content driven by `activeSection`:
 *   Sales       → the sales-pipeline `Board`
 *   Engineering → the system `Canvas` (bare/locked) + the queue ADR `Decision`
 *   Meetings    → the standup "status per person" `Table`
 *   Onboarding  → the onboarding `Checklist`
 *   Runbooks    → the on-call triage `Table` + a `Note`
 * The Accounts `EntityCard` backs the two facets it actually owns (Engineering + Onboarding). No
 * second, drifting mock-up — every surface is a real component over a `_data` spec.
 *
 * Every colour is a token (or a token-derived `color-mix`); hierarchy is surface-step + 1px border,
 * never a drop shadow. The single interactive bit — the nav tree — is real buttons with a visible
 * focus ring and `aria-current`; selecting a section just swaps the facet (click-driven, no
 * auto-cycle). The content surface is height-capped with an alpha-mask bottom fade so it reads
 * "endless" (there's more KB past the frame), lit by a low accent radial halo behind the mock. The
 * mask is alpha-only (`#000`/transparent) and the halo is a token `color-mix`, so both are
 * theme-equal and motion-free (nothing animates — reduced-motion-safe by construction).
 */
import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Board, Canvas, Checklist, Decision, EntityCard, Note, Table } from "superlore";
import {
  accountsEntity,
  kbOnboardingChecklist,
  kbQueueDecision,
  kbRunbookColumns,
  kbRunbookRows,
  salesPipeline,
  standupColumns,
  standupRows,
  systemSpec,
} from "../_data";
import { FoldMark } from "../_fold-mark";
import { Reveal } from "../reveal";

/** The KB's section tree, in display order. `Sales` is the facet shown first. */
const NAV_SECTIONS = ["Sales", "Engineering", "Meetings", "Onboarding", "Runbooks"] as const;

type NavSection = (typeof NAV_SECTIONS)[number];

/** One facet of the KB: its heading, the URL it lives at, an optional summary chip, and the real
 * component surface rendered for it. */
interface SectionRecord {
  /** Page heading. */
  title: string;
  /** One-line sub-heading under the title. */
  subtitle: string;
  /** Path shown in the browser-chrome URL pill (after `your-kb.dev`). */
  urlPath: string;
  /** Optional mono meta chip on the right of the heading row. */
  meta?: string;
  /** The real superlore component(s) rendering this facet's content. */
  surface: ReactNode;
}

/** Per-section content — each a REAL `superlore` component over a shared `_data` spec (no drift). */
const SECTIONS: Record<NavSection, SectionRecord> = {
  Sales: {
    title: "Sales pipeline",
    subtitle:
      "The single screen we scan before every planning call — every prospect, its stage, and the next step.",
    urlPath: "/sales/pipeline",
    meta: "Open $1.7M · 19 prospects",
    surface: (
      <div className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-1">
        <Board columns={salesPipeline} label="Sales pipeline by stage" />
      </div>
    ),
  },
  Engineering: {
    title: "System architecture",
    subtitle:
      "The URL-shortener service map and the decisions behind it — the diagram and the ADR are the same typed graph your agent queries, not a screenshot.",
    urlPath: "/engineering/architecture",
    meta: "8 services · 1 ADR",
    surface: (
      <div className="space-y-5">
        {/* The service-map canvas renders on every breakpoint — on a phone it fits-to-width and is
            the surface, not a caption. The Decision ADR below stacks legibly on both. */}
        <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card [&_*]:max-w-full">
          <Canvas bare spec={systemSpec} height={300} />
        </div>
        <Decision {...kbQueueDecision} />
      </div>
    ),
  },
  Meetings: {
    title: "Status per person",
    subtitle:
      "Every standup lands here as typed rows — so any agent is one MCP call from “who’s blocked?”, no wall of transcript to skim.",
    urlPath: "/meetings/standup",
    meta: "Daily · 4 people",
    surface: (
      <div className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-1">
        <Table columns={standupColumns} rows={standupRows} caption="Standup — status per person" />
      </div>
    ),
  },
  Onboarding: {
    title: "New-hire onboarding",
    subtitle:
      "A runbook with a real done-state — the agent can count progress (“how far is a new hire?”), not infer it from strike-through.",
    urlPath: "/onboarding/checklist",
    meta: "3 of 6 done",
    surface: (
      <div className="rounded-xl border border-fd-border bg-fd-card p-4 sm:p-5">
        <Checklist items={kbOnboardingChecklist} label="New-hire onboarding" />
      </div>
    ),
  },
  Runbooks: {
    title: "On-call runbook",
    subtitle:
      "A Signal → Sev → first-action triage grid an on-call engineer scans during an incident — typed rows the agent can answer from directly.",
    urlPath: "/runbooks/on-call",
    meta: "4 signals",
    surface: (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-1">
          <Table
            columns={kbRunbookColumns}
            rows={kbRunbookRows}
            caption="Incident triage by signal"
          />
        </div>
        <Note title="Escalation">
          Anything still red after the first action pages the on-call lead. The same grid backs the
          agent&apos;s incident answers.
        </Note>
      </div>
    ),
  },
};

/** The facets that the Accounts service actually owns — only these show the `EntityCard`. */
const ENTITY_SECTIONS: ReadonlySet<NavSection> = new Set<NavSection>(["Engineering", "Onboarding"]);

export function KBSurface() {
  const [activeSection, setActiveSection] = useState<NavSection>("Sales");
  const active = SECTIONS[activeSection];
  const showEntity = ENTITY_SECTIONS.has(activeSection);

  return (
    <section className="bg-fd-muted/40 px-6 py-[clamp(56px,10vw,128px)]">
      <style>{`
        .kb-surface-window {
          /* FIXED height (not min-height) so every section renders the same size — switching
             sections no longer grows the panel and shifts the whole layout. Taller content
             fades out via the bottom mask ("endless" feel). */
          height: clamp(380px, 46vh, 540px);
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom, #000 84%, transparent);
          mask-image: linear-gradient(to bottom, #000 84%, transparent);
        }
      `}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* ── Editorial column (LEFT on desktop; the chess flip vs. ReleaseSurface) ── */}
        <Reveal className="lg:order-1">
          <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-kp-accent-text uppercase">
            Use case · Company knowledge base
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-4xl">
            Your pipeline, decisions, and meetings — one screen your team and your agents can trust.
          </h2>
          <p className="mt-5 max-w-[640px] text-base/7 text-fd-muted-foreground">
            Capture how the company actually works: every prospect and where it sits, the service
            that owns sign-up, the digest from last week&apos;s sync. The team scans the pipeline
            board before every planning call; your agent answers from the same typed graph behind
            it.
          </p>

          <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-2">
            <div className="bg-fd-background p-4">
              <dt className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                Pipeline
              </dt>
              <dd className="mt-1.5 text-sm/6 text-fd-foreground">
                A kanban of prospects by stage humans read and agents traverse — not a screenshot.
              </dd>
            </div>
            <div className="bg-fd-background p-4">
              <dt className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                Entities
              </dt>
              <dd className="mt-1.5 text-sm/6 text-fd-foreground">
                Services, owners, SLAs — typed fields and refs, queryable by the MCP.
              </dd>
            </div>
            <div className="bg-fd-background p-4">
              <dt className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                Meetings
              </dt>
              <dd className="mt-1.5 text-sm/6 text-fd-foreground">
                Recorded-meeting digests land as typed rows your team scans in seconds.
              </dd>
            </div>
            <div className="bg-fd-background p-4">
              <dt className="font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                One corpus
              </dt>
              <dd className="mt-1.5 text-sm/6 text-fd-foreground">
                All MDX in your repo — one source, two faces, no drift.
              </dd>
            </div>
          </dl>
        </Reveal>

        {/* ── KB-page mock (RIGHT on desktop) — low accent halo behind it (z-0), content z-10. ── */}
        <Reveal delay={80} className="relative lg:order-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 rounded-[2rem] bg-[radial-gradient(60%_55%_at_50%_42%,color-mix(in_oklab,var(--kp-accent)_11%,transparent),transparent_72%)]"
          />
          <div className="relative z-10 overflow-hidden rounded-2xl border border-fd-border bg-fd-background">
            {/* Browser-ish chrome — URL pill (driven by the active facet), no OS buttons. */}
            <div className="flex items-center gap-3 border-b border-fd-border bg-fd-muted px-4 py-2.5">
              <FoldMark size={15} className="shrink-0 text-kp-accent-text" />
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-fd-border bg-fd-background px-2.5 py-1">
                <span className="truncate font-mono text-[11px] text-fd-muted-foreground">
                  your-kb.dev{active.urlPath}
                </span>
              </div>
              <span className="shrink-0 rounded-full border border-kp-accent-border bg-kp-accent-weak px-2 py-0.5 font-mono text-[10px] tracking-wide text-kp-accent-text uppercase">
                MCP
              </span>
            </div>

            {/* Body: nav tree (left) + content (right). */}
            <div className="grid lg:grid-cols-[180px_minmax(0,1fr)]">
              {/* Nav-tree — elevated surface, active item banded accent-weak. */}
              <nav
                aria-label="Knowledge base sections"
                className="flex flex-row gap-1 overflow-x-auto border-b border-fd-border bg-fd-muted p-2.5 lg:max-w-[280px] lg:flex-col lg:overflow-x-visible lg:border-r lg:border-b-0"
              >
                <p className="hidden px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-fd-muted-foreground uppercase lg:block">
                  Sections
                </p>
                {NAV_SECTIONS.map((section) => {
                  const isActive = section === activeSection;
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveSection(section)}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-kp-accent ${
                        isActive
                          ? "border-kp-accent-border bg-kp-accent-weak font-medium text-kp-accent-text"
                          : "border-transparent text-fd-muted-foreground hover:border-fd-border hover:bg-fd-card hover:text-fd-foreground"
                      }`}
                    >
                      <span>{section}</span>
                      <ChevronRight
                        aria-hidden
                        className={`size-3.5 shrink-0 transition-opacity ${
                          isActive
                            ? "text-kp-accent-text opacity-100"
                            : "opacity-30 group-hover:opacity-70"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>

              {/* Content column — UNIQUE per facet, height-capped + bottom-masked so it reads
                  "endless." Heading/subtitle/meta + the EntityCard are all driven by the record. */}
              <div className="kb-surface-window min-w-0 space-y-7 p-5 sm:p-6">
                <header>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-xl font-semibold tracking-tight text-fd-foreground">
                      {active.title}
                    </h3>
                    {active.meta && (
                      <span className="font-mono text-[11px] tracking-wide text-fd-muted-foreground">
                        {active.meta}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm/6 text-fd-muted-foreground">{active.subtitle}</p>
                </header>

                {active.surface}

                {/* Owning service entity — only on the facets the Accounts service backs. */}
                {showEntity && (
                  <div>
                    <p className="mb-2 font-mono text-[11px] tracking-wide text-fd-muted-foreground uppercase">
                      Owning service
                    </p>
                    <EntityCard {...accountsEntity} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-3 font-mono text-[11px] tracking-wide text-fd-muted-foreground">
            A live superlore page — the same MDX your team reads and your agent queries.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
