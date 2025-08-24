# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript source (ES modules). Export from `src/index.ts`.
- `tests/`: Vitest unit and property tests (e.g., `add.property.spec.ts`).
- `specs/`: SPEC and PLAN used for spec-first work.
- `prompts/`: Prompt templates for tasks (Codex CLI friendly).
- `scripts/`: Helper scripts (repo maintenance only).
- `docs/`: Process and workflow docs.

## Build, Test, and Development Commands

- `pnpm install`: Install deps (Node 22 via `mise install`).
- `pnpm build`: Type-check and emit to `dist/` via `tsc -p tsconfig.build.json`.
- `pnpm typecheck`: TS type checks without emitting.
- `pnpm lint` / `pnpm lint:fix`: Lint with ESLint (flat config).
- `pnpm format` / `pnpm format:write`: Check/format with Prettier.
- `pnpm test` / `pnpm test:watch`: Run Vitest (+ c8 coverage).
- `pnpm coverage:report`: Text summary after coverage.
- `pnpm verify`: Run typecheck, lint, format check, tests.
- `pnpm sbom`: Generate SPDX and CycloneDX SBOMs.

## Coding Style & Naming Conventions

- TypeScript (strict), ES modules, 2‑space indent, semicolons.
- Naming: functions/vars `camelCase`, types/interfaces `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Validation: prefer `zod` schemas for inputs and types.
- Tools: ESLint (`@typescript-eslint` recommended-type-checked) + Prettier. No `console` in core code (`no-console` warns), no `debugger`.

## Testing Guidelines

- Framework: Vitest with `c8` coverage; property tests via `fast-check`.
- File names: `*.spec.ts`; use `.property.spec.ts` for property-based tests.
- Expectations: cover happy paths, edge cases, and Zod validation failures.
- Run locally: `pnpm test`; ensure `pnpm verify` passes before PR.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits (e.g., `feat:`, `fix:`, `build:`, `ci:`). Keep messages imperative and scoped.
- PRs: include problem statement, approach, and verification steps; link issues. Attach screenshots only if user-visible output changes.
- Require green `pnpm verify`. Update docs/specs if behavior changes. Keep diffs focused.

## Security & Configuration Tips

- Toolchain pinned via `mise.toml` and `.npmrc`. SBOM via `pnpm sbom`.
- CI runs OSV scan, coverage, and provenance. Avoid adding new runtime deps without justification.

## Using Codex CLI

- Author task specs in `specs/SPEC.md` and prompts in `prompts/`.
- Use your local Codex CLI to drive changes; this repo does not ship an in-repo agent runner or scripts.
- Keep generated diffs minimal and always add/adjust tests.
