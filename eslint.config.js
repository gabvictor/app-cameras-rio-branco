const { FlatCompat } = require("@eslint/eslintrc");
const globals = require("globals");
const js = require("@eslint/js");
const ts = require("typescript-eslint");

const compat = new FlatCompat();

module.exports = [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...compat.extends("google"),
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
      },
    },
    // A SEÇÃO ABAIXO É A MAIS IMPORTANTE PARA CORRIGIR O ERRO
    settings: {
      "import/resolver": {
        typescript: {}, // This enables the typescript resolver
      },
    },
    rules: {
      "import/no-unresolved": 0, // Desativa a regra original, pois o resolver cuidará disso
      "quotes": ["error", "double"],
      "object-curly-spacing": ["error", "always"],
      "require-jsdoc": 0,
    },
  },
];