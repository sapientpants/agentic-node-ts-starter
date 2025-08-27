---
'agentic-node-ts-starter': patch
---

Optimize GitHub Actions workflows for better performance and maintainability

- Extract reusable workflows for setup, validation, and security scanning
- Parallelize PR validation jobs for ~50% faster feedback
- Simplify publish workflow by removing unnecessary matrix strategy
- Fix publish workflow to properly handle secrets in conditions
- Reduce overall workflow code by ~25% through DRY principles
