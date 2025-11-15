---
---

chore: update dev dependencies and pnpm to 10.22.0

Updates:

- @typescript-eslint/eslint-plugin: 8.46.2 → 8.46.4
- @typescript-eslint/parser: 8.46.2 → 8.46.4
- @vitest/coverage-v8: 4.0.6 → 4.0.9
- eslint: 9.39.0 → 9.39.1
- vitest: 4.0.6 → 4.0.9
- @cyclonedx/cdxgen: 11.10.0 → 11.11.0
- @types/node: 24.9.2 → 24.10.1
- vite: 7.1.12 → 7.2.2
- markdownlint-cli2: 0.18.1 → 0.19.0
- pnpm: 10.17.0 → 10.22.0 (updated across all config files)

Configuration updates:

- Disabled MD060 markdownlint rule to prevent conflicts with Prettier table formatting

All quality checks passing including:

- ✅ Tests (93.77% line coverage, 80% threshold)
- ✅ Linting (ESLint, TypeScript strict mode)
- ✅ Security audit (only moderate vulnerability in transitive dependency)
- ✅ Zero code duplication
- ✅ No circular dependencies
- ✅ No dead code
