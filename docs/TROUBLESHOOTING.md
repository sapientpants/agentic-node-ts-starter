# Troubleshooting Guide

This guide helps you resolve common issues when using the Agentic Node + TypeScript Starter template.

## Table of Contents

- [Version and Environment Issues](#version-and-environment-issues)
- [Installation Problems](#installation-problems)
- [TypeScript and Module Issues](#typescript-and-module-issues)
- [Testing Issues](#testing-issues)
- [CI/CD Failures](#cicd-failures)
- [Git and Commit Issues](#git-and-commit-issues)
- [Container and Security Scanning](#container-and-security-scanning)
- [Claude AI Integration](#claude-ai-integration)

## Version and Environment Issues

### Node.js Version Mismatch

**Problem**: Error about Node.js version being too old or incompatible.

**Solution**:

```bash
# Check your current Node version
node --version

# Must be >= 22.0.0
# If using mise:
mise install
mise use node@22

# If using nvm:
nvm install 22
nvm use 22

# If using fnm:
fnm install 22
fnm use 22
```

### pnpm Version Issues

**Problem**: Warning about pnpm version mismatch or Corepack errors.

**Solution**:

```bash
# Install exact version required
npm install -g pnpm@10.15.0

# Or use Corepack (Node 16.13+)
corepack enable
corepack prepare pnpm@10.15.0 --activate

# Verify version
pnpm --version  # Should show 10.15.0
```

### mise Not Found

**Problem**: `mise: command not found`

**Solution**:

```bash
# Install mise (macOS/Linux)
curl -fsSL https://mise.run | sh

# Add to your shell profile
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc  # for bash
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> ~/.zshrc    # for zsh

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Alternative: Use nvm or fnm instead (see Getting Started guide)
```

## Installation Problems

### Dependencies Won't Install

**Problem**: `pnpm install` fails with network or permission errors.

**Solution**:

```bash
# Clear pnpm cache
pnpm store prune

# Try with different registry
pnpm install --registry https://registry.npmjs.org

# If behind corporate proxy
pnpm config set proxy http://proxy.company.com:8080
pnpm config set https-proxy http://proxy.company.com:8080
```

### Lockfile Conflicts

**Problem**: pnpm-lock.yaml conflicts or "lockfile is up to date" errors.

**Solution**:

```bash
# Regenerate lockfile
rm pnpm-lock.yaml
pnpm install

# Or if you want to keep existing versions
pnpm install --frozen-lockfile=false
```

## TypeScript and Module Issues

### Import Extension Errors

**Problem**: `Cannot find module './module' or its corresponding type declarations`

**Solution**:

```typescript
// ❌ Wrong - missing extension
import { myFunction } from './module';

// ✅ Correct - include .js extension for ES modules
import { myFunction } from './module.js';
```

### Type Declaration Not Found

**Problem**: `Cannot find type definition file for module`

**Solution**:

```bash
# Check if types are available
pnpm add -D @types/module-name

# If no types exist, create declaration
echo "declare module 'module-name';" > src/types/module-name.d.ts
```

### Module Resolution Errors

**Problem**: `ERR_MODULE_NOT_FOUND` or resolution failures.

**Solution**:

1. Ensure `"type": "module"` is in package.json
2. Use `.js` extensions in all imports
3. Check tsconfig.json has correct settings:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

## Testing Issues

### Coverage Threshold Failures

**Problem**: Tests pass but coverage check fails with "Coverage for X (79%) does not meet threshold (80%)"

**Solution**:

```bash
# Run coverage report to see what's missing
pnpm coverage:report

# Open detailed HTML report
open coverage/index.html

# Add more tests for uncovered code
# Or if temporarily needed, adjust thresholds in vitest.config.ts
```

### Test Import Errors

**Problem**: Tests can't import modules or find files.

**Solution**:

```typescript
// In test files, use correct import paths
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/module.js'; // Note .js extension

// For test utilities
import { testHelper } from './helpers/test-utils.js';
```

### Property Tests Failing Randomly

**Problem**: Property-based tests fail intermittently.

**Solution**:

```typescript
// Increase number of runs for more stable tests
it.prop([fc.integer()], { numRuns: 1000 })('should handle all integers', (value) => {
  // test implementation
});

// Or set a seed for reproducible failures
it.prop([fc.integer()], { seed: 42 })('reproducible test', (value) => {
  // test implementation
});
```

## CI/CD Failures

### Changeset Required Error

**Problem**: CI fails with "No changesets found" or "Changeset required".

**Solution**:

```bash
# For feature changes
pnpm changeset
# Follow prompts to describe your change

# For non-release changes (docs, tests, CI)
pnpm changeset --empty
```

### GitHub Actions Permission Errors

**Problem**: "Error: Permission denied" in GitHub Actions.

**Solution**:

1. Check repository Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

### Release Workflow Failing

**Problem**: Release automation not working after merge to main.

**Solution**:

1. Ensure changeset was included in PR
2. Check NPM_TOKEN secret is set (if publishing)
3. Verify version in package.json was bumped
4. Check commit message doesn't include `[skip ci]`

## Git and Commit Issues

### Pre-commit Hook Failures

**Problem**: Commit blocked by pre-commit hooks.

**Solution**:

```bash
# Fix formatting issues
pnpm format:fix

# Fix linting issues
pnpm lint:fix

# Run all checks
pnpm verify

# Emergency bypass (not recommended)
git commit --no-verify -m "message"
```

### Conventional Commit Errors

**Problem**: "subject may not be empty" or "type must be one of..."

**Solution**:

```bash
# Correct format
git commit -m "type(scope): description"

# Valid types:
# feat, fix, docs, style, refactor, test, chore, perf

# Examples:
git commit -m "feat: add user authentication"
git commit -m "fix(api): resolve memory leak"
git commit -m "docs: update troubleshooting guide"
```

### Husky Not Running

**Problem**: Pre-commit hooks not executing.

**Solution**:

```bash
# Reinstall husky
pnpm prepare

# Verify hooks are installed
ls -la .husky/

# If still not working, check Git version
git --version  # Should be >= 2.9
```

## Container and Security Scanning

### Docker Build Fails

**Problem**: `pnpm scan:container` fails with Docker errors.

**Solution**:

```bash
# Ensure Docker is running
docker version

# Build manually to see detailed errors
docker build -t test-image .

# Common fixes:
# - Check Dockerfile syntax
# - Ensure .dockerignore is correct
# - Verify base image availability
```

### Trivy Not Found

**Problem**: "trivy: command not found" when scanning containers.

**Solution**:

```bash
# Install Trivy (macOS)
brew install aquasecurity/trivy/trivy

# Install Trivy (Linux)
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Verify installation
trivy --version
```

### High Vulnerability Count

**Problem**: Container scan finds many vulnerabilities.

**Solution**:

```bash
# Update base image in Dockerfile
FROM node:22-alpine  # Use latest patch version

# Rebuild and scan
pnpm scan:container

# For false positives, add to .trivyignore:
echo "CVE-2024-XXXXX # False positive: reason" >> .trivyignore
```

## Claude AI Integration

### Claude Commands Not Working

**Problem**: `/spec-feature` or other Claude commands not recognized.

**Solution**:

1. Ensure you're using claude.ai/code
2. Commands are in `.claude/commands/` directory
3. Restart Claude Code session if needed
4. Check command file has `.md` extension

### Changeset Guidance Issues

**Problem**: Unsure when to add changesets with Claude AI assistance.

**Solution**:

- **Add changeset** for: bug fixes, features, breaking changes
- **Use --empty** for: tests, CI changes, documentation, refactoring
- Claude commands should remind you about changesets
- Check `pnpm changeset:status` to see pending changes

### AI Getting Import Paths Wrong

**Problem**: Claude AI suggests imports without `.js` extensions.

**Solution**:

- Remind Claude about ES modules requirement
- Point to CLAUDE.md for correct patterns
- Always review generated imports for `.js` extensions

## Common Error Messages

### `ERR_REQUIRE_ESM`

**Cause**: Trying to use `require()` in an ES module project.

**Fix**: Use `import` statements instead of `require()`.

### `ERR_UNKNOWN_FILE_EXTENSION`

**Cause**: TypeScript files not being compiled or wrong extension.

**Fix**: Ensure you're running compiled `.js` files from `dist/`, not `.ts` files.

### `EACCES: permission denied`

**Cause**: File permission issues.

**Fix**:

```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use different directory
mkdir ~/.pnpm-global
pnpm config set prefix ~/.pnpm-global
```

## Getting Further Help

If your issue isn't covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/sapientpants/agentic-node-ts-starter/issues)
2. **Review documentation**:
   - [GETTING_STARTED.md](./GETTING_STARTED.md)
   - [CLAUDE.md](../CLAUDE.md)
   - [PROCESS.md](./PROCESS.md)
3. **Ask for help**: Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, pnpm version)
   - What you've tried

## Quick Fixes Checklist

When something's not working, try these in order:

1. ✅ Check Node version: `node --version` (must be >= 22)
2. ✅ Check pnpm version: `pnpm --version` (must be 10.15.0)
3. ✅ Clear and reinstall: `rm -rf node_modules && pnpm install`
4. ✅ Run verify: `pnpm verify`
5. ✅ Check for changesets: `pnpm changeset:status`
6. ✅ Update dependencies: `pnpm update`
7. ✅ Restart your IDE/terminal
8. ✅ Pull latest changes: `git pull origin main`

---

**Remember**: Most issues are related to versions, missing extensions in imports, or forgetting to add changesets. Check these first!
