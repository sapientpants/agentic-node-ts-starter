---
'agentic-node-ts-starter': minor
---

feat: enhance release workflow with SBOM attestations and conditional NPM publishing

- Enable native GitHub releases via changesets/action with `createGithubReleases: true`
- Add SBOM generation and attachment to GitHub releases
- Create build provenance and SBOM attestations for release artifacts
- Add conditional NPM publishing that checks for NPM_TOKEN availability
- Remove deprecated `actions/create-release@v1` action
- Improve supply chain security with verifiable attestations
- Log informative messages when NPM publishing is skipped

This provides a complete CD pipeline with supply chain transparency while maintaining flexibility for both private and public package scenarios.
