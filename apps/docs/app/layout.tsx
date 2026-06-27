import { RootProvider } from "superlore/ui";
import "./global.css";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
// superlore.json is the KB config the CLI scaffolds; `theme` selects the visual skin. The package
// ships each skin's CSS scoped to `[data-sl-theme="…"]`, so flipping this flag is all it takes.
import siteConfig from "@/superlore.json";

const inter = Inter({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Handwritten marker face for Canvas annotations (the one place a hand font appears).
const hand = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hand" });

const SITE = "https://superlore.vercel.app";
const GITHUB = "https://github.com/KrishnanSG/superlore";
const DESCRIPTION =
  "The company knowledge base your agents run on. Author rich, structured docs once — canvases, boards, timelines — and every agent reads the same corpus over MCP.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "superlore — the company knowledge base your agents run on",
    template: "%s · superlore",
  },
  description: DESCRIPTION,
  applicationName: "superlore",
  authors: [{ name: "Krishnan S G" }],
  creator: "Krishnan S G",
  publisher: "superlore",
  keywords: [
    "knowledge base",
    "MCP",
    "MCP-native documentation",
    "AI agents",
    "agent-native docs",
    "MDX documentation",
    "dual-representation",
    "open source docs framework",
    "Mintlify alternative",
    "Docusaurus alternative",
    "GitBook alternative",
    "llms.txt",
  ],
  openGraph: {
    type: "website",
    siteName: "superlore",
    url: SITE,
    title: "superlore — the company knowledge base your agents run on",
    description: DESCRIPTION,
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "superlore — one corpus, humans and agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "superlore — the company knowledge base your agents run on",
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
  alternates: { canonical: SITE },
  // Favicon from superlore.json (mint.json-style) — falls back to Next's default when unset.
  icons: siteConfig.favicon ? { icon: siteConfig.favicon } : undefined,
};

/**
 * JSON-LD structured data — the schema.org graph search engines and LLMs read to understand what
 * superlore *is* (an open-source software project + the org behind it). A top GEO/SEO signal: it
 * makes superlore eligible to be surfaced when someone asks an AI "best docs tool for AI agents".
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#org`,
      name: "superlore",
      url: SITE,
      logo: `${SITE}/superlore-mark.svg`,
      description: DESCRIPTION,
      sameAs: [GITHUB],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#site`,
      name: "superlore",
      url: SITE,
      publisher: { "@id": `${SITE}/#org` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: "superlore",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      url: SITE,
      description:
        "Open-source, MCP-native knowledge-base framework. Author once in MDX — humans get a clean, visual site; AI agents get a first-class MCP over the same structured content.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": `${SITE}/#org` },
      softwareHelp: `${SITE}/docs`,
      featureList: [
        "MCP-native: agents query the same corpus humans read",
        "Dual-representation components (typed knowledge, not OCR)",
        "FigJam-style Canvas that renders as a typed graph",
        "Author once in MDX, self-host anywhere",
      ],
    },
    {
      "@type": "SoftwareSourceCode",
      name: "superlore",
      codeRepository: GITHUB,
      programmingLanguage: "TypeScript",
      url: GITHUB,
      author: { "@id": `${SITE}/#org` },
    },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${mono.variable} ${hand.variable}`}
      data-sl-theme={
        siteConfig.theme && siteConfig.theme !== "default" ? siteConfig.theme : undefined
      }
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        {/* schema.org graph for SEO + GEO (AI assistants reconstruct what superlore is from this). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* `accent` from superlore.json drives the WHOLE palette (kp-accent family + fumadocs
            primary/ring, light + dark) — derived in the package, no per-token overrides. */}
        <RootProvider
          accent={siteConfig.accent}
          theme={{ defaultTheme: "dark", enableSystem: true }}
        >
          {children}
        </RootProvider>
        {/* Privacy-friendly traffic + top-content analytics, and Core Web Vitals. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
