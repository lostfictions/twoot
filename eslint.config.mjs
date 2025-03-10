import config from "eslint-config-lostfictions";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    ignores: ["example.ts"],
  },
];
