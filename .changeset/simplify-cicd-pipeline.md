---
'agentic-node-ts-starter': patch
---

Simplify CI/CD pipeline for better maintainability

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
