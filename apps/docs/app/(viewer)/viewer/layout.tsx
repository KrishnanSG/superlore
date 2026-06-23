import Link from "next/link";
import { ThemeToggle } from "superlore";
import { SuperloreMark } from "@/lib/logo";

/** Viewer chrome: a slim top bar (the real mark + wordmark + theme toggle), NO docs sidebar. The
 *  "Built with superlore" badge is baked into RootProvider, so it shows here without being added. */
export default function ViewerLayout({ children }: LayoutProps<"/viewer">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-fd-border bg-fd-background/80 px-4 backdrop-blur md:px-6">
        <Link href="/docs" className="flex items-center gap-2 font-semibold no-underline">
          <SuperloreMark className="size-[22px] text-kp-accent-text" />
          <span className="text-[17px] tracking-tight text-fd-foreground">superlore</span>
          <span className="rounded-full border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-fd-muted-foreground uppercase">
            Viewer
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
