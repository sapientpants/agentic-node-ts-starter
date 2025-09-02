---
'agentic-node-ts-starter': patch
---

docs: Clarify Docker healthcheck configuration and requirements

- Created comprehensive Docker configuration guide (docs/DOCKER.md) with detailed healthcheck instructions
- Added prominent comments to Dockerfile explaining healthcheck expectations and linking to documentation
- Created optional health endpoint example file (src/health.example.ts) demonstrating implementation patterns
- Updated README.md to reference Docker documentation and warn about healthcheck requirements
- Provided configuration examples for different application types: web services, CLI tools, workers, and API services
- Included troubleshooting guide and container orchestration examples (Docker Compose, Kubernetes, ECS)

This change addresses issue #98 by providing clear guidance on Docker healthcheck configuration, helping developers understand and properly configure healthchecks for their specific application types.
