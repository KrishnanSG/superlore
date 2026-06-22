import { type InstallResult, detectEditors, EDITORS, installInto } from "../lib/editors.js";
import { accent, bold, cyan, dim, log } from "../lib/log.js";

/** Flags for `superlore connect`. */
export interface ConnectFlags {
  /** Install from a local `.vsix` instead of the Marketplace (offline / pre-publish). */
  vsix?: string;
  /** Don't fail the process if no editor is detected (used when folded into `init`). */
  optional?: boolean;
}

/**
 * `superlore connect` — wire superlore into the user's editor(s).
 *
 * Detects the VS Code-family editors on the machine (VS Code, Cursor, Windsurf) and installs the
 * `superlore-preview` extension into each via its own CLI. Reports a clean, branded, per-editor
 * result, handles "none detected" and "already installed" gracefully, and finishes by pointing at
 * the next step of the get-started flow — wiring the MCP so the user's agent reads the same corpus.
 *
 * Non-interactive and safe in scripts: it never prompts, and `connect` itself exits 0 even when no
 * editor is found (there's nothing broken — just nothing to install).
 */
export async function connectCommand(flags: ConnectFlags = {}): Promise<void> {
  log.blank();
  log.info(`${accent("superlore connect")} ${dim("— set up your editor")}`);
  log.blank();

  const detected = detectEditors();

  if (detected.length === 0) {
    log.warn("No supported editor detected (looked for VS Code, Cursor, and Windsurf).");
    log.blank();
    log.info(`${dim("Install one, then re-run")} ${cyan("superlore connect")}${dim(".")}`);
    log.info(
      `${dim("If an editor is installed but its CLI isn't on PATH, open it and run")} ${cyan('"Shell Command: Install \'<editor>\' command in PATH"')}${dim(".")}`,
    );
    printMcpNextStep();
    // Not an error: nothing to do, exit clean so it's safe in any script / `init` chain.
    process.exit(0);
  }

  const labels = detected.map((e) => bold(e.label)).join(", ");
  log.step(`Found ${labels}. Installing the superlore Preview extension…`);
  log.blank();

  const results = detected.map((editor) => report(installInto(editor, { vsix: flags.vsix })));

  log.blank();
  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0 && failed.length === results.length) {
    log.error("Couldn't install the extension into any editor. See the errors above.");
    printManualInstall();
    process.exit(flags.optional ? 0 : 1);
  }

  log.success(
    `superlore Preview is ready. Open a ${cyan(".mdx")} file and run ${cyan("superlore: Open Preview")} ${dim("(Cmd/Ctrl+K V)")}.`,
  );
  printMcpNextStep();
}

/** Print, and return, one per-editor result line. */
function report(result: InstallResult): InstallResult {
  switch (result.status) {
    case "installed":
      log.success(`${bold(result.editor.label)} ${dim("— extension installed.")}`);
      break;
    case "already-installed":
      log.info(`${accent("›")} ${bold(result.editor.label)} ${dim("— already installed, up to date.")}`);
      break;
    case "failed":
      log.error(`${bold(result.editor.label)} ${dim("— install failed:")} ${result.error}`);
      break;
  }
  return result;
}

/** The fallback path when every editor CLI install failed. */
function printManualInstall(): void {
  log.blank();
  log.info(`${dim("Install it by hand from the Extensions view — search")} ${cyan('"superlore Preview"')}${dim(".")}`);
}

/** Point at the next step of the get-started flow: connecting the MCP to the user's agent. */
function printMcpNextStep(): void {
  log.blank();
  log.info(bold("Next: connect the MCP"));
  log.info(
    `  ${dim("Let your agent read the same corpus. Ask Claude")} ${cyan('"connect my superlore MCP"')}${dim(",")}`,
  );
  log.info(
    `  ${dim("or register it yourself:")} ${cyan("claude mcp add --transport http -s user superlore <url>/api/mcp")}`,
  );
}

// Re-export so callers (e.g. `init`) can reason about the editor set without importing the lib.
export { EDITORS };
