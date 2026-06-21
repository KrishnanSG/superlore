/**
 * `superlore/ui` — the page chrome a consuming app needs: layout, page shell, and the root
 * provider. Re-exported through superlore so an app imports everything from one place and never
 * names the underlying renderer. Pair with `superlore/source` (content) and `getMDXComponents`
 * from `superlore` (the component set).
 */
export { DocsPage, DocsBody, DocsTitle, DocsDescription } from "fumadocs-ui/page";
export { DocsLayout } from "fumadocs-ui/layouts/notebook";
export { RootProvider } from "fumadocs-ui/provider/next";
export { createRelativeLink } from "fumadocs-ui/mdx";
export type { BaseLayoutProps, LinkItemType, LayoutTab } from "fumadocs-ui/layouts/shared";
