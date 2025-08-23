# Security Guidelines

- Follow OWASP ASVS Level 1+ for application controls.
- Validate all inputs at trust boundaries with Zod or equivalent.
- Secret management via environment variables and your secret store; never commit secrets.
- Generate SBOMs (SPDX/CycloneDX) and attach to releases. Scan dependencies in CI with OSV.
- Enable npm 2FA and use automation tokens for CI publishing. Prefer provenance attestations for releases.
