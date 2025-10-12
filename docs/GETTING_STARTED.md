# Getting Started Guide

Welcome to the Agentic Node + TypeScript Starter! This guide will walk you through transforming this template into your own project in under 10 minutes.

> **What does "Agentic" mean?** This template is designed for AI-assisted development workflows. It includes configurations and commands specifically tailored for working with AI development tools like Claude Code. The template itself is not an AI agent - it's a foundation for building your own applications with the help of AI assistants. The comprehensive testing, documentation, and quality automation make it safe and efficient for AI tools to help you generate, refactor, and maintain code.

## Quick Setup Checklist

Follow these steps in order to customize the template for your project:

### 1. Clone and Initialize

```bash
# Clone the template (replace with your project name)
git clone https://github.com/sapientpants/agentic-node-ts-starter.git your-project-name
cd your-project-name

# Remove template history and start fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit from agentic-node-ts-starter template"
```

### 2. Install Development Environment

Choose your preferred Node.js version manager:

#### Option A: Using mise (Recommended)

The project includes a `mise.toml` file to automatically manage Node.js and pnpm versions:

```bash
# Install mise (if not already installed)
# macOS/Linux: curl https://mise.run | sh
# Or via Homebrew: brew install mise

# Activate mise in your shell (add to ~/.bashrc or ~/.zshrc)
eval "$(mise activate bash)"  # or zsh

# Install the exact versions specified in mise.toml
mise install        # Installs Node 22 and pnpm 10.17.0
pnpm install       # Install dependencies
```

#### Option B: Using nvm or fnm

```bash
# Using nvm
nvm install 22
nvm use 22
npm install -g pnpm@10.17.0

# OR using fnm
fnm install 22
fnm use 22
npm install -g pnpm@10.17.0

# Then install dependencies
pnpm install
```

#### Option C: Manual Installation

1. Install [Node.js 22+](https://nodejs.org/) directly
2. Install pnpm: `npm install -g pnpm@10.17.0`
3. Install dependencies: `pnpm install`

⚠️ **Important**: This project requires:

- Node.js >= 22.0.0
- pnpm 10.17.0 (exact version)

### 3. Set Up Configuration (Required)

Configuration is mandatory. The application will not start without valid configuration:

```bash
# Copy the example configuration
cp .env.example .env

# Edit .env with your configuration
# Most defaults will work for development
```

### 4. Update Project Metadata

Edit `package.json`:

```json
{
  "name": "your-project-name",
  "version": "0.1.0",
  "description": "Your project description",
  "private": true, // or false if publishing to npm
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-project.git"
  },
  "keywords": ["your", "keywords"],
  "license": "MIT" // or your preferred license
}
```

### 5. Clean Up Example Code

> [!IMPORTANT]
> **Understanding Template Files**
>
> This template includes two types of files:
>
> - **📝 Example Code**: Demonstration files marked with header comments that should be removed:
>   - `src/index.ts` - Example add function with validation demos
>   - `src/health.example.ts` - Example health endpoint implementation (reference only)
>   - `tests/index.spec.ts` - Example unit tests
>   - `tests/add.property.spec.ts` - Example property-based tests
> - **🏗️ Template Infrastructure**: Production-ready code that you can keep and customize:
>   - `src/config.ts` - Type-safe environment configuration with Zod validation
>   - `src/logger.ts` - Structured logging with Pino
>   - `src/logger-validation.ts` - Logger security validation utilities
>   - `tests/config.spec.ts` - Configuration tests
>   - `tests/logger.spec.ts` - Logger tests
>   - `tests/logger-validation.spec.ts` - Logger validation tests
>   - `tests/logger-output.spec.ts` - Logger output configuration tests
>   - `tests/container-scan.spec.ts` - Container security tests
>   - `tests/documentation.spec.ts` - Documentation validation tests
>   - All configuration files (TypeScript, ESLint, Prettier, etc.)
>
> All example files have clear header comments marked with "EXAMPLE CODE" to identify them.

Remove the example files with a single command:

```bash
# Remove all example files at once
rm src/index.ts \
   src/health.example.ts \
   tests/index.spec.ts \
   tests/add.property.spec.ts

# Create your own entry point
echo "console.log('Hello from my app!');" > src/index.ts

# Note: Keep the infrastructure files (config.ts, logger.ts, etc.) unless you want to replace them
```

### 5. Update README

Replace the template README with your project-specific content:

```bash
# Backup the template README for reference
mv README.md TEMPLATE_README.md

# Create your project README
cat > README.md << 'EOF'
# Your Project Name

Brief description of your project.

## Installation

\`\`\`bash
pnpm install
\`\`\`

## Usage

Describe how to use your project.

## Development

\`\`\`bash
pnpm build       # Build the project
pnpm test        # Run tests
pnpm verify      # Run all checks
\`\`\`

## License

Your license here.
EOF
```

### 6. Configure GitHub Repository

This template's CI/CD workflows require GitHub. Create your repository:

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-project.git
git branch -M main
git push -u origin main
```

### 7. Set Up CI/CD

The template includes comprehensive GitHub Actions workflows that handle PR validation, releases, and publishing:

#### For npm publishing (optional):

1. Generate an npm token at https://www.npmjs.com/
2. Add it as `NPM_TOKEN` in your GitHub repository secrets

#### For Docker publishing (optional):

1. Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets
2. Set repository variable `ENABLE_DOCKER_RELEASE` to `true`

#### For documentation deployment (optional):

1. Configure your documentation hosting
2. Set repository variable `ENABLE_DOCS_RELEASE` to `true`

### 8. Start Building Your Project

Now that your template is customized, you can start building your project. The template provides a solid foundation for any Node.js TypeScript project.

## Verify Your Setup

### Post-Setup Validation Checklist

After customization, run through this checklist to ensure everything is properly configured:

```bash
# 1. Verify all quality checks pass
pnpm verify
# This runs: audit, typecheck, lint, format check, and tests

# 2. Check test coverage meets requirements (80% minimum)
pnpm test:coverage
# Should show coverage >= 80% for all metrics

# 3. Ensure TypeScript builds successfully
pnpm build
# Creates dist/ directory with compiled JavaScript

# 4. Verify pre-commit hooks are installed
git add .
git commit -m "test commit" --dry-run
# Should trigger pre-commit validation

# 5. Check that your environment is configured
node -e "console.log('Node:', process.version)"
pnpm --version
# Should show Node 22+ and pnpm 10.17.0
```

If all checks pass, your project is ready for development!

## Next Steps

1. **Write your first feature**: Start with a test, then implement
2. **Set up your IDE**: Configure VS Code or your preferred editor
3. **Review documentation**:
   - [CLAUDE.md](../CLAUDE.md) - AI-assisted development with Claude
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
   - [PROCESS.md](./PROCESS.md) - Development workflow
   - [OBSERVABILITY.md](./OBSERVABILITY.md) - Logging and monitoring

## Common Customizations

### Change Test Framework

The template uses Vitest. To switch to Jest:

```bash
pnpm remove vitest @vitest/coverage-v8
pnpm add -D jest @types/jest ts-jest
# Update test scripts in package.json
# Create jest.config.js
```

### Add a Web Framework

For Express:

```bash
pnpm add express
pnpm add -D @types/express
```

For Fastify:

```bash
pnpm add fastify
```

### Add a Database

For PostgreSQL with Prisma:

```bash
pnpm add @prisma/client
pnpm add -D prisma
npx prisma init
```

### Change License

1. Update `LICENSE` file with your preferred license text
2. Update `license` field in `package.json`
3. Update license badge in `README.md` if present

## After Setup - Start Building Your Application

### Next Steps

1. **Verify your environment** (if using mise):

   ```bash
   # Check that mise is managing versions correctly
   mise list          # Shows installed tools
   node --version     # Should show v22.x.x
   pnpm --version     # Should show 10.17.0
   ```

2. **Update project metadata**:
   - Edit `package.json` with your project name and description
   - Update README.md with your project information
   - Configure CLAUDE.md for your specific needs

3. **Start developing**:

   ```bash
   # Watch TypeScript changes
   pnpm dev

   # Watch tests
   pnpm test:watch
   ```

4. **Add your first feature**:
   - Create source files in `src/`
   - Add tests in `tests/`
   - Follow patterns in [docs/PATTERNS.md](./PATTERNS.md)

5. **Before your first commit**:

   ```bash
   # Run all quality checks
   pnpm verify

   # Create a changeset
   pnpm changeset
   ```

### What to Keep vs What to Change

**Keep These**:

- All configuration files (they're optimized)
- Pre-commit hooks (maintains quality)
- GitHub Actions workflows (CI/CD ready)
- Testing setup (comprehensive coverage)

**Customize These**:

- `src/` - Replace with your code
- `tests/` - Replace with your tests
- `README.md` - Your project description
- `CLAUDE.md` - Your AI instructions

**Optional to Remove**:

- `.claude/` directory (if not using Claude Code)
- ADR records (if you prefer different documentation)

## Time-Saving Tips

- **Keep the pre-commit hooks** to maintain code quality
- **Use changesets** for version management from the start
- **Review CLAUDE.md** to leverage AI-assisted development effectively
- **Check existing patterns** in the template before adding new ones
- **Use the documentation** - [docs/](../docs/) has examples for everything

## Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review the [template documentation](https://github.com/sapientpants/agentic-node-ts-starter)
- Open an issue if you find bugs in the template

---

**Estimated time to complete**: 5-10 minutes for basic setup, depending on familiarity with the tools.
