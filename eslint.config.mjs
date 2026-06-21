import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Shared flat ESLint config for the workspace TS/React packages (the `superlore` library and any
 * future non-Next packages). `apps/docs` uses its own config (next/core-web-vitals); never apply
 * these browser-lib rules there or Next route/RSC false-positives appear. Prettier owns
 * formatting (eslint-config-prettier disables conflicting style rules).
 */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/coverage/**",
      "**/*.d.ts",
      // The VS Code extension is a self-contained sub-project with its own build + typecheck.
      "extensions/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs["recommended-latest"].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // React 19: no React import needed; props are typed by TS.
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      // No `any` — the superlore rule. Use `unknown` + narrowing.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Plain JS config/build files (next.config.mjs, *.config.mjs, remark/rehype plugins) run on
    // Node — give them Node globals so `process`/`URL`/etc. don't trip `no-undef`.
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
