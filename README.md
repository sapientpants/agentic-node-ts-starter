# Agentic Node + TypeScript Starter

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

**Core:** Node.js 22+ • TypeScript 5.9 (strict) • pnpm 10.15  
**Testing:** Vitest • fast-check (property testing) • 80% coverage minimum  
**Quality:** ESLint 9 • Prettier • Husky • Commitlint  
**Security:** CodeQL • OSV Scanner • SBOM • SLSA attestations  
**CI/CD:** GitHub Actions • Changesets • Automated releases

## 📖 Documentation

**[Full Documentation →](./docs/)**

- **[Getting Started](./docs/GETTING_STARTED.md)** - Setup and installation
- **[Development](./docs/DEVELOPMENT.md)** - Workflows and commands
- **[Testing](./docs/TESTING.md)** - Test patterns and coverage
- **[Docker](./docs/DOCKER.md)** - Docker configuration and healthchecks
- **[Patterns](./docs/PATTERNS.md)** - Copy-paste code examples
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/mfisher87/agentic-node-ts-starter.git my-project
cd my-project

# Install dependencies (requires Node.js 22+ and pnpm 10.15)
pnpm install

# Set up configuration (required)
cp .env.example .env
# Edit .env with your configuration

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
pnpm lint:fix     # Fix linting issues
pnpm format:fix   # Fix formatting
pnpm typecheck    # Type check only

# Releases
pnpm changeset    # Create changeset
pnpm sbom         # Generate SBOM
```

**Full command reference:** [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

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
- 🔌 **Configurable logging output** - Redirect logs to stderr, files, syslog, or disable entirely
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

To enable Docker builds:

1. Set repository variable `ENABLE_DOCKER_RELEASE` to `true`
2. Add secrets for Docker Hub (optional):
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
3. Images are automatically pushed to GitHub Container Registry

> **⚠️ Important**: The default Dockerfile includes a healthcheck that expects a web server with a `/health` endpoint on port 3000. See [Docker Configuration Guide](./docs/DOCKER.md) for detailed instructions on configuring healthchecks for different application types (web services, CLI tools, workers).

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
