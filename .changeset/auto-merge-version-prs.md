---
'agentic-node-ts-starter': minor
---

feat: add automatic merging of version PRs for fully automated releases

- Add auto-merge workflow that enables auto-merge for changesets version PRs
- Eliminate manual intervention in the release process
- Document repository settings required for automation
- Update README and CONTRIBUTING with complete automation instructions

This completes the release automation by automatically merging version PRs when CI passes, making the entire release process hands-free. Once a PR with changesets is merged, the version PR is created, auto-merge is enabled, and when CI passes, it merges automatically, triggering the release with SBOM generation.
