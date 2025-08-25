---
'agentic-node-ts-starter': patch
---

fix: include actual CHANGELOG content in GitHub release body

- Extract changelog content for the specific version being released
- Include the actual changes in the GitHub release body instead of just linking to CHANGELOG.md
- Users can now see what changed directly in the GitHub release without clicking through
- Maintains link to full CHANGELOG for historical reference

This improves the user experience by showing the actual changes for each release directly in the GitHub release page.
