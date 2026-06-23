/**
 * `superlore/ui` — the page chrome a consuming app needs: layout, page shell, and the root
 * provider. Re-exported through superlore so an app imports everything from one place and never
 * names the underlying renderer. Pair with `superlore/source` (content) and `getMDXComponents`
 * from `superlore` (the component set).
 */
import type { ComponentProps } from "react";
import { RootProvider as FumaRootProvider } from "fumadocs-ui/provider/next";
import { BuiltWithSuperlore } from "./components/built-with";

export { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
export { DocsLayout } from "fumadocs-ui/layouts/notebook";
export { createRelativeLink } from "fumadocs-ui/mdx";
export type { BaseLayoutProps, LinkItemType, LayoutTab } from "fumadocs-ui/layouts/shared";

/**
 * The superlore root provider — fumadocs' provider with the "Built with superlore" badge baked in.
 *
 * Every superlore KB wraps its app in this (the scaffold puts it in `app/layout.tsx`), so the badge
 * renders exactly once on every page. It lives here in the package, not in an editable template, so
 * it can't be removed by deleting a component from a page. Accepts (and forwards) all of fumadocs'
 * `RootProvider` props — `theme`, `search`, etc. — so it's a drop-in.
 */
export function RootProvider({ children, ...props }: ComponentProps<typeof FumaRootProvider>) {
  return (
    <FumaRootProvider {...props}>
      {children}
      <BuiltWithSuperlore
        href="https://superlore.vercel.app"
        className="fixed right-4 bottom-4 z-50"
      />
    </FumaRootProvider>
  );
}
