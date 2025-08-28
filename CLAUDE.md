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

1. **Validation Pattern**: Use Zod schemas for runtime validation at system boundaries

   ```typescript
   const Schema = z.object({ ... });
   type Schema = z.infer<typeof Schema>;
   ```

2. **Property Testing**: Use fast-check for testing invariants (commutativity, identity, etc.)

3. **Import Extensions**: Always use `.js` extension in imports for ES modules:
   ```typescript
   import { function } from './module.js';
   ```

### CI/CD Pipeline

- **GitHub Actions** enforces: audit → typecheck → lint → format → test → OSV scan → SBOM generation
- **Security scanning**: CodeQL analysis and OSV vulnerability scanning
- **Pre-commit hooks** via Husky run lint-staged (Prettier and ESLint)
- **Attestations**: SLSA provenance and SBOM attestations for build artifacts
- **Single-user workflow**: Simplified for individual developers without branch protection
- **Release automation**: Automatically creates version PRs and manages releases

### Development Process

1. Implement with tests (property-based for core logic)
2. Run `pnpm verify` before committing
3. Use Conventional Commits format (`feat:`, `fix:`, etc.)
4. Add a changeset for your changes: `pnpm changeset`
5. Create a pull request for review - **never push directly to main**

## GitHub CLI Commands

Common gh commands for this repository:

- `gh issue list` - List open issues
- `gh issue view <number>` - View issue details
- `gh pr create --title "title" --body "description"` - Create a pull request
- `gh pr checks` - View CI status for current PR
- `gh pr merge --auto --squash` - Enable auto-merge for PR

## Claude Commands

Available slash commands in `.claude/commands/`:

- `/analyze-and-fix-github-issue` - Analyze and fix a GitHub issue with full workflow
- `/release` - Guide for the automated Changesets release process
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

## Critical Workflow Notes

### Before Committing

1. **Always run `pnpm verify`** - Ensures all checks pass (typecheck, lint, format, tests)
2. **Use conventional commits** - Format: `type(scope): description` (e.g., `feat: add dark mode`)
3. **Add changesets** - Run `pnpm changeset` to document your changes for the release notes
4. **Use the correct import syntax** - Always use `.js` extension for local ES module imports

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
