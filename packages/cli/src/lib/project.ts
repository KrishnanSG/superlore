import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { type SuperloreJson, SUPERLORE_JSON_FILENAME, parseSuperloreJson } from "../config.js";

/** A located superlore project: its root dir and parsed config. */
export interface SuperloreProject {
  /** Absolute path to the directory containing `superlore.json`. */
  root: string;
  /** The validated config. */
  config: SuperloreJson;
}

/**
 * Walk up from `start` looking for a `superlore.json`. Returns the directory that holds it, or
 * undefined if none is found before the filesystem root. This lets `superlore dev` work from any
 * subdirectory of a KB, the way `git` and `next` do.
 */
export function findProjectRoot(start: string = process.cwd()): string | undefined {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, SUPERLORE_JSON_FILENAME))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/** A failure to load a project, with a user-facing reason. */
export class LoadProjectError extends Error {}

/**
 * Locate and load the nearest superlore project. Throws {@link LoadProjectError} with a clear,
 * actionable message when there's no `superlore.json` or it fails validation.
 */
export function loadProject(start: string = process.cwd()): SuperloreProject {
  const root = findProjectRoot(start);
  if (!root) {
    throw new LoadProjectError(
      `No ${SUPERLORE_JSON_FILENAME} found here or in any parent directory. Run \`superlore init\` to scaffold a KB, or cd into one.`,
    );
  }
  const file = join(root, SUPERLORE_JSON_FILENAME);
  const result = parseSuperloreJson(readFileSync(file, "utf8"));
  if (!result.ok) {
    const lines = result.issues.map((i) => `  - ${i.path ? `${i.path} ` : ""}${i.message}`);
    throw new LoadProjectError(`Invalid ${SUPERLORE_JSON_FILENAME}:\n${lines.join("\n")}`);
  }
  return { root, config: result.value };
}

/** Pick the package manager that scaffolded the project (lockfile heuristic, pnpm default). */
export function detectPackageManager(root: string): "pnpm" | "npm" | "yarn" | "bun" {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) return "bun";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  return "pnpm";
}

/** True when the project's dependencies have been installed. */
export function isInstalled(root: string): boolean {
  return existsSync(join(root, "node_modules"));
}

/**
 * Run a package.json script in the project root, inheriting stdio so the child's output
 * (the dev server URL, build progress) streams straight through. Resolves with the exit code.
 */
export function runScript(
  root: string,
  script: string,
  extraArgs: readonly string[] = [],
  env?: Record<string, string>,
): Promise<number> {
  const pm = detectPackageManager(root);
  // pnpm/npm/yarn/bun all accept `<pm> run <script> -- <args>`; bun uses `bun run`.
  const args = ["run", script, ...(extraArgs.length ? ["--", ...extraArgs] : [])];
  return new Promise((resolvePromise, reject) => {
    const child = spawn(pm, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: env ? { ...process.env, ...env } : process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => resolvePromise(code ?? 0));
  });
}
