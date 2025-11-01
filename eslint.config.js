// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as jsonc from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';
import sonarjs from 'eslint-plugin-sonarjs';
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
      sonarjs,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Core ESLint complexity rules
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', 3],
      'max-lines-per-function': [
        'warn',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-params': ['error', { max: 4 }],
      'max-statements': ['warn', 15],
      'max-nested-callbacks': ['warn', 3],

      // Cognitive complexity (SonarJS)
      'sonarjs/cognitive-complexity': ['warn', 15],

      // Additional code quality rules from SonarJS
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
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
      sonarjs,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Relaxed complexity rules for tests
      // Test files can have larger describe blocks with many test cases
      complexity: ['warn', 15],
      'max-lines-per-function': ['warn', { max: 600, skipComments: true, skipBlankLines: true }],
      'sonarjs/cognitive-complexity': ['warn', 20],
      'sonarjs/no-duplicate-string': 'off', // Allow duplicates in tests
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
