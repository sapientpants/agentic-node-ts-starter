---
'agentic-node-ts-starter': minor
---

feat: add actionlint for GitHub Actions workflow validation

- Add actionlint wrapper script to check for workflow installation
- Integrate actionlint into precommit validation process
- Add actionlint job to PR workflow for CI validation
- Add configuration file for customizing actionlint rules
- Ensure workflow files are validated both locally and in CI

This helps catch workflow errors early, including:

- Syntax errors in YAML
- Undefined outputs and secrets
- Incorrect action inputs
- Shell script issues via shellcheck integration
- Best practice violations
