# Development Guide

> **Quick Start**: Run `pnpm install` to install dependencies, then `pnpm dev` to start development.

## Daily Development Workflow

### 🚀 Starting Development

```bash
# Start development
pnpm dev        # TypeScript watch mode
pnpm test:watch # Test watch mode
```

### 🔍 Quick Quality Checks

```bash
# Fast check before committing
pnpm quick-check  # typecheck + lint + test

# Full verification (like CI)
pnpm verify       # All quality gates including audit + format
```

### 🧪 Testing

```bash
# Watch mode (development)
pnpm test:watch

# Single run
pnpm test

# With coverage (80% minimum threshold enforced)
pnpm test:coverage

# Coverage in browser
pnpm coverage:open
```

> **📊 Coverage Requirements**: This project enforces **80% minimum coverage** for lines, branches, functions, and statements. The CI pipeline will fail if coverage drops below this threshold.

### 🏗️ Building

```bash
# Production build
pnpm build

# Watch build (rebuilds on file changes)
pnpm build:watch
```

## Development Tools

### 📦 Available Scripts

Run `pnpm help` to see all available scripts, or check these key commands:

| Command              | Description                       | What it runs                             |
| -------------------- | --------------------------------- | ---------------------------------------- |
| `pnpm dev`           | TypeScript watch mode             | `tsc --watch`                            |
| `pnpm test`          | Run tests once                    | `vitest run`                             |
| `pnpm test:watch`    | Test watch mode                   | `vitest`                                 |
| `pnpm test:coverage` | Tests with coverage report        | `vitest run --coverage` (80% threshold)  |
| `pnpm typecheck`     | Type check only                   | `tsc --noEmit`                           |
| `pnpm lint`          | Check linting                     | `eslint .`                               |
| `pnpm format`        | Check formatting                  | `prettier --check .`                     |
| `pnpm verify`        | Full verification (CI equivalent) | audit + typecheck + lint + format + test |
| `pnpm quick-check`   | Fast quality check                | typecheck + lint + test                  |
| `pnpm ci:local`      | Simulate full CI locally          | Complete CI pipeline simulation          |
| `pnpm doctor`        | Check environment health          | Node/pnpm version check                  |

## IDE Setup

### VS Code (Recommended)

The project includes VS Code configuration in `.vscode/`:

- **Auto-formatting** on save
- **ESLint integration** with auto-fix
- **TypeScript strict mode**
- **Vitest integration**
- **Debugging configuration**

**Recommended Extensions** (auto-suggested):

- ESLint
- Prettier
- Vitest Explorer
- TypeScript Importer

### Debugging

- **F5** - Debug Node.js app (builds first)
- **Ctrl+F5** - Debug current test file
- Set breakpoints in `.ts` files (source maps enabled)

## Code Quality

### Type Safety

This project uses **strict TypeScript** with additional safety features:

```typescript
// ✅ Good - explicit types
function processUser(user: User): Promise<UserResult> {
  return validateAndProcess(user);
}

// ❌ Avoid - implicit any
function processUser(user) {
  return user.something;
}
```

### Testing Philosophy

1. **Unit tests** (`.spec.ts`) - Test functions in isolation
2. **Property-based tests** (`.property.spec.ts`) - Test invariants with fast-check

**Test Templates Available:**

- `tests/templates/unit-test.template.ts` - Standard unit test structure
- `tests/templates/property-test.template.ts` - Property-based test patterns

### Documentation & Config Quality

- **Markdown linting** with markdownlint-cli2 ensures consistent documentation
- **YAML validation** with yamllint catches config file issues early
- Run `pnpm format:fix` to automatically fix markdown and YAML formatting issues
- Pre-commit hooks enforce these standards automatically

### Code Organization

```
src/
├── index.ts           # Main entry point
├── logger.ts          # Structured logging
├── dev/               # Development utilities (debug, performance)
└── [your-modules]/    # Feature modules

tests/
├── *.spec.ts         # Unit tests
├── *.property.spec.ts # Property-based tests
├── helpers/          # Test utilities
└── templates/        # Test templates to copy
```

## Performance & Debugging

### Development Debug Tools

```typescript
import { PerformanceTimer, timed, trace, devConsole } from './src/dev/debug-utils.js';

// Time operations
const timer = new PerformanceTimer('slow-operation');
await doSomething();
timer.checkpoint('phase-1');
await doSomethingElse();
timer.end();

// Auto-time methods with decorator
class MyService {
  @timed
  async processData(data: unknown[]) {
    // Method automatically timed in development
  }

  @trace
  criticalMethod() {
    // Method calls automatically logged in development
  }
}

// Enhanced console (development only)
devConsole.log(complexObject, 'debug-label');
devConsole.table(arrayData);
devConsole.time('operation', () => expensiveOperation());
```

### Memory Monitoring

```typescript
import { logMemoryUsage } from './src/dev/debug-utils.js';

// Log current memory usage (development only)
logMemoryUsage('before-operation');
await heavyOperation();
logMemoryUsage('after-operation');
```

## CI/CD Integration

### Local CI Simulation

Before pushing, run CI checks locally:

```bash
# Full CI simulation (slow, thorough)
pnpm ci:local

# Fast CI simulation (skip security scans)
pnpm ci:local:fast

# Quick commands
pnpm verify       # Full verification
pnpm quick-check  # Fast quality check
```

### Pre-commit Hooks

#### What Runs on Every Commit

The project uses Husky to enforce quality checks before each commit. The `precommit` script runs:

1. **Security audit** (`pnpm audit --audit-level critical`) - Checks for critical vulnerabilities
2. **Type check** (`pnpm typecheck`) - Ensures TypeScript types are correct
3. **Linting** (`pnpm lint`) - ESLint checks
4. **Workflow linting** (`pnpm lint:workflows`) - GitHub Actions validation
5. **Markdown linting** (`pnpm lint:markdown`) - Documentation quality
6. **YAML linting** (`pnpm lint:yaml`) - Configuration file validation
7. **Format check** (`pnpm format`) - Prettier formatting verification
8. **Tests** (`pnpm test`) - All test suites must pass

#### Important: No Bypass Allowed

> **🔒 Security Feature**: This project includes a Claude Code hook that **blocks the `--no-verify` flag**. You cannot bypass pre-commit checks with `git commit --no-verify`. This ensures all commits meet quality standards.

If you encounter issues:

```bash
# Fix formatting issues
pnpm format:fix

# Fix linting issues
pnpm lint:fix

# Run full verification to debug
pnpm verify
```

## Troubleshooting

### Common Issues

**TypeScript errors after pulling changes:**

```bash
pnpm reset  # Clean + reinstall dependencies
```

**Tests failing randomly:**

```bash
pnpm test:watch  # Check for shared state between tests
```

**Slow development builds:**

```bash
# Use incremental builds
pnpm dev  # TypeScript watch mode with incremental compilation
```

**Memory issues during development:**

```bash
# Monitor memory usage
node --max-old-space-size=4096 ./node_modules/.bin/vitest
```

### Getting Help

1. **Check documentation**: All guides are in `docs/`
2. **Run diagnostics**: `pnpm doctor`
3. **View available commands**: Check package.json scripts or this documentation
4. **Check CI logs**: Compare local vs CI behavior with `pnpm ci:local`

## Environment Variables

### Development

```bash
# .env.local (not committed)
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=myapp:*
```

### Testing

```bash
NODE_ENV=test
LOG_LEVEL=silent  # Reduce noise in tests
```

### Production

```bash
NODE_ENV=production
LOG_LEVEL=info
CORRELATION_ID=request-uuid  # For request tracing
```

## Release Process

### Creating a Release

1. **Create a changeset** for your changes:

   ```bash
   pnpm changeset
   ```

2. **Merge to main** - This triggers the release workflow

3. **Automatic release** happens if changesets exist:
   - Version bumps based on changesets
   - CHANGELOG.md generation
   - Git tags creation
   - GitHub release creation
   - Optional: npm publishing (if NPM_TOKEN configured)
   - Optional: Docker publishing (if enabled)

### Required Secrets for Releases

| Secret               | Required    | Purpose                                                     |
| -------------------- | ----------- | ----------------------------------------------------------- |
| `RELEASE_TOKEN`      | Recommended | GitHub PAT with repo/workflow scopes for protected branches |
| `NPM_TOKEN`          | Optional    | Required for npm publishing                                 |
| `DOCKERHUB_USERNAME` | Optional    | Required for Docker Hub publishing                          |
| `DOCKERHUB_TOKEN`    | Optional    | Required for Docker Hub publishing                          |

### Repository Variables

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `ENABLE_DOCKER_RELEASE` | Set to `true` to enable Docker builds            |
| `ENABLE_DOCS_RELEASE`   | Set to `true` to enable documentation deployment |

> **Note**: Without `RELEASE_TOKEN`, the workflow uses `GITHUB_TOKEN` but may fail on protected branches.

## Next Steps

After setting up development:

1. **Read the architecture**: `docs/architecture/decisions/*.md`
2. **Understand the process**: `docs/PROCESS.md`
3. **Set up monitoring**: `docs/OBSERVABILITY.md`
4. **Check troubleshooting**: `docs/TROUBLESHOOTING.md`

Happy coding! 🚀
