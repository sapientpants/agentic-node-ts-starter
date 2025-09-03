---
'agentic-node-ts-starter': minor
---

feat: Add MCP stdio-compatible logging mode

Adds comprehensive MCP (Model Context Protocol) compatible logging support to enable building MCP servers that communicate via stdio channels. This feature ensures stdout remains clean for protocol messages while maintaining robust logging capabilities.

Key features:

- Multiple output destinations: stdout, stderr, file, syslog, null
- MCP mode auto-detection via MCP_MODE environment variable
- File logging with rotation support (size and count limits)
- Programmatic API for runtime mode switching
- Preserves all existing logger features (context, correlation IDs, redaction)
- Zero stdout contamination in MCP modes
- Backward compatible with no breaking changes

This enables developers to build Claude Desktop integrations, VS Code extensions, and other MCP-compatible tools using the starter template.

For detailed usage, see docs/MCP_LOGGING.md
