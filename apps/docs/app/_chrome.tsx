import Link from "next/link";
import { ThemeToggle } from "superlore";
import { superlore } from "@/superlore.config";

import { FoldMark } from "./_fold-mark";

/* Shared site chrome for the marketing routes (`/`, `/cloud`, …) — the thin top bar and the minimal
   footer, kept in one place so every page carries the same nav (incl. the superlore Cloud link). */

/* GitHub glyph — lucide v1 dropped the brand icon, so we draw it from the mark path. */
export function GitHubGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.85 1.19 3.11 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  );
}

/** Thin custom top bar: wordmark + Fold mark · Docs / Cloud / GitHub-star / theme-toggle / Get started. */
export function TopBar() {
  const navLink =
    "hidden rounded-md px-2 py-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-kp-accent sm:inline-flex";
  return (
    <header className="sticky top-0 z-30 border-b border-fd-border bg-fd-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold no-underline focus-visible:outline-none"
        >
          <FoldMark size={22} className="text-kp-accent-text" />
          <span className="text-[17px] tracking-tight text-fd-foreground">{superlore.name}</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Primary">
          <Link href="/docs" className={navLink}>
            Docs
          </Link>
          <Link href="/cloud" className={navLink}>
            Cloud
          </Link>
          <a
            href={superlore.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-kp-accent"
          >
            <GitHubGlyph className="size-4" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </a>
          <ThemeToggle />
          <Link
            href="/docs/getting-started"
            className="kp-btn kp-btn-primary kp-btn-sm font-medium"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Minimal footer (the CloseBand carries the GitHub-star band; this is the legal/links rail). */
export function Footer() {
  return (
    <footer className="border-t border-fd-border bg-fd-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-fd-muted-foreground">{superlore.footer.note}</span>
        </div>
        <nav className="flex items-center gap-5" aria-label="Footer">
          {superlore.footer.links.map((link) =>
            link.external ? (
              <a
                key={link.text}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-kp-accent"
              >
                {link.text}
              </a>
            ) : (
              <Link
                key={link.text}
                href={link.url}
                className="rounded-sm text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-kp-accent"
              >
                {link.text}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
