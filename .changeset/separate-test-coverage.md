---
'agentic-node-ts-starter': patch
---

feat: separate test and test:coverage scripts for better performance

- Add dedicated `test:coverage` script for running tests with coverage
- Update `test` script to run without coverage for faster local development
- Update CI workflow to use `test:coverage` to maintain coverage reporting
- Update documentation to reflect the new testing commands

This improves the developer experience by making the default test command faster while still maintaining coverage reporting in CI.
