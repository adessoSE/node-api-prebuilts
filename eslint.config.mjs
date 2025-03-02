// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const rootDir = import.meta.dirname;

export default tseslint.config(
  {
    ignores: [
      "**/.vite/",
      "**/.yarn/",
      "**/.pnp.*",
      "**/dist/",
      "tools/",
      "eslint.config.mjs",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "warn",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    rules: {
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
          ignoreVoidOperator: true,
        },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true },
      ],
      // not compatible with specifying void return types via generics
      // see also https://github.com/typescript-eslint/typescript-eslint/issues/8113
      "@typescript-eslint/no-invalid-void-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          // reportUsedIgnorePattern: true,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: true,
        },
      ],
    },
  },
  {
    files: ["src/cli/**/*.ts", "src/cli/**/*.mts", "src/cli/**/*.cts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: rootDir,
        // typescript-eslint specific options
        warnOnUnsupportedTypeScriptVersion: true,
        projectService: true,
      },
    },
  },
);
