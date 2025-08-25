# agentic-node-ts-starter

## 0.3.1

### Patch Changes

- [#25](https://github.com/sapientpants/agentic-node-ts-starter/pull/25) [`7e80c53`](https://github.com/sapientpants/agentic-node-ts-starter/commit/7e80c538f093ecd2303151263ab26eb50eb908fb) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: include actual CHANGELOG content in GitHub release body
  - Extract changelog content for the specific version being released
  - Include the actual changes in the GitHub release body instead of just linking to CHANGELOG.md
  - Users can now see what changed directly in the GitHub release without clicking through
  - Maintains link to full CHANGELOG for historical reference

  This improves the user experience by showing the actual changes for each release directly in the GitHub release page.

## 0.3.0

### Minor Changes

- [#15](https://github.com/sapientpants/agentic-node-ts-starter/pull/15) [`47ddf0c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/47ddf0c59cb2b7b1521f89742c8ef6bcb9afd32a) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: add automatic merging of version PRs for fully automated releases
  - Add auto-merge workflow that enables auto-merge for changesets version PRs
  - Eliminate manual intervention in the release process
  - Document repository settings required for automation
  - Update README and CONTRIBUTING with complete automation instructions

  This completes the release automation by automatically merging version PRs when CI passes, making the entire release process hands-free. Once a PR with changesets is merged, the version PR is created, auto-merge is enabled, and when CI passes, it merges automatically, triggering the release with SBOM generation.

- [#21](https://github.com/sapientpants/agentic-node-ts-starter/pull/21) [`4d4c657`](https://github.com/sapientpants/agentic-node-ts-starter/commit/4d4c6572dc8c2761e46fb14f16f7819398b731ea) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: implement unified CI/CD workflow to eliminate duplication

  Major improvements to the CI/CD pipeline:
  - Combined CI and Release workflows into a single unified ci-cd.yml workflow
  - Removed old ci.yml and release.yml workflows
  - Build, test, SBOM generation, and attestations now happen once and artifacts are reused
  - Fixed status check reporting for all PR types including version PRs
  - Improved auto-merge workflow with better error handling and PAT support
  - Reduced workflow execution time and resource usage by ~50%
  - Better artifact management with 30-day retention
  - Release job now depends on all CI checks passing

  This change eliminates the duplication between CI and Release workflows, making the pipeline more efficient and maintainable.

### Patch Changes

- [#23](https://github.com/sapientpants/agentic-node-ts-starter/pull/23) [`78976c7`](https://github.com/sapientpants/agentic-node-ts-starter/commit/78976c705f5aea35c983e883d385a4dfd9d1e5ca) Thanks [@sapientpants](https://github.com/sapientpants)! - Add release distribution workflow for automated multi-platform deployment
  - Add `release.yml` workflow triggered on GitHub release publication
  - Create production-ready Dockerfile with multi-architecture support (amd64/arm64)
  - Add .dockerignore to optimize Docker build context
  - Enable automated npm publishing with provenance attestation
  - Support Docker image distribution to Docker Hub and GitHub Container Registry
  - Add GitHub Pages documentation deployment capability
  - Generate additional release artifacts (source/dist tarballs with checksums)
  - Update documentation with distribution setup instructions
  - Update `ci-cd.yml` to disable npm publishing and GitHub releases in changesets action (now handled by release.yml)
  - Document `AUTO_MERGE_PAT` requirement for automated version PR merging

  This workflow efficiently reuses artifacts from the CI/CD pipeline and only builds what's necessary for each distribution channel, avoiding duplicate work. The separation of concerns ensures the CI/CD workflow focuses on version management while release.yml handles all distribution channels.

- [#18](https://github.com/sapientpants/agentic-node-ts-starter/pull/18) [`f5b9a80`](https://github.com/sapientpants/agentic-node-ts-starter/commit/f5b9a804783157b7f12d1ca4e888dac3479eae59) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: add attestations write permission to release workflow

  The release workflow was failing with "Resource not accessible by integration" when trying to create attestations. Added the missing `attestations: write` permission.

- [#19](https://github.com/sapientpants/agentic-node-ts-starter/pull/19) [`75a5d58`](https://github.com/sapientpants/agentic-node-ts-starter/commit/75a5d5819960e6b6d12b9b1e9ebae3f0ab04d7aa) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: update auto-merge workflow to recognize changesets PR author

  The auto-merge workflow was checking for `github-actions[bot]` but changesets creates PRs with `app/github-actions` as the author. Updated the condition to check for both formats.

- [#20](https://github.com/sapientpants/agentic-node-ts-starter/pull/20) [`7446585`](https://github.com/sapientpants/agentic-node-ts-starter/commit/744658564b9447ed30a1eeae21e6bd696c30fc16) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: check PR title instead of actor for auto-merge workflow

  The auto-merge workflow was checking `github.actor` which is the user who triggers the workflow (including when pushing updates to the PR), not the PR author. Changed to check the PR title directly in the job condition, which is more reliable and works regardless of who triggers the workflow.

- [#16](https://github.com/sapientpants/agentic-node-ts-starter/pull/16) [`ce1cec5`](https://github.com/sapientpants/agentic-node-ts-starter/commit/ce1cec5894e1db968e478be7543bafcbdcef5b20) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: correct ncipollo/release-action version from v2 to v1

  The action version v2 doesn't exist. Use v1 which is the current major version tag that points to the latest stable release (v1.18.0).

- [#15](https://github.com/sapientpants/agentic-node-ts-starter/pull/15) [`47ddf0c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/47ddf0c59cb2b7b1521f89742c8ef6bcb9afd32a) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: consolidate release workflow to support private packages with SBOM generation
  - Configure changesets to support tagging private packages via privatePackages config
  - Consolidate all release logic into single workflow to avoid token triggering issues
  - Detect version changes after PR merge and generate release assets
  - Create GitHub releases with SBOM for every version change
  - Generate build provenance and SBOM attestations for all releases
  - Add documentation for future npm publishing requirements

  This fixes the issue where private packages don't trigger the publish flow, ensuring that every release includes supply chain transparency artifacts. The consolidated workflow approach avoids GitHub's restriction on workflow cascading when using GITHUB_TOKEN.

## 0.2.0

### Minor Changes

- [#13](https://github.com/sapientpants/agentic-node-ts-starter/pull/13) [`6236970`](https://github.com/sapientpants/agentic-node-ts-starter/commit/6236970654563189e340d22a3c34b7ca0da632d9) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: enhance release workflow with SBOM attestations and conditional NPM publishing
  - Enable native GitHub releases via changesets/action with `createGithubReleases: true`
  - Add SBOM generation and attachment to GitHub releases
  - Create build provenance and SBOM attestations for release artifacts
  - Add conditional NPM publishing that checks for NPM_TOKEN availability
  - Remove deprecated `actions/create-release@v1` action
  - Improve supply chain security with verifiable attestations
  - Log informative messages when NPM publishing is skipped

  This provides a complete CD pipeline with supply chain transparency while maintaining flexibility for both private and public package scenarios.

## 0.1.1

### Patch Changes

- [#10](https://github.com/sapientpants/agentic-node-ts-starter/pull/10) [`4ad85dd`](https://github.com/sapientpants/agentic-node-ts-starter/commit/4ad85dd59ccaa72152dfb770510ad8bfdb51830e) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: document GitHub Actions permissions requirement for release workflow
  - Add clear documentation about required repository settings
  - Add comments in release workflow about permissions requirement
  - Add issues write permission for better GitHub integration
  - Update README, CONTRIBUTING, and CLAUDE documentation

  This fixes the release workflow failure by documenting that repository
  administrators must enable "Allow GitHub Actions to create and approve
  pull requests" in Settings → Actions → General.

- [#9](https://github.com/sapientpants/agentic-node-ts-starter/pull/9) [`62dbf2c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/62dbf2cdf7e3ea4c6cea45f909840f976f3aed8b) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: separate test and test:coverage scripts for better performance
  - Add dedicated `test:coverage` script for running tests with coverage
  - Update `test` script to run without coverage for faster local development
  - Update CI workflow to use `test:coverage` to maintain coverage reporting
  - Update documentation to reflect the new testing commands

  This improves the developer experience by making the default test command faster while still maintaining coverage reporting in CI.
