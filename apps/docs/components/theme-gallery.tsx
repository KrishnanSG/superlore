"use client";

import { useEffect, useState } from "react";

/**
 * ThemeGallery — the live, interactive theme picker for the Themes doc page. Clicking a theme stamps
 * `data-sl-theme` on `<html>`, so the WHOLE site reskins in place (the truest "see how it changes").
 * Below the switcher, a static reference card per theme: palette swatches, a type sample rendered in
 * the theme's own font stack, and its radius/density. The gallery itself uses fd-/kp- tokens, so it
 * also reskins as you preview — reinforcing what the theme does.
 */

interface ThemeDef {
  id: string;
  name: string;
  tagline: string;
  inspired: string;
  mode: "light" | "dark"; // which palette the swatches show
  swatches: { label: string; hex: string }[];
  fontStack: string;
  fontNote: string;
  mono: boolean; // show a mono label sample
  radius: string;
  density: string;
}

const THEMES: ThemeDef[] = [
  {
    id: "default",
    name: "default",
    tagline:
      "superlore's native look — layered surfaces, hairline borders, the Canvas front-and-center.",
    inspired: "superlore",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#fcfcfd" },
      { label: "surface", hex: "#ffffff" },
      { label: "border", hex: "#e3e5ea" },
      { label: "text", hex: "#14161a" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontNote: "Inter · JetBrains Mono",
    mono: true,
    radius: "8px",
    density: "balanced",
  },
  {
    id: "mint",
    name: "mint",
    tagline:
      "Mintlify-grade — airy blurred navbar, accent-underlined tabs, a grouped icon sidebar.",
    inspired: "Mintlify",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#fcfcfd" },
      { label: "surface", hex: "#ffffff" },
      { label: "border", hex: "#e3e5ea" },
      { label: "text", hex: "#14161a" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontNote: "airy Inter",
    mono: false,
    radius: "12px",
    density: "airy",
  },
  {
    id: "geist",
    name: "geist",
    tagline:
      "Swiss border-first — structure in 1px hairlines, mono nav labels, color as punctuation.",
    inspired: "Vercel / Geist",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#ffffff" },
      { label: "surface", hex: "#fafafa" },
      { label: "border", hex: "#ebebeb" },
      { label: "text", hex: "#0a0a0a" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontNote: "sans + mono labels",
    mono: true,
    radius: "5px",
    density: "tight",
  },
  {
    id: "ledger",
    name: "ledger",
    tagline: "Editorial ivory — authority through restraint, a printed-essay serif body.",
    inspired: "Anthropic / Claude",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#faf9f5" },
      { label: "surface", hex: "#fffdf7" },
      { label: "border", hex: "#e8e4d9" },
      { label: "text", hex: "#141413" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: 'Georgia, "Iowan Old Style", "Times New Roman", ui-serif, serif',
    fontNote: "serif body + sans headings",
    mono: false,
    radius: "6px",
    density: "roomy",
  },
  {
    id: "obsidian",
    name: "obsidian",
    tagline: "Dark-first dense console — near-black, information-dense, calm.",
    inspired: "Linear",
    mode: "dark",
    swatches: [
      { label: "bg", hex: "#08090a" },
      { label: "surface", hex: "#0e0f11" },
      { label: "border", hex: "#1c1d21" },
      { label: "text", hex: "#e6e7ea" },
      { label: "accent", hex: "#7c87ff" },
    ],
    fontStack: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontNote: "Inter, dense",
    mono: false,
    radius: "8px",
    density: "dense",
  },
  {
    id: "prism",
    name: "prism",
    tagline: "Polished light reference — cool white, navy headings, restrained soft elevation.",
    inspired: "Stripe",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#ffffff" },
      { label: "surface", hex: "#f6f9fc" },
      { label: "border", hex: "#e6ebf1" },
      { label: "text", hex: "#0a2540" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontNote: "airy light sans + mono",
    mono: true,
    radius: "10px",
    density: "roomy",
  },
  {
    id: "paste",
    name: "paste",
    tagline: "Accessible system — one family, weight discipline, guaranteed contrast.",
    inspired: "Twilio / Paste",
    mode: "light",
    swatches: [
      { label: "bg", hex: "#ffffff" },
      { label: "surface", hex: "#f4f4f6" },
      { label: "border", hex: "#e1e3e8" },
      { label: "text", hex: "#0e1117" },
      { label: "accent", hex: "#5a47e0" },
    ],
    fontStack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontNote: "one family · 400 / 600",
    mono: false,
    radius: "8px",
    density: "medium",
  },
];

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace';

function applyTheme(id: string) {
  const html = document.documentElement;
  if (id === "default") html.removeAttribute("data-sl-theme");
  else html.setAttribute("data-sl-theme", id);
}

export function ThemeGallery() {
  // `siteDefault` = the theme the site loaded with (from superlore.json); Reset returns here.
  // Both start "default" so the first client render matches SSR (no hydration mismatch); the effect
  // then syncs them once from the server-stamped <html data-sl-theme>.
  const [st, setSt] = useState({ siteDefault: "default", active: "default" });
  const { siteDefault, active } = st;

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-sl-theme") || "default";
    // One-time sync from the server-rendered DOM attribute (an external system), not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSt({ siteDefault: current, active: current });
  }, []);

  const preview = (id: string) => {
    applyTheme(id);
    setSt((p) => ({ ...p, active: id }));
  };

  return (
    <div className="not-prose my-6">
      {/* live switcher */}
      <div className="rounded-2xl border border-fd-border bg-fd-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold tracking-widest text-kp-accent-text uppercase">
            Live preview
          </span>
          <span className="text-[12.5px] text-fd-muted-foreground">
            Reskins the whole page · resets on reload
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => preview(t.id)}
              aria-pressed={active === t.id}
              className={
                active === t.id
                  ? "rounded-lg border border-kp-accent-border bg-kp-accent-weak px-3 py-1.5 text-[13px] font-medium text-kp-accent-text transition"
                  : "rounded-lg border border-fd-border bg-fd-card px-3 py-1.5 text-[13px] font-medium text-fd-muted-foreground transition hover:border-kp-accent-border hover:text-fd-foreground"
              }
            >
              {t.name}
            </button>
          ))}
          {active !== siteDefault && (
            <button
              type="button"
              onClick={() => preview(siteDefault)}
              className="ml-auto rounded-lg px-3 py-1.5 text-[13px] font-medium text-fd-muted-foreground underline-offset-2 transition hover:text-fd-foreground hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* reference cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {THEMES.map((t) => (
          <div
            key={t.id}
            className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card"
          >
            {/* type sample — rendered in the theme's own font stack */}
            <div
              className="flex items-baseline justify-between gap-3 border-b border-fd-border px-4 py-3"
              style={{ fontFamily: t.fontStack }}
            >
              <span className="text-[26px] leading-none font-semibold tracking-tight text-fd-foreground">
                Aa
              </span>
              <span className="text-right text-[12.5px] text-fd-muted-foreground">
                The quick brown fox jumps over the lazy dog
              </span>
            </div>

            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[14px] font-semibold text-fd-foreground">
                  {t.name}
                </span>
                <button
                  type="button"
                  onClick={() => preview(t.id)}
                  className="rounded-md border border-fd-border px-2.5 py-1 text-[11.5px] font-medium text-fd-muted-foreground transition hover:border-kp-accent-border hover:text-kp-accent-text"
                >
                  Preview →
                </button>
              </div>
              <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-fd-muted-foreground">
                {t.tagline}
              </p>

              {/* swatches */}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                {t.swatches.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <span
                      className="size-7 rounded-md border border-fd-border"
                      style={{ background: s.hex }}
                      title={s.hex}
                    />
                    <span className="font-mono text-[9px] text-fd-muted-foreground/80">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* meta chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">
                  {t.fontNote}
                </span>
                {t.mono && (
                  <span
                    className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground"
                    style={{ fontFamily: MONO }}
                  >
                    v1.0.0
                  </span>
                )}
                <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">
                  radius {t.radius}
                </span>
                <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] text-fd-muted-foreground">
                  {t.density}
                </span>
                <span className="ml-auto text-[11px] text-fd-muted-foreground/70">
                  {t.inspired}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
