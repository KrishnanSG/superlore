import { RootProvider } from "superlore/ui";
import "./global.css";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import type { Metadata } from "next";
import { ThemeStyle } from "@/lib/theme-style";

const inter = Inter({ subsets: ["latin"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// Handwritten marker face for Canvas annotations (the one place a hand font appears).
const hand = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: {
    default: "superlore — the company knowledge base your agents run on",
    template: "%s · superlore",
  },
  description:
    "The company knowledge base your agents run on. Author rich, structured docs once — canvases, boards, timelines — and every agent reads the same corpus over MCP.",
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
        {/* Light and dark are co-equal; default to the reader's system preference. */}
        <RootProvider theme={{ defaultTheme: "system", enableSystem: true }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
