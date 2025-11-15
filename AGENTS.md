# AGENTS.md

This file provides guidance to AI agents (such as Claude Code at claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm install` - Install dependencies (use pnpm 10, Node 22 via mise)
- `pnpm build` - Build TypeScript to dist/
- `pnpm typecheck` - Type check without emitting files
- `pnpm lint` - Run ESLint (fails on any violations)
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Check Prettier formatting
- `pnpm format:fix` - Apply Prettier formatting
- `pnpm precommit` - Run all quality checks in optimized order (see below)

**Pre-commit Check Order (optimized for fast feedback and fail-fast):**

1. `pnpm audit` - Security first (critical vulnerabilities block commits)
2. `pnpm format` - Instant feedback, easy to fix
3. `pnpm lint:spelling` - Fast spell checking
4. `pnpm lint:yaml` - Fast file linting
5. `pnpm lint:markdown` - Fast file linting
6. `pnpm lint:workflows` - Fast workflow validation
7. `pnpm typecheck` - Required for type-aware lint rules
8. `pnpm lint` - Comprehensive quality checks (12 ESLint plugins, depends on typecheck)
9. `pnpm deps:circular` - Circular dependency detection (madge)
10. `pnpm deps:cruise` - Architectural dependency validation (dependency-cruiser)
11. `pnpm duplication` - Code duplication analysis (jscpd)
12. `pnpm dead-code` - Unused exports/files/deps/types (Knip)
13. `pnpm ts-prune` - Unused TypeScript exports (ts-prune)
14. `pnpm test:coverage` - Slowest check, runs last (80% minimum threshold)

**Note:** The following tools are excluded from precommit due to performance/use-case:

- `pnpm mutation-test` - Run periodically (weekly/monthly)
- `pnpm scan:secrets` - Run manually or in CI (can use `scan:secrets:protect` for staged changes)
- `pnpm publint` / `pnpm attw` - Run before publishing, not every commit
- `pnpm size` - Run before release or when concerned about bundle size
- `pnpm license:check` - Run when adding dependencies or before release
- `pnpm deps:unused` - Too many false positives, use Knip instead (already in precommit)

### Testing

- `pnpm test` - Run tests without coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report and **80% minimum threshold enforcement**
- `pnpm coverage:report` - Generate detailed coverage report
- `vitest run tests/specific.spec.ts` - Run a single test file
- `vitest -t "test name"` - Run tests matching a pattern
- Test files: `tests/*.spec.ts` for unit tests, `tests/*.property.spec.ts` for property-based tests

**Coverage Requirements**: This project enforces 80% minimum coverage for lines, branches, functions, and statements. Coverage checks will fail in CI if thresholds are not met.

### Code Quality & Complexity

- `pnpm lint` - Check code quality and complexity (via ESLint, fails on violations)
- `pnpm deps:circular` - Find circular dependencies (fails if found)
- `pnpm deps:graph` - Generate dependency graph
- `pnpm deps:summary` - Show dependency summary
- `pnpm deps:check` - Check for outdated dependencies
- `pnpm deps:update:minor` - Update dependencies to latest minor versions
- `pnpm deps:update:patch` - Update dependencies to latest patch versions
- `pnpm dead-code` - Find unused exports, files, dependencies, and types (via Knip)
- `pnpm duplication` - Check code duplication (fails if >2% threshold exceeded)
- `pnpm mutation-test` - Run mutation testing to verify test quality (via Stryker)
- `pnpm mutation-test:incremental` - Run mutation testing with incremental mode (faster)
- `pnpm metrics` - Run all quality metrics (deps summary, circular deps, duplication)
- `pnpm metrics:update` - Extract and update quality-metrics.json file for README badges

**Complexity Thresholds**: This project enforces strict code quality limits via ESLint and dedicated analyzers:

| Metric                    | Threshold | Scope        |
| ------------------------- | --------- | ------------ |
| **Cyclomatic Complexity** | 10        | Per function |
| **Max Function Lines**    | 50        | Per function |
| **Max Parameters**        | 4         | Per function |
| **Max Nesting Depth**     | 3         | Per function |
| **Max Statements**        | 15        | Per function |
| **Max Nested Callbacks**  | 3         | Per function |
| **Code Duplication**      | 2%        | Project-wide |

All violations trigger **errors** and cause `pnpm lint` to fail. These rules apply to `src/**/*.ts`.

**Tools Used**:

- **@typescript-eslint/eslint-plugin** - Strict TypeScript type checking with type-aware rules
  - Floating promise detection
  - Strict boolean expressions
  - Unnecessary conditions and type assertions
  - Promise/async best practices
- **eslint-plugin-unicorn** - Modern JavaScript patterns and code quality
  - Modern Math APIs
  - Node.js protocol imports
  - String manipulation best practices
  - Array method preferences
- **eslint-plugin-promise** - Promise/async patterns and error handling
  - Promise return values
  - Catch or return enforcement
  - Async/await preference
- **eslint-plugin-import** - Import/export organization and circular dependency detection
  - No circular dependencies
  - Import ordering
  - No duplicate imports
- **eslint-plugin-no-barrel-files** - Prevent barrel file anti-patterns
- **ESLint core rules** - Cyclomatic complexity, max lines, max params, max nesting, max statements, max callbacks
- **madge** - Circular dependency detection
- **jscpd** - Code duplication analysis (2% threshold triggers failure)
- **Knip** - Dead code detection (unused exports, files, dependencies, types)
- **Stryker Mutator** - Mutation testing for test quality verification (80% threshold)
- **npm-check-updates** - Dependency freshness tracking

**Test File Relaxed Thresholds** (`tests/**/*.ts`):

- Cyclomatic complexity: 15 (vs 10 for src)
- Max function lines: 600 (vs 50 for src) - allows large describe blocks with many test cases
- All other rules: same as src files

### Quality Metrics Dashboard

The project includes an automated quality metrics system that powers the comprehensive dashboard in README.md:

**Files:**

- `quality-metrics.json` - Auto-generated metrics file (updated by CI on every main build)
- `scripts/extract-quality-metrics.js` - Metrics extraction script
- `.github/workflows/main.yml` - Contains `update-metrics` job that updates metrics

**Metrics Tracked:**

- **Test Coverage** - Lines, branches, functions, statements (from Vitest coverage reports)
- **Code Duplication** - Percentage, lines, tokens, clones (from jscpd reports)
- **Mutation Testing** - Score, mutants killed/survived (from Stryker reports, when available)
- **Complexity Thresholds** - Documented limits for reference

**How It Works:**

1. On push to main, validation workflow runs quality checks (tests, duplication analysis, etc.)
2. Validation workflow uploads coverage and quality reports as artifacts
3. `update-metrics` job downloads the artifacts and extracts metrics
4. `quality-metrics.json` is updated and committed automatically (if changed)
5. README badges use shields.io dynamic JSON endpoint to display current metrics from the committed file

**Manual Update:**

Run `pnpm metrics:update` locally after running quality checks to update the metrics file manually.

**Badge URLs:**

Badges in README.md use shields.io dynamic JSON endpoints:

```
https://img.shields.io/badge/dynamic/json
  ?url=https://raw.githubusercontent.com/.../quality-metrics.json
  &query=$.coverage.lines
  &suffix=%25
  &label=Coverage
  &color=brightgreen
```

**Note:** After updating `quality-metrics.json`, badges will refresh automatically (shields.io caches for ~5 minutes).

### Container Security

**Prerequisites**: Docker and Trivy must be installed locally (`brew install aquasecurity/trivy/trivy` on macOS).

- `pnpm scan:container` - Run container security scan locally (builds and scans Docker image)
- `pnpm scan:container:sarif` - Generate SARIF report for GitHub Security integration
- `./scripts/scan-container.sh --help` - View all scanning options
- **Severity Threshold**: Default fails on HIGH and CRITICAL vulnerabilities
- **False Positives**: Add CVEs to `.trivyignore` with explanatory comments
- **CI/CD Integration**: Scans run automatically before Docker Hub publication (Trivy installed automatically in CI)

### Secret Scanning

**Prerequisites**: Gitleaks must be installed locally (`brew install gitleaks` on macOS) or run in CI.

- `pnpm scan:secrets` - Scan repository for secrets (default mode)
- `pnpm scan:secrets:protect` - Scan staged changes only (pre-commit mode)
- `pnpm scan:secrets:history` - Scan full git history (comprehensive audit)
- `pnpm scan:secrets:report` - Generate JSON report in reports/gitleaks-report.json
- **Configuration**: `.gitleaks.toml` (extends default rules)
- **Allowlist**: `.gitleaksignore` for false positives (document reasons)
- **Integration**: Can be added to pre-commit hooks or run manually/in CI

### Package Publishing & Validation

- `pnpm publint` - Validate package.json for npm publishing (checks exports, files field)
- `pnpm attw` - Check TypeScript types exports with arethetypeswrong
- `pnpm ts-prune` - Find unused TypeScript exports (complements Knip)
- `pnpm pkg:validate` - Run both publint and attw together
- **Note**: publint and attw are for pre-release validation, ts-prune runs in precommit

### Documentation Generation

- `pnpm docs:generate` - Generate API documentation with TypeDoc (output: docs/)
- `pnpm docs:api` - Build project and extract API surface with Microsoft API Extractor
- **Configuration**: `typedoc.json` and `api-extractor.json`
- **Output**: TypeDoc generates HTML docs, API Extractor creates API reports and .d.ts rollups

### Advanced Dependency Analysis

- `pnpm deps:cruise` - Validate dependencies against architectural rules (dependency-cruiser)
- `pnpm deps:cruise:graph` - Generate visual dependency graph (SVG)
- `pnpm deps:unused` - Find unused dependencies with depcheck
- **Configuration**: `.dependency-cruiser.js` defines dependency rules and constraints
- **Complements**: Works alongside existing madge-based circular dependency detection

### License Compliance

- `pnpm license:check` - Display license summary for all dependencies
- `pnpm license:report` - Generate detailed JSON license report
- `pnpm license:csv` - Generate CSV license report
- **Use**: Ensure license compatibility, generate compliance reports for legal review

### Performance & Size Monitoring

- `pnpm size` - Check bundle size against limits (fails if exceeded)
- `pnpm perf:bench` - HTTP benchmark with autocannon (100 concurrent, 10s duration)
- **Configuration**: `.size-limit.json` defines size limits per bundle
- **Use**: Prevent bundle bloat, establish performance baselines

### Developer Experience

- `pnpm commit` - Interactive conventional commit creation with commitizen
- **Branch Validation**: validate-branch-name enforces pattern: `<type>/<description>`
  - Valid types: feat, fix, docs, style, refactor, perf, test, chore, revert
  - Example: `feat/add-authentication` or `fix/memory-leak`
  - Configuration: `.validate-branch-namerc.json`
- **Test UI**: `pnpm test:ui` - Visual test interface with @vitest/ui

### Release & Security

- `pnpm changeset` - Create a changeset for your changes
- `pnpm changeset --empty` - Create empty changeset for non-release changes
- `pnpm changeset:status` - Check status of changesets
- `pnpm sbom` - Generate SBOM file in CycloneDX format (sbom.cdx.json)
- `pnpm release` - Version packages with Changesets and build
- `pnpm release:publish` - Build and publish packages
- `pnpm release:tag` - Commit changes and create git tag for release
- `pnpm lint-staged` - Run lint-staged (formats and lints staged files only)

## Architecture & Patterns

### Project Structure

- **Test-as-contract**: Property-based testing with fast-check for invariants, unit tests with Vitest
- **Type safety**: Strict TypeScript with runtime validation using Zod for external boundaries
- **Advanced linting**: TypeScript ESLint with type-aware rules for catching subtle type-safety issues
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

#### 3. Structured Logging Pattern

Use Pino logger for structured logging:

```typescript
import { createChildLogger } from './logger.js';

const logger = createChildLogger('module-name');

// Log with context
logger.info({ userId: '123', action: 'login' }, 'User logged in');

// Sensitive data is automatically redacted
logger.info({ password: 'secret', safe: 'data' }, 'Request processed');
// Output will redact password field
```

#### 4. Import Extensions

Always use `.js` extension in imports for ES modules:

```typescript
import { myFunction } from './module.js'; // ✓ Correct
import { myFunction } from './module'; // ✗ Wrong
```

### CI/CD Pipeline

- **GitHub Actions** enforces: audit → typecheck → lint → format → test → OSV scan → container scan → SBOM generation
- **Security scanning**: CodeQL analysis, OSV vulnerability scanning, and Trivy container image scanning
- **Container security**: Automatic vulnerability scanning of Docker images with configurable severity thresholds
- **Pre-commit hooks** via Husky run lint-staged (Prettier and ESLint)
- **Attestations**: SLSA provenance and SBOM attestations for build artifacts, including container scan results
- **Single-user workflow**: Simplified for individual developers without branch protection
- **Release automation**: Automatically creates version PRs and manages releases

### Development Process

1. (Optional) Use `/spec-feature` to create a feature spec as a GitHub issue
2. Implement with tests (property-based for core logic)
3. Run `pnpm precommit` before committing (runs all quality checks)
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
- **Testing**: Vitest with V8 coverage provider + @vitest/ui for visual testing interface
- **Linting**: ESLint 9 with comprehensive plugin ecosystem (11 plugins)
  - **@typescript-eslint**: Type-aware rules (floating promises, unsafe assertions, strict boolean expressions)
  - **eslint-plugin-sonarjs**: Code quality and bug detection (cognitive complexity, duplicate conditions)
  - **eslint-plugin-security**: Security-focused linting (eval detection, unsafe regex, command injection)
  - **eslint-plugin-n**: Node.js best practices (deprecated APIs, proper file extensions)
  - **@eslint-community/eslint-plugin-eslint-comments**: ESLint directive validation
  - **eslint-plugin-regexp**: Advanced regex validation and optimization
  - **eslint-plugin-jsdoc**: JSDoc/TSDoc documentation quality
  - **eslint-plugin-unicorn**: Modern JavaScript patterns
  - **eslint-plugin-promise**: Promise/async best practices
  - **eslint-plugin-import**: Import organization and circular dependency detection
  - **eslint-plugin-no-barrel-files**: Barrel file anti-pattern prevention
  - **eslint-plugin-jsonc**: JSON/JSONC/JSON5 linting
  - Type-aware rules apply to `src/**/*.ts` and `tests/**/*.ts` files
  - Performance: ~2-3s for full project lint (enhanced coverage)
- **Formatting**: Prettier 3 with ESLint integration
- **Versioning**: Changesets for automated version management
- **Documentation**: TypeDoc (API docs) + Microsoft API Extractor (API surface analysis)
- **Package Publishing**: publint + arethetypeswrong + ts-prune
- **Dependency Analysis**: madge + dependency-cruiser + depcheck
- **Secret Scanning**: Gitleaks (configuration in .gitleaks.toml)
- **License Compliance**: license-checker
- **Performance**: size-limit (bundle size tracking) + autocannon (HTTP benchmarking)
- **Developer Experience**: commitizen (conventional commits) + validate-branch-name

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

### Creating and Editing Changesets

Use `pnpm changeset` to create a changeset file, then edit it as needed:

```bash
# Create a changeset (generates a file in .changeset/)
pnpm changeset

# The command creates a file like: .changeset/fuzzy-pandas-dance.md
# Edit the generated file to adjust version bump or description:

# Example 1: Change to minor version for a feature
cat > .changeset/fuzzy-pandas-dance.md << 'EOF'
---
"agentic-node-ts-starter": minor
---

feat: Add new authentication system with JWT support
EOF

# Example 2: Change to patch for a bug fix
cat > .changeset/fuzzy-pandas-dance.md << 'EOF'
---
"agentic-node-ts-starter": patch
---

fix: Resolve memory leak in logger initialization
EOF

# For non-release changes
pnpm changeset --empty
```

### Example Workflow

```bash
# Make your changes
git checkout -b feature/my-feature

# After implementing changes
pnpm precommit  # Ensure all checks pass

# Add a changeset
pnpm changeset
# Then edit the generated .changeset/*.md file if needed

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
- **Test coverage** - **Minimum 80% coverage enforced** for lines, branches, functions, and statements
- **Test naming** - Use descriptive names that explain what is being tested
- **Test independence** - Tests should not depend on execution order
- **Assertions** - Use multiple assertions to thoroughly verify behavior
- **Coverage enforcement** - Tests fail if coverage drops below 80% in any metric

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

1. **Always run `pnpm precommit`** - Ensures all checks pass in optimized order (see Development Commands section for details)
2. **Use conventional commits** - Format: `type(scope): description` (e.g., `feat: add dark mode`)
3. **Add changesets** - Run `pnpm changeset` to document your changes for the release notes
4. **Use the correct import syntax** - Always use `.js` extension for local ES module imports

### Troubleshooting Common Issues

#### Pre-commit Hook Fails

```bash
pnpm format:fix  # Fix formatting issues (including markdown and YAML)
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

## Customizing AGENTS.md for Your Project

When adapting this template for your specific project, update this file to include:

### 1. Project-Specific Context

```markdown
## Project Overview

This is a [your project type] application that [brief description].
Key technologies: [list your stack]
Target users: [who will use this]
```

### 2. Business Rules & Constraints

```markdown
## Business Rules

1. [Critical rule 1]
2. [Critical rule 2]

## Technical Constraints

- Must support [requirement]
- Cannot use [technology] because [reason]
- Performance requirement: [metric]
```

### 3. Code Conventions

```markdown
## Our Conventions

- Component naming: [pattern]
- File organization: [structure]
- API design: [style]
- Error handling: [approach]
```

### 4. Testing Requirements

```markdown
## Testing Strategy

- Always test: [critical paths]
- Property test: [business logic]
- Mock: [external services]
- Skip testing: [generated code]
```

### 5. Common Tasks

```markdown
## Common Development Tasks

- To add a new API endpoint: [steps]
- To add a new database model: [steps]
- To update dependencies: [process]
```

### Example Project-Specific AGENTS.md Addition

```markdown
## Project: E-Commerce API

### Domain Context

- We process payments using Stripe
- Inventory is managed in real-time
- Orders must maintain ACID properties
- Customer data requires GDPR compliance

### Architecture Decisions

- Use PostgreSQL for transactional data
- Redis for session management
- Event-driven architecture for order processing
- RESTful API with OpenAPI documentation

### Code Patterns

- All monetary values use Decimal.js
- Dates are stored in UTC
- API responses follow JSend specification
- Use repository pattern for data access

### Security Requirements

- Never log payment information
- PII must be encrypted at rest
- API requires authentication except /health
- Rate limiting on all endpoints
```
