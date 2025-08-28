# agentic-node-ts-starter

## 0.12.0

### Minor Changes

- [#76](https://github.com/sapientpants/agentic-node-ts-starter/pull/76) [`7c46ed5`](https://github.com/sapientpants/agentic-node-ts-starter/commit/7c46ed53a0c937b8ad020c0c71b5ed1610efb7b1) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: Enhance documentation and onboarding experience for AI coding agents
  - Added comprehensive GETTING_STARTED.md with step-by-step customization checklist
  - Created detailed TROUBLESHOOTING.md with common issues and solutions
  - Updated README with clear navigation to all documentation guides and GitHub requirement
  - Clarified that GitHub is required for CI/CD workflows in prerequisites
  - Fixed CLAUDE.md changeset documentation to show proper non-interactive usage
  - Added documentation validation tests to ensure consistency and prevent drift
  - Improved clarity for non-mise users with alternative setup instructions
  - Focused all documentation on scriptable, automation-friendly workflows for AI agents

## 0.11.0

### Minor Changes

- [`bf07182`](https://github.com/sapientpants/agentic-node-ts-starter/commit/bf07182267eacd786af9fa636ad86e63fe169573) Thanks [@sapientpants](https://github.com/sapientpants)! - Improve OSV vulnerability scanner integration with official Google actions
  - Replace custom OSV scanner implementation with Google's official GitHub Actions
  - Use specialized `osv-scanner-reusable-pr.yml` workflow for pull requests (v2.2.2)
  - Use standard `osv-scanner-reusable.yml` workflow for main branch scanning (v2.2.1)
  - Split security scanning into separate CodeQL and vulnerability jobs for better visibility
  - Add security scanning to main branch workflow for pre-release validation
  - Fix permissions for vulnerability scanning in main workflow

  This change improves security scanning reliability by using Google's maintained OSV Scanner actions, which provide better compatibility, automatic updates, and optimized PR-specific scanning capabilities.

## 0.10.0

### Minor Changes

- [#74](https://github.com/sapientpants/agentic-node-ts-starter/pull/74) [`b10aa51`](https://github.com/sapientpants/agentic-node-ts-starter/commit/b10aa51a8f5dafe3d9b7b7c2b967f9f1dc0ed054) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: Add container image security scanning to CI/CD pipeline
  - Integrated Trivy scanner for vulnerability detection in Docker images
  - Added automatic scanning before Docker Hub publication
  - Configured SARIF output for GitHub Security tab integration
  - Created local scanning script for developer testing
  - Implemented configurable severity thresholds (default: HIGH/CRITICAL)
  - Added `.trivyignore` file for false positive exclusions
  - Included scan result caching for performance optimization
  - Generated attestations for clean scans
  - Added comprehensive test coverage for scanning functionality

  This enhancement completes the security supply chain by providing end-to-end security coverage from source code to deployed artifacts, enabling early detection of vulnerabilities in base images and dependencies.

## 0.9.0

### Minor Changes

- [#73](https://github.com/sapientpants/agentic-node-ts-starter/pull/73) [`17eb13a`](https://github.com/sapientpants/agentic-node-ts-starter/commit/17eb13ac251e53060215f0ddb7d4fb396264805e) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: add structured logging with Pino

  Implements structured logging foundation with Pino logger:
  - Environment-based configuration (development, production, test)
  - Automatic sensitive data redaction for security
  - Child logger creation for module-specific logging with proper method preservation
  - Pretty-print formatting in development, JSON in production
  - OpenTelemetry integration placeholders with documented migration path
  - Comprehensive test coverage (100%) for all logger functionality
  - Fixed withContext method preservation on child loggers (addresses PR feedback)

  Documentation:
  - Added usage examples and configuration guide to README.md
  - Created Architecture Decision Record (ADR) for logging choice
  - Added logging guidelines to CONTRIBUTING.md
  - Created OBSERVABILITY.md with OpenTelemetry roadmap
  - Enhanced inline documentation with implementation examples

  Closes #66

## 0.8.0

### Minor Changes

- [#65](https://github.com/sapientpants/agentic-node-ts-starter/pull/65) [`531ca40`](https://github.com/sapientpants/agentic-node-ts-starter/commit/531ca40a7c05589c4073d489ba9505577e8965a0) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: enforce minimum test coverage thresholds at 80%
  - Added coverage thresholds to Vitest configuration (80% for lines, branches, functions, statements)
  - Configured proper coverage exclusions for non-source files
  - Added json-summary reporter for better CI integration
  - Updated documentation to reflect coverage requirements
  - CI/CD pipeline now enforces coverage thresholds on all PRs
  - Tests will fail locally and in CI if coverage drops below 80%

  This ensures code quality is maintained through quantitative metrics and supports the project's test-as-contract philosophy.

  Closes #64

## 0.7.0

### Minor Changes

- [#62](https://github.com/sapientpants/agentic-node-ts-starter/pull/62) [`b668240`](https://github.com/sapientpants/agentic-node-ts-starter/commit/b668240dfb59c793179957e03ab0615bf67f58b1) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: Enable TypeScript ESLint rules requiring type information
  - Added TypeScript ESLint type-aware rules (@typescript-eslint/recommended-type-checked)
  - Configured ESLint to use TypeScript compiler for enhanced type checking
  - Type-aware rules now catch floating promises, unsafe type assertions, and other subtle type-safety issues
  - Rules apply to src/**/\*.ts and tests/**/\*.ts files
  - Minimal performance impact (~1.5s for full project lint)
  - Improved code quality and runtime safety through compile-time checks

  Closes #61

## 0.6.0

### Minor Changes

- [#60](https://github.com/sapientpants/agentic-node-ts-starter/pull/60) [`c935b3c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/c935b3cfa8b53460b10a214b7cded91f3e22f03e) Thanks [@sapientpants](https://github.com/sapientpants)! - Refactor project structure and enhance Claude Code integration

  ## Removed Unused Directories
  - Removed `artifacts/` directory (unused)
  - Removed `openapi/` directory (unused)
  - Removed `specs/` directory (replaced with GitHub issues)

  ## Claude Command Improvements
  - Added `/spec-feature` command to create Gherkin specs as GitHub issues
  - Enhanced `/implement-github-issue` command with comprehensive workflow
  - Removed deprecated `/analyze-and-fix-github-issue` command
  - Removed deprecated `/release` command (superseded by automated Changesets)

  ## Documentation Refactoring
  - Moved global coding standards from commands to `CLAUDE.md`
  - Added comprehensive testing patterns and troubleshooting guides to `CLAUDE.md`
  - Updated `PROCESS.md` to reflect GitHub issue-based specifications
  - Updated `README.md` with correct workflow references
  - Fixed `CONTRIBUTING.md` references

  ## Workflow Improvements
  - Specs now managed as GitHub issues instead of filesystem
  - Issues created with `/spec-feature` are ready for `/implement-github-issue`
  - Maintains spec-first approach without filesystem clutter
  - Clearer separation between project-wide guidelines and command-specific instructions

## 0.5.10

### Patch Changes

- [#59](https://github.com/sapientpants/agentic-node-ts-starter/pull/59) [`be7fa33`](https://github.com/sapientpants/agentic-node-ts-starter/commit/be7fa335ce96f76f540875d5b1b7c00410c92621) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix Husky pre-commit hook configuration and rename scripts for clarity
  - Fixed missing shebang line in `.husky/pre-commit` hook
  - Renamed `verify` script to `precommit` to better indicate its purpose
  - Created `verify` as an alias to `precommit` for backwards compatibility
  - Renamed old `precommit` script to `lint-staged` for clarity
  - Updated documentation to reflect that pre-commit runs ALL checks
  - Pre-commit hook now correctly runs comprehensive checks on every commit

## 0.5.9

### Patch Changes

- [#58](https://github.com/sapientpants/agentic-node-ts-starter/pull/58) [`c676b92`](https://github.com/sapientpants/agentic-node-ts-starter/commit/c676b92a39fbf2c2f63a443d669773b05229d4c5) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix version inconsistencies in documentation
  - Updated README.md to show pnpm 10.15.0 instead of 10.0.0
  - Updated Dockerfile to use pnpm 10.15.0 for consistency
  - Updated mise.toml to specify exact pnpm version 10.15.0
  - Ensures all configuration files and documentation reference the same tool versions

## 0.5.8

### Patch Changes

- [#57](https://github.com/sapientpants/agentic-node-ts-starter/pull/57) [`1edb9b9`](https://github.com/sapientpants/agentic-node-ts-starter/commit/1edb9b94ec89fc73f5a6af60fff0ae262e201d4c) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix release documentation to reflect automated Changesets workflow
  - Updated `.claude/commands/release.md` to accurately describe the automated release process
  - Removed outdated manual version bumping and changelog editing instructions
  - Emphasized PR-only workflow (no direct pushes to main)
  - Added proper troubleshooting steps for the automated workflow
  - Clarified that releases are fully automated via GitHub Actions when changesets are merged

## 0.5.7

### Patch Changes

- [#55](https://github.com/sapientpants/agentic-node-ts-starter/pull/55) [`edf6c4d`](https://github.com/sapientpants/agentic-node-ts-starter/commit/edf6c4d7bb174b7491ad0b68962e032d108ea77e) Thanks [@sapientpants](https://github.com/sapientpants)! - Update dependencies to latest versions
  - zod: 4.1.1 → 4.1.4
  - @typescript-eslint/eslint-plugin: 8.40.0 → 8.41.0
  - @typescript-eslint/parser: 8.40.0 → 8.41.0

- [#56](https://github.com/sapientpants/agentic-node-ts-starter/pull/56) [`adb4b3c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/adb4b3c4b920aa83445c64886be01dd393b991fe) Thanks [@sapientpants](https://github.com/sapientpants)! - Update pnpm package manager to version 10.15.0

## 0.5.6

### Patch Changes

- [#53](https://github.com/sapientpants/agentic-node-ts-starter/pull/53) [`b6abce1`](https://github.com/sapientpants/agentic-node-ts-starter/commit/b6abce1c0db13485bf91cfb8856ba958195a9738) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix duplicate workflow runs for release commits by adding [skip actions] tag

- [#54](https://github.com/sapientpants/agentic-node-ts-starter/pull/54) [`44f0a33`](https://github.com/sapientpants/agentic-node-ts-starter/commit/44f0a33d03fdb40623ddb1b81a805ab23a27112e) Thanks [@sapientpants](https://github.com/sapientpants)! - Update dependencies to latest versions
  - zod: 4.1.1 → 4.1.4
  - @typescript-eslint/eslint-plugin: 8.40.0 → 8.41.0
  - @typescript-eslint/parser: 8.40.0 → 8.41.0

## 0.5.5

### Patch Changes

- [#52](https://github.com/sapientpants/agentic-node-ts-starter/pull/52) [`5dbec56`](https://github.com/sapientpants/agentic-node-ts-starter/commit/5dbec56313cee920273ebf2cfea30b08551841f9) Thanks [@sapientpants](https://github.com/sapientpants)! - Optimize GitHub Actions workflows for better performance and maintainability
  - Extract reusable workflows for setup, validation, and security scanning
  - Parallelize PR validation jobs for ~50% faster feedback
  - Simplify publish workflow by removing unnecessary matrix strategy
  - Fix publish workflow to properly handle secrets in conditions
  - Reduce overall workflow code by ~25% through DRY principles

## 0.5.4

### Patch Changes

- [#47](https://github.com/sapientpants/agentic-node-ts-starter/pull/47) [`6500da9`](https://github.com/sapientpants/agentic-node-ts-starter/commit/6500da976100317b037ddac39bba06cd81de9657) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix GITHUB_TOKEN secret reference in release creation workflow
  - Changed `secrets.github-token` to `secrets.GITHUB_TOKEN` in the Create GitHub Release step
  - This ensures the release is created with proper permissions to trigger subsequent workflows
  - Also reorganized YAML properties for better readability (moved release flags before files list)

- [#48](https://github.com/sapientpants/agentic-node-ts-starter/pull/48) [`760d769`](https://github.com/sapientpants/agentic-node-ts-starter/commit/760d7696589fa7e23af11ab034d664ebca5d1bfd) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix publish workflow not triggering after releases
  - Updated main.yml to use RELEASE_TOKEN instead of GITHUB_TOKEN for release creation
  - This fixes the issue where the publish workflow wasn't triggered due to GitHub's security feature that prevents workflows triggered by GITHUB_TOKEN from triggering other workflows
  - Added comprehensive documentation about PAT requirements in WORKFLOWS.md
  - The workflow now falls back to GITHUB_TOKEN if RELEASE_TOKEN is not configured

- [#46](https://github.com/sapientpants/agentic-node-ts-starter/pull/46) [`bf61f04`](https://github.com/sapientpants/agentic-node-ts-starter/commit/bf61f0443cc50089eba8356e2783c201144106ff) Thanks [@sapientpants](https://github.com/sapientpants)! - refactor: split CI/CD workflow into reusable workflows
  - Created separate reusable workflows for CI validation and CD release/publishing
  - Simplified main workflow to orchestrate reusable components
  - Improved maintainability and modularity of GitHub Actions workflows
  - Centralized Node.js and pnpm version configuration using environment variables

## 0.5.3

### Patch Changes

- [#47](https://github.com/sapientpants/agentic-node-ts-starter/pull/47) [`6500da9`](https://github.com/sapientpants/agentic-node-ts-starter/commit/6500da976100317b037ddac39bba06cd81de9657) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix GITHUB_TOKEN secret reference in release creation workflow
  - Changed `secrets.github-token` to `secrets.GITHUB_TOKEN` in the Create GitHub Release step
  - This ensures the release is created with proper permissions to trigger subsequent workflows
  - Also reorganized YAML properties for better readability (moved release flags before files list)

- [#48](https://github.com/sapientpants/agentic-node-ts-starter/pull/48) [`760d769`](https://github.com/sapientpants/agentic-node-ts-starter/commit/760d7696589fa7e23af11ab034d664ebca5d1bfd) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix publish workflow not triggering after releases
  - Updated main.yml to use RELEASE_TOKEN instead of GITHUB_TOKEN for release creation
  - This fixes the issue where the publish workflow wasn't triggered due to GitHub's security feature that prevents workflows triggered by GITHUB_TOKEN from triggering other workflows
  - Added comprehensive documentation about PAT requirements in WORKFLOWS.md
  - The workflow now falls back to GITHUB_TOKEN if RELEASE_TOKEN is not configured

- [#46](https://github.com/sapientpants/agentic-node-ts-starter/pull/46) [`bf61f04`](https://github.com/sapientpants/agentic-node-ts-starter/commit/bf61f0443cc50089eba8356e2783c201144106ff) Thanks [@sapientpants](https://github.com/sapientpants)! - refactor: split CI/CD workflow into reusable workflows
  - Created separate reusable workflows for CI validation and CD release/publishing
  - Simplified main workflow to orchestrate reusable components
  - Improved maintainability and modularity of GitHub Actions workflows
  - Centralized Node.js and pnpm version configuration using environment variables

## 0.5.2

### Patch Changes

- [#47](https://github.com/sapientpants/agentic-node-ts-starter/pull/47) [`6500da9`](https://github.com/sapientpants/agentic-node-ts-starter/commit/6500da976100317b037ddac39bba06cd81de9657) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix GITHUB_TOKEN secret reference in release creation workflow
  - Changed `secrets.github-token` to `secrets.GITHUB_TOKEN` in the Create GitHub Release step
  - This ensures the release is created with proper permissions to trigger subsequent workflows
  - Also reorganized YAML properties for better readability (moved release flags before files list)

- [#46](https://github.com/sapientpants/agentic-node-ts-starter/pull/46) [`bf61f04`](https://github.com/sapientpants/agentic-node-ts-starter/commit/bf61f0443cc50089eba8356e2783c201144106ff) Thanks [@sapientpants](https://github.com/sapientpants)! - refactor: split CI/CD workflow into reusable workflows
  - Created separate reusable workflows for CI validation and CD release/publishing
  - Simplified main workflow to orchestrate reusable components
  - Improved maintainability and modularity of GitHub Actions workflows
  - Centralized Node.js and pnpm version configuration using environment variables

## 0.5.1

### Patch Changes

- [#46](https://github.com/sapientpants/agentic-node-ts-starter/pull/46) [`bf61f04`](https://github.com/sapientpants/agentic-node-ts-starter/commit/bf61f0443cc50089eba8356e2783c201144106ff) Thanks [@sapientpants](https://github.com/sapientpants)! - refactor: split CI/CD workflow into reusable workflows
  - Created separate reusable workflows for CI validation and CD release/publishing
  - Simplified main workflow to orchestrate reusable components
  - Improved maintainability and modularity of GitHub Actions workflows
  - Centralized Node.js and pnpm version configuration using environment variables

## 0.5.0

### Minor Changes

- [`fcba137`](https://github.com/sapientpants/agentic-node-ts-starter/commit/fcba137d80bb2feee5308f8f535b827298333dd1) Thanks [@sapientpants](https://github.com/sapientpants)! - ### ✨ Streamlined CI/CD Workflow

  Significantly simplified the CI/CD pipeline for single-user projects:
  - **Reduced complexity by 65%** - From 730 to 259 lines
  - **Faster CI** - All validation checks now run in parallel
  - **Direct releases** - No more PR creation overhead, commits directly to main
  - **Hybrid changelog** - Automatically generates changesets from conventional commits when needed
  - **Simplified to 3 jobs** - validate, release, and optional npm publishing

  #### New Features
  - Auto-generate changesets from conventional commits (`feat:`, `fix:`, etc.)
  - New helper script `scripts/generate-changeset.js` for commit analysis
  - Added `pnpm changeset:from-commits` and `pnpm release:auto` commands

  #### Breaking Changes
  - Removed Docker publishing job
  - Removed documentation publishing job
  - Removed Slack notifications
  - No longer enforces changesets in PRs

  This change makes the workflow much more suitable for individual developers while maintaining professional CI/CD practices.

## 0.4.4

### Patch Changes

- [#43](https://github.com/sapientpants/agentic-node-ts-starter/pull/43) [`f6152a7`](https://github.com/sapientpants/agentic-node-ts-starter/commit/f6152a73d6bebbeda2df0f54517c3484f5e4278d) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: handle missing labels gracefully in CD workflow

  The CD workflow now creates PRs without failing if labels don't exist.
  Labels are added after PR creation if they exist, but their absence
  won't cause the workflow to fail.

## 1.0.0

### Major Changes

- [#37](https://github.com/sapientpants/agentic-node-ts-starter/pull/37) [`e6035ba`](https://github.com/sapientpants/agentic-node-ts-starter/commit/e6035ba3306d36ccd1481bfbdcb6261161c75127) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: implement true continuous deployment with serialized release workflow

  **BREAKING CHANGE**: Complete redesign of CI/CD pipeline

  **Major Architecture Changes:**
  - **Two-workflow system**: Separated CI (`ci.yml`) and CD (`cd.yml`) workflows for clear separation of concerns
  - **Serialized CD**: Non-interruptable, queued release process ensures no race conditions
  - **Direct commits to main**: Removed version PR approach in favor of direct changelog/version commits
  - **Automated everything**: Every PR merge triggers automatic changelog update, version bump, build, and publish
  - **Build attestations**: SLSA provenance attestations for all artifacts
  - **Simplified flow**: No PAT requirements for auto-merge, reduced complexity

  **Key Features:**
  - CI runs on all PRs and pushes to main (validation, security scans, tests)
  - CD triggers on successful CI completion (serialized, queued)
  - Automatic changelog generation from changesets
  - Direct version commits to main branch
  - GitHub release creation with artifacts
  - Multi-channel publishing (npm, Docker, docs)
  - Slack notifications for releases

  **Migration Notes:**
  - Remove `AUTO_MERGE_PAT` secret (no longer needed)
  - Ensure `CHANGESETS_PAT` or default token has write permissions
  - All existing secrets (NPM*TOKEN, DOCKERHUB*\*, SLACK_WEBHOOK) remain compatible
  - Repository variables (ENABLE_DOCKER_RELEASE, ENABLE_DOCS_RELEASE) unchanged

  This change eliminates manual intervention in the release process while ensuring every merged PR results in a properly versioned, documented, and published release.

### Patch Changes

- [#40](https://github.com/sapientpants/agentic-node-ts-starter/pull/40) [`a3d7ea7`](https://github.com/sapientpants/agentic-node-ts-starter/commit/a3d7ea749b8db32a9ace7c25ffd87c424efbcb03) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: add run-id and github-token to cross-workflow artifact downloads

  The CD workflow needs to download artifacts from the CI workflow run.
  The `download-artifact@v4` action requires `run-id` and `github-token`
  parameters when downloading artifacts from a different workflow run.

  Uses CHANGESETS_PAT for authentication to ensure proper access to artifacts
  from the triggering workflow.

  This fix ensures the CD workflow can successfully retrieve build artifacts
  and SBOMs generated by the CI workflow.

- [#41](https://github.com/sapientpants/agentic-node-ts-starter/pull/41) [`4ab2f6c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/4ab2f6c48bc1447053f339e34d90da55e538cc5b) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: adapt CD workflow to use PR approach for version updates

  Due to repository rules requiring all changes to main go through PRs,
  the CD workflow now:
  - Creates a release branch with version updates
  - Opens a PR with auto-merge enabled
  - Waits for the PR to merge before creating release tags

  This maintains the automated release flow while respecting branch protection rules.

- [#39](https://github.com/sapientpants/agentic-node-ts-starter/pull/39) [`1c05e7c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/1c05e7cbad04096741f1fc2c098a19641077ded5) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: improve CI/CD reliability and performance

  **Fixes:**
  - Use standalone pnpm installation to avoid npm registry rate limiting (429 errors)
  - Add CHANGESETS_PAT as GITHUB_TOKEN for changeset version command
  - Make OSV Scanner depend on validate job for proper sequencing
  - Ensure build artifacts only created after security scans pass

  **Performance Improvements:**
  - Add explicit caching for pnpm binary to avoid re-downloads
  - Use environment variables for pnpm and node versions for maintainability

  **Security:**
  - Build artifacts now depend on security scans completing successfully
  - Ensures we don't build and attest to artifacts with known vulnerabilities

  These changes make the CI/CD pipeline more reliable, faster, and more secure.

## 0.4.3

### Patch Changes

- [#35](https://github.com/sapientpants/agentic-node-ts-starter/pull/35) [`56e9241`](https://github.com/sapientpants/agentic-node-ts-starter/commit/56e9241a44c70d02b8fc99fa5f328d3ea9a80e13) Thanks [@sapientpants](https://github.com/sapientpants)! - Make auto-merge workflow fail explicitly when PAT is not configured
  - Add validation step to check for AUTO_MERGE_PAT secret
  - Fail the workflow with clear error messages when PAT is missing
  - Remove silent fallback to GITHUB_TOKEN which doesn't work
  - Update success comment to confirm auto-merge is enabled
  - This ensures proper configuration is in place before attempting auto-merge

## 0.4.2

### Patch Changes

- [#33](https://github.com/sapientpants/agentic-node-ts-starter/pull/33) [`b57458d`](https://github.com/sapientpants/agentic-node-ts-starter/commit/b57458d959d65cc3fdd787ef9a92f05fd7c25cf8) Thanks [@sapientpants](https://github.com/sapientpants)! - Fix auto-merge workflow to recognize app/github-actions author
  - GitHub Actions can appear as 'app/github-actions' when using the default token
  - Add this as valid author for version PRs created by changesets
  - This fixes auto-merge not triggering for version PRs

## 0.4.1

### Patch Changes

- [#31](https://github.com/sapientpants/agentic-node-ts-starter/pull/31) [`46bfb2d`](https://github.com/sapientpants/agentic-node-ts-starter/commit/46bfb2ddf61e7e64680f1905198c490c01ba6cce) Thanks [@sapientpants](https://github.com/sapientpants)! - Simplify CI/CD pipeline for better maintainability
  - Consolidated build logic directly into continuous-deployment.yml
  - Removed redundant workflows (reusable-build, release-distribution, setup-node-pnpm)
  - Simplified artifact naming by removing unique run IDs
  - Reduced artifact retention from 90 to 30 days
  - Streamlined deployment workflow with cleaner conditions
  - Updated documentation to reflect simplified architecture

  This reduces complexity while maintaining all core functionality:
  - Build-once principle for efficiency
  - Automated versioning and releases
  - Multi-channel deployment (npm, Docker, docs)
  - PAT support for workflow triggering

## 0.4.0

### Minor Changes

- [#29](https://github.com/sapientpants/agentic-node-ts-starter/pull/29) [`51c1bdc`](https://github.com/sapientpants/agentic-node-ts-starter/commit/51c1bdce74f295cf821da8c82cf0c8a8e3fd5cef) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: implement build-once-deploy-many CD architecture for true continuous deployment

  **Major Architecture Changes:**
  - **Reusable Workflows**: Created modular, callable workflows for build and deploy operations
    - `reusable-build.yml`: Centralized build logic with artifact generation
    - `reusable-deploy.yml`: Deploy pre-built artifacts without rebuilding
    - `continuous-deployment.yml`: Main orchestrator workflow
    - `release-distribution.yml`: Alternative entry for release distribution
  - **Build Once, Deploy Many**: Artifacts are built once in CI and reused across all deployments
    - Unique artifact IDs for traceability
    - 90-day retention for cost optimization
    - Manifest files track build metadata
  - **PAT Support for Auto-merge**: Version PRs created with PAT trigger workflows
    - Solves GitHub's GITHUB_TOKEN limitation
    - Enables true hands-free releases
    - Documented setup process

  **Key Benefits:**
  - **Efficiency**: ~60% reduction in build time by eliminating rebuilds
  - **Consistency**: Same artifacts deployed everywhere
  - **Automation**: Zero manual steps from merge to deployment
  - **Traceability**: Complete artifact lineage tracking
  - **Security**: SLSA provenance and SBOM attestations

  **Configuration:**

  New secrets:
  - `CHANGESETS_PAT`: Personal Access Token for creating PRs that trigger workflows

  New documentation:
  - `docs/CD-ARCHITECTURE.md`: Complete architecture documentation
  - Setup instructions for PAT configuration
  - Troubleshooting guide for common issues

  This change fundamentally restructures the CI/CD pipeline to achieve true continuous deployment with artifact reuse, solving the core issue of version PRs not triggering workflows and ensuring efficient, consistent deployments.

### Patch Changes

- [#27](https://github.com/sapientpants/agentic-node-ts-starter/pull/27) [`4caf589`](https://github.com/sapientpants/agentic-node-ts-starter/commit/4caf589d965028af6ae650ef80dec30afeb7f407) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: improve GitHub Actions workflows with security and reliability enhancements

  **Bug Fixes:**
  - Fixed critical bug in auto-merge workflow that was attempting to merge wrong PR number (#17 instead of dynamic PR number)
  - Added security validation to auto-merge workflow to verify PR author is github-actions bot before enabling auto-merge

  **Security Enhancements:**
  - Added dependency review action to scan for vulnerable dependencies in pull requests
  - Added license checking to automatically block problematic licenses (GPL-3.0, AGPL-3.0)
  - Integrated security validation in auto-merge workflow to prevent unauthorized auto-merge

  **Reliability Improvements:**
  - Added timeout configurations to prevent hung jobs (15 minutes for build-test, 5 minutes for dependencies)
  - Created reusable workflow (`setup-node-pnpm.yml`) for consistent Node.js and pnpm setup
  - Improved error handling and user feedback in auto-merge workflow

  **Documentation:**
  - Added comprehensive workflow documentation in `.github/WORKFLOWS.md` including:
    - Workflow architecture diagram
    - Detailed descriptions and triggers for each workflow
    - Troubleshooting guide for common issues
    - Required secrets and variables reference
    - Performance metrics and best practices

  These improvements strengthen the security posture, improve reliability, and make workflows easier to maintain and troubleshoot.

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
