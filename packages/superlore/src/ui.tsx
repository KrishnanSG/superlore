/**
 * `superlore/ui` — the page chrome a consuming app needs: layout, page shell, and the root
 * provider. Re-exported through superlore so an app imports everything from one place and never
 * names the underlying renderer. Pair with `superlore/source` (content) and `getMDXComponents`
 * from `superlore` (the component set).
 */
import type { ComponentProps } from "react";
import { RootProvider as FumaRootProvider } from "fumadocs-ui/provider/next";
import { BuiltWithSuperlore } from "./components/built-with";
import { AccentStyle } from "./components/accent-style";
import { SidebarShortcuts } from "./components/sidebar-shortcuts";

export { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
export { DocsLayout } from "fumadocs-ui/layouts/notebook";
export { createRelativeLink } from "fumadocs-ui/mdx";
export type { BaseLayoutProps, LinkItemType, LayoutTab } from "fumadocs-ui/layouts/shared";
export { AccentStyle } from "./components/accent-style";
export { BuiltWithSuperlore } from "./components/built-with";
export { SidebarShortcuts } from "./components/sidebar-shortcuts";

/**
 * The superlore root provider — fumadocs' provider with brand-accent derivation + the "Built with
 * superlore" badge baked in.
 *
 * Every superlore KB wraps its app in this (the scaffold puts it in `app/layout.tsx`), so the badge
 * renders exactly once on every page. Pass `accent` (from `superlore.json`) and it retints the WHOLE
 * palette — superlore's `--kp-accent` family AND the fumadocs primary/ring tokens, light + dark —
 * with no per-token overrides. Forwards all of fumadocs' `RootProvider` props (`theme`, `search`, …).
 */
export function RootProvider({
  children,
  accent,
  ...props
}: ComponentProps<typeof FumaRootProvider> & { accent?: string }) {
  return (
    <FumaRootProvider {...props}>
      <AccentStyle accent={accent} />
      <SidebarShortcuts />
      {children}
      <BuiltWithSuperlore
        href="https://superlore.vercel.app"
        className="fixed right-4 bottom-4 z-50"
      />
    </FumaRootProvider>
  );
}
