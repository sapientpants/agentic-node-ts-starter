---
'agentic-node-ts-starter': minor
---

feat: add YAML linting with yaml-lint

- Integrate yaml-lint for comprehensive YAML validation
- Configure to exclude node_modules, GitHub workflows (handled by actionlint), and lock files
- Add lint:yaml npm script for checking YAML files
- Integrate with lint-staged for automatic YAML validation on commit
- Include YAML linting in precommit validation pipeline
- Create .yamllintignore and .yaml-lint.yml configuration files
- Ensure consistent and valid YAML syntax across the codebase
