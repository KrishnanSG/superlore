import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Cloud, ShieldCheck, Users } from "lucide-react";

import { TopBar, Footer } from "../_chrome";
import { FoldMark } from "../_fold-mark";

export const metadata: Metadata = {
  title: "superlore Cloud — join the waitlist",
  description:
    "Self-host superlore free today. superlore Cloud — managed hosting, SSO, and team features — is coming. Join the waitlist for early access.",
};

/**
 * superlore Cloud waitlist (pre-monetization demand capture).
 *
 * The "Join the waitlist" / "Join now" buttons open a Typeform POPUP (modal) via Typeform's embed
 * script — any element with `data-tf-popup="<id>"` becomes a trigger once the script loads. The id
 * is the PUBLIC form slug from its share URL (form.typeform.com/to/<slug>), NOT the inline
 * `data-tf-live` embed id. Set it via `NEXT_PUBLIC_TYPEFORM_ID` (apps/docs/.env.local in dev; the
 * deploy's env vars in prod).
 */
const TYPEFORM_ID = process.env.NEXT_PUBLIC_TYPEFORM_ID ?? "";
const GITHUB_URL = "https://github.com/KrishnanSG/superlore";

const VALUE = [
  {
    icon: Cloud,
    title: "Managed hosting",
    body: "One-click deploy and updates, with your MCP endpoint hosted for you — no infra to run.",
  },
  {
    icon: ShieldCheck,
    title: "SSO & governance",
    body: "Google / SAML SSO, an org gate, roles and audit — your corpus, scoped to your company.",
  },
  {
    icon: Users,
    title: "Built for teams",
    body: "Shared workspaces at scale, over the same corpus every agent reads through one MCP URL.",
  },
];

export default function CloudPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Typeform popup embed — wires every [data-tf-popup] trigger on the page to open a modal. */}
      <Script src="https://embed.typeform.com/next/embed.js" strategy="afterInteractive" />
      <TopBar />
      <main className="flex-1">
        {/* Hero — pre-launch framing. Self-host stays free; Cloud is the future managed tier. */}
        <section className="relative overflow-hidden border-b border-fd-border bg-fd-background">
          <div aria-hidden className="kp-hero-grid" />
          <div aria-hidden className="kp-hero-aurora" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 pt-20 pb-14 text-center sm:pt-24">
            {/* Live, theme-aware lockup — the Fold mark + wordmark + "Cloud" pill, rendered from
                tokens so it never goes stale or needs a light/dark raster pair. */}
            <div className="mx-auto flex w-fit items-center gap-3">
              <FoldMark size={52} className="text-kp-accent-text" />
              <span className="text-[2.6rem] leading-none font-semibold tracking-[-0.03em] text-fd-foreground">
                superlore
              </span>
              <span className="self-start rounded-full border border-kp-accent-border bg-kp-accent-weak px-2.5 py-1 text-xs font-semibold tracking-wide text-kp-accent-text uppercase">
                Cloud
              </span>
            </div>
            <h1 className="mt-8 text-4xl font-bold tracking-[-0.025em] text-balance text-fd-foreground sm:text-[3.25rem] sm:leading-[1.05]">
              Managed superlore is coming.
            </h1>
            <p className="mx-auto mt-5 max-w-[40rem] text-base leading-relaxed text-pretty text-fd-muted-foreground sm:text-lg">
              superlore is open source —{" "}
              <strong className="font-semibold text-fd-foreground">self-host it free today</strong>.
              superlore Cloud adds managed hosting, SSO, and team features. Join the waitlist for
              early access — and to help shape what we build.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                data-tf-popup={TYPEFORM_ID}
                data-tf-iframe-props="title=superlore Cloud waitlist"
                className="kp-btn kp-btn-primary"
              >
                Join the waitlist
              </button>
              <Link className="kp-btn kp-btn-secondary" href="/docs/getting-started">
                Self-host free today
              </Link>
            </div>
          </div>
        </section>

        {/* What Cloud adds — value, no prices (we're not selling yet). */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-3">
            {VALUE.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-fd-card p-6">
                <div className="flex size-9 items-center justify-center rounded-lg border border-kp-accent-border bg-kp-accent-weak text-kp-accent-text">
                  <Icon className="size-[18px]" />
                </div>
                <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-fd-foreground">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA — the Join-now popup trigger. */}
        <section className="mx-auto w-full max-w-2xl px-6 pb-24">
          <div className="rounded-2xl border border-fd-border bg-fd-card p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-[1.75rem]">
              Be first on superlore Cloud.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-pretty text-fd-muted-foreground">
              Add your email and tell us whether you want it for a team or enterprise. No spam —
              early access and product updates only.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                data-tf-popup={TYPEFORM_ID}
                data-tf-iframe-props="title=superlore Cloud waitlist"
                className="kp-btn kp-btn-primary"
              >
                Join now
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="kp-btn kp-btn-secondary"
              >
                Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
