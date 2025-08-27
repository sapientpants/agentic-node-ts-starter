---
'agentic-node-ts-starter': patch
---

refactor: split CI/CD workflow into reusable workflows

- Created separate reusable workflows for CI validation and CD release/publishing
- Simplified main workflow to orchestrate reusable components
- Improved maintainability and modularity of GitHub Actions workflows
- Centralized Node.js and pnpm version configuration using environment variables
