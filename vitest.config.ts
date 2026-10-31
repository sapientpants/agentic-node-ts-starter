import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Plugin } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Load the project's compiler options the way `tsc` does. `tsconfig.json` may contain
 * comments, trailing commas and `extends`, which plain `JSON.parse` would reject or ignore.
 */
function loadCompilerOptions(): ts.CompilerOptions {
  const configPath = fileURLToPath(new URL('./tsconfig.json', import.meta.url));
  const result = ts.readConfigFile(configPath, ts.sys.readFile);
  if (result.error !== undefined) {
    throw new Error(ts.flattenDiagnosticMessageText(result.error.messageText, '\n'));
  }
  return ts.parseJsonConfigFileContent(result.config, ts.sys, dirname(configPath)).options;
}

/**
 * Vite's default transformer (oxc) strips types but does not yet lower standard (TC39)
 * decorators, so files that use `@decorator` syntax are transpiled with the TypeScript
 * compiler instead. Only files containing decorators take this slower path.
 */
function standardDecorators(): Plugin {
  const compilerOptions: ts.CompilerOptions = {
    ...loadCompilerOptions(),
    module: ts.ModuleKind.ESNext,
    sourceMap: true,
    inlineSources: true,
    declaration: false,
  };

  return {
    name: 'standard-decorators',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.[cm]?ts$/.test(id) || id.includes('/node_modules/') || !/^\s*@\w/m.test(code)) {
        return null;
      }
      const result = ts.transpileModule(code, { compilerOptions, fileName: id });
      return { code: result.outputText, map: result.sourceMapText ?? null };
    },
  };
}

export default defineConfig({
  plugins: [standardDecorators()],
  test: {
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '*.config.js',
        '*.config.ts',
        '.*.js',
        '**/*.d.ts',
        'tests/**',
        'test/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'docs/**',
        '.github/**',
        '.changeset/**',
        'node_modules/**',
        'src/dev/**', // Development utilities - no coverage required
        '**/*.example.ts', // Example files - not part of production code
      ],
      thresholds: {
        branches: 84, // Goal: 90% - see PR#160 for plan. Docs and quality-metrics.json read this value.
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
