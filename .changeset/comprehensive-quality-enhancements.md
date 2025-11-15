---
'agentic-node-ts-starter': minor
---

feat: comprehensive quality tooling enhancement - add 20+ new quality tools

This major enhancement adds best-in-class quality tooling across all dimensions:

**ESLint Enhancements (6 new plugins):**

- eslint-plugin-sonarjs: Advanced bug detection and code quality analysis
- eslint-plugin-security: Security-focused linting (eval, regex, injection detection)
- eslint-plugin-n: Node.js best practices and deprecated API detection
- @eslint-community/eslint-plugin-eslint-comments: ESLint directive validation
- eslint-plugin-regexp: Advanced regex validation and optimization
- eslint-plugin-jsdoc: JSDoc/TSDoc documentation quality enforcement

**Package Publishing & Validation:**

- publint: Package.json validation for npm publishing
- @arethetypeswrong/cli: TypeScript exports validation
- ts-prune: Unused TypeScript exports detection (complements Knip)

**Documentation Tools:**

- TypeDoc: Automated API documentation generation
- @microsoft/api-extractor: API surface analysis and .d.ts rollup generation

**Secret Scanning:**

- Gitleaks integration with configuration (.gitleaks.toml, .gitleaksignore)
- Scripts for scan/protect/history/report modes (scripts/scan-secrets.sh)

**Advanced Dependency Analysis:**

- dependency-cruiser: Architectural dependency rules and validation
- depcheck: Alternative unused dependency detection

**License Compliance:**

- license-checker: Dependency license auditing and reporting

**Developer Experience:**

- commitizen + cz-conventional-changelog: Interactive conventional commits
- validate-branch-name: Branch naming convention enforcement
- @vitest/ui: Visual test interface

**Performance & Size Monitoring:**

- size-limit: Bundle size tracking and enforcement
- autocannon: HTTP benchmarking and performance baselines

**Configuration Files Added:**

- typedoc.json: TypeDoc configuration
- api-extractor.json: API Extractor configuration
- .gitleaks.toml: Secret scanning rules
- .gitleaksignore: Secret scanning allowlist
- .dependency-cruiser.js: Dependency validation rules
- .validate-branch-namerc.json: Branch naming rules
- .size-limit.json: Bundle size limits

**Documentation Updates:**

- Comprehensive AGENTS.md updates with all new tools documented
- Command reference for 30+ new npm scripts
- Integration guidance for each tool category

**Precommit Integration:**
All new quality tools integrated into optimized precommit workflow (15 checks total):

- Added dependency-cruiser architectural validation
- Added depcheck unused dependency detection
- Added ts-prune TypeScript export analysis
- Tools run in fail-fast order: security → formatting → linting → analysis → tests
- Performance-intensive tools (mutation testing, secrets scanning, size limits) excluded by design

**Impact:**

- ESLint coverage expanded from 6 to 12 plugins
- Precommit checks expanded from 11 to 15 steps
- Security scanning enhanced (static + secrets + container)
- Developer experience significantly improved
- Documentation generation automated
- Performance monitoring capabilities added
- License compliance tracking enabled
- Dependency analysis enhanced (3 complementary tools)

This positions the starter as truly best-in-class for TypeScript/Node.js projects.
