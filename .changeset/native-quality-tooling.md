---
'agentic-node-ts-starter': minor
---

feat: implement comprehensive native TypeScript/JavaScript quality tooling

This release enhances code quality enforcement with a suite of native TypeScript/JavaScript ecosystem tools:

**New Quality Tools:**

- **Knip** - Dead code detection (unused exports, files, dependencies, types)
- **Stryker Mutator** - Mutation testing for test quality verification (80% threshold)
- **npm-check-updates** - Dependency freshness tracking
- **eslint-plugin-unicorn** - Modern JavaScript patterns and code quality
- **eslint-plugin-promise** - Promise/async best practices
- **eslint-plugin-import** - Import organization and circular dependency detection
- **eslint-plugin-no-barrel-files** - Prevent barrel file anti-patterns

**Enhanced Quality Enforcement:**

- All ESLint rules upgraded from warnings to errors for stricter code quality
- 200+ active rules enforcing code quality, complexity, and best practices
- Pre-commit hook now includes dead code detection and code duplication checks
- Comprehensive type safety with strict TypeScript rules

**New Commands:**

- `pnpm dead-code` - Find unused exports, files, dependencies, and types
- `pnpm mutation-test` - Verify test quality (80% threshold)
- `pnpm mutation-test:incremental` - Faster incremental mutation testing
- `pnpm deps:check` - Check for outdated dependencies
- `pnpm deps:update:minor` - Update to latest minor versions
- `pnpm deps:update:patch` - Update to latest patch versions
- `pnpm deps:update:latest` - Update to latest versions

**Breaking Changes:**

- All ESLint warnings are now errors - code must pass stricter quality checks
- Pre-commit hook includes additional checks (dead code, duplication) - may take slightly longer

All quality checks are now performed using native ecosystem tools with zero external platform dependencies.
