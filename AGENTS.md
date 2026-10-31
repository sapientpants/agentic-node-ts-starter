# AGENTS.md

Compact guidance for AI agents working in this repository.

## Setup

- Node 26 and pnpm 11.27.1 are pinned by `mise.toml`; use mise shims if versions differ.
- Starter template: `src/index.ts` and files named `*.example.ts` are placeholder code to replace, not real features. `src/config.ts` and `src/logger.ts` are the load-bearing infrastructure — keep them intact when customizing.

## Commands (high signal)

- `pnpm verify` — the full offline gate, identical to what CI enforces: format → linters (cspell/yaml/markdown/actionlint) → typecheck → eslint → dependency-cruiser → jscpd → knip → `test:coverage`. Takes several minutes; run it before pushing.
- The husky pre-commit hook does **not** run the full gate. It runs `validate-branch-name` and `lint-staged` (prettier, eslint, markdownlint, yamllint, cspell on staged files only), so commits are fast and work offline.
- Faster iteration loop: `pnpm quick-check` (typecheck + lint + tests, no coverage).
- Auto-fixes: `pnpm format:fix`, `pnpm lint:fix`. `pnpm format` only checks.
- Agentic workflows (OpenCode, see `.opencode/`): `/spec-feature <feature>`, `/implement-github-issue <issue-number>`, `/update-dependencies` — process in `docs/PROCESS.md`.

## Quality gates (enforced in CI and `pnpm verify`; docs sometimes lag — trust the config files)

- Coverage (`vitest.config.ts`): lines/functions/statements ≥90, branches ≥80.
- Complexity (ESLint, type-aware): complexity ≤10, ≤50 lines/function, ≤4 params, max-depth 3, and **min** `max-statements: 15`. Test files are relaxed (complexity ≤15, lines ≤600).
- No barrel files (`no-barrel-files`): re-exporting from modules is a lint error except in `index.ts`. Import direct paths.
- Unused exports/deps/imports fail the build via Knip (`pnpm dead-code`, run before tests in `pnpm verify` and CI). `knip --production` also runs there and reports exports that only tests import, so keep code reachable from the production entries in `knip.json` (`src/index.ts`, `src/dev/`) or tag intentional template API with a `@public` JSDoc tag and say why. Do not add test-only exports (no `__testExports`); test through the public surface.
- No floating promises, enforced `node:` import protocol, strict-boolean-expressions: ESLint surfaces these as errors you will hit on first write.

## Testing

- Unit tests live in `tests/*.spec.ts`; property-based tests (`tests/*.property.spec.ts`) use fast-check (via `fc` from `@fast-check/vitest`).
- Run single test: `pnpm exec vitest run <file>`; filter by name with `-t "<name>"`. Also `test:watch`, `test:ui`.
- Config and logger are side-effect-free factories: build fixtures with `loadConfig({ NODE_ENV: 'production', ... })` and `createLogger(config)` from `src/config.js` / `src/logger.js` instead of mutating `process.env` and `vi.resetModules()`.

## Conventions

- ES modules + NodeNext resolution: local imports use the `.js` extension on `.ts` files (e.g., `import { x } from './foo.js'`).
- Strict tsconfig: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `switch-exhaustiveness-check`.
- Dependency pinning policy: every dependency is pinned to an exact version (`saveExact` in `pnpm-workspace.yaml` / `.npmrc`); no caret or tilde ranges. Upgrades are explicit commits via `pnpm deps:update:*` (npm-check-updates) and the lockfile is the single source of resolved versions.
- Env config goes through `src/config.ts` (Zod schema): add new variables to the schema and `.env.example`; there is a default for every key, so no `.env` file is required.
- Use `createChildLogger` from `src/logger.js`; it auto-redacts secrets by field name (password/token/secret/api_key) — do not log raw values that need protecting anywhere else.
- New words (any file type: identifiers, comments, docs) fail the cspell check in the pre-commit hook, `pnpm verify`, and CI; add terms to `cspell.json`.
- Markdown, YAML, and even GitHub workflow files are linted (`lint:markdown`, `lint:yaml`, `lint:workflows`).

## CI/CD & changesets

- PRs must pass validate (everything above) + CodeQL security scan. A missing changeset fails the PR — run `pnpm changeset` (interactive), or `pnpm changeset --empty` for non-releasable commits (tests, CI, refactor).
- No direct pushes to main; releases flow from merging a changeset: version + tag + GitHub release on main, publish gated by `ENABLE_NPM_RELEASE` / `ENABLE_DOCKER_RELEASE` variables. Releases require the `RELEASE_TOKEN` secret (PAT with `contents:write`, `actions:read`) or the main workflow aborts early.

## Git hooks & branch rules

- Husky pre-commit runs `validate-branch-name` + `lint-staged`; commit-msg enforces conventional commits via commitlint (`feat:`/`fix:` etc.).
- Branch names must match `<type>/<description>` (types: feat, fix, docs, style, refactor, perf, test, chore, revert) — pattern in `.validate-branch-namerc.json`, enforced by the pre-commit hook.

## Gotchas

- `pnpm lint:workflows` needs a locally installed `actionlint` binary (`brew install actionlint`); it fails with install instructions when missing (CI installs its own copy).
- The Dockerfile healthcheck expects a `/health` HTTP endpoint on port 3000 (see `docs/DOCKER.md`). The default app is not one — remove or replace the healthcheck if your replacement isn't a web server.
