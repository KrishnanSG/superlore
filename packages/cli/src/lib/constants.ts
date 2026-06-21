/**
 * Shared constants: the canonical site + the surfaces the CLI points users at.
 *
 * `SUPERLORE_SITE` is overridable via `SUPERLORE_SITE` env so a self-hoster (or our own dev) can point
 * the CLI at a different deploy. The waitlist lives at the site's `/cloud` page — the same page
 * `apps/docs` ships — so managed deploy ("superlore Cloud") routes there while it's in private beta.
 */
export const SUPERLORE_SITE = (
  process.env.SUPERLORE_SITE ?? "https://superlore.vercel.app"
).replace(/\/$/, "");

/** The superlore Cloud waitlist (the site's `/cloud` page). */
export const CLOUD_WAITLIST_URL = `${SUPERLORE_SITE}/cloud`;

/** The public repository. */
export const GITHUB_URL = "https://github.com/KrishnanSG/superlore";

/** superlore brand violet — the default accent when none is provided. */
export const SUPERLORE_VIOLET = "#6D5CF0";
