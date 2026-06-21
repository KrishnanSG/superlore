/**
 * superlore site config — the single place to brand a superlore KB.
 *
 * A scaffolder edits THIS file (name, tagline, nav, links, footer) to make the site theirs,
 * without touching any layout internals. It's pure data: tab/link `icon`s are lucide icon
 * names resolved by the layout. Brand *colour* lives in the theme layer (`superlore/css` tokens,
 * `--kp-*`) — light and dark are co-equal there — so retheming is a token edit, not a config flag.
 */

export interface SuperloreTab {
  title: string;
  /** Section landing URL the tab points at. */
  url: string;
  /** lucide icon name (kebab-case). */
  icon: string;
  /** Doc slugs (relative to /docs, "" = index) that light this tab up. */
  match: string[];
  /**
   * For a tab that points at a docs *folder* (a `meta.json` group rendered as a sidebar group),
   * the folder's index path (relative to /docs). The layout binds the tab to that page-tree node
   * so it tracks the active state of the folder index AND every sub-page — Fumadocs' supported
   * way to get correct active state for a folder tab. `match` is the fallback.
   */
  folder?: string;
}

export interface SuperloreLink {
  text: string;
  url: string;
  icon?: string;
  external?: boolean;
  /** Render as a filled CTA button (Fumadocs `type: "button"`) — for a featured surface. */
  cta?: boolean;
}

export interface SuperloreConfig {
  name: string;
  tagline: string;
  /** Long description for <head> metadata + the landing hero sub-line. */
  description: string;
  github: string;
  /**
   * High-level theming — the only knobs most people touch. Set a brand `accent` (any CSS colour)
   * and superlore derives the whole accent family (hover/weak/border/text) for BOTH light and dark.
   * Set a `logo` URL to replace the built-in mark in the nav. Everything else stays beautiful by
   * default. Leave unset to use superlore violet.
   */
  theme?: {
    accent?: string;
    logo?: string;
  };
  /**
   * An optional dismissible "what's new" card shown in the sidebar footer. Bump `id` to re-show a
   * new announcement after a reader dismissed the previous one.
   */
  announcement?: {
    id: string;
    title: string;
    body?: string;
    href?: string;
    badge?: string;
    external?: boolean;
  };
  /** Top-nav tabs (Mintlify-style section switcher). */
  tabs: SuperloreTab[];
  /** Extra top-right nav items. */
  links: SuperloreLink[];
  footer: {
    note: string;
    links: { text: string; url: string; external?: boolean }[];
  };
}

export const superlore: SuperloreConfig = {
  name: "superlore",
  tagline: "One corpus. Humans and agents.",
  description:
    "The company knowledge base your agents run on. Author rich, structured docs once — canvases, boards, timelines — and every agent reads the same corpus over MCP.",
  github: "https://github.com/KrishnanSG/superlore",
  // Brand it in one place: an accent colour (light + dark derived for you) and an optional logo.
  // Leave empty for superlore violet + the built-in mark.
  theme: {},
  // An `announcement` (see the SuperloreConfig type) renders a dismissible sidebar card via
  // <AnnouncementCard>. Wiring it into the notebook layout's sidebar slot is pending a Fumadocs
  // slot fix — the component is shipped and ready to mount.
  tabs: [
    {
      title: "Guide",
      url: "/docs",
      icon: "book-open",
      match: ["", "getting-started", "architecture", "authoring", "auth", "built-with-superlore"],
    },
    // Canvas sits before Components — the whiteboard is a headline capability, not a footnote. It's
    // a folder tab now: the whole Canvas world (the region model, templates, gallery, briefs) nests
    // under it, so the tab tracks the folder index AND every sub-page. Templates folds in here.
    {
      title: "Canvas",
      url: "/docs/canvas",
      icon: "pen-tool",
      match: ["canvas"],
      folder: "canvas",
    },
    {
      title: "Components",
      url: "/docs/components",
      icon: "blocks",
      match: ["components"],
      folder: "components",
    },
    // Agents & MCP is its own folder tab: the agent surface (authoring-for-agents + the MCP, which
    // has its own nested section for tools + connecting).
    {
      title: "Agents & MCP",
      url: "/docs/agents",
      icon: "plug",
      match: ["agents"],
      folder: "agents",
    },
  ],
  // The Viewer is a special, standalone surface (drop in MDX, see it render live). Featured as a
  // filled CTA button in the top-right nav so it reads as "try it", not another docs tab.
  links: [{ text: "Open Viewer", url: "/viewer", icon: "play", cta: true }],
  footer: {
    note: "Author once. Humans and agents read the same corpus.",
    links: [
      { text: "GitHub", url: "https://github.com/KrishnanSG/superlore", external: true },
      { text: "Docs", url: "/docs" },
      { text: "Viewer", url: "/viewer" },
    ],
  },
};
