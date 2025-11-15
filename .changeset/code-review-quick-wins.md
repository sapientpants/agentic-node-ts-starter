---
'agentic-node-ts-starter': patch
---

chore: code review quick wins - documentation and code quality improvements

- Add ESLint override for script files to disable no-console warnings (15 warnings eliminated)
- Add comprehensive JSDoc documentation to logger exports (switchLogOutput, getLoggerOutputMode)
- Extract magic numbers to named constants in logger-validation.ts and health.example.ts

These changes improve code maintainability and eliminate linting warnings without changing functionality.
