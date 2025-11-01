---
'agentic-node-ts-starter': patch
---

fix: resolve all 23 open SonarQube code quality issues

- Use node: prefix for built-in module imports (fs, path, net)
- Replace parseInt/parseFloat with Number.parseInt/parseFloat
- Replace isNaN with Number.isNaN
- Use String.raw for Windows path literals with backslashes
- Replace forEach with for...of loops for better performance
- Refactor nested template literals to improve readability
- Use TypeError instead of generic Error for type validation
- Use RangeError for range validation
- Use RegExp.exec() instead of String.match()
- Use optional chaining to simplify null checks
- Use export...from syntax for re-exporting types
- Add explicit assertions to property-based tests
- Refactor formatZodError to reduce complexity and statement count

All 185 tests passing with 94.92% code coverage.
