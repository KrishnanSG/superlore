/**
 * Conventional Commits. Body/footer line-length rules are disabled so longer bodies and git
 * trailers never trip the linter — the header rules (type/scope/subject) still apply.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
