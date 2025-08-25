---
'agentic-node-ts-starter': patch
---

fix: enable SBOM generation and GitHub releases for private packages

- Configure changesets to create tags for private packages via privatePackages config
- Add tag creation logic in release workflow for private package version changes
- Create separate release-assets workflow that triggers on tag push
- Generate and attach SBOM to GitHub releases when tags are created
- Create build provenance and SBOM attestations for all releases

This fixes the issue where private packages don't trigger the publish flow, ensuring that every release includes supply chain transparency artifacts.
