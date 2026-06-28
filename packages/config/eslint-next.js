/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["./eslint-base.js", "next/core-web-vitals"],
  ignorePatterns: ["dist/**", ".next/**", "node_modules/**", ".turbo/**"],
};
