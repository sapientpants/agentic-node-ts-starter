# Agentic Node + TypeScript Starter — **mise + pnpm**

A **batteries-included** starting point for building software with an **agentic coding** workflow on Node.js + TypeScript. This template provides a **spec-first, test-as-contract** approach with comprehensive **quality gates**, **supply-chain security** (SBOM, SLSA provenance), and **CI/CD automation**.

> Created: 2025-08-23  
> Last Updated: 2025-08-24

## 🛠️ Tech Stack

### Core Technologies

- **Runtime:** Node.js 22+ via **mise** (`mise.toml`)
- **Package Manager:** **pnpm 10.0.0** (pinned in package.json)
- **Language:** TypeScript 5.9+ with strict mode
- **Testing:** Vitest 3.2+ with V8 coverage
- **Property Testing:** fast-check 4.2+
- **Validation:** Zod 4.1+ for runtime type safety

### Code Quality

- **Linting:** ESLint 9 with TypeScript support
- **Formatting:** Prettier 3.6+
- **Pre-commit:** Husky + lint-staged
- **Commit Convention:** Commitlint with conventional commits

### CI/CD & Security

- **GitHub Actions:** Comprehensive CI pipeline
- **Security Scanning:** CodeQL analysis, OSV vulnerability scanning
- **Supply Chain:** SBOM generation (CycloneDX), SLSA provenance attestations
- **Versioning:** Changesets for semantic versioning

## 🚀 Quick Start

### Prerequisites

- [mise](https://mise.jdx.dev/) - for Node.js and pnpm version management

### Setup

```bash
# Install Node 22 + pnpm 10 via mise
mise install

# Install dependencies
pnpm install

# Run all quality checks
pnpm verify

# Start development
pnpm test:watch
```

## 📚 Available Scripts

### Development

- `pnpm build` - Build TypeScript to `dist/`
- `pnpm typecheck` - Type check without emitting
- `pnpm lint` - Run ESLint checks
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Check Prettier formatting
- `pnpm format:fix` - Apply Prettier formatting
- `pnpm verify` - Run all checks (audit, typecheck, lint, format, test)

### Testing

- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm coverage:report` - Generate detailed coverage report

### Release & Security

- `pnpm changeset` - Create a changeset for your changes
- `pnpm changeset --empty` - Create an empty changeset for non-release changes
- `pnpm sbom` - Generate SBOM (Software Bill of Materials)
- `pnpm release` - Version packages with Changesets
- `pnpm release:publish` - Build and publish packages
- `pnpm release:tag` - Create git tag for release

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
├── specs/             # Feature specifications
├── src/               # Source code
├── tests/             # Test files
│   ├── *.spec.ts      # Unit tests
│   └── *.property.spec.ts # Property-based tests
├── mise.toml          # Tool version management
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## 🔄 Versioning & Releases

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

- **Required for all PRs**: Every PR must include a changeset (CI enforced)
- **Automated Versioning**: Version bumps based on changeset types
- **Automated Changelogs**: Generated from changeset descriptions
- **Release Automation**: GitHub Actions workflow for creating release PRs
- **Semantic Versioning**: Following semver conventions

### Adding a Changeset (Required)

Every PR must include a changeset:

```bash
pnpm changeset  # For user-facing changes
pnpm changeset --empty  # For internal changes (no release)
```

### ⚠️ Required Repository Settings

For the release automation to work, you must configure the following settings:

#### 1. GitHub Actions Permissions

Go to **Settings** → **Actions** → **General**:

- ✅ Enable **"Allow GitHub Actions to create and approve pull requests"**

#### 2. Auto-Merge Settings

Go to **Settings** → **General** → **Pull Requests**:

- ✅ Enable **"Allow auto-merge"**

#### 3. Branch Protection Rules (Recommended)

Go to **Settings** → **Branches** → Add rule for `main`:

- ✅ **Require status checks to pass before merging**
  - Select these status checks: `build-test`, `changeset-validation`
- ✅ **Require branches to be up to date before merging**
- Optional: **Dismiss stale pull request approvals when new commits are pushed**

Without these settings, the automated release process will not work correctly.

## 🚀 Automated Release Process

This project features a fully automated release pipeline:

1. **Developer merges PR** with changesets → triggers `release.yml`
2. **Changesets creates version PR** automatically with updated versions and CHANGELOG
3. **Auto-merge enables** for the version PR (no manual intervention needed)
4. **CI runs and passes** → PR merges automatically
5. **Release workflow detects merge** → creates git tag and GitHub release
6. **SBOM and attestations** are generated and attached to the release

### How It Works

- When you merge a PR with changesets, a "Version Packages" PR is automatically created
- The `auto-merge-version-pr.yml` workflow enables auto-merge for this PR
- Once CI checks pass, the PR merges without manual intervention
- The `release.yml` workflow then creates a GitHub release with SBOM

### Manual Override

If you need to prevent automatic release:

```bash
# Disable auto-merge for a specific PR
gh pr merge --disable-auto PR_NUMBER

# Re-enable when ready
gh pr merge --auto --squash PR_NUMBER
```

## 🔒 Security Features

- **Dependency Auditing**: Critical vulnerability checks on every CI run
- **SBOM Generation**: CycloneDX format for supply chain transparency
- **CodeQL Analysis**: Static security analysis
- **OSV Scanning**: Open Source Vulnerability detection
- **SLSA Provenance**: Build attestations for artifacts

## 📖 Documentation

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to this project
- [Development Process](./docs/PROCESS.md) - End-to-end workflow and checklists
- [Architecture Decisions](./docs/architecture/decisions/) - ADR records
- [Specifications](./specs/SPEC.md) - Feature specifications

## 📄 License

This is a template repository. Feel free to use it for your projects.
