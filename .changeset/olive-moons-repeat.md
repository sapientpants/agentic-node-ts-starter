---
---

chore: update all dependencies to latest compatible versions

- pnpm 10.22.0 → 11.27.1; `pnpm.overrides` moved from package.json to the new `pnpm-workspace.yaml` (pnpm 11 no longer reads the `pnpm` field)
- TypeScript 5.9 → 6.0, ESLint 9 → 10, Vitest 4 → 5, Stryker 9 → 10, knip 5 → 6, cspell 9 → 10, lint-staged 16 → 17, changesets 2 → 3, and the remaining dev tooling to latest
- Added overrides for qs, fast-uri and js-yaml, clearing all 9 outstanding audit advisories
