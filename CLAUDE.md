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
- `pnpm verify` - Run all checks (audit, typecheck, lint, format, test)

### Testing

- `pnpm test` - Run tests once with coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm coverage:report` - Generate detailed coverage report
- Test files: `tests/*.spec.ts` for unit tests, `tests/*.property.spec.ts` for property-based tests

### Release & Security

- `pnpm changeset` - Create a changeset for your changes (interactive)
- `pnpm changeset --empty` - Create empty changeset for non-release changes
- `pnpm changeset status` - Check status of changesets
- `pnpm sbom` - Generate SBOM file in CycloneDX format (sbom.cdx.json)
- `pnpm release` - Version packages with Changesets and build
- `pnpm release:publish` - Build and publish packages
- `pnpm release:tag` - Commit changes and create git tag for release
- `pnpm precommit` - Run lint-staged (automatically triggered by Husky)

## Architecture & Patterns

### Project Structure

- **Spec-first approach**: Features start with specifications in `specs/SPEC.md` using Gherkin-style acceptance criteria
- **Test-as-contract**: Property-based testing with fast-check for invariants, unit tests with Vitest
- **Type safety**: Strict TypeScript with runtime validation using Zod for external boundaries
- **Module system**: ES modules (`"type": "module"`) with NodeNext resolution
- **Claude Commands**: Custom commands in `.claude/commands/` for common workflows
- **Git Hooks**: Custom pre-commit verification via `.claude/hooks/`

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
- **Trunk-based development** with branch protection and linear history

### Development Process

1. Write/update specifications in `specs/SPEC.md`
2. Implement with tests (property-based for core logic)
3. Run `pnpm verify` before committing
4. Create a changeset with `pnpm changeset` for user-facing changes
5. Use Conventional Commits format
6. Push and create PR - CI will validate changeset presence

## Claude Commands

Available slash commands in `.claude/commands/`:

- `/analyze-and-fix-github-issue` - Analyze and fix a GitHub issue with full workflow
- `/release` - Create a new version release following semantic versioning
- `/update-dependencies` - Update all dependencies to latest versions with PR workflow

## Configuration

- **Package Manager**: pnpm 10.0.0 (specified in package.json)
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
