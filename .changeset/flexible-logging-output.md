---
'agentic-node-ts-starter': minor
---

feat: Add configurable logging output destinations

Adds comprehensive support for multiple logging output destinations to provide flexibility for different deployment scenarios and application architectures.

Key features:

- Multiple output destinations: stdout, stderr, file, syslog, null
- File logging with rotation support (size and count limits)
- Programmatic API for runtime output switching
- Preserves all existing logger features (context, correlation IDs, redaction)
- Backward compatible with no breaking changes

This enables developers to:

- Redirect logs to stderr for applications that use stdout for data output
- Write logs to files with automatic rotation for long-running services
- Send logs to centralized syslog servers for enterprise environments
- Disable logging entirely with the null output for testing or special cases

For detailed usage, see docs/LOGGING_OUTPUT.md
