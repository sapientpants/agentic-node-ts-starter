---
'agentic-node-ts-starter': patch
---

fix: skip actionlint in CI when not installed during release

- Skip actionlint validation in CI environments when not installed
- Workflows are already validated during PR checks, no need to re-validate
- Prevents release workflow failures while maintaining local development checks
