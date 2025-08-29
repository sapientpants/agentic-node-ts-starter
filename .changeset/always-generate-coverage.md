---
'agentic-node-ts-starter': patch
---

ci: always generate test coverage in validation workflow

- Remove conditional coverage generation
- Always run tests with coverage in CI for better visibility
- Upload coverage artifacts for all builds
- Ensure SonarQube always receives coverage data
