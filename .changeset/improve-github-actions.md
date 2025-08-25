---
'agentic-node-ts-starter': patch
---

feat: improve GitHub Actions workflows with security and reliability enhancements

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
