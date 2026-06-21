/**
 * Prettier owns all formatting (ESLint defers via eslint-config-prettier).
 * The Tailwind plugin sorts utility classes; on Tailwind v4 it needs `tailwindStylesheet`
 * pointing at the CSS entry that imports tailwind, or class sorting silently no-ops.
 *
 * @type {import("prettier").Config}
 */
export default {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./apps/docs/app/global.css",
  tailwindFunctions: ["cn"],
};
