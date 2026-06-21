import { source } from "@/lib/source";
import { DocsBody, DocsPage } from "superlore/ui";
import { notFound } from "next/navigation";
import { getMDXComponents, PageHero, BuiltWithSuperlore } from "superlore";
import { createRelativeLink } from "superlore/ui";
import { superlore } from "@/superlore.config";
import type { Metadata } from "next";

/** The section a page sits in (Guide / Components / Canvas / MCP) — the hero's eyebrow. */
function kickerFor(slug: string[] | undefined): string {
  const first = slug?.[0] ?? "";
  for (const t of superlore.tabs) {
    if (t.folder === first || t.match.includes(first)) return t.title;
  }
  return superlore.name;
}

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{ style: "clerk" }}>
      {/* The branded page hero is the default top-of-page treatment on every doc — an eyebrow
          (the section), the title, and the description in a violet-gradient card. */}
      <PageHero
        kicker={kickerFor(params.slug)}
        title={page.data.title}
        description={page.data.description}
      />
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      {/* Mandatory "Built with superlore" attribution — present on every screen. */}
      <footer className="mt-10 flex justify-center border-t border-fd-border pt-6">
        <BuiltWithSuperlore />
      </footer>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
