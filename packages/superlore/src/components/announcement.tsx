"use client";

import { useSyncExternalStore } from "react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Per-id dismissal backed by localStorage, read via `useSyncExternalStore` so it's hydration-safe
 * (server snapshot = "not dismissed", so the card always renders on the server) and updates in
 * place when dismissed — no setState-in-effect.
 */
function useDismissed(id: string): [boolean, () => void] {
  const key = `superlore:announcement:${id}`;
  const dismissed = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new StorageEvent("storage", { key }));
  };
  return [dismissed, dismiss];
}

/**
 * A dismissible "what's new" announcement — config-driven (`superlore.config` `announcement`), shown in
 * the sidebar footer. Prisma-style: a small promo card that points at a launch/changelog and
 * remembers its dismissal per `id` in localStorage. Chrome, not content — so it has no MCP
 * knowledge face; surface a real changelog as a `<Releases>`/`<Changelog>` page instead.
 */
export interface AnnouncementData {
  /** Stable id — bump it to re-show a new announcement after the old one was dismissed. */
  id: string;
  title: string;
  body?: string;
  href?: string;
  /** A small tag, e.g. "New". */
  badge?: string;
  external?: boolean;
}

export function AnnouncementCard(props: AnnouncementData) {
  const { id, title, body, href, badge, external } = props;
  const [dismissed, markDismissed] = useDismissed(id);
  if (dismissed) return null;

  const dismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markDismissed();
  };

  const body_ = (
    <>
      <div className="flex items-center justify-between gap-2">
        {badge ? (
          <span className="text-kp-accent-ink inline-flex items-center rounded-full bg-kp-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            {badge}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="grid size-5 place-items-center rounded text-fd-muted-foreground transition hover:bg-fd-muted hover:text-fd-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-fd-foreground">{title}</p>
      {body ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fd-muted-foreground">{body}</p>
      ) : null}
      {href ? (
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-kp-accent-text">
          Read more <ArrowRight className="size-3" />
        </span>
      ) : null}
    </>
  );

  const klass = cn(
    "not-prose block rounded-xl border border-kp-accent-border bg-kp-accent-weak/60 p-3 transition",
    href && "hover:border-kp-accent hover:bg-kp-accent-weak",
  );

  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={klass}
    >
      {body_}
    </a>
  ) : (
    <div className={klass}>{body_}</div>
  );
}
