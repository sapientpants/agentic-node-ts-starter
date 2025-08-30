# 9. Container and Security Scanning Strategy

Date: 2025-08-28

## Status

Accepted

## Context

The project required a comprehensive security scanning strategy to:

- Detect vulnerabilities in dependencies and container images
- Integrate security checks into the CI/CD pipeline
- Provide actionable security reports for remediation
- Support both local development and automated workflows
- Meet compliance requirements for security-conscious deployments
- Balance security thoroughness with development velocity

Key security concerns:

- **Dependency Vulnerabilities**: Third-party package security issues
- **Container Security**: Base image and runtime vulnerabilities
- **Supply Chain**: Ensuring integrity of build artifacts and dependencies
- **Compliance**: Meeting industry standards for security scanning

## Decision

We implemented a multi-layered security scanning strategy:

1. **Static Analysis**: CodeQL for source code security scanning
2. **Dependency Scanning**: OSV Scanner for vulnerability detection
3. **Container Scanning**: Trivy for container image security
4. **Supply Chain Security**: SLSA attestations and SBOM generation

### Implementation Details

- **CodeQL Integration**:
  - Automated analysis of TypeScript/JavaScript code
  - Detection of common vulnerabilities (XSS, injection attacks)
  - Integration with GitHub Security tab for findings

- **OSV (Open Source Vulnerabilities) Scanning**:
  - Google's official vulnerability database
  - Scans package.json and lock files
  - Continuous monitoring of new vulnerabilities

- **Container Security**:
  - Trivy scanning for Docker images
  - Configurable severity thresholds (HIGH/CRITICAL)
  - SARIF report integration with GitHub Security
  - Support for vulnerability exclusions via .trivyignore

- **Supply Chain Security**:
  - SLSA build attestations for provenance
  - Software Bill of Materials (SBOM) generation
  - Cryptographic verification of build artifacts

- **Local Development**:
  - Scripts for local security scanning
  - Pre-commit security validation
  - Developer-friendly security tooling

## Consequences

### Positive

- **Early Detection**: Security issues caught before production deployment
- **Comprehensive Coverage**: Multi-layered approach covers various attack vectors
- **Automation**: Integrated into CI/CD for continuous security validation
- **Actionable Reports**: Clear remediation guidance through SARIF integration
- **Supply Chain Security**: Build provenance and artifact verification
- **Compliance**: Meets security standards for enterprise deployments
- **Developer Experience**: Local tools enable security testing during development

### Negative

- **Build Time**: Security scans add 2-3 minutes to CI/CD pipeline
- **False Positives**: Occasionally flags acceptable patterns or dependencies
- **Complexity**: Multiple tools require coordination and maintenance
- **Alert Fatigue**: High volume of security findings may overwhelm teams
- **Dependency Updates**: Security fixes may require frequent dependency updates

### Mitigation

- **Performance**: Scans run in parallel to minimize pipeline impact
- **Triaging**: .trivyignore and exception handling for false positives
- **Documentation**: Clear guidelines for interpreting and acting on security findings
- **Automation**: Automated dependency updates where safe
- **Training**: Team education on security best practices and tool usage
- **Thresholds**: Configurable severity levels balance security vs. velocity

## References

- [CodeQL Documentation](https://codeql.github.com/)
- [OSV Scanner](https://osv.dev/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [SLSA Framework](https://slsa.dev/)
- [SARIF Format](https://sarifweb.azurewebsites.net/)

## Addendum (2025-08-30)

The security scanning strategy has been enhanced with additional code quality and security analysis:

### SonarQube Security Integration (see ADR-0011)

Added SonarCloud security analysis to complement existing security scanning:

- Detection of security vulnerabilities in TypeScript/JavaScript code
- Security hotspot identification for sensitive code patterns
- OWASP Top 10 vulnerability detection
- CWE (Common Weakness Enumeration) classification
- Integration with existing SARIF reporting

### Comprehensive Security Approach

The security strategy now includes:

1. **Static Analysis**: CodeQL + SonarQube for source code
2. **Dependency Scanning**: OSV Scanner for known vulnerabilities
3. **Container Scanning**: Trivy for Docker images
4. **Code Quality**: SonarQube for security-related code smells
5. **Supply Chain**: SLSA attestations and SBOM generation

### Automated Remediation

- SonarQube issues can be automatically fixed via Claude commands
- Prioritization based on severity (BLOCKER, CRITICAL, HIGH)
- Integration with pull request workflow for immediate feedback

### Related ADRs

- ADR-0011: SonarQube Code Quality Integration
- ADR-0013: Claude Code Development Environment
