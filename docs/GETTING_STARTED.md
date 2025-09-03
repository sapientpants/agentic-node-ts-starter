# Getting Started Guide

Welcome to the Agentic Node + TypeScript Starter! This guide will walk you through transforming this template into your own project in under 10 minutes.

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

```bash
# Install mise: https://mise.jdx.dev/getting-started.html
mise install        # Installs Node 22 and pnpm 10.15.0
pnpm install       # Install dependencies
```

#### Option B: Using nvm or fnm

```bash
# Using nvm
nvm install 22
nvm use 22
npm install -g pnpm@10.15.0

# OR using fnm
fnm install 22
fnm use 22
npm install -g pnpm@10.15.0

# Then install dependencies
pnpm install
```

#### Option C: Manual Installation

1. Install [Node.js 22+](https://nodejs.org/) directly
2. Install pnpm: `npm install -g pnpm@10.15.0`
3. Install dependencies: `pnpm install`

⚠️ **Important**: This project requires:

- Node.js >= 22.0.0
- pnpm 10.15.0 (exact version)

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
> - **📝 Example Code**: Demonstration files that should be removed or replaced:
>   - `src/index.ts` - Example add function with validation demos
>   - `tests/index.spec.ts` - Example unit tests
>   - `tests/add.property.spec.ts` - Example property-based tests
> - **🏗️ Template Infrastructure**: Production-ready code that you can keep and customize:
>   - `src/config.ts` - Type-safe environment configuration with Zod validation
>   - `src/logger.ts` - Structured logging with Pino
>   - `src/dev/debug-utils.ts` - Development debugging utilities
>   - `tests/config.spec.ts` - Configuration tests
>   - `tests/logger.spec.ts` - Logger tests
>   - `tests/container-scan.spec.ts` - Container security tests
>   - `tests/documentation.spec.ts` - Documentation validation tests
>   - All configuration files (TypeScript, ESLint, Prettier, etc.)
>
> Look for header comments in files to identify their purpose.

Remove the example files and create your own:

```bash
# Remove example source files
rm src/index.ts

# Remove example tests
rm tests/index.spec.ts
rm tests/add.property.spec.ts

# Keep the logger if you want structured logging
# Or remove it: rm src/logger.ts tests/logger.spec.ts
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

After customization, ensure everything works:

```bash
# Run all quality checks
pnpm verify

# This runs:
# - Security audit
# - TypeScript type checking
# - ESLint linting
# - Prettier formatting
# - Test suite
```

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

1. **Clean up example code**:

   ```bash
   # Remove example test files
   rm tests/index.spec.ts tests/add.property.spec.ts

   # Replace the example entry point with your own
   echo "console.log('Hello from my app!');" > src/index.ts
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
