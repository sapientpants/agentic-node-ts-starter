---
'agentic-node-ts-starter': minor
---

feat: add JSON linting with eslint-plugin-jsonc

- Integrate eslint-plugin-jsonc for comprehensive JSON/JSONC/JSON5 linting
- Configure specific rules for package.json (key ordering) and tsconfig files (allow comments)
- Add JSON files to lint-staged for automatic formatting on commit
- Exclude auto-generated files (sbom.cdx.json) from linting
- Enforce consistent JSON formatting: 2-space indentation, double quotes, proper key spacing
