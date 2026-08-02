# AGENTS.md

## Project Setup

- **Node**: 24+ (via mise: `node = "24"`)
- **Package Manager**: pnpm 10.22.0 (via mise: `pnpm = "10.22.0"`)
- **TypeScript**: Strict mode, NodeNext modules, ES2022 target
- **ES Modules**: Always use `.js` extension in imports: `import { foo } from './module.js'`

## Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - TypeScript watch mode
- `pnpm build` - Build to dist/
- `pnpm test` - Run tests (80% coverage required)
- `pnpm test:coverage` - Tests with coverage report
- `pnpm typecheck` - Type check only
- `pnpm lint` - ESLint (fails on violations)
- `pnpm format` - Prettier check
- `pnpm precommit` - Run all quality checks in optimized order

## Quality Gates (Enforced)

- **Coverage**: 80% minimum for lines, branches, functions, statements
- **Complexity**: Cyclomatic ≤10, max 50 lines/function, max 4 params, max 3 nesting depth
- **Duplication**: <2% project-wide (jscpd)
- **Circular deps**: Forbidden (madge)
- **Dead code**: Forbidden (Knip)
- **Test files**: Relaxed thresholds (complexity ≤15, lines ≤600)

## Pre-commit Order (Fast-Fail)

1. `pnpm audit` (critical vulnerabilities block)
2. `pnpm format`
3. `pnpm lint:spelling`
4. `pnpm lint:yaml`
5. `pnpm lint:markdown`
6. `pnpm lint:workflows`
7. `pnpm typecheck`
8. `pnpm lint`
9. `pnpm deps:circular`
10. `pnpm deps:cruise`
11. `pnpm duplication`
12. `pnpm dead-code`
13. `pnpm ts-prune`
14. `pnpm test:coverage` (slowest, runs last)

## Testing

- **Unit tests**: `tests/*.spec.ts`
- **Property tests**: `tests/*.property.spec.ts` (required for business logic)
- **Single test**: `vitest run tests/specific.spec.ts`
- **Pattern match**: `vitest -t "test name"`
- **Watch mode**: `pnpm test:watch`
- **Test UI**: `pnpm test:ui`

## Project Structure

- `src/` - Source code (ES modules with .ts extension)
- `tests/` - Test files
- `dist/` - Build output (gitignored)
- `.claude/` - Claude Code configurations and commands

## Key Patterns

- **Validation**: Use Zod schemas for runtime validation at boundaries
- **Property testing**: Use fast-check for invariants (commutativity, associativity, etc.)
- **Logging**: Use Pino logger with structured logging; sensitive data auto-redacted
- **Imports**: Always use `.js` extension for local ES module imports

## CI/CD

- **PR workflow**: Validates changesets, runs all quality checks, security scans
- **Main workflow**: Auto-versions, creates releases, generates SBOM, updates quality metrics
- **Publish workflow**: Publishes to NPM/Docker (requires `RELEASE_TOKEN` secret)
- **Required for releases**: `RELEASE_TOKEN` secret (PAT with contents:write, actions:read)
- **Optional secrets**: `NPM_TOKEN`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- **Variables**: `ENABLE_NPM_RELEASE`, `ENABLE_DOCKER_RELEASE`

## Changesets

- **Required**: For bug fixes, features, breaking changes, usage-affecting docs
- **Empty changeset**: `pnpm changeset --empty` for test-only, CI/CD, refactoring, dev deps
- **Create**: `pnpm changeset` then edit `.changeset/*.md` file
- **Workflow**: CI validates changesets present for releasable commits

## Branch & Commit Conventions

- **Branch**: `<type>/<description>` (e.g., `feat/add-auth`, `fix/memory-leak`)
- **Commit**: Conventional commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`)
- **Validation**: validate-branch-name enforces pattern via `.validate-branch-namerc.json`

## Git Hooks

- **Pre-commit**: Blocks `--no-verify` flag via `.claude/hooks/block-git-no-verify.ts` (for AI agents)
- **Pre-commit checks**: Runs lint-staged (Prettier, ESLint, markdownlint, yamllint)
- **Note**: All git commands with `--no-verify` or `-n` flags are blocked for AI agents

## Security

- **Audit**: `pnpm audit` (critical vulnerabilities block commits)
- **Container scan**: `pnpm scan:container` (requires Docker, Trivy)
- **Secrets scan**: `pnpm scan:secrets` (requires Gitleaks)
- **CI security**: CodeQL, OSV scanning on all PRs

## Release Process

1. PR with changes + changeset merged to main
2. Main workflow: versions packages, builds artifacts, creates GitHub release
3. Publish workflow: publishes to NPM/Docker (if enabled and secrets configured)

## Tools Configuration

- **ESLint**: 11 plugins (TypeScript, SonarJS, Security, Unicorn, Promise, Import, etc.)
- **Prettier**: 3.x with ESLint integration
- **Vitest**: V8 coverage provider
- **TypeDoc**: API documentation generator
- **Dependency analysis**: madge, dependency-cruiser, depcheck, Knip

## Gotchas

- **Docker healthcheck**: Default Dockerfile expects `/health` endpoint on port 3000 (see docs/DOCKER.md)
- **Private package**: Remove `"private": true` from package.json for NPM publishing
- **RELEASE_TOKEN required**: Main workflow fails early without it
- **No direct main pushes**: Always use PR workflow for changes
