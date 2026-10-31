# 18. Fast Offline Pre-commit Hook and Pruned Quality Tooling

Date: 2026-10-31

## Status

Accepted

Amends: [ADR-0010](./0010-extended-linting-strategy.md), [ADR-0014](./0014-extended-code-quality-toolchain.md)

## Context

The quality toolchain had grown to the point where overlap, dead configuration, and network dependencies cost more than they caught ([issue #197](https://github.com/sapientpants/agentic-node-ts-starter/issues/197)):

- **Redundant tools**: `madge` and `dependency-cruiser` both detected circular imports; `depcheck` duplicated Knip's unused-dependency check; `license-checker` had not been published since 2019.
- **Dead configuration**: `lint-staged` was configured in `package.json` and cited in ADRs 0006, 0010, and 0014, but the husky hook ran `pnpm precommit` instead, so it was never invoked. `validate-branch-name` and its `.validate-branch-namerc.json` were installed and documented but wired into no hook.
- **Slow, online pre-commit**: the hook ran the entire gate, including `pnpm audit` (needs the registry), so every commit took minutes and failed offline.
- **Script sprawl**: 83 npm scripts, including exact duplicates (`test:coverage` / `coverage:report`) and placeholders (`help`, `doctor`).
- **Loose ends**: dependency pinning mixed exact and caret ranges with no stated policy, `tsconfig.json` included the `DOM` lib in a Node-only project, and `eslint.config.js` used the deprecated `Linter.FlatConfig` type.

## Decision

1. **Pre-commit hook is fast and offline.** `.husky/pre-commit` runs `validate-branch-name` and then `lint-staged`, which runs Prettier, ESLint, markdownlint, yamllint, and cspell on staged files only. Nothing in the hook needs the network.
2. **The full gate lives in CI.** The `pnpm verify` script (formerly `precommit`) runs format, spelling, YAML, Markdown, and workflow linting, type checking, ESLint, dependency-cruiser, jscpd, Knip, and tests with coverage. It is offline. CI runs the same checks on every pull request and push to `main`; `pnpm audit` and the other network scanners run only in CI and `pnpm ci:local`.
3. **One tool per job.** `madge`, `depcheck`, and `license-checker` are removed with their scripts. dependency-cruiser owns import-graph rules (including `no-circular`); Knip owns unused files, exports, and dependencies.
4. **Scripts pruned.** Duplicate and placeholder scripts are removed; `pnpm run` lists the rest with their commands.
5. **Pinning policy.** Every dependency is pinned to an exact version (`saveExact` is already set in `pnpm-workspace.yaml` and `.npmrc`). No caret or tilde ranges. Upgrades are deliberate commits made with `pnpm deps:update:*`.
6. **Housekeeping.** `DOM` is dropped from `tsconfig.json` `lib`; the ESLint config uses `Linter.Config`.

## Consequences

### Positive

- Commits take seconds and work without network access.
- The slow checks still gate every merge because CI runs them on each PR.
- Fewer tools and 120 fewer transitive packages to update, audit, and explain.
- `lint-staged` and `validate-branch-name` now do what the ADRs and `AGENTS.md` always said they did.
- Exact pins make the lockfile and `package.json` agree and make upgrades visible in diffs.

### Negative

- Type errors and failing tests are no longer caught at commit time; they surface in CI or when the developer runs `pnpm verify` / `pnpm quick-check`.
- Exact pins mean security patches require an explicit bump instead of arriving via a range on the next install.

### Mitigation

- `pnpm quick-check` (typecheck + lint + tests) is the recommended loop before pushing; `pnpm verify` mirrors CI exactly.
- The `/update-dependencies` workflow and `pnpm deps:check` keep upgrades routine; `pnpm audit` in CI still fails on critical vulnerabilities.

## References

- [Issue #197](https://github.com/sapientpants/agentic-node-ts-starter/issues/197)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [validate-branch-name](https://github.com/JsonMa/validate-branch-name)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- [Knip](https://knip.dev/)
