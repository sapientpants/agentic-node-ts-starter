---
'agentic-node-ts-starter': minor
---

feat: Add comprehensive code complexity and quality checks

This adds local code quality analysis tools to catch complexity issues, circular dependencies, and code duplication before they reach CI.

**New Quality Checks:**

- **Complexity Analysis**: ESLint rules enforcing cognitive complexity (max 15), cyclomatic complexity (max 10), function size limits, and parameter counts
- **Circular Dependencies**: madge detects and blocks circular imports
- **Code Duplication**: jscpd identifies copy-paste code (threshold: 3%)

**New Commands:**

- `pnpm complexity` - Check code complexity via ESLint
- `pnpm complexity:strict` - Enforce zero warnings
- `pnpm deps:circular` - Find circular dependencies (blocks commits)
- `pnpm deps:graph` - Generate dependency visualization
- `pnpm deps:summary` - Show dependency metrics
- `pnpm duplication` - Check code duplication
- `pnpm duplication:ci` - Enforce duplication threshold
- `pnpm metrics` - Run all quality metrics
- `pnpm metrics:ci` - Run metrics with CI enforcement

**Pre-commit Integration:**

- All complexity rules now block commits via `lint:strict`
- Circular dependencies block commits
- Code duplication checked in CI

**Tools Added:**

- eslint-plugin-sonarjs (cognitive complexity)
- madge (circular dependency detection)
- jscpd (code duplication analysis)

**Thresholds:**

Source files: complexity ≤10, cognitive ≤15, lines ≤50, params ≤4, nesting ≤3
Test files: Relaxed thresholds (complexity ≤15, lines ≤100)
Duplication: Warn at 2%, error at 3%
