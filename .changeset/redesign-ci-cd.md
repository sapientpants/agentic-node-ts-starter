---
'agentic-node-ts-starter': major
---

feat: implement true continuous deployment with serialized release workflow

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
