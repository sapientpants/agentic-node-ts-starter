---
'agentic-node-ts-starter': minor
---

Improve OSV vulnerability scanner integration with official Google actions

- Replace custom OSV scanner implementation with Google's official GitHub Actions
- Use specialized `osv-scanner-reusable-pr.yml` workflow for pull requests (v2.2.2)
- Use standard `osv-scanner-reusable.yml` workflow for main branch scanning (v2.2.1)
- Split security scanning into separate CodeQL and vulnerability jobs for better visibility
- Add security scanning to main branch workflow for pre-release validation
- Fix permissions for vulnerability scanning in main workflow

This change improves security scanning reliability by using Google's maintained OSV Scanner actions, which provide better compatibility, automatic updates, and optimized PR-specific scanning capabilities.
