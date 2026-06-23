import type { SuperloreJson } from "../../config.js";

/** The file-writer closure the scaffolder hands to each content module. */
export type WriteFn = (rel: string, body: string) => void;

/** A content module: authors a full `content/docs` tree for one KB type. */
export type ContentWriter = (write: WriteFn, config: SuperloreJson) => void;

/** Escape a string for safe inlining inside a JSX text / attribute literal. */
export function escapeForJsx(value: string): string {
  return value.replace(/[\\"]/g, "\\$&").replace(/[{}]/g, "");
}
