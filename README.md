# Agentic Node + TypeScript Starter

## 📊 Build Status & Quality Metrics

### CI/CD Workflows

[![Main](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/main.yml/badge.svg)](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/main.yml)
[![PR](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/pr.yml/badge.svg)](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/pr.yml)
[![CodeQL](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/codeql.yml/badge.svg)](https://github.com/sapientpants/agentic-node-ts-starter/actions/workflows/codeql.yml)

### Test Coverage & Quality

[![Lines Coverage](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.coverage.lines&suffix=%25&label=Coverage%20(Lines)&color=brightgreen>)](https://github.com/sapientpants/agentic-node-ts-starter/actions)
[![Branches Coverage](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.coverage.branches&suffix=%25&label=Coverage%20(Branches)&color=brightgreen>)](https://github.com/sapientpants/agentic-node-ts-starter/actions)
[![Functions Coverage](<https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.coverage.functions&suffix=%25&label=Coverage%20(Functions)&color=brightgreen>)](https://github.com/sapientpants/agentic-node-ts-starter/actions)

### Code Quality Metrics

[![Code Duplication](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.duplication.percentage&suffix=%25&label=Duplication&color=brightgreen)](https://github.com/sapientpants/agentic-node-ts-starter/actions)
[![Mutation Score](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.mutation.score&suffix=%25&label=Mutation%20Score&color=yellow)](https://github.com/sapientpants/agentic-node-ts-starter/actions)

### Meta

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.nodeVersion&label=Node.js&color=339933&logo=node.js)](https://nodejs.org)
[![Package Manager](https://img.shields.io/badge/pnpm-10.17.0-orange.svg?logo=pnpm)](https://pnpm.io)
[![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsapientpants%2Fagentic-node-ts-starter%2Fmain%2Fquality-metrics.json&query=%24.version&label=Version)](https://github.com/sapientpants/agentic-node-ts-starter/releases)

A **batteries-included** TypeScript starter template with comprehensive testing, code quality automation, and security scanning. Built for modern Node.js development with AI-assisted (agentic) coding workflow.

> **Note:** This template includes example code to demonstrate its capabilities. These example files are clearly marked with header comments and should be removed when starting your project. See [Getting Started](./docs/GETTING_STARTED.md#clean-up-example-code) for details.

## 🤔 What is Agentic Development?

**"Agentic" in this context refers to AI-assisted development workflow**, not AI agent runtime. This template is designed to work seamlessly with AI development tools like [Claude Code](https://claude.ai/code) to enhance your productivity through:

- 🤖 **AI-powered code generation** - Let AI assistants help write boilerplate and tests
- 🔄 **Automated refactoring** - AI tools can safely refactor with comprehensive test coverage
- 📝 **Documentation assistance** - AI can help maintain docs in sync with code
- 🎯 **Issue-to-implementation workflows** - Custom commands for AI-driven development

> **Important:** This is a template repository for starting new projects. No AI agents or chatbots are included - the "agentic" aspect comes from using AI development tools (like Claude) to assist you in building your application faster and with higher quality.

## 🛠️ Tech Stack

**Core:** Node.js 22+ • TypeScript ^5.9.2 (strict) • pnpm 10.15  
**Testing:** Vitest • fast-check (property testing) • 80% coverage minimum  
**Quality:** ESLint 9 • Prettier • Husky • Commitlint  
**Security:** CodeQL • OSV Scanner • SBOM • SLSA attestations  
**CI/CD:** GitHub Actions • Changesets • Automated releases

## 📖 Documentation

**[Full Documentation →](./docs/README.md)**

- **[Getting Started](./docs/GETTING_STARTED.md)** - Setup and installation
- **[Development](./docs/DEVELOPMENT.md)** - Workflows and commands
- **[Testing](./docs/TESTING.md)** - Test patterns and coverage
- **[Docker](./docs/DOCKER.md)** - Docker configuration and healthchecks
- **[Patterns](./docs/PATTERNS.md)** - Copy-paste code examples
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/sapientpants/agentic-node-ts-starter.git my-project
cd my-project

# Install dependencies (requires Node.js 22+ and pnpm 10.15)
pnpm install

# Set up configuration (required)
cp .env.example .env
# Edit .env with your configuration
# See docs/CONFIG.md for required environment variables

# Verify everything works
pnpm test
pnpm verify  # Full quality check

# Start developing
pnpm dev     # TypeScript watch mode
```

**Prerequisites:** Node.js 22+, pnpm 10.15, GitHub repo (for CI/CD)  
**Full setup guide:** [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)

## 📚 Key Commands

```bash
# Development
pnpm dev          # TypeScript watch mode
pnpm build        # Build to dist/
pnpm verify       # Run all quality checks

# Testing (80% coverage required)
pnpm test         # Run tests
pnpm test:watch   # Watch mode
pnpm test:coverage # With coverage report

# Quality
pnpm lint         # Check linting
pnpm lint:fix     # Fix linting issues
pnpm format       # Check formatting
pnpm format:fix   # Fix formatting
pnpm typecheck    # Type check only

# Releases
pnpm changeset    # Create changeset
pnpm sbom         # Generate SBOM
```

**Full command reference:** [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

## 📊 Code Quality Dashboard

Comprehensive quality metrics tracked automatically on every CI run:

### Testing Metrics

| Metric                 | Current | Threshold | Status     | Local Command        |
| ---------------------- | ------- | --------- | ---------- | -------------------- |
| **Line Coverage**      | 93.77%  | ≥80%      | ✅ Pass    | `pnpm test:coverage` |
| **Branch Coverage**    | 84.95%  | ≥80%      | ✅ Pass    | `pnpm test:coverage` |
| **Function Coverage**  | 100%    | ≥80%      | ✅ Pass    | `pnpm test:coverage` |
| **Statement Coverage** | 93.65%  | ≥80%      | ✅ Pass    | `pnpm test:coverage` |
| **Mutation Score**     | N/A     | ≥80%      | ⏳ Pending | `pnpm mutation-test` |

### Code Quality Metrics

| Metric                      | Current | Threshold | Status  | Local Command        |
| --------------------------- | ------- | --------- | ------- | -------------------- |
| **Code Duplication**        | 0%      | <2%       | ✅ Pass | `pnpm duplication`   |
| **Cyclomatic Complexity**   | Max 10  | ≤10       | ✅ Pass | `pnpm lint`          |
| **Max Function Lines**      | Max 50  | ≤50       | ✅ Pass | `pnpm lint`          |
| **Max Function Parameters** | Max 4   | ≤4        | ✅ Pass | `pnpm lint`          |
| **Max Nesting Depth**       | Max 3   | ≤3        | ✅ Pass | `pnpm lint`          |
| **Circular Dependencies**   | 0       | 0         | ✅ Pass | `pnpm deps:circular` |
| **Dead Code**               | 0       | 0         | ✅ Pass | `pnpm dead-code`     |

### Security Metrics

| Metric                        | Status | Tool        | Local Command         |
| ----------------------------- | ------ | ----------- | --------------------- |
| **Critical Vulnerabilities**  | ✅ 0   | pnpm audit  | `pnpm audit`          |
| **High Vulnerabilities**      | ✅ 0   | OSV Scanner | CI only               |
| **CodeQL Findings**           | ✅ 0   | CodeQL      | CI only               |
| **Container Vulnerabilities** | ✅ 0   | Trivy       | `pnpm scan:container` |

### Build & Dependencies

| Metric                     | Status  | Tool       | Local Command         |
| -------------------------- | ------- | ---------- | --------------------- |
| **TypeScript Compilation** | ✅ Pass | tsc        | `pnpm typecheck`      |
| **ESLint Violations**      | ✅ 0    | ESLint     | `pnpm lint`           |
| **Prettier Formatting**    | ✅ Pass | Prettier   | `pnpm format`         |
| **Workflow Validation**    | ✅ Pass | actionlint | `pnpm lint:workflows` |

### Tools & Analyzers Used

- **Coverage:** Vitest with V8 coverage provider
- **Mutation Testing:** Stryker Mutator (JavaScript/TypeScript)
- **Duplication:** jscpd (Copy/Paste Detector)
- **Complexity:** ESLint with complexity rules
- **Circular Deps:** madge (dependency graph analyzer)
- **Dead Code:** Knip (unused exports, files, dependencies, types)
- **Security:** pnpm audit, OSV Scanner, CodeQL, Trivy
- **Type Safety:** TypeScript strict mode + type-aware ESLint rules

> **Note:** Metrics are auto-updated on every push to main as part of the build workflow. The `quality-metrics.json` file is committed automatically after validation completes.

## 🎯 Quality Standards

This project enforces strict quality standards to ensure maintainability, security, and reliability:

### Why These Standards?

**80% Coverage Minimum** - Ensures comprehensive test coverage without requiring 100% (which can lead to diminishing returns)

**Low Complexity Limits** - Functions with cyclomatic complexity >10 are harder to understand, test, and maintain

**Zero Duplication Target** - DRY principle reduces maintenance burden and bugs

**No Circular Dependencies** - Prevents tight coupling and enables better modularity

**No Dead Code** - Keeps codebase lean and maintainable

**Zero Critical/High Vulnerabilities** - Security-first approach protects users and infrastructure

### Complexity Rationale

| Limit                     | Rationale                                                         |
| ------------------------- | ----------------------------------------------------------------- |
| Cyclomatic Complexity ≤10 | Industry standard for maintainable code (NIST, IEEE)              |
| Max 50 Lines/Function     | Single screen view improves comprehension                         |
| Max 4 Parameters          | Reduces cognitive load, encourages better abstractions            |
| Max 3 Nesting Depth       | Prevents deeply nested code that's hard to reason about           |
| Max 15 Statements         | Forces function decomposition, improves testability               |
| Code Duplication <2%      | Minimal threshold allowing for small necessary repetition         |
| Mutation Score ≥80%       | Ensures tests actually verify behavior, not just achieve coverage |

### Test File Exceptions

Test files (`tests/**/*.ts`) have relaxed limits:

- Cyclomatic complexity: ≤15 (vs 10)
- Max lines per function: ≤600 (vs 50) - allows large describe blocks with many test cases

### Pre-commit Quality Gates

The `pnpm precommit` command runs checks in optimized order for fast feedback:

1. **Security** (`pnpm audit`) - Blocks commits with critical vulnerabilities
2. **Formatting** (`pnpm format`) - Fast, easy to fix
3. **YAML/Markdown Linting** - Fast file validation
4. **Workflow Validation** - Prevents broken GitHub Actions
5. **Type Checking** (`pnpm typecheck`) - Required for type-aware lint rules
6. **Linting** (`pnpm lint`) - Comprehensive quality checks
7. **Structural Analysis** - Circular deps, duplication, dead code
8. **Tests with Coverage** (`pnpm test:coverage`) - Slowest check runs last

**Mutation testing** is excluded from pre-commit due to performance - run it periodically (weekly/monthly).

## 🤖 Claude Code Integration

This project includes special configurations for [Claude Code](https://claude.ai/code):

### Custom Commands

- `/analyze-and-fix-github-issue` - Complete workflow for fixing GitHub issues
- `/release` - Automated release process
- `/update-dependencies` - Update dependencies with PR workflow

### Git Hooks

- Prevents bypassing verification with `--no-verify` flag
- Ensures all commits pass quality checks

See [CLAUDE.md](./CLAUDE.md) for detailed Claude Code guidance.

## 📁 Project Structure

```
.
├── .claude/           # Claude Code configurations
│   ├── commands/      # Custom slash commands
│   └── hooks/         # Git hook scripts
├── .github/           # GitHub Actions workflows
├── docs/              # Documentation
├── src/               # Source code
├── tests/             # Test files
│   ├── *.spec.ts      # Unit tests
│   └── *.property.spec.ts # Property-based tests
├── mise.toml          # Tool version management
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## 🔄 Features

### Configuration & Environment

- 🔐 **Type-safe configuration** with Zod validation
- 🔌 **Configurable logging output** - Redirect logs to stderr, files, syslog, or disable entirely (see [docs/LOGGING_OUTPUT.md](./docs/LOGGING_OUTPUT.md))
- 🔐 **Environment validation** at startup with clear errors
- 🔐 **Sensitive value masking** in error messages
- 📝 See [docs/CONFIG.md](./docs/CONFIG.md) for configuration guide

### Testing & Quality

- ✅ **Vitest** with property-based testing (fast-check)
- ✅ **80% coverage minimum** enforced
- ✅ **Strict TypeScript** with type-aware linting
- ✅ **Pre-commit hooks** with Husky & lint-staged
- ✅ **Markdown and YAML linting** for docs/config consistency

### Security & Supply Chain

- 🔒 **CodeQL** static analysis
- 🔒 **OSV Scanner** for dependencies
- 🔒 **SBOM generation** (CycloneDX)
- 🔒 **SLSA attestations** for artifacts

### Automation

- 🚀 **GitHub Actions** CI/CD pipeline
- 🚀 **Changesets** for versioning
- 🚀 **Automated releases** with changelog
- 🚀 **Claude Code** integration

## ⚙️ Required Setup

### GitHub Repository Settings

**Actions permissions** (Settings → Actions → General):

- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

**Auto-merge** (Settings → General → Pull Requests):

- ✅ Allow auto-merge
- ✅ Automatically delete head branches

**For automated releases**, add secrets:

- `RELEASE_TOKEN` - GitHub PAT with repo/workflow scopes (triggers publish workflow)
- `NPM_TOKEN` - For npm publishing (optional)

## 📦 Release Distribution Setup

### NPM Publishing

To enable npm publishing:

1. Add `NPM_TOKEN` secret in repository settings
2. Remove `"private": true` from package.json
3. Use a scoped package name: `@yourorg/package-name`

### Docker Publishing

> **⚠️ Important**: The default Dockerfile includes a healthcheck that expects a web server with a `/health` endpoint on port 3000. See [Docker Configuration Guide](./docs/DOCKER.md) for detailed instructions on configuring healthchecks for different application types (web services, CLI tools, workers).

To enable Docker builds:

1. Set repository variable `ENABLE_DOCKER_RELEASE` to `true`
2. Add secrets for Docker Hub (optional):
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
3. Images are automatically pushed to GitHub Container Registry

## 🔒 Security Features

- **Dependency Auditing**: Critical vulnerability checks on every CI run
- **SBOM Generation**: CycloneDX format for supply chain transparency
- **CodeQL Analysis**: Static security analysis
- **OSV Scanning**: Open Source Vulnerability detection
- **SLSA Provenance**: Build attestations
- **Container Attestations**: SBOM and provenance for Docker images

## 📚 Additional Resources

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to this project
- [Development Process](./docs/PROCESS.md) - End-to-end workflow and checklists
- [Architecture Decisions](./docs/architecture/decisions/) - ADR records

## 📄 License

This is a template repository. Feel free to use it for your projects.
