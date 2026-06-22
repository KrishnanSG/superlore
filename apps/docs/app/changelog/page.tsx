import type { Metadata } from "next";
import { Releases, Release } from "superlore";
import { TopBar, Footer } from "../_chrome";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What's new in superlore — releases of the core library, the CLI, and the editor extension.",
};

/**
 * /changelog — release notes, deliberately OUTSIDE /docs (changelog is dated, reverse-chron, not
 * evergreen reference). Dogfoods the `Releases` / `Release` components: the same entries a human reads
 * here serialize to typed `release` knowledge nodes an agent can query ("every fix since June").
 */
export default function ChangelogPage() {
  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground">Changelog</h1>
        <p className="mt-2 max-w-2xl text-fd-muted-foreground">
          What's new across superlore — the core library, the CLI, and the editor extension. Author
          once; humans read it here, agents read the same entries over the MCP.
        </p>
        <div className="mt-8">
          <Releases label="superlore releases">
            <Release
              version="superlore 0.4"
              date="2026-06-22"
              status="done"
              title="Preview + Handoff components"
              changes={[
                {
                  type: "added",
                  text: "Preview — UI mockups (browser/app chrome, tabs, sidebar) as a dual-representation component.",
                  refs: [{ rel: "related", target: "/docs/components/preview", label: "Preview" }],
                },
                {
                  type: "added",
                  text: "Handoff — the session baton (AI↔AI, AI↔human) for the top of a doc.",
                  refs: [{ rel: "related", target: "/docs/components/handoff", label: "Handoff" }],
                },
                {
                  type: "fixed",
                  text: "Canvas node colors render for consumers of the published package.",
                },
              ]}
            />
            <Release
              version="superlore 0.3"
              date="2026-06-22"
              status="done"
              title="One import surface, RSC-ready"
              changes={[
                {
                  type: "added",
                  text: "Single-import surface — import everything from superlore (ui / source / config / next).",
                },
                {
                  type: "changed",
                  text: "Build preserves React Server Component boundaries, so the package is consumable by real Next apps.",
                },
              ]}
            />
            <Release
              version="superlore-cli 0.2 · extension 0.2"
              date="2026-06-22"
              status="done"
              title="Editor onboarding over curl"
              changes={[
                {
                  type: "added",
                  text: "superlore connect — auto-detects VS Code / Cursor / Windsurf and installs the editor extension. No Marketplace.",
                },
                { type: "added", text: "The editor extension renders the full component set in preview, including Handoff." },
              ]}
            />
            <Release
              version="superlore 0.1"
              date="2026-06"
              title="First release"
              changes={[
                {
                  type: "added",
                  text: "Dual-representation components, the Canvas, a first-class MCP, and optional auth — one corpus for humans and agents.",
                },
              ]}
            />
          </Releases>
        </div>
      </main>
      <Footer />
    </>
  );
}
