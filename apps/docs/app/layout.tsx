import { RootProvider } from "superlore/ui";
import "./global.css";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import type { Metadata } from "next";
import { ThemeStyle } from "@/lib/theme-style";

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
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${mono.variable} ${hand.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        {/* Optional brand accent from superlore.config — derives the family for light + dark. */}
        <ThemeStyle />
        {/* superlore's own docs default to dark; the toggle still offers light + system. */}
        <RootProvider theme={{ defaultTheme: "dark", enableSystem: true }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
