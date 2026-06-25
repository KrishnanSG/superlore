/**
 * AccentStyle — derive the WHOLE brand palette from a single `accent` colour.
 *
 * One value in `superlore.json` (`accent`) should retint the entire KB — superlore's `--kp-accent`
 * family AND the fumadocs primary/ring tokens — for BOTH light and dark, with no per-token hand
 * overrides. This emits that derived CSS as a `<style>` after the base theme so it wins by source
 * order. Rendered once by {@link RootProvider} (pass `accent`), or drop it in standalone.
 *
 * Pure CSS `color-mix` derivations — no JS colour math, no theme branch (light + dark are co-equal).
 */
export interface AccentStyleProps {
  /** Any CSS colour. When unset, nothing is emitted (superlore's violet defaults apply). */
  accent?: string;
}

export function AccentStyle({ accent }: AccentStyleProps) {
  const a = accent?.trim();
  if (!a) return null;
  const i = "!important";
  const css = `
:root{
  --kp-accent:${a} ${i};
  --kp-accent-hover:color-mix(in oklab, ${a} 82%, #000) ${i};
  --kp-accent-ink:#fff ${i};
  --kp-accent-text:${a} ${i};
  --kp-accent-weak:color-mix(in oklab, ${a} 12%, var(--color-fd-card)) ${i};
  --kp-accent-border:color-mix(in oklab, ${a} 30%, var(--color-fd-border)) ${i};
  --color-fd-primary:${a} ${i};
  --color-fd-primary-foreground:#fff ${i};
  --color-fd-ring:${a} ${i};
}
.dark{
  --kp-accent:color-mix(in oklab, ${a} 88%, #fff) ${i};
  --kp-accent-hover:color-mix(in oklab, ${a} 74%, #fff) ${i};
  --kp-accent-text:color-mix(in oklab, ${a} 72%, #fff) ${i};
  --kp-accent-weak:color-mix(in oklab, ${a} 16%, var(--color-fd-card)) ${i};
  --kp-accent-border:color-mix(in oklab, ${a} 36%, var(--color-fd-border)) ${i};
  --color-fd-primary:color-mix(in oklab, ${a} 88%, #fff) ${i};
  --color-fd-primary-foreground:#0b0b10 ${i};
  --color-fd-ring:color-mix(in oklab, ${a} 88%, #fff) ${i};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
