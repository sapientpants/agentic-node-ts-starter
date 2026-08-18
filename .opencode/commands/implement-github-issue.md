---
description: Implement a GitHub issue with the full workflow (branch, code, tests, changeset, PR)
---

# Implement GitHub Issue

You are about to implement GitHub issue: $ARGUMENTS

## Implementation Workflow

### 1. Analyze the Issue

```bash
gh issue view $ARGUMENTS
```

- Review the full issue description
- If it contains Gherkin specs, parse acceptance criteria carefully
- Identify non-goals and constraints
- Note any technical requirements

### 2. Research Codebase

- Search for relevant existing `src/` code and `tests/` coverage
- Identify files needing modification
- Look for similar patterns to maintain consistency (`docs/PATTERNS.md`)
- Review existing tests for patterns (`docs/TESTING.md`)

### 3. Plan Implementation

Create a plan with:

- Core functionality breakdown
- Test strategy (unit + property-based)
- Files to create/modify
- Edge cases and risks

### 4. Create Feature Branch

```bash
# Branch name must match <type>/<description> (validate-branch-name)
git checkout -b <type>/<issue-number>-<description>
# Example: feat/42-user-authentication
```

### 5. Implement Solution

- Follow patterns in AGENTS.md and `docs/PATTERNS.md`: Zod validation in `src/config.ts`, structured logging via `createChildLogger` from `src/logger.js`, JSDoc on public APIs
- Write clean, focused functions (complexity ≤10, ≤50 lines, ≤4 params, depth ≤3, ≤15 statements)
- Do not add barrel re-exports; import direct `.js`-extension paths (NodeNext ESM)
- Keep `src/config.ts` and `src/logger.ts` intact; extend the Zod schema + `.env.example` for new env vars

### 6. Write Tests

Required test coverage:

- **Unit tests** in `tests/*.spec.ts`
- **Property-based tests** in `tests/*.property.spec.ts` (fast-check) for core invariants
- Test both success and failure cases
- Keep coverage at lines/functions/statements ≥90%, branches ≥80%

### 7. Verify Quality

```bash
pnpm quick-check  # Fast loop: typecheck + lint + tests
pnpm precommit    # Full gate: audit, linters, dead code, test:coverage (slow)
```

### 8. Create Changeset

**Changeset Guidance:**

```bash
# Bug fix
pnpm changeset  # Select: patch
# "Fix: [brief description of what was fixed]"

# New feature
pnpm changeset  # Select: minor
# "Add [feature name]: [brief description]"

# Breaking change
pnpm changeset  # Select: major
# "BREAKING: [what changed and migration required]"

# Non-code changes (docs, tests, CI/refactor)
pnpm changeset --empty
```

### 9. Commit Changes

```bash
git add .
git commit -m "<type>: <description>

<body-if-needed>

Closes #<issue-number>"
```

Pre-commit runs the full `pnpm precommit`; commit messages are validated by commitlint (conventional commits).

### 10. Create Pull Request

```bash
git push -u origin <branch-name>

gh pr create \
  --title "<type>: <description>" \
  --body "## Pull request type
- [x] <Bugfix|Feature|Refactoring|Build|Documentation|Other>

## What is the current behavior?

Issue Number: #<issue-number>

## What is the new behavior?

- <change 1>
- <change 2>

## Other information

- Tests: unit + property-based added; coverage thresholds hold
- Changeset: <patch/minor/major: message>" \
  --assignee @me
```

### 11. Monitor CI

```bash
gh pr checks --watch
```

PRs run validate (audit, typecheck, lint, format, tests, coverage, changeset status) + CodeQL. Address failures, re-push, and repeat.

### 12. Address Feedback

- Respond to review comments
- Make requested changes
- Re-verify with `pnpm precommit` before each push

### 13. Merge PR

```bash
# After approval and passing checks
gh pr merge --squash --delete-branch
```

## Key Points

- **Follow coding standards** in AGENTS.md and `docs/PATTERNS.md`
- **Test thoroughly** - unit + property-based tests required
- **Use changesets** for version management
- **Conventional commits** for clear history
- **Quality first** - all gates must pass

## Success Checklist

Before completing:

- [ ] All acceptance criteria met
- [ ] Tests comprehensive (unit + property)
- [ ] `pnpm precommit` passes
- [ ] Documentation updated
- [ ] Changeset created and up to date
- [ ] PR reviewed and approved
