---
'agentic-node-ts-starter': minor
---

feat: Add container image security scanning to CI/CD pipeline

- Integrated Trivy scanner for vulnerability detection in Docker images
- Added automatic scanning on PRs and before Docker Hub publication
- Configured SARIF output for GitHub Security tab integration
- Created local scanning script for developer testing
- Implemented configurable severity thresholds (default: HIGH/CRITICAL)
- Added `.trivyignore` file for false positive exclusions
- Included scan result caching for performance optimization
- Generated attestations for clean scans
- Added comprehensive test coverage for scanning functionality

This enhancement completes the security supply chain by providing end-to-end security coverage from source code to deployed artifacts, enabling early detection of vulnerabilities in base images and dependencies.
