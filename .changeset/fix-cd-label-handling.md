---
'agentic-node-ts-starter': patch
---

fix: handle missing labels gracefully in CD workflow

The CD workflow now creates PRs without failing if labels don't exist.
Labels are added after PR creation if they exist, but their absence
won't cause the workflow to fail.
