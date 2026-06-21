import { cn } from "../lib/cn";

/** The superlore "Fold" mark, inheriting `currentColor` (mirrors brand/superlore-mark.svg). */
function Mark() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={14}
      height={14}
      style={{ width: 14, height: 14, flexShrink: 0 }}
      aria-hidden
      className="text-kp-accent-text"
    >
      <polygon points="14,20 32,12 32,46 14,54" fill="currentColor" />
      <polygon points="32,12 50,20 50,54 32,46" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export interface BuiltWithSuperloreProps {
  /** Where the badge links — defaults to the superlore project. */
  href?: string;
  className?: string;
}

/**
 * The "Built with superlore" attribution badge. A small, token-driven chip carrying the real superlore
 * mark — meant to sit in the footer of every screen of a superlore KB. Light/dark co-equal.
 */
export function BuiltWithSuperlore({
  href = "https://github.com/KrishnanSG/superlore",
  className,
}: BuiltWithSuperloreProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Built with superlore"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card px-2.5 py-1 text-xs font-medium text-fd-muted-foreground no-underline shadow-[var(--kp-canvas-shadow)] transition hover:border-kp-accent-border hover:text-fd-foreground",
        className,
      )}
    >
      <span className="text-fd-muted-foreground">Built with</span>
      <Mark />
      <span className="font-semibold text-fd-foreground">superlore</span>
    </a>
  );
}
