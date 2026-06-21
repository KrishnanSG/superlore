import type { KComment } from "./comments/model";

/** Messages the extension host posts INTO the webview. Mirrors src/extension.ts. */
export type HostMessage =
  | { type: "update"; source: string; fileName: string }
  | { type: "theme"; theme: "dark" | "light" }
  | { type: "init"; author: string }
  | { type: "comments"; fileName: string; comments: KComment[] };

/** Messages the webview posts back OUT to the host. Mirrors src/extension.ts. */
export type WebviewMessage =
  | { type: "ready" }
  | { type: "saveComments"; comments: KComment[] }
  | { type: "copyToClipboard"; text: string; label?: string };

/** The VS Code webview API surface we use (subset). */
export interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}
