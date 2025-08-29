---
'agentic-node-ts-starter': minor
---

feat: add markdown linting with markdownlint-cli2

- Integrate markdownlint-cli2 for comprehensive markdown validation
- Configure sensible markdown rules with flexibility for documentation needs
- Add markdown linting to npm scripts (lint:markdown and lint:markdown:fix)
- Integrate with lint-staged for automatic markdown formatting on commit
- Include markdown linting in precommit validation pipeline
- Create .markdownlintignore for excluding generated files
- Fix duplicate heading in README.md to comply with linting rules
