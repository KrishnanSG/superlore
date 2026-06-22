/**
 * Editor detection + extension install for `superlore connect`.
 *
 * Detects the VS Code-family editors a user has installed — VS Code, Cursor, Windsurf — and installs
 * the `superlore-preview` extension into each via the editor's own CLI (`code --install-extension …`,
 * and the equivalent `cursor` / `windsurf` binaries, which share VS Code's extension CLI surface).
 *
 * Detection is layered so it works on a fresh shell where the editor's CLI isn't on PATH yet:
 *   1. the editor's CLI on PATH (`code`, `cursor`, `windsurf`), then
 *   2. the standard install location for the OS (macOS app bundle, Windows install dir, Linux bin).
 *
 * This module shells out, so the pure decision logic (which binary, the install/already-installed
 * parse) is split out so it stays unit-testable: the side-effecting install takes an injectable
 * {@link Runner}.
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

/** The id of the extension (publisher.name) — used for identity / manual install hints. */
export const EXTENSION_ID = "superlore.superlore-preview";

/**
 * superlore isn't on the VS Code Marketplace by design — distribution is CLI/curl-driven. We host
 * the packaged extension on the public docs site and install it from the `.vsix` directly, which
 * VS Code, Cursor, and Windsurf all accept. (Hosted on the site, not a GitHub Release, because the
 * repo is private pre-launch and release assets aren't publicly downloadable — revisit post-launch.)
 */
export const DEFAULT_VSIX_URL = "https://superlore.vercel.app/superlore-preview.vsix";

/** Download the published `.vsix` to a temp file and return its path. Throws on a non-OK response. */
export async function downloadVsix(url: string = DEFAULT_VSIX_URL): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`couldn't fetch the extension (${res.status} ${res.statusText})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const path = join(tmpdir(), "superlore-preview.vsix");
  writeFileSync(path, bytes);
  return path;
}

/** A VS Code-family editor superlore can install its extension into. */
export interface Editor {
  /** Stable key used in flags / output. */
  readonly id: "vscode" | "cursor" | "windsurf";
  /** Human-facing name for branded output. */
  readonly label: string;
  /** The CLI binary name to try on PATH first. */
  readonly bin: string;
}

/** The editors superlore knows how to target, in the order we report them. */
export const EDITORS: readonly Editor[] = [
  { id: "vscode", label: "VS Code", bin: "code" },
  { id: "cursor", label: "Cursor", bin: "cursor" },
  { id: "windsurf", label: "Windsurf", bin: "windsurf" },
];

/** An editor we found on the machine, with the resolved command used to drive its CLI. */
export interface DetectedEditor extends Editor {
  /** Absolute path or bare command name to invoke the editor's CLI with. */
  readonly command: string;
}

/** A command runner — injectable so tests don't shell out. Returns trimmed stdout. */
export type Runner = (command: string, args: readonly string[]) => string;

/** True when a binary resolves on PATH (cross-platform). Best-effort; never throws. */
function onPath(bin: string): boolean {
  const probe = process.platform === "win32" ? "where" : "which";
  try {
    execFileSync(probe, [bin], { stdio: "ignore", shell: process.platform === "win32" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Standard, non-PATH install locations for an editor's CLI, per OS. These let `connect` work right
 * after a fresh editor install, before the user has run "Shell Command: Install '<editor>' command
 * in PATH". Returns absolute candidate paths in priority order.
 */
function fallbackPaths(editor: Editor): string[] {
  const home = homedir();
  if (process.platform === "darwin") {
    // The CLI shim shipped inside the .app bundle.
    const app: Record<Editor["id"], string> = {
      vscode: "Visual Studio Code.app",
      cursor: "Cursor.app",
      windsurf: "Windsurf.app",
    };
    const rel = `Contents/Resources/app/bin/${editor.bin}`;
    return [
      join("/Applications", app[editor.id], rel),
      join(home, "Applications", app[editor.id], rel),
    ];
  }
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
    const programs = join(local, "Programs");
    const dir: Record<Editor["id"], string> = {
      vscode: "Microsoft VS Code",
      cursor: "cursor",
      windsurf: "Windsurf",
    };
    const exe = `bin\\${editor.bin}.cmd`;
    return [
      join(programs, dir[editor.id], exe),
      join(process.env.ProgramFiles ?? "C:\\Program Files", dir[editor.id], exe),
    ];
  }
  // Linux: common install roots for the bundled CLI.
  return [
    join("/usr/share", editor.bin, "bin", editor.bin),
    join("/usr/bin", editor.bin),
    join("/snap/bin", editor.bin),
    join(home, ".local", "bin", editor.bin),
  ];
}

/** Resolve the command to drive an editor's CLI: PATH first, then a known install path. */
export function resolveEditorCommand(editor: Editor): string | undefined {
  if (onPath(editor.bin)) return editor.bin;
  for (const candidate of fallbackPaths(editor)) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Detect every targetable editor present on the machine. */
export function detectEditors(): DetectedEditor[] {
  const found: DetectedEditor[] = [];
  for (const editor of EDITORS) {
    const command = resolveEditorCommand(editor);
    if (command) found.push({ ...editor, command });
  }
  return found;
}

/**
 * The default {@link Runner} — runs the editor CLI synchronously and returns its combined output.
 * stderr is captured (`stdio: pipe`) rather than inherited, so the editor CLI's own chatter
 * (deprecation warnings, multi-line "not found" hints) never leaks into superlore's clean output;
 * we surface a single branded line per editor instead. On failure we still want the captured text,
 * so it's read off the thrown error.
 */
export const execRunner: Runner = (command, args) =>
  execFileSync(command, [...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // Editor CLIs on Windows are .cmd shims; a shell is needed to invoke them.
    shell: process.platform === "win32",
    timeout: 60_000,
  }).trim();

/** The outcome of attempting an install into one editor. */
export type InstallResult =
  | { editor: DetectedEditor; status: "installed" }
  | { editor: DetectedEditor; status: "already-installed" }
  | { editor: DetectedEditor; status: "failed"; error: string };

/**
 * Decide the {@link InstallResult} from an editor CLI's `--install-extension` output. VS Code-family
 * CLIs print "is already installed" (and exit 0) when the extension is present, and a confirmation
 * line otherwise. Pure so it's unit-testable.
 */
export function classifyInstallOutput(editor: DetectedEditor, output: string): InstallResult {
  return /already installed/i.test(output)
    ? { editor, status: "already-installed" }
    : { editor, status: "installed" };
}

/**
 * Install the superlore extension into one detected editor via its CLI, returning a structured
 * result rather than throwing — the caller reports a per-editor line. `--force` makes a re-run a
 * clean upgrade. Installs from a `.vsix` path — `connect` resolves one (the downloaded release
 * asset, or a local `--vsix`) and passes it here.
 */
export function installInto(
  editor: DetectedEditor,
  options: { vsix?: string; run?: Runner } = {},
): InstallResult {
  const run = options.run ?? execRunner;
  const target = options.vsix ?? EXTENSION_ID;
  try {
    const output = run(editor.command, ["--install-extension", target, "--force"]);
    return classifyInstallOutput(editor, output);
  } catch (error) {
    return { editor, status: "failed", error: failureReason(error) };
  }
}

/**
 * Distil a thrown CLI error into one concise, user-facing reason. `execFileSync` throws an Error
 * carrying `stderr`; we prefer its first meaningful line over the noisy "Command failed: …" message.
 */
function failureReason(error: unknown): string {
  if (error instanceof Error) {
    const stderr = (error as { stderr?: unknown }).stderr;
    const text =
      typeof stderr === "string" ? stderr : Buffer.isBuffer(stderr) ? stderr.toString() : "";
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      // Drop Node's own noise (deprecation warnings + their "(Use … --trace-deprecation …)" hints).
      .filter((l) => l.length > 0 && !/^\(node:/.test(l) && !/^\(Use /.test(l));
    // Prefer a line that names the actual failure; else the first meaningful line.
    const meaningful = lines.find((l) => /(not found|error|fail|denied)/i.test(l)) ?? lines[0];
    if (meaningful) return meaningful;
    return error.message.replace(/^Command failed:.*/s, "the editor CLI returned an error").trim();
  }
  return String(error);
}
