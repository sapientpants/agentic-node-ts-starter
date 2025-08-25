---
'agentic-node-ts-starter': patch
---

Add release distribution workflow for automated multi-platform deployment

- Add `release.yml` workflow triggered on GitHub release publication
- Create production-ready Dockerfile with multi-architecture support (amd64/arm64)
- Add .dockerignore to optimize Docker build context
- Enable automated npm publishing with provenance attestation
- Support Docker image distribution to Docker Hub and GitHub Container Registry
- Add GitHub Pages documentation deployment capability
- Generate additional release artifacts (source/dist tarballs with checksums)
- Update documentation with distribution setup instructions

This workflow efficiently reuses artifacts from the CI/CD pipeline and only builds what's necessary for each distribution channel, avoiding duplicate work.
