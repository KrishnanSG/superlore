import { RootProvider } from "superlore/ui";
import "./global.css";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import type { Metadata } from "next";
// superlore.json is the KB config the CLI scaffolds; `theme` selects the visual skin. The package
// ships each skin's CSS scoped to `[data-sl-theme="…"]`, so flipping this flag is all it takes.
import siteConfig from "@/superlore.json";

const inter = Inter({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Handwritten marker face for Canvas annotations (the one place a hand font appears).
const hand = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hand" });

const SITE = "https://superlore.vercel.app";
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
  keywords: ["knowledge base", "MCP", "agents", "MDX", "documentation", "dual-representation"],
  openGraph: {
    type: "website",
    siteName: "superlore",
    url: SITE,
    title: "superlore — the company knowledge base your agents run on",
    description: DESCRIPTION,
    images: [{ url: "/hero.png", alt: "superlore — one corpus, humans and agents" }],
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
        {/* `accent` from superlore.json drives the WHOLE palette (kp-accent family + fumadocs
            primary/ring, light + dark) — derived in the package, no per-token overrides. */}
        <RootProvider
          accent={siteConfig.accent}
          theme={{ defaultTheme: "dark", enableSystem: true }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
