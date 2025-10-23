---
---

chore: update dev dependencies to latest versions

## Updated Dependencies

### Patch Updates

- `lint-staged`: 16.2.5 → 16.2.6
- `vite`: 7.1.11 → 7.1.12

### Major Updates

- `vitest`: 3.2.4 → 4.0.1
- `@vitest/coverage-v8`: 3.2.4 → 4.0.1

## Changes Required for Vitest 4

Updated `vitest.config.ts` to explicitly exclude the `dist/` directory from test discovery. Vitest 4 changed its default behavior to include build directories, which caused duplicate test execution and failures.

## Known Issues

- One moderate severity vulnerability in `validator` package (transitive dependency through `@cyclonedx/cdxgen`). No patch available yet. This affects only SBOM generation tooling and does not impact production code.
- Peer dependency warning with `@fast-check/vitest` expecting vitest v1-3 but now using v4. Tests continue to work correctly despite the warning.
