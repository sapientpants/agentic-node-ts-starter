---
'agentic-node-ts-starter': patch
---

fix: check PR title instead of actor for auto-merge workflow

The auto-merge workflow was checking `github.actor` which is the user who triggers the workflow (including when pushing updates to the PR), not the PR author. Changed to check the PR title directly in the job condition, which is more reliable and works regardless of who triggers the workflow.
