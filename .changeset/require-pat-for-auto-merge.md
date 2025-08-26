---
'agentic-node-ts-starter': patch
---

Make auto-merge workflow fail explicitly when PAT is not configured

- Add validation step to check for AUTO_MERGE_PAT secret
- Fail the workflow with clear error messages when PAT is missing
- Remove silent fallback to GITHUB_TOKEN which doesn't work
- Update success comment to confirm auto-merge is enabled
- This ensures proper configuration is in place before attempting auto-merge
