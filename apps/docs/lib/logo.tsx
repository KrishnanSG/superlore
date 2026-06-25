import { superlore } from "@/superlore.config";
import siteConfig from "@/superlore.json";

/** Optional logo config from superlore.json — pick light/dark images the mint.json way. */
const logo = (siteConfig as { logo?: { light?: string; dark?: string; href?: string } }).logo;

/**
 * The superlore mark — "Fold": one flat surface folded into a structured, dimensional body. The lit
 * face is the human view, the half-tone face the machine's — one source, two readings. Drawn with
 * `currentColor`, so it inherits whatever colour we set (here, brand violet). Mirrors
 * `brand/superlore-mark.svg` — keep them in sync.
 */
export function SuperloreMark({ className }: { className?: string }) {
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
 * The navbar lockup. When `superlore.json` sets a `logo` ({ light, dark }), we render those images —
 * swapped by theme in pure CSS (`dark:` visibility), so light and dark stay co-equal with no JS
 * theme-branch — plus the "Docs" pill. Otherwise the built-in mark + wordmark lockup is the fallback.
 */
export function NavTitle() {
  const hasLogo = Boolean(logo?.light || logo?.dark);
  return (
    <span className="flex shrink-0 items-center gap-2 font-semibold">
      {hasLogo ? (
        <>
          {logo?.light && (
            <img
              src={logo.light}
              alt={superlore.name}
              className="w-auto shrink-0 dark:hidden"
              style={{ height: 22 }}
            />
          )}
          {logo?.dark && (
            <img
              src={logo.dark}
              alt={superlore.name}
              className="hidden w-auto shrink-0 dark:block"
              style={{ height: 22 }}
            />
          )}
        </>
      ) : (
        <>
          <SuperloreMark className="size-[22px] text-kp-accent-text" />
          <span className="text-[17px] tracking-tight text-fd-foreground">{superlore.name}</span>
        </>
      )}
      <span className="rounded-full border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-fd-muted-foreground uppercase">
        Docs
      </span>
    </span>
  );
}
