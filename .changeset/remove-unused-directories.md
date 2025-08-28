---
'agentic-node-ts-starter': minor
---

Refactor project structure and enhance Claude Code integration

## Removed Unused Directories

- Removed `artifacts/` directory (unused)
- Removed `openapi/` directory (unused)
- Removed `specs/` directory (replaced with GitHub issues)

## Claude Command Improvements

- Added `/spec-feature` command to create Gherkin specs as GitHub issues
- Enhanced `/implement-github-issue` command with comprehensive workflow
- Removed deprecated `/analyze-and-fix-github-issue` command
- Removed deprecated `/release` command (superseded by automated Changesets)

## Documentation Refactoring

- Moved global coding standards from commands to `CLAUDE.md`
- Added comprehensive testing patterns and troubleshooting guides to `CLAUDE.md`
- Updated `PROCESS.md` to reflect GitHub issue-based specifications
- Updated `README.md` with correct workflow references
- Fixed `CONTRIBUTING.md` references

## Workflow Improvements

- Specs now managed as GitHub issues instead of filesystem
- Issues created with `/spec-feature` are ready for `/implement-github-issue`
- Maintains spec-first approach without filesystem clutter
- Clearer separation between project-wide guidelines and command-specific instructions
