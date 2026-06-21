"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/** A subscribe that never fires: the snapshot only differs between server and client. */
const noopSubscribe = () => () => {};

/**
 * A compact light/dark toggle. Light and dark are co-equal; this just flips between them and
 * the CSS token layer does the rest (no theme branching beyond the icon). The Fumadocs docs
 * shell ships its own toggle — this is for custom chrome (landing, the Viewer).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Hydration-safe "are we on the client yet?": `false` on the server + first paint, `true`
  // once mounted — without a setState-in-effect cascade. Avoids a theme-icon hydration mismatch.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted ? resolvedTheme === "dark" : false;
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-lg border border-fd-border bg-fd-card text-fd-muted-foreground transition hover:border-kp-accent-border hover:text-fd-foreground"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
