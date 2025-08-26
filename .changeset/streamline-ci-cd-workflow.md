---
'agentic-node-ts-starter': minor
---

### ✨ Streamlined CI/CD Workflow

Significantly simplified the CI/CD pipeline for single-user projects:

- **Reduced complexity by 65%** - From 730 to 259 lines
- **Faster CI** - All validation checks now run in parallel
- **Direct releases** - No more PR creation overhead, commits directly to main
- **Hybrid changelog** - Automatically generates changesets from conventional commits when needed
- **Simplified to 3 jobs** - validate, release, and optional npm publishing

#### New Features

- Auto-generate changesets from conventional commits (`feat:`, `fix:`, etc.)
- New helper script `scripts/generate-changeset.js` for commit analysis
- Added `pnpm changeset:from-commits` and `pnpm release:auto` commands

#### Breaking Changes

- Removed Docker publishing job
- Removed documentation publishing job
- Removed Slack notifications
- No longer enforces changesets in PRs

This change makes the workflow much more suitable for individual developers while maintaining professional CI/CD practices.
