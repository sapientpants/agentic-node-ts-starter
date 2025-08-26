---
'agentic-node-ts-starter': patch
---

fix: improve CI/CD reliability and performance

**Fixes:**

- Use standalone pnpm installation to avoid npm registry rate limiting (429 errors)
- Add CHANGESETS_PAT as GITHUB_TOKEN for changeset version command
- Make OSV Scanner depend on validate job for proper sequencing
- Ensure build artifacts only created after security scans pass

**Performance Improvements:**

- Add explicit caching for pnpm binary to avoid re-downloads
- Use environment variables for pnpm and node versions for maintainability

**Security:**

- Build artifacts now depend on security scans completing successfully
- Ensures we don't build and attest to artifacts with known vulnerabilities

These changes make the CI/CD pipeline more reliable, faster, and more secure.
