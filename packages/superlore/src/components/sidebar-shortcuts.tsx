"use client";

import { useEffect } from "react";

/**
 * Sidebar collapse polish for the notebook layout. fumadocs collapses the docs sidebar (hide + hover-
 * peek — the right pattern for a nested docs tree), but the collapse is ephemeral and has no shortcut.
 * This adds the two things every app sidebar has and fumadocs' lacks, with **zero** fumadocs internals
 * (the collapse state isn't exposed): a `⌘\` / `Ctrl+\` toggle, and persistence of the collapsed choice
 * across navigations + reloads. Pure DOM against the rendered `#nd-sidebar` + its collapse trigger; if
 * the markup shifts in a fumadocs upgrade it degrades to a no-op. Mount once, inside `RootProvider`.
 */
const KEY = "sl-sidebar-collapsed";

function collapseTrigger(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    'button[aria-label*="ollapse sidebar" i], button[aria-label*="xpand sidebar" i]',
  );
}

export function SidebarShortcuts() {
  useEffect(() => {
    const sidebar = () => document.getElementById("nd-sidebar");

    // Restore the persisted collapsed choice once fumadocs has mounted the sidebar.
    const restore = window.setTimeout(() => {
      const sb = sidebar();
      if (sb && localStorage.getItem(KEY) === "1" && sb.getAttribute("data-collapsed") !== "true") {
        collapseTrigger()?.click();
      }
    }, 80);

    // Persist whenever the sidebar's collapsed state changes.
    const sb = sidebar();
    const mo = sb
      ? new MutationObserver(() =>
          localStorage.setItem(KEY, sb.getAttribute("data-collapsed") === "true" ? "1" : "0"),
        )
      : null;
    if (sb && mo) mo.observe(sb, { attributes: true, attributeFilter: ["data-collapsed"] });

    // ⌘\ / Ctrl+\ toggles collapse (Notion/Linear convention).
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        collapseTrigger()?.click();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(restore);
      mo?.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
