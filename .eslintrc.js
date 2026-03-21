module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "obsidianmd"],
  rules: {
    "obsidianmd/ui-text-case": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": ["error", { "checksVoidReturn": true }],
    "@typescript-eslint/no-unnecessary-type-assertion": "error"
  }
};
