---
'agentic-node-ts-starter': patch
---

Fix Husky pre-commit hook configuration and rename scripts for clarity

- Fixed missing shebang line in `.husky/pre-commit` hook
- Renamed `verify` script to `precommit` to better indicate its purpose
- Created `verify` as an alias to `precommit` for backwards compatibility
- Renamed old `precommit` script to `lint-staged` for clarity
- Updated documentation to reflect that pre-commit runs ALL checks
- Pre-commit hook now correctly runs comprehensive checks on every commit
