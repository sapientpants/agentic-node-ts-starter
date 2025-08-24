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
- `pnpm format:write` - Apply Prettier formatting
- `pnpm verify` - Run all checks (typecheck, lint, format, test)

### Testing

- `pnpm test` - Run tests once with coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm coverage:report` - Generate detailed coverage report
- Test files: `tests/*.spec.ts` for unit tests, `tests/*.property.spec.ts` for property-based tests

### Release & Security

- `pnpm sbom` - Generate SBOM files (SPDX and CycloneDX formats)
- `pnpm release` - Version packages with Changesets
- `pnpm release:tag` - Commit and tag release

## Architecture & Patterns

### Project Structure

- **Spec-first approach**: Features start with specifications in `specs/SPEC.md` using Gherkin-style acceptance criteria
- **Test-as-contract**: Property-based testing with fast-check for invariants, unit tests with Vitest
- **Type safety**: Strict TypeScript with runtime validation using Zod for external boundaries
- **Module system**: ES modules (`"type": "module"`) with NodeNext resolution

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

- GitHub Actions enforces: typecheck → lint → test → OSV scan → SBOM generation
- Pre-commit hooks via Husky run Prettier and ESLint
- Trunk-based development with branch protection and linear history

### Development Process

1. Write/update specifications in `specs/SPEC.md`
2. Implement with tests (property-based for core logic)
3. Run `pnpm verify` before committing
4. Use Conventional Commits format
5. Create Changesets for version bumps
