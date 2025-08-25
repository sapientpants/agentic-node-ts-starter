---
'agentic-node-ts-starter': patch
---

fix: update auto-merge workflow to recognize changesets PR author

The auto-merge workflow was checking for `github-actions[bot]` but changesets creates PRs with `app/github-actions` as the author. Updated the condition to check for both formats.
