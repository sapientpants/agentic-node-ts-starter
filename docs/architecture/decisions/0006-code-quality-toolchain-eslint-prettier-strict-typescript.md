# 6. Code Quality Toolchain: ESLint, Prettier, Strict TypeScript

Date: 2025-08-28

## Status

Accepted

## Context

The project required a comprehensive code quality toolchain to ensure:

- Consistent code formatting across the team
- Early detection of potential bugs and code smells
- Enforcement of best practices and coding standards
- Seamless integration with development workflow
- Support for modern JavaScript/TypeScript features
- Fast feedback during development and CI/CD

Key considerations:

- Tool compatibility with ES Modules and TypeScript
- Performance impact on development and CI
- Configuration complexity vs. benefits
- Team adoption and learning curve
- Integration with editors and automated workflows

## Decision

We implemented a comprehensive code quality toolchain:

1. **TypeScript**: Strict configuration for maximum type safety
2. **ESLint 9**: Modern flat config with type-aware rules
3. **Prettier**: Consistent code formatting
4. **Integration**: Pre-commit hooks and CI/CD validation

### Implementation Details

- **TypeScript Strict Mode**: All strict flags enabled
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `noImplicitOverride: true`

- **ESLint Configuration**:
  - Flat config format (ESLint 9+)
  - Type-aware rules for enhanced type safety
  - Performance optimization with targeted rule application
  - Custom rules for project-specific patterns

- **Prettier Integration**:
  - Consistent formatting across all file types
  - ESLint integration to prevent conflicts
  - Pre-commit formatting with lint-staged

- **Automation**:
  - Husky pre-commit hooks
  - CI/CD validation pipeline
  - Editor integration (VS Code, etc.)

## Consequences

### Positive

- **Type Safety**: Maximum TypeScript strictness catches more bugs at compile time
- **Consistency**: Uniform code style across the entire codebase
- **Quality**: Early detection of potential issues and code smells
- **Productivity**: Automated formatting reduces bikeshedding
- **Maintainability**: Consistent patterns make code easier to read and maintain
- **CI/CD**: Fast feedback prevents low-quality code from merging
- **Developer Experience**: Editor integration provides real-time feedback

### Negative

- **Initial Setup**: Complex configuration for optimal type-aware rules
- **Performance**: Type-aware linting adds ~1.5s to full project validation
- **Learning Curve**: Strict TypeScript requires understanding of advanced types
- **False Positives**: Occasionally overly strict rules may flag acceptable patterns

### Mitigation

- **Performance**: Rules applied selectively to balance speed vs. safety
- **Documentation**: Clear guidelines for common patterns and exceptions
- **Flexibility**: Rule overrides available for exceptional cases
- **Training**: Team guidance on effective TypeScript strict mode usage
- **Tooling**: Editor integration reduces friction of strict checking

## References

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Integration](https://prettier.io/docs/en/integrating-with-linters.html)

## Addendum (2025-08-30)

The code quality toolchain has been extended with additional linting tools and continuous monitoring:

### Extended Linting (see ADR-0010)

The toolchain now includes comprehensive linting for all file types:

- **Markdown**: markdownlint-cli2 for documentation consistency
- **YAML**: yamllint for configuration validation
- **JSON**: ESLint with jsonc-parser for JSON/JSONC files
- **GitHub Actions**: actionlint for workflow validation

These tools are integrated into the same pre-commit hooks and CI/CD pipeline, providing a unified quality enforcement mechanism across all project files.

### SonarQube Integration (see ADR-0011)

Added SonarCloud for continuous code quality monitoring:

- Real-time analysis on pull requests
- Historical tracking of code quality metrics
- Automated issue remediation via Claude commands
- Quality gates enforcement before merge

This extends our local toolchain with cloud-based analysis, providing deeper insights into code quality trends and technical debt.

### Related ADRs

- ADR-0010: Extended Linting Strategy
- ADR-0011: SonarQube Code Quality Integration
- ADR-0012: Runtime Validation with Zod
