---
'agentic-node-ts-starter': patch
---

chore: update dependencies and fix security vulnerabilities

Production: pino 10.1.0→10.3.1, zod 4.1.12→4.3.6
Dev: @cyclonedx/cdxgen 11.11.0→12.1.2 (fixes 28 transitive vulnerabilities), 26 other packages updated
Security: Added pnpm overrides for tar, minimatch, flatted, rollup, lodash transitive vulnerabilities
Removed unused LoggerContext type export detected by updated Knip
Vitest currently resolved to 4.0.9 in the lockfile due to a type incompatibility with exactOptionalPropertyTypes (package.json still specifies ^4.0.9)
