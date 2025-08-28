# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm install` - Install dependencies (use pnpm 10, Node 22 via mise)
- `pnpm build` - Build TypeScript to dist/
- `pnpm typecheck` - Type check without emitting files
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Check Prettier formatting
- `pnpm format:fix` - Apply Prettier formatting
- `pnpm precommit` - Run all checks (audit, typecheck, lint, format, test)
- `pnpm verify` - Alias for pnpm precommit (for backwards compatibility)

### Testing

- `pnpm test` - Run tests without coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm coverage:report` - Generate detailed coverage report
- `vitest run tests/specific.spec.ts` - Run a single test file
- `vitest -t "test name"` - Run tests matching a pattern
- Test files: `tests/*.spec.ts` for unit tests, `tests/*.property.spec.ts` for property-based tests

### Release & Security

- `pnpm changeset` - Create a changeset for your changes (interactive)
- `pnpm changeset --empty` - Create empty changeset for non-release changes
- `pnpm changeset:from-commits` - Generate changeset from conventional commits
- `pnpm release:auto` - Auto-generate changeset and version
- `pnpm changeset status` - Check status of changesets
- `pnpm sbom` - Generate SBOM file in CycloneDX format (sbom.cdx.json)
- `pnpm release` - Version packages with Changesets and build
- `pnpm release:publish` - Build and publish packages
- `pnpm release:tag` - Commit changes and create git tag for release
- `pnpm lint-staged` - Run lint-staged (formats and lints staged files only)

## Architecture & Patterns

### Project Structure

- **Test-as-contract**: Property-based testing with fast-check for invariants, unit tests with Vitest
- **Type safety**: Strict TypeScript with runtime validation using Zod for external boundaries
- **Module system**: ES modules (`"type": "module"`) with NodeNext resolution
- **Claude Commands**: Custom commands in `.claude/commands/` for common workflows
- **Git Hooks**: Custom pre-commit verification via `.claude/hooks/`

### Project Layout

```
src/               # Source code - ES modules with .ts extension
tests/            # Test files - *.spec.ts (unit), *.property.spec.ts (property-based)
dist/             # Build output (gitignored)
.claude/          # Claude Code configurations and commands
```

### Key Patterns

#### 1. Validation Pattern

Use Zod schemas for runtime validation at system boundaries:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().positive().int(),
});

type User = z.infer<typeof UserSchema>;

export function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

#### 2. Property Testing Pattern

Use fast-check for testing invariants:

```typescript
import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

describe('myFunction', () => {
  it.prop([fc.integer(), fc.integer()])('should be commutative', (a, b) => {
    expect(myFunction(a, b)).toBe(myFunction(b, a));
  });
});
```

Common properties to test:

- Commutativity: `f(a, b) === f(b, a)`
- Associativity: `f(f(a, b), c) === f(a, f(b, c))`
- Identity: `f(a, identity) === a`
- Idempotence: `f(f(a)) === f(a)`
- Round-trip: `decode(encode(a)) === a`

#### 3. Import Extensions

Always use `.js` extension in imports for ES modules:

```typescript
import { myFunction } from './module.js'; // ✓ Correct
import { myFunction } from './module'; // ✗ Wrong
```

### CI/CD Pipeline

- **GitHub Actions** enforces: audit → typecheck → lint → format → test → OSV scan → SBOM generation
- **Security scanning**: CodeQL analysis and OSV vulnerability scanning
- **Pre-commit hooks** via Husky run lint-staged (Prettier and ESLint)
- **Attestations**: SLSA provenance and SBOM attestations for build artifacts
- **Single-user workflow**: Simplified for individual developers without branch protection
- **Release automation**: Automatically creates version PRs and manages releases

### Development Process

1. (Optional) Use `/spec-feature` to create a feature spec as a GitHub issue
2. Implement with tests (property-based for core logic)
3. Run `pnpm verify` before committing
4. Use Conventional Commits format (`feat:`, `fix:`, etc.)
5. Add a changeset for your changes: `pnpm changeset`
6. Create a pull request for review - **never push directly to main**

## GitHub CLI Commands

Common gh commands for this repository:

- `gh issue list` - List open issues
- `gh issue view <number>` - View issue details
- `gh pr create --title "title" --body "description"` - Create a pull request
- `gh pr checks` - View CI status for current PR
- `gh pr merge --auto --squash` - Enable auto-merge for PR

## Claude Commands

Available slash commands in `.claude/commands/`:

- `/spec-feature` - Create a feature specification in Gherkin format as a GitHub issue
- `/implement-github-issue` - Implement a GitHub issue with full workflow
- `/update-dependencies` - Update all dependencies to latest versions with PR workflow

## Configuration

- **Package Manager**: pnpm 10.15.0 (specified in package.json)
- **Node Version**: >=22.0.0 (engines requirement)
- **TypeScript**: Strict mode with NodeNext module resolution
- **Testing**: Vitest with V8 coverage provider
- **Linting**: ESLint 9 with TypeScript support
- **Formatting**: Prettier 3 with ESLint integration
- **Versioning**: Changesets for automated version management

## Changeset Best Practices

### When to Add a Changeset

Always add a changeset when your PR includes:

- Bug fixes (patch)
- New features (minor)
- Breaking changes (major)
- Documentation updates that affect usage (patch)

### When to Use Empty Changeset

Use `pnpm changeset --empty` when:

- Only updating tests
- Updating CI/CD configuration
- Internal refactoring with no API changes
- Updating dev dependencies

### Example Workflow

```bash
# Make your changes
git checkout -b feature/my-feature

# After implementing changes
pnpm verify  # Ensure all checks pass

# Add a changeset
pnpm changeset  # Interactive prompt

# Commit with conventional commit message
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

The CI will validate that a changeset is present, and the release workflow will automatically create version PRs when changes are merged to main.

## Coding Standards

### Type Safety

- **Use TypeScript strictly** - Avoid `any`, use `unknown` when type is truly unknown
- **Define explicit types** - For function parameters, return types, and complex objects
- **Runtime validation** - Use Zod for data from external sources (APIs, user input, files)

### Testing Requirements

- **Unit tests** (`tests/*.spec.ts`) - Test functions in isolation
- **Property-based tests** (`tests/*.property.spec.ts`) - Required for business logic
- **Test coverage** - Aim for high coverage of new code
- **Test naming** - Use descriptive names that explain what is being tested
- **Test independence** - Tests should not depend on execution order
- **Assertions** - Use multiple assertions to thoroughly verify behavior

### Code Quality Guidelines

- **Function size** - Keep functions small and focused (single responsibility)
- **Error handling** - Comprehensive error handling with meaningful messages
- **Comments** - Document complex logic and public APIs with JSDoc
- **Performance** - Consider performance implications, avoid premature optimization
- **Security** - Never hardcode secrets, validate all inputs, sanitize outputs

### Branch Naming Convention

```bash
<type>/<issue-number>-<brief-description>

# Examples:
feat/42-user-authentication
fix/13-validation-error
chore/7-update-dependencies
```

### Commit Message Format

```bash
<type>(<scope>): <description>

<optional-body>

Closes #<issue-number>

# Types: feat, fix, docs, style, refactor, test, chore, perf
# Example:
git commit -m "feat(auth): implement JWT authentication

- Added login/logout endpoints
- Implemented JWT token generation
- Added refresh token support

Closes #42"
```

## Critical Workflow Notes

### Before Committing

1. **Always run `pnpm verify`** - Ensures all checks pass (typecheck, lint, format, tests)
2. **Use conventional commits** - Format: `type(scope): description` (e.g., `feat: add dark mode`)
3. **Add changesets** - Run `pnpm changeset` to document your changes for the release notes
4. **Use the correct import syntax** - Always use `.js` extension for local ES module imports

### Troubleshooting Common Issues

#### Pre-commit Hook Fails

```bash
pnpm format:fix  # Fix formatting issues
pnpm lint:fix    # Fix linting issues
pnpm test        # Ensure tests pass
```

#### Type Errors

- Check imports include `.js` extension
- Verify TypeScript version compatibility
- Ensure strict mode compliance

#### Test Failures

```bash
pnpm test:watch  # Run tests in watch mode
# Check for:
# - Shared state between tests
# - Missing mock/stub cleanup
# - Async operations not awaited
```

### CI/CD Workflow

- **PR validation**: `.github/workflows/pr.yml` - Runs all checks on pull requests
- **Release automation**: `.github/workflows/main.yml` - Handles releases when PRs are merged
- **Parallel validation**: All checks run simultaneously for faster CI
- **Changeset-driven releases**: Uses changesets for version management and changelog generation
- **Security scanning**: CodeQL and OSV vulnerability scanning on all PRs

### Automatic Release Process

The workflow automatically handles releases when PRs with changesets are merged to main:

1. **PR merge triggers workflow** - Main workflow runs after PR is merged
2. **Checks for changesets** - Determines if a release is needed
3. **Versions and tags automatically** - Updates version, generates CHANGELOG.md
4. **Creates GitHub release** - With changelog, build artifacts, and SBOM
5. **Publishes to npm** - If NPM_TOKEN is configured
6. **Uses [skip actions]** - Prevents release commits from triggering duplicate workflows

Key principle: **No duplicate builds** - The workflow checks out code at the release tag and builds only what's needed for each distribution channel.

Required secrets for distribution:

- `NPM_TOKEN` - For npm publishing
- `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` - For Docker Hub (optional)
- `SLACK_WEBHOOK` - For Slack notifications (optional)

Required variables:

- `ENABLE_DOCKER_RELEASE` - Set to 'true' to enable Docker builds
- `ENABLE_DOCS_RELEASE` - Set to 'true' to enable documentation deployment
