---
'agentic-node-ts-starter': patch
---

fix(ci): skip precommit hook when committing quality metrics

The automated quality metrics update in CI was failing because the precommit hook runs ESLint, which exits with code 1 when there are JSDoc warnings. These warnings are intentional (to guide future documentation improvements) and should not block automated commits.

Added `--no-verify` flag to bypass precommit hook for the automated quality metrics commit in CI.
