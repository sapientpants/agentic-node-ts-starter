---
'agentic-node-ts-starter': patch
---

fix: consolidate release workflow to support private packages with SBOM generation

- Configure changesets to support tagging private packages via privatePackages config
- Consolidate all release logic into single workflow to avoid token triggering issues
- Detect version changes after PR merge and generate release assets
- Create GitHub releases with SBOM for every version change
- Generate build provenance and SBOM attestations for all releases
- Add documentation for future npm publishing requirements

This fixes the issue where private packages don't trigger the publish flow, ensuring that every release includes supply chain transparency artifacts. The consolidated workflow approach avoids GitHub's restriction on workflow cascading when using GITHUB_TOKEN.
