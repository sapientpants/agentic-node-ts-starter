# AGENTS.md

Compact guidance for AI agents working in this repository.

## Setup

- Node 24 and pnpm 10.22.0 are pinned by `mise.toml`; use mise shims if versions differ.
- Starter template: `src/index.ts` and files named `*.example.ts` are placeholder code to replace, not real features. `src/config.ts` and `src/logger.ts` are the load-bearing infrastructure — keep them intact when customizing.

## Commands (high signal)

- `pnpm precommit` — the real local gate: audit → format → linters → typecheck → deps checks → dead code → `test:coverage`. Runs before every commit via husky; expect it to take several minutes.
- Faster iteration loop: `pnpm quick-check` (typecheck + lint + tests, no coverage).
- Auto-fixes: `pnpm format:fix`, `pnpm lint:fix`. `pnpm format` only checks.

## Quality gates (enforced in CI and precommit; docs sometimes lag — trust the config files)

- Coverage (`vitest.config.ts`): lines/functions/statements ≥90, branches ≥80.
- Complexity (ESLint, type-aware): complexity ≤10, ≤50 lines/function, ≤4 params, max-depth 3, and **min** `max-statements: 15`. Test files are relaxed (complexity ≤15, lines ≤600).
- No barrel files (`no-barrel-files`): re-exporting from modules is a lint error except in `index.ts`/`logger.ts`. Import direct paths.
- Unused exports/deps/imports fail the build via Knip and ts-prune (run before tests in precommit) — keep code reachable or it fails CI.
- No floating promises, enforced `node:` import protocol, strict-boolean-expressions: ESLint surfaces these as errors you will hit on first write.

## Testing

- Unit tests live in `tests/*.spec.ts`; property-based tests (`tests/*.property.spec.ts`) use fast-check (via `fc` from `@fast-check/vitest`).
- Run single test: `pnpm exec vitest run <file>`; filter by name with `-t "<name>"`. Also `test:watch`, `test:ui`.

## Conventions

- ES modules + NodeNext resolution: local imports use the `.js` extension on `.ts` files (e.g., `import { x } from './foo.js'`).
- Strict tsconfig: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `switch-exhaustiveness-check`.
- Env config goes through `src/config.ts` (Zod schema): add new variables to the schema and `.env.example`; there is a default for every key, so no `.env` file is required.
- Use `createChildLogger` from `src/logger.js`; it auto-redacts secrets by field name (password/token/secret/api_key) — do not log raw values that need protecting anywhere else.
- New words (any file type: identifiers, comments, docs) fail the cspell check in precommit; add terms to `cspell.json`.
- Markdown, YAML, and even GitHub workflow files are linted (`lint:markdown`, `lint:yaml`, `lint:workflows`).

## CI/CD & changesets

- PRs must pass validate (everything above) + CodeQL security scan. A missing changeset fails the PR — run `pnpm changeset` (interactive), or `pnpm changeset --empty` for non-releasable commits (tests, CI, refactor).
- No direct pushes to main; releases flow from merging a changeset: version + tag + GitHub release on main, publish gated by `ENABLE_NPM_RELEASE` / `ENABLE_DOCKER_RELEASE` variables. Releases require the `RELEASE_TOKEN` secret (PAT with `contents:write`, `actions:read`) or the main workflow aborts early.

## Git hooks & branch rules

- Husky pre-commit runs the full `pnpm precommit`; commit-msg enforces conventional commits via commitlint (`feat:`/`fix:` etc.).
- Branch names must match `<type>/<description>` (types: feat, fix, docs, style, refactor, perf, test, chore, revert) — pattern in `.validate-branch-namerc.json`.

## Gotchas

- `pnpm lint:workflows` downloads actionlint each run; it needs network access.
- The Dockerfile healthcheck expects a `/health` HTTP endpoint on port 3000 (see `docs/DOCKER.md`). The default app is not one — remove or replace the healthcheck if your replacement isn't a web server.
