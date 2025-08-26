---
'agentic-node-ts-starter': patch
---

fix: adapt CD workflow to use PR approach for version updates

Due to repository rules requiring all changes to main go through PRs,
the CD workflow now:

- Creates a release branch with version updates
- Opens a PR with auto-merge enabled
- Waits for the PR to merge before creating release tags

This maintains the automated release flow while respecting branch protection rules.
