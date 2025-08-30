# 14. Node Version Management Strategy

Date: 2025-08-30

## Status

Accepted

## Context

The project required a consistent Node.js version management strategy to:

- Ensure all developers use the same Node.js version
- Prevent version-related bugs and incompatibilities
- Support modern JavaScript features requiring Node.js 22+
- Integrate seamlessly with CI/CD environments
- Provide simple onboarding for new developers
- Support multiple projects with different Node.js requirements

Key considerations:

- Cross-platform compatibility (macOS, Linux, Windows via WSL)
- Integration with existing development workflow
- Performance and resource efficiency
- Ability to switch between Node.js versions quickly
- Support for automatic version switching

Options considered:

- **nvm**: Most popular, but slow and bash-specific
- **fnm**: Fast and cross-platform, Rust-based
- **volta**: Fast with great toolchain management
- **mise**: Polyglot version manager with excellent performance
- **asdf**: Extensible version manager for multiple languages

## Decision

We chose **mise** (formerly rtx) as our Node.js version management tool, with Node.js 22+ as the minimum required version:

1. **Version Manager**: mise for fast, polyglot version management
2. **Node.js Version**: Minimum 22.0.0 for full ESM support
3. **Configuration**: `.mise.toml` for project version pinning
4. **Package Manager**: pnpm version specified in package.json

### Implementation Details

- **mise Configuration** (`.mise.toml`):

  ```toml
  [tools]
  node = "22"
  pnpm = "10.15.0"
  ```

- **Version Requirements**:
  - Node.js 22+ for native ESM support
  - Full support for top-level await
  - Native fetch API availability
  - Improved performance and security

- **Developer Workflow**:
  1. Install mise: `curl https://mise.run | sh`
  2. Run `mise install` in project directory
  3. Automatic version switching when entering directory
  4. Version validation in pre-commit hooks

- **CI/CD Integration**:
  - GitHub Actions uses specified Node.js version
  - Docker images built with matching Node.js version
  - Version validation in CI pipeline

- **Fallback Support**:
  - package.json `engines` field for version enforcement
  - Clear error messages for version mismatches
  - Documentation for alternative version managers

## Consequences

### Positive

- **Consistency**: All developers use identical Node.js versions
- **Performance**: mise is significantly faster than nvm
- **Polyglot Support**: Can manage other tools (Python, Ruby, etc.)
- **Automatic Switching**: Version changes when entering project directory
- **Modern Features**: Node.js 22+ enables latest JavaScript features
- **Resource Efficient**: Minimal overhead compared to containerization
- **Simple Onboarding**: One command to set up development environment

### Negative

- **Tool Installation**: Developers must install mise
- **Learning Curve**: New tool for developers familiar with nvm
- **Version Requirement**: Node.js 22+ may be newer than some environments
- **Platform Support**: Best support on Unix-like systems

### Mitigation

- **Documentation**: Clear installation instructions in README and GETTING_STARTED
- **Alternatives**: Document fallback options (nvm, fnm, volta)
- **CI/CD Validation**: Ensure version compatibility in automated tests
- **Error Messages**: Clear guidance when version mismatches occur
- **Gradual Adoption**: Support for manual Node.js installation initially

## References

- [mise Documentation](https://mise.jdx.dev/)
- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [ESM in Node.js](https://nodejs.org/api/esm.html)
- [package.json engines field](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#engines)
