---
'agentic-node-ts-starter': patch
---

fix: resolve SonarQube issues

Fixed 18 SonarQube issues to improve code quality:

- Fixed 2 MINOR issues: Updated deprecated Zod methods (uuid and email) with proper options
- Fixed 1 MAJOR issue: Marked startTime field as readonly in PerformanceTimer class
- Excluded test template files from SonarQube analysis (15 BLOCKER false positives)

The template files are intentionally incomplete examples and should not be analyzed for test assertions.
