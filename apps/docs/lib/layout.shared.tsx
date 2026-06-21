import type { BaseLayoutProps, LinkItemType, LayoutTab } from "fumadocs-ui/layouts/shared";
import type * as PageTree from "fumadocs-core/page-tree";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { superlore } from "@/superlore.config";
import { source } from "@/lib/source";
import { NavTitle } from "./logo";

/** Render a lucide icon by name (kebab-case) for the nav/tabs. */
function NavIcon({ name }: { name: string }) {
  return <DynamicIcon name={name as IconName} size={15} />;
}

/** Shared chrome, built from `superlore.config.ts`: the brand lockup, top links, and the GitHub URL. */
export function baseOptions(): BaseLayoutProps {
  const links: LinkItemType[] = superlore.links.map((l) =>
    l.cta
      ? {
          // A featured surface — Fumadocs renders `type: "button"` as a filled CTA.
          type: "button",
          text: l.text,
          url: l.url,
          icon: l.icon ? <NavIcon name={l.icon} /> : undefined,
          external: l.external,
        }
      : {
          type: "main",
          text: l.text,
          url: l.url,
          icon: l.icon ? <NavIcon name={l.icon} /> : undefined,
          external: l.external,
        },
  );
  return {
    nav: { title: <NavTitle />, url: "/" },
    links,
    githubUrl: superlore.github,
  };
}

/** Find a top-level folder node in the page tree by its index URL (e.g. `/docs/components`). */
function findFolder(folder: string): PageTree.Folder | undefined {
  const url = `/docs/${folder}`;
  const root = source.getPageTree();
  return root.children.find((node): node is PageTree.Folder => {
    if (node.type !== "folder") return false;
    // A section folder is its own sidebar root (`root: true` in meta.json), so Fumadocs does
    // NOT hang the index page off `node.index` — the index lives as a normal page child. Match
    // either: the folder's own index URL, or a child page whose URL is the section landing.
    if (node.index?.url === url) return true;
    return node.children.some((child) => child.type === "page" && child.url === url);
  });
}

/**
 * Mintlify-style top tabs (a section switcher), built from the config.
 *
 * A folder tab (one with `folder` set — e.g. Components) binds to its page-tree node via
 * `$folder`, so Fumadocs lights it on the folder index AND every sub-page (`/docs/components/*`).
 * Every other tab binds to the doc slugs in its `match` list via a `urls` set.
 */
export function docsTabs(): LayoutTab[] {
  return superlore.tabs.map((t) => {
    const base = {
      title: t.title,
      url: t.url,
      icon: <NavIcon name={t.icon} />,
    };
    const folderNode = t.folder ? findFolder(t.folder) : undefined;
    if (folderNode) return { ...base, $folder: folderNode };
    return { ...base, urls: new Set(t.match.map((m) => (m ? `/docs/${m}` : "/docs"))) };
  });
}
