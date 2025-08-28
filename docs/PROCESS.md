# Solo Agentic Delivery Process (Node + TypeScript)

## 0) Prepare

- Node 22 LTS via **mise** (`mise.toml`), package manager **pnpm 10**, strict TypeScript, ESLint (flat), Prettier, Vitest, fast-check, Zod.
- Turn on branch protection + required status checks in GitHub. Enforce PRs, linear history, required reviews (self-review allowed but deliberate).

## 1) Specify (SPEC-first)

- Use `/spec-feature` Claude command to create a GitHub issue with Gherkin specification
- Define clear scope, non-goals, risks, and acceptance criteria (Given/When/Then)
- Prefer **executable specs** via tests

## 2) Plan & slice

- Break work into increments that take <1 day and can be merged behind a feature flag if needed.
- Draft a verification plan in your PR (template provided).

## 3) Generate with agent

- Author a task prompt in `prompts/tasks/*.md` referencing SPEC and constraints. Keep tool rights minimal.
- Use the agent to produce the smallest viable diff plus tests. Prefer **in-repo** prompt files (versioned).

## 4) Verify automatically

- Run: typecheck → lint → unit + property tests → contract validation (Zod/OpenAPI) → OSV scan → SBOM generation.
- CI enforces gates; outputs include coverage report, SBOM, and SLSA provenance.

## 5) Review

- Self-review the diff. Check the "AI usage" block in PR. Ensure tests truly fail when behavior regresses.
- If risky, enable behind a **feature flag**.

## 6) Integrate (trunk-based)

- Merge early/often. Keep main always releasable.

## 7) Release

- Use Changesets to create semver bumps and release notes. Publish with provenance and SBOM.

## 8) Operate & learn

- Instrument with OpenTelemetry; use structured logging (Pino). Track DORA-ish solo metrics: lead time, deploy frequency, MTTR.
