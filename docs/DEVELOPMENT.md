# Development Guide

> **Quick Start**: Run `pnpm setup` for one-command project initialization, then `make dev` or `pnpm dev` to start development.

## Daily Development Workflow

### 🚀 Starting Development

```bash
# Option 1: Use Make (recommended for speed)
make dev        # Start TypeScript watching + rebuild on changes
make test       # Run tests in watch mode

# Option 2: Use pnpm directly
pnpm dev        # TypeScript watch mode
pnpm test:watch # Test watch mode
```

### 🔍 Quick Quality Checks

```bash
# Fast check before committing (30 seconds)
make check      # typecheck + lint + test (no audit/format)
pnpm quick-check

# Full verification (like CI, 60+ seconds)
make verify     # All quality gates including audit + format
pnpm verify
```

### 🧪 Testing

```bash
# Watch mode (development)
make test
pnpm test:watch

# Single run
pnpm test

# With coverage
pnpm test:coverage

# Coverage in browser
pnpm coverage:open

# Visual test UI
pnpm test:ui
```

### 🏗️ Building

```bash
# Production build
make build
pnpm build

# Watch build (rebuilds on file changes)
pnpm build:watch
```

## Development Tools

### 🛠️ Available Make Commands

Run `make help` to see all available commands:

- `make dev` - Start development mode
- `make test` - Run tests in watch mode
- `make check` - Quick quality check
- `make verify` - Full verification
- `make clean` - Clean build artifacts
- `make reset` - Clean + reinstall dependencies

### 📦 NPM Scripts

Run `pnpm help` to see all available scripts, or check these key ones:

- `pnpm dev` - TypeScript watch mode
- `pnpm test:watch` - Test watch mode
- `pnpm quick-check` - Fast quality check
- `pnpm verify` - Full verification
- `pnpm ci:local` - Simulate CI locally
- `pnpm doctor` - Check environment health

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

# Make shortcuts
make verify     # Full verification
make check      # Quick check
```

### Pre-commit Hooks

The project automatically runs quality checks before each commit:

- **Format** files with Prettier
- **Lint** with ESLint auto-fix
- **Type check** with TypeScript
- **Test** all existing tests
- **Security audit** for vulnerabilities

To bypass (not recommended):

```bash
git commit --no-verify -m "emergency fix"
```

## Troubleshooting

### Common Issues

**TypeScript errors after pulling changes:**

```bash
make reset  # Clean + reinstall dependencies
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
3. **View available commands**: `make help` or `pnpm help`
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

## Next Steps

After setting up development:

1. **Read the architecture**: `docs/architecture/decisions/*.md`
2. **Understand the process**: `docs/PROCESS.md`
3. **Set up monitoring**: `docs/OBSERVABILITY.md`
4. **Check troubleshooting**: `docs/TROUBLESHOOTING.md`

Happy coding! 🚀
