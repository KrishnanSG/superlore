import { accent, cyan, dim, log } from "../lib/log.js";
import { isInstalled, loadProject, LoadProjectError, runScript } from "../lib/project.js";

/** Flags for `superlore dev`. */
export interface DevFlags {
  /** Port to run the dev server on (passed through to `next dev`). */
  port?: number;
}

/**
 * `superlore dev` — run the local superlore site for preview by wrapping the scaffolded app's
 * `next dev`. Prints the local URL up front, then streams the dev server's output.
 */
export async function devCommand(flags: DevFlags): Promise<void> {
  let project;
  try {
    project = loadProject();
  } catch (error) {
    if (error instanceof LoadProjectError) {
      log.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  if (!isInstalled(project.root)) {
    log.error(
      `Dependencies aren't installed. Run ${cyan("pnpm install")} (or npm / yarn / bun) first.`,
    );
    process.exit(1);
  }

  const port = flags.port ?? 3000;
  log.step(`Starting ${accent(project.config.name)} dev server`);
  log.info(`  ${dim("Local:")} ${cyan(`http://localhost:${port}`)}`);
  if (project.config.mcp?.enabled) {
    log.info(
      `  ${dim("MCP:  ")} ${cyan(`http://localhost:${port}${project.config.mcp.path ?? "/api/mcp"}`)}`,
    );
  }
  log.blank();

  const args = flags.port ? ["--port", String(flags.port)] : [];
  const code = await runScript(project.root, "dev", args);
  process.exit(code);
}
