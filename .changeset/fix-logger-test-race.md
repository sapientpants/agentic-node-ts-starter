---
'agentic-node-ts-starter': patch
---

fix: resolve race condition in logger-output tests

- Fixed intermittent test failures that were causing CI/CD pipeline issues
- Tests now use explicit file paths to prevent conflicts
- Increased cleanup delay for async operations to complete properly
