---
'agentic-node-ts-starter': minor
---

feat: implement unified CI/CD workflow to eliminate duplication

Major improvements to the CI/CD pipeline:

- Combined CI and Release workflows into a single unified ci-cd.yml workflow
- Build, test, SBOM generation, and attestations now happen once and artifacts are reused
- Fixed status check reporting for all PR types including version PRs
- Improved auto-merge workflow with better error handling and PAT support
- Reduced workflow execution time and resource usage
- Better artifact management with 30-day retention

This change eliminates the duplication between CI and Release workflows, making the pipeline more efficient and maintainable.
