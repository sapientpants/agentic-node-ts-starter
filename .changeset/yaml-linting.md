---
'agentic-node-ts-starter': minor
---

feat: add YAML linting with yaml-lint

Integrate yaml-lint package for comprehensive YAML validation across the codebase. Configure appropriate exclusions for node_modules, GitHub workflows (already handled by actionlint), and auto-generated lock files. Add lint:yaml npm script and integrate with lint-staged for automatic validation on commit. Create .yamllintignore and .yaml-lint.yml configuration files using FAILSAFE_SCHEMA for maximum compatibility.
