import type { VsCodeApi } from "./messages";

/**
 * `acquireVsCodeApi()` may be called only ONCE per webview — calling it twice throws. Both the
 * theme/handshake code (main.tsx) and the comment system need to post messages, so acquire it once
 * here and share the singleton. In the browser-verification harness a stub is injected before the
 * bundle runs, so this still resolves.
 */
let api: VsCodeApi | undefined;
let acquired = false;

export function getVsCodeApi(): VsCodeApi | undefined {
  if (!acquired) {
    acquired = true;
    api = typeof window.acquireVsCodeApi === "function" ? window.acquireVsCodeApi() : undefined;
  }
  return api;
}
