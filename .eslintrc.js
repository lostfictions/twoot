// @ts-check
require("eslint-config-lostfictions/patch");

/** @type {import('@typescript-eslint/experimental-utils').TSESLint.Linter.Config} */
module.exports = {
  extends: ["lostfictions"],
  parserOptions: { tsconfigRootDir: __dirname },
  ignorePatterns: ["example.ts"],
};
