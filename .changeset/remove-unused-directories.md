---
'agentic-node-ts-starter': minor
---

Remove unused directories and add spec-feature command

- Removed `artifacts/` directory (unused)
- Removed `openapi/` directory (unused)
- Removed `specs/` directory (replaced with GitHub issues)
- Added `/spec-feature` Claude command to create Gherkin specs as GitHub issues
- Specs are now managed as GitHub issues instead of filesystem
- Issues created are ready for `/implement-github-issue` command
- Updated all documentation to reflect new workflow
- Maintains spec-first approach without filesystem clutter
