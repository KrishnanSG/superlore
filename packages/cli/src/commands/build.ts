import { accent, cyan, log } from "../lib/log.js";
import { isInstalled, loadProject, LoadProjectError, runScript } from "../lib/project.js";

/**
 * `superlore build` — production build of the KB, wrapping the scaffolded app's `next build`.
 * Warns a company KB that ships without an auth gate before it hits a public host.
 */
export async function buildCommand(): Promise<void> {
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

  // Surface the company-KB-without-auth warning regardless of install state — it's a deploy risk.
  if (project.config.type === "company-kb" && !project.config.auth?.enabled) {
    log.warn(
      `Building a company KB with auth disabled — anyone with the URL can read it. Enable ${cyan("auth in superlore.json")} before deploying.`,
    );
    log.blank();
  }

  if (!isInstalled(project.root)) {
    log.error(
      `Dependencies aren't installed. Run ${cyan("pnpm install")} (or npm / yarn / bun) first.`,
    );
    process.exit(1);
  }

  log.step(`Building ${accent(project.config.name)} for production`);
  log.blank();

  const code = await runScript(project.root, "build");
  process.exit(code);
}
