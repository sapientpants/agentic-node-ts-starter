---
'agentic-node-ts-starter': patch
---

fix: resolve file rotation test race condition in CI

- Create unique test directories for each test iteration to avoid conflicts
- Add configurable timeout for file operations in CI environments
- Implement proper cleanup with error handling using try-finally blocks
- Remove console statement to comply with linting rules

This fixes the intermittent ENOENT errors when pino-roll tries to access
rotation files that may have been cleaned up by concurrent tests.
