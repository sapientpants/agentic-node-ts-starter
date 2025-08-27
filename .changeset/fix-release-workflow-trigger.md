---
'agentic-node-ts-starter': patch
---

Fix publish workflow not triggering after releases

- Updated main.yml to use RELEASE_TOKEN instead of GITHUB_TOKEN for release creation
- This fixes the issue where the publish workflow wasn't triggered due to GitHub's security feature that prevents workflows triggered by GITHUB_TOKEN from triggering other workflows
- Added comprehensive documentation about PAT requirements in WORKFLOWS.md
- The workflow now falls back to GITHUB_TOKEN if RELEASE_TOKEN is not configured
