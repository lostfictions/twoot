// @ts-check
require("eslint-config-lostfictions/patch");

/** @type {import('eslint-config-lostfictions').Config} */
module.exports = {
  extends: ["lostfictions"],
  parserOptions: { tsconfigRootDir: __dirname },
  ignorePatterns: ["example.ts"],
};
