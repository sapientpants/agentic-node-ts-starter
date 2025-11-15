// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as jsonc from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';
import unicorn from 'eslint-plugin-unicorn';
import promisePlugin from 'eslint-plugin-promise';
import importPlugin from 'eslint-plugin-import';
import noBarrelFiles from 'eslint-plugin-no-barrel-files';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import n from 'eslint-plugin-n';
import regexp from 'eslint-plugin-regexp';
import jsdoc from 'eslint-plugin-jsdoc';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'sbom.cdx.json', 'reports/**'],
  },
  // Base configuration for all JS/TS files
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs['recommended'].rules,
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  // Type-aware rules for TypeScript source files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      unicorn,
      promise: promisePlugin,
      import: importPlugin,
      'no-barrel-files': noBarrelFiles,
      sonarjs,
      security,
      '@eslint-community/eslint-comments': eslintComments,
      n,
      regexp,
      jsdoc,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: __dirname,
        },
        node: true,
      },
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Core ESLint complexity rules
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 3],
      'max-lines-per-function': [
        'error',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-params': ['error', { max: 4 }],
      'max-statements': ['error', 15],
      'max-nested-callbacks': ['error', 3],

      // Strict TypeScript rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: true,
          checksConditionals: true,
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: true,
          allowAny: false,
        },
      ],
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // Promise best practices
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'error',
      'promise/prefer-await-to-then': 'error',

      // Import organization
      'import/no-cycle': ['error', { maxDepth: Infinity }],
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-absolute-path': 'error',

      // Barrel files
      'no-barrel-files/no-barrel-files': 'error',

      // Unicorn rules - selective modern patterns
      'unicorn/no-nested-ternary': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/no-array-reduce': 'error',
      'unicorn/prefer-ternary': 'error',

      // SonarJS - Code quality and bug detection
      ...sonarjs.configs.recommended.rules,

      // Security - Security-focused linting
      ...security.configs.recommended.rules,

      // ESLint Comments - Validate ESLint directive comments
      ...eslintComments.configs.recommended.rules,

      // Node.js - Node.js best practices
      ...n.configs['recommended-module'].rules,

      // RegExp - Advanced regex validation and optimization
      ...regexp.configs['flat/recommended'].rules,

      // JSDoc - Documentation quality and validation
      ...jsdoc.configs['flat/recommended-typescript-flavor'].rules,
      'jsdoc/require-jsdoc': 'off', // Don't require JSDoc everywhere, use selectively
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns-description': 'warn',
    },
  },
  // Allow barrel files for index.ts entry points and legitimate re-exports
  {
    files: ['**/index.ts', '**/logger.ts'],
    rules: {
      'no-barrel-files/no-barrel-files': 'off',
    },
  },
  // Relaxed complexity rules for test files
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Relaxed complexity rules for tests
      // Test files can have larger describe blocks with many test cases
      complexity: ['error', 15],
      'max-lines-per-function': ['error', { max: 600, skipComments: true, skipBlankLines: true }],
    },
  },
  // Script files - allow console.log for CLI output
  {
    files: ['scripts/**/*.js', '.github/scripts/**/*.js', '.claude/hooks/**/*.ts'],
    rules: {
      'no-console': 'off', // Console output is appropriate for CLI scripts
    },
  },
  // JSON/JSONC/JSON5 linting configuration
  {
    files: ['**/*.json', '**/*.json5', '**/*.jsonc'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
    },
    rules: {
      ...jsonc.configs['recommended-with-json'].rules,
      'jsonc/sort-keys': 'off', // Keep keys in logical order, not alphabetical
      'jsonc/indent': ['error', 2], // Enforce 2-space indentation in JSON files
      'jsonc/key-spacing': 'error', // Enforce consistent spacing between keys and values
      'jsonc/comma-dangle': ['error', 'never'], // No trailing commas in JSON
      'jsonc/quotes': ['error', 'double'], // Enforce double quotes in JSON
      'jsonc/quote-props': ['error', 'always'], // Always quote property names
      'jsonc/no-comments': 'off', // Allow comments in JSONC files
    },
  },
  // Specific rules for package.json
  {
    files: ['**/package.json'],
    rules: {
      'jsonc/sort-keys': [
        'error',
        {
          pathPattern: '^$', // Root object
          order: [
            'name',
            'version',
            'description',
            'keywords',
            'author',
            'license',
            'repository',
            'bugs',
            'homepage',
            'private',
            'type',
            'main',
            'module',
            'exports',
            'files',
            'bin',
            'packageManager',
            'engines',
            'scripts',
            'lint-staged',
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
          ],
        },
      ],
    },
  },
  // Specific rules for tsconfig files
  {
    files: ['**/tsconfig*.json'],
    rules: {
      'jsonc/no-comments': 'off', // Allow comments in tsconfig files
    },
  },
  // Keep Prettier last
  eslintConfigPrettier,
];
