import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
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
        '.claude/**',
        'node_modules/**',
        'src/dev/**', // Development utilities - no coverage required
        '**/*.example.ts', // Example files - not part of production code
      ],
      thresholds: {
        branches: 84, // Current: 84.95%, Goal: 90% - see PR#160 for plan
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
