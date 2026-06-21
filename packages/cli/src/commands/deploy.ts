import { spawn } from "node:child_process";

import { CLOUD_WAITLIST_URL } from "../lib/constants.js";
import { accent, bold, cyan, dim, log } from "../lib/log.js";

/** Flags for `superlore deploy`. */
export interface DeployFlags {
  /** Open the waitlist URL in the default browser. */
  open?: boolean;
}

/** Best-effort open a URL in the OS default browser. Never throws. */
function openInBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(cmd, [url], {
      stdio: "ignore",
      detached: true,
      shell: process.platform === "win32",
    });
    child.on("error", () => {
      /* ignore — we already printed the URL */
    });
    child.unref();
  } catch {
    /* ignore */
  }
}

/**
 * `superlore deploy` — WAITLISTED. Managed deploy (superlore Cloud) is in private beta, so this never
 * deploys. It prints a friendly message, shows (and optionally opens) the waitlist, points at the
 * self-host path, and exits 0 so it's safe to drop into any script.
 */
export async function deployCommand(flags: DeployFlags): Promise<void> {
  log.blank();
  log.info(`${accent("superlore Cloud")} ${dim("— managed deploy")}`);
  log.blank();
  log.info(
    `Managed deploy is in ${bold("private beta")} — one-click superlore Cloud hosting isn't open to`,
  );
  log.info(`everyone yet.`);
  log.blank();
  log.info(`${bold("Join the waitlist:")} ${cyan(CLOUD_WAITLIST_URL)}`);
  log.blank();
  log.info(`${dim("In the meantime, superlore is open source — self-host free:")}`);
  log.info(
    `  ${accent("›")} ${cyan("superlore build")} ${dim("then deploy the app to Vercel or any Next.js host.")}`,
  );
  log.blank();

  if (flags.open) {
    log.step(`Opening ${cyan(CLOUD_WAITLIST_URL)} …`);
    openInBrowser(CLOUD_WAITLIST_URL);
  }

  // Waitlisted, not an error: exit cleanly.
  process.exit(0);
}
