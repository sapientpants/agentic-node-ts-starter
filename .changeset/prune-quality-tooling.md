---
'agentic-node-ts-starter': patch
---

Prune redundant quality tooling and make the pre-commit hook fast and offline (#197).

- The husky pre-commit hook now runs `validate-branch-name` and `lint-staged` (Prettier, ESLint, markdownlint, yamllint, cspell on staged files) instead of the full gate.
- The full gate is renamed from `pnpm precommit` to `pnpm verify`, no longer needs the network, and CI now also runs spelling, YAML, and Markdown linting.
- Removed `madge`, `depcheck`, and `license-checker` and their scripts; dependency-cruiser covers circular imports and Knip covers unused dependencies.
- Removed duplicate and placeholder scripts (`coverage:report`, `metrics`, `help`, `doctor`, `lint-staged`).
- All dependencies are pinned to exact versions; the policy is documented in `AGENTS.md` and ADR-0018.
- Dropped the `DOM` lib from `tsconfig.json` and switched the ESLint config type to `Linter.Config`.
