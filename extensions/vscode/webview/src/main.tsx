import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { Preview } from "./preview";
import { PreviewErrorBoundary } from "./error-boundary";
import { getVsCodeApi } from "./vscode-api";
import type { HostMessage } from "./messages";

// Fonts the superlore theme expects, bundled so the strict CSP never reaches the network:
//   --font-mono → JetBrains Mono, --font-hand → Caveat (Canvas annotations), body → Inter.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";

// Tailwind v4 + superlore theme tokens + React Flow styles + extension-local styling.
import "./styles.css";

// Acquire the VS Code API once (shared singleton — the comment system posts messages too). In the
// browser-verification harness a stub is injected before this bundle runs (see the README).
const vscode = getVsCodeApi();

type Theme = "dark" | "light";

/* Inline sun/moon glyphs — no icon dependency in the extension. */
function SunIcon(): React.ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon(): React.ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/**
 * Root: the theme is fully controlled here (next-themes `forcedTheme`), so it never depends on
 * webview localStorage. The host's VS Code theme sets the initial value and follows *genuine* VS
 * Code theme changes — but a redundant re-send (e.g. the "ready" handshake) is ignored so the
 * manual toggle (top-right) sticks.
 */
function App(): React.ReactNode {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const lastHostTheme = useRef<Theme | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>): void => {
      const msg = event.data;
      if (msg?.type === "theme" && msg.theme !== lastHostTheme.current) {
        lastHostTheme.current = msg.theme;
        setTheme(msg.theme);
      }
    };
    window.addEventListener("message", onMessage);
    vscode?.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      forcedTheme={theme}
      disableTransitionOnChange
    >
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="fixed top-3 right-3 z-50 grid size-9 place-items-center rounded-lg border border-fd-border bg-fd-card text-fd-muted-foreground shadow-sm transition hover:border-kp-accent-border hover:text-fd-foreground"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
      <PreviewErrorBoundary>
        <Preview />
      </PreviewErrorBoundary>
    </ThemeProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
