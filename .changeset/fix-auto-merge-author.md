---
'agentic-node-ts-starter': patch
---

Fix auto-merge workflow to recognize app/github-actions author

- GitHub Actions can appear as 'app/github-actions' when using the default token
- Add this as valid author for version PRs created by changesets
- This fixes auto-merge not triggering for version PRs
