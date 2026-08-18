---
description: Update project dependencies following the CI/CD workflow and changeset requirements
---

# Update Dependencies

You are about to update the dependencies of this project using the curated npm-check-updates workflow.

## Workflow Steps

### 1. Create a Branch

```bash
git checkout -b chore/update-dependencies-<date>
# Example: chore/update-dependencies-2025-01
```

### 2. Check What Will Update

```bash
pnpm deps:check   # ncu dry run: shows outdated packages and targets
```

Review the table before applying anything. Choose the narrowest target that achieves the goal:

- `pnpm deps:update:patch` — patch bumps only (routine hygiene)
- `npm-check-updates` without arguments (`pnpm deps:check`) never modifies files
- `pnpm deps:update:minor` — includes minor bumps
- `pnpm deps:update:latest` — includes major bumps; review each one deliberately

### 3. Install and Lock

```bash
pnpm install   # updates pnpm-lock.yaml
```

- `pnpm.overrides` in `package.json` pins floor versions of security-critical packages (tar, minimatch, rollup, undici, ...). Do not remove overrides; if one blocks an update you need, change the floor deliberately and re-check `pnpm audit --audit-level critical`.
- Do not hand-edit `pnpm-lock.yaml`; regenerate it with `pnpm install`.

### 4. Verify

```bash
pnpm ci:local:fast   # Fast local mirror of CI validation
pnpm precommit       # Full gate: audit, linters, dead code, test:coverage
```

- Coverage must hold: lines/functions/statements ≥90%, branches ≥80%
- Major bumps that break APIs: fix affected code/tests, then re-run until green
- If the build fails, bisect: revert individual packages until it passes, and document the pinned stragglers in the PR

### 5. Create a Changeset

Choose by impact:

- Dev-only or tooling updates that do not affect users → `pnpm changeset --empty`
- Production dependency updates, or anything user-visible → `pnpm changeset` with patch/minor/major

```bash
pnpm changeset
# patch: "Update zod to 4.x, fixing validation edge cases"
# minor: "Update pino to 10.x with new structured logging features"
# major: "Update to Node 24 engine (drops Node 22 support)"
```

### 6. Commit and Push

```bash
git add .
git commit -m "chore: update dependencies

- <package> from <old> to <new> (notable change, if any)
- All tests passing; coverage thresholds hold"

git push -u origin chore/update-dependencies-<date>
```

### 7. Create the PR

```bash
gh pr create \
  --title "chore: update dependencies" \
  --body "## Pull request type
- [x] Build related changes

## What is the current behavior?

Dependency set with <N> outdated packages.

## What is the new behavior?

- <package list / notable changes>

## Other information

- Verified with pnpm ci:local + pnpm precommit
- Coverage thresholds hold (≥90% lines/functions/statements, ≥80% branches)
- pnpm audit --audit-level critical: clean
- Changeset: <empty|patch|minor|major>" \
  --assignee @me
```

### 8. Monitor CI

```bash
gh pr checks --watch
```

CI also runs CodeQL and OSV scans; review any new advisories against the updated versions. If the branch needs fixes, commit them and push with `git push --force-with-lease` (force-push without lease is denied by the editor permission rules).

### 9. Merge

```bash
gh pr merge --squash --delete-branch
```

## Important Notes

### Changeset Requirements

- CI's `changeset status` fails PRs that commit changes without a changeset — include `pnpm changeset --empty` for dev-only/tooling updates
- Production dependency updates or user-visible changes need a real (non-empty) changeset

### Security Considerations

- Always run `pnpm audit --audit-level critical` after updates, and `pnpm scan:secrets` is available for leaked-credential checks
- Review security advisories for each major bump
- Be cautious with major version updates in a template repo: downstream projects inherit the bump
