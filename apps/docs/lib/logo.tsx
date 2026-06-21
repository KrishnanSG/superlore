import { superlore } from "@/superlore.config";

/**
 * The superlore mark — "Fold": one flat surface folded into a structured, dimensional body. The lit
 * face is the human view, the half-tone face the machine's — one source, two readings. Drawn with
 * `currentColor`, so it inherits whatever colour we set (here, brand violet). Mirrors
 * `brand/superlore-mark.svg` — keep them in sync.
 */
export function SuperloreMark({ className }: { className?: string }) {
  // A configured logo (superlore.config `theme.logo`) replaces the built-in mark.
  if (superlore.theme?.logo) {
    return (
      <img
        src={superlore.theme.logo}
        alt={superlore.name}
        width={22}
        height={22}
        style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }}
        className={className}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={22}
      height={22}
      style={{ width: 22, height: 22, flexShrink: 0 }}
      className={className}
      role="img"
      aria-label={superlore.name}
    >
      <polygon points="14,20 32,12 32,46 14,54" fill="currentColor" />
      <polygon points="32,12 50,20 50,54 32,46" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/**
 * The navbar lockup: the violet mark + the wordmark + a small "Docs" pill. Used as the Fumadocs
 * nav title across the docs shell.
 */
export function NavTitle() {
  return (
    <span className="flex shrink-0 items-center gap-2 font-semibold">
      <SuperloreMark className="size-[22px] text-kp-accent-text" />
      <span className="text-[17px] tracking-tight text-fd-foreground">{superlore.name}</span>
      <span className="rounded-full border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-fd-muted-foreground uppercase">
        Docs
      </span>
    </span>
  );
}
