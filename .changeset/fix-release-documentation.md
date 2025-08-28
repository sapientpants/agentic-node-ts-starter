---
'agentic-node-ts-starter': patch
---

Fix release documentation to reflect automated Changesets workflow

- Updated `.claude/commands/release.md` to accurately describe the automated release process
- Removed outdated manual version bumping and changelog editing instructions
- Emphasized PR-only workflow (no direct pushes to main)
- Added proper troubleshooting steps for the automated workflow
- Clarified that releases are fully automated via GitHub Actions when changesets are merged
