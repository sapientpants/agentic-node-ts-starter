---
'agentic-node-ts-starter': patch
---

feat: improve GitHub Actions workflows with performance, security, and reliability enhancements

- **Fixed critical bug** in auto-merge workflow that was using wrong PR number
- **Added security validation** to auto-merge workflow to verify PR author is github-actions bot
- **Added matrix strategy** to CI/CD workflow for parallel testing on Node 20 and 22
- **Added dependency review action** for vulnerability scanning in pull requests
- **Added timeout configurations** to prevent hung jobs
- **Created reusable workflow** for consistent Node.js and pnpm setup across workflows
- **Added comprehensive workflow documentation** in .github/WORKFLOWS.md with troubleshooting guide
- **Optimized artifact uploads** to only run on primary Node version to avoid duplicates
- **Added license checking** to block problematic licenses (GPL-3.0, AGPL-3.0)

These improvements enhance CI/CD performance, strengthen security posture, and improve workflow maintainability.
