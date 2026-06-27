import { cn } from "../lib/cn";

/** The superlore "Fold" mark in white — for the violet badge chip. */
function FoldMarkWhite() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={13}
      height={13}
      style={{ width: 13, height: 13, flexShrink: 0 }}
      aria-hidden
    >
      <polygon points="14,20 32,12 32,46 14,54" fill="#ffffff" />
      <polygon points="32,12 50,20 50,54 32,46" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

export interface BuiltWithSuperloreProps {
  /** Where the badge links — defaults to the superlore site. */
  href?: string;
  /** Lead-in text before the wordmark. Defaults to "Built with"; pass "Powered by" for embeds. */
  label?: string;
  /** Mark-chip background — defaults to superlore violet. Set it to your brand for a themed badge. */
  chipColor?: string;
  className?: string;
}

/**
 * The "Built with superlore" badge — shields.io style: a violet Fold-mark chip next to a themed
 * label panel ("Built with superlore"). This is the ONE badge design across surfaces: baked into
 * {@link RootProvider} so it renders on every page of a KB, mirrored by the embeddable SVG at
 * `/built-with-superlore.svg`, and reused (as "Powered by superlore") as the floating badge a
 * {@link SuperloreDoc} stamps on an embedded doc. Light/dark co-equal — the label panel follows the
 * theme via tokens; the violet chip is constant superlore brand.
 */
export function BuiltWithSuperlore({
  href = "https://superlore.vercel.app",
  label = "Built with",
  chipColor = "#6D5CF0",
  className,
}: BuiltWithSuperloreProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${label} superlore`}
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md border border-fd-border text-xs font-medium no-underline shadow-sm transition hover:border-kp-accent-border",
        className,
      )}
    >
      <span className="flex items-center px-2" style={{ backgroundColor: chipColor }}>
        <FoldMarkWhite />
      </span>
      <span className="flex items-center gap-1 bg-fd-card px-2.5 py-1">
        <span className="text-fd-muted-foreground">{label}</span>
        <span className="font-semibold text-fd-foreground">superlore</span>
      </span>
    </a>
  );
}
