import type { SuperloreJson } from "../../config.js";
import type { WriteFn } from "./util.js";
import { writeCompanyContent } from "./company.js";
import { writeProductContent } from "./product.js";
import { writePersonalContent } from "./personal.js";

export type { WriteFn, ContentWriter } from "./util.js";
export { escapeForJsx } from "./util.js";

/**
 * Author the full `content/docs` tree for a scaffolded KB, dispatched on its type. Each type gets a
 * realistic, populated multi-page structure (not a single welcome page) authored with real superlore
 * components — so a fresh scaffold renders rich for humans and serves clean knowledge to agents, and
 * the owner replaces dummy content section by section.
 */
export function writeContent(write: WriteFn, config: SuperloreJson): void {
  switch (config.type) {
    case "company-kb":
      writeCompanyContent(write, config);
      return;
    case "product-docs":
      writeProductContent(write, config);
      return;
    case "personal-kb":
      writePersonalContent(write, config);
      return;
  }
}
