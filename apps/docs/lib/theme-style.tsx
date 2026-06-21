import { superlore } from "@/superlore.config";

/**
 * If the site config sets a brand `accent`, derive the whole accent family (hover/weak/border/text)
 * for BOTH light and dark from that one colour and override the theme tokens — so one config value
 * retints the entire site, theme-equal, with no other edits. Emitted as a `<style>` after the base
 * theme so it wins by source order. No accent set → nothing injected (superlore violet defaults).
 */
export function ThemeStyle() {
  const a = superlore.theme?.accent;
  if (!a) return null;
  // `!important` on the custom properties so the override wins regardless of stylesheet source
  // order (the base theme tokens also live on `:root`/`.dark`).
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
}
.dark{
  --kp-accent:color-mix(in oklab, ${a} 88%, #fff) ${i};
  --kp-accent-hover:color-mix(in oklab, ${a} 74%, #fff) ${i};
  --kp-accent-text:color-mix(in oklab, ${a} 72%, #fff) ${i};
  --kp-accent-weak:color-mix(in oklab, ${a} 16%, var(--color-fd-card)) ${i};
  --kp-accent-border:color-mix(in oklab, ${a} 36%, var(--color-fd-border)) ${i};
  --color-fd-primary:color-mix(in oklab, ${a} 88%, #fff) ${i};
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
