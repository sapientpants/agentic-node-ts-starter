---
'agentic-node-ts-starter': patch
---

chore: code review quick wins - documentation and enhanced quality thresholds

**Code Quality Improvements:**

- Add ESLint override for script files to disable no-console warnings (15 warnings eliminated)
- Add comprehensive JSDoc documentation to logger exports (switchLogOutput, getLoggerOutputMode)
- Extract magic numbers to named constants in logger-validation.ts and health.example.ts

**Quality Threshold Enhancements:**

- Set code duplication threshold to 0% (zero tolerance for duplication)
- Increase test coverage thresholds: branches 84%, functions/lines/statements 90%
- Add cspell for automated spell checking with custom technical dictionary
- Add markdown reporter to jscpd for better documentation

These changes improve code maintainability, eliminate linting warnings, and enforce stricter quality standards without changing functionality.
