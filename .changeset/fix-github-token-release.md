---
'agentic-node-ts-starter': patch
---

Fix GITHUB_TOKEN secret reference in release creation workflow

- Changed `secrets.github-token` to `secrets.GITHUB_TOKEN` in the Create GitHub Release step
- This ensures the release is created with proper permissions to trigger subsequent workflows
- Also reorganized YAML properties for better readability (moved release flags before files list)
