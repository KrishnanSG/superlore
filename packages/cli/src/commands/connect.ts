import {
  type InstallResult,
  detectEditors,
  downloadVsix,
  EDITORS,
  installInto,
} from "../lib/editors.js";
import { accent, bold, cyan, dim, log } from "../lib/log.js";

/** Flags for `superlore connect`. */
export interface ConnectFlags {
  /** Install from a local `.vsix` instead of downloading the published release asset. */
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
      `${dim("If an editor is installed but its CLI isn't on PATH, open it and run")} ${cyan("\"Shell Command: Install '<editor>' command in PATH\"")}${dim(".")}`,
    );
    printMcpNextStep();
    // Not an error: nothing to do, exit clean so it's safe in any script / `init` chain.
    process.exit(0);
  }

  const labels = detected.map((e) => bold(e.label)).join(", ");
  log.step(`Found ${labels}. Installing the superlore Preview extension…`);
  log.blank();

  // Prefer the Open VSX registry: install by extension id so the EDITOR manages and auto-updates it
  // (Cursor, Windsurf, VSCodium, … resolve ids from Open VSX) — no stale hand-installed build. Fall
  // back to the hosted `.vsix` for an editor whose marketplace doesn't carry it (VS Code proper), or
  // whenever a local `--vsix` was passed.
  let results: InstallResult[];
  if (flags.vsix) {
    results = detected.map((editor) => report(installInto(editor, { vsix: flags.vsix })));
  } else {
    const byId = detected.map((editor) => installInto(editor)); // install by id → Open VSX
    // Download the hosted .vsix once, only if some editor couldn't resolve it from a registry.
    const vsix = byId.some((r) => r.status === "failed")
      ? await downloadVsix().catch(() => undefined)
      : undefined;
    results = detected.map((editor, i) => {
      const idResult = byId[i]!;
      if (idResult.status !== "failed") return report(idResult);
      return report(vsix ? installInto(editor, { vsix }) : idResult);
    });
  }

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
      log.info(
        `${accent("›")} ${bold(result.editor.label)} ${dim("— already installed, up to date.")}`,
      );
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
  log.info(
    `${dim("Install it by hand: open your editor's Extensions panel and search")} ${cyan('"superlore Preview"')}${dim(" (it's on Open VSX),")}`,
  );
  log.info(
    `${dim("or run")} ${cyan("code --install-extension superlore.superlore-preview")} ${dim("(Cursor/Windsurf/VSCodium).")}`,
  );
}

/** Point at the next step of the get-started flow: connecting the MCP to the user's agent. */
function printMcpNextStep(): void {
  log.blank();
  log.info(bold("Next: connect the MCP"));
  // superlore's own docs MCP — always-on help: your agent reads superlore's latest docs over MCP.
  log.info(`  ${dim("superlore's docs + help, in your agent — always current:")}`);
  log.info(
    `  ${cyan("claude mcp add --transport http -s user superlore-docs https://superlore.vercel.app/api/mcp")}`,
  );
  log.blank();
  // Their own KB MCP — the whole point: the agent reads THEIR corpus, once deployed.
  log.info(
    `  ${dim("And your own KB once it's live (or ask Claude")} ${cyan('"connect my superlore MCP"')}${dim("):")}`,
  );
  log.info(`  ${cyan("claude mcp add --transport http -s user my-kb <your-kb-url>/api/mcp")}`);
}

// Re-export so callers (e.g. `init`) can reason about the editor set without importing the lib.
export { EDITORS };
