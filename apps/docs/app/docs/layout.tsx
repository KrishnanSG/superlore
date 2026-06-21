import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { baseOptions, docsTabs } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      tabMode="navbar"
      tabs={docsTabs()}
      sidebar={{ defaultOpenLevel: 1, collapsible: true }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
