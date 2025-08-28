---
'agentic-node-ts-starter': minor
---

feat: enforce minimum test coverage thresholds at 80%

- Added coverage thresholds to Vitest configuration (80% for lines, branches, functions, statements)
- Configured proper coverage exclusions for non-source files
- Added json-summary reporter for better CI integration
- Updated documentation to reflect coverage requirements
- CI/CD pipeline now enforces coverage thresholds on all PRs
- Tests will fail locally and in CI if coverage drops below 80%

This ensures code quality is maintained through quantitative metrics and supports the project's test-as-contract philosophy.

Closes #64
