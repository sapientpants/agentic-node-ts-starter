# MCP-Compatible Logging Guide

This guide explains how to use the MCP (Model Context Protocol) compatible logging system in your application. This feature is essential when building MCP servers that communicate via stdio channels.

## Overview

MCP servers communicate with clients using JSON-RPC over stdio (standard input/output). This means:

- **stdin** receives protocol messages from the client
- **stdout** must be reserved exclusively for protocol responses
- **Any log output to stdout would corrupt the protocol stream**

Our logging system provides multiple output destinations to keep stdout clean while maintaining robust logging capabilities.

## Quick Start

### For MCP Server Development

1. **Set MCP mode via environment variable:**

```bash
# .env
MCP_MODE=true  # Automatically redirects logs to stderr
```

1. **Or set output explicitly:**

```bash
# .env
LOG_OUTPUT=stderr  # Direct control over output destination
```

1. **Use the logger normally in your code:**

```typescript
import { logger } from './logger.js';

// These logs go to stderr, keeping stdout clean for MCP protocol
logger.info('MCP server starting...');
logger.debug({ request }, 'Processing MCP request');

// MCP protocol messages can safely use stdout
process.stdout.write(
  JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: {
      /* ... */
    },
  }),
);
```

## Configuration Options

### Environment Variables

#### Core MCP Settings

| Variable     | Type    | Default  | Description                                            |
| ------------ | ------- | -------- | ------------------------------------------------------ |
| `MCP_MODE`   | boolean | `false`  | Enable MCP mode - auto-redirects to stderr             |
| `LOG_OUTPUT` | string  | `stdout` | Output destination: stdout, stderr, file, syslog, null |

#### Output Destinations

##### `stdout` (default)

Standard output - normal logging behavior. Use for non-MCP applications.

```bash
LOG_OUTPUT=stdout
```

##### `stderr`

Standard error stream - perfect for MCP servers.

```bash
LOG_OUTPUT=stderr
# Or simply:
MCP_MODE=true
```

##### `file`

Write logs to a file with optional rotation.

```bash
LOG_OUTPUT=file
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10M       # Rotate when file reaches 10MB
LOG_FILE_MAX_FILES=5        # Keep maximum 5 rotated files
```

##### `syslog`

Send logs to a syslog daemon.

```bash
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=localhost
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=udp     # or tcp
```

##### `null`

Disable logging entirely.

```bash
LOG_OUTPUT=null
```

### File Logging Configuration

| Variable             | Type   | Default          | Description                                   |
| -------------------- | ------ | ---------------- | --------------------------------------------- |
| `LOG_FILE_PATH`      | string | `./logs/app.log` | Path to log file                              |
| `LOG_FILE_MAX_SIZE`  | string | `10M`            | Max file size before rotation (e.g., 10M, 1G) |
| `LOG_FILE_MAX_FILES` | number | `5`              | Number of rotated files to keep               |

### Syslog Configuration

| Variable              | Type   | Default     | Description            |
| --------------------- | ------ | ----------- | ---------------------- |
| `LOG_SYSLOG_HOST`     | string | `localhost` | Syslog server hostname |
| `LOG_SYSLOG_PORT`     | number | `514`       | Syslog server port     |
| `LOG_SYSLOG_PROTOCOL` | string | `udp`       | Protocol: udp or tcp   |

## Programmatic API

### Runtime Mode Switching

You can enable/disable MCP mode at runtime:

```typescript
import { enableMCPMode, disableMCPMode, getLoggerOutputMode } from './logger.js';

// Check current mode
console.log('Current output:', getLoggerOutputMode()); // 'stdout'

// Enable MCP mode (redirects to stderr)
enableMCPMode();
console.log('Current output:', getLoggerOutputMode()); // 'stderr'

// Disable MCP mode (back to stdout)
disableMCPMode();
console.log('Current output:', getLoggerOutputMode()); // 'stdout'
```

### Using with MCP Servers

Here's a complete example of an MCP server with proper logging:

```typescript
import { logger, enableMCPMode } from './logger.js';
import { createInterface } from 'readline';

// Enable MCP mode to keep stdout clean
enableMCPMode();

// Log to stderr
logger.info('MCP server starting...');

// Set up stdio communication
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Handle incoming MCP messages
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    logger.debug({ message }, 'Received MCP message'); // Goes to stderr

    // Process the message
    const response = handleMCPMessage(message);

    // Send response via stdout (clean, no log contamination)
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    logger.error({ error }, 'Failed to process MCP message'); // Goes to stderr
  }
});

function handleMCPMessage(message: any) {
  logger.info({ method: message.method }, 'Processing MCP method'); // Goes to stderr

  // Your MCP logic here
  return {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      /* ... */
    },
  };
}
```

## Use Cases

### 1. Claude Desktop MCP Server

```bash
# .env for Claude Desktop MCP server
NODE_ENV=production
MCP_MODE=true
LOG_LEVEL=info
LOG_FILE_PATH=~/.mcp/servers/my-server/logs/server.log
```

### 2. VS Code Extension MCP Server

```typescript
// Enable MCP mode when running as language server
if (process.env.VSCODE_MCP_SERVER === 'true') {
  enableMCPMode();
  logger.info('Running in VS Code MCP mode');
}
```

### 3. Development with File Logging

```bash
# .env for development
NODE_ENV=development
LOG_OUTPUT=file
LOG_FILE_PATH=./dev-logs/app.log
LOG_FILE_MAX_SIZE=50M
LOG_FILE_MAX_FILES=10
LOG_LEVEL=debug
```

### 4. Production with Syslog

```bash
# .env for production
NODE_ENV=production
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=syslog.internal.company.com
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=tcp
LOG_LEVEL=warn
```

## Testing MCP Mode

### Manual Testing

1. **Test stderr redirection:**

```bash
# Run with MCP mode
MCP_MODE=true npm start 2>error.log

# Logs should appear in error.log, not in stdout
```

1. **Test file output:**

```bash
# Run with file logging
LOG_OUTPUT=file LOG_FILE_PATH=./test.log npm start

# Check test.log for output
tail -f test.log
```

1. **Test programmatic switching:**

```typescript
// test-mcp-mode.ts
import { logger, enableMCPMode, getLoggerOutputMode } from './logger.js';

console.log('Initial mode:', getLoggerOutputMode());
logger.info('This goes to stdout');

enableMCPMode();
console.log('After enabling:', getLoggerOutputMode());
logger.info('This goes to stderr');
```

### Automated Testing

Run the comprehensive test suite:

```bash
# Run MCP logging tests
pnpm test tests/logger-mcp.spec.ts

# Run all logger tests
pnpm test tests/logger*.spec.ts
```

## Best Practices

### 1. Use Environment Variables for Static Configuration

For production MCP servers, set configuration via environment:

```bash
# Production MCP server
MCP_MODE=true
LOG_LEVEL=info
```

### 2. Use Programmatic API for Dynamic Scenarios

For applications that switch between modes:

```typescript
if (isRunningAsMCPServer()) {
  enableMCPMode();
} else {
  // Normal logging to stdout
}
```

### 3. Always Test stdout Cleanliness

Verify your MCP server doesn't contaminate stdout:

```bash
# This should only show MCP protocol messages
npm start 2>/dev/null | jq .
```

### 4. Use File Logging for Debugging

During development, use file logging to debug MCP servers:

```bash
LOG_OUTPUT=file LOG_FILE_PATH=./debug.log npm start
# In another terminal:
tail -f debug.log
```

### 5. Implement Graceful Shutdown

Ensure logs are flushed on exit:

```typescript
process.on('SIGTERM', () => {
  logger.info('Shutting down MCP server...');
  // Pino automatically flushes on process exit
  process.exit(0);
});
```

## Troubleshooting

### Issue: Logs appearing in stdout despite MCP_MODE=true

**Solution:** Check if LOG_OUTPUT is explicitly set, as it overrides MCP_MODE:

```bash
# This will use stdout, ignoring MCP_MODE
MCP_MODE=true LOG_OUTPUT=stdout npm start

# Remove LOG_OUTPUT or set it to stderr
MCP_MODE=true npm start
```

### Issue: File logs not appearing

**Solution:** Check file permissions and path:

```typescript
import { logger } from './logger.js';

// The logger will create directories if needed
// Ensure the process has write permissions
logger.info('Test message');
```

### Issue: Syslog connection failing

**Solution:** Verify syslog daemon is running and accessible:

```bash
# Test syslog connectivity
echo "test" | nc -u localhost 514

# Check syslog configuration
LOG_SYSLOG_HOST=localhost LOG_SYSLOG_PORT=514 LOG_SYSLOG_PROTOCOL=udp
```

### Issue: Performance impact with file logging

**Solution:** Adjust rotation settings and use async transports:

```bash
# Larger files, less frequent rotation
LOG_FILE_MAX_SIZE=100M
LOG_FILE_MAX_FILES=3
```

## Migration Guide

### From console.log to MCP-compatible logging

Before:

```typescript
console.log('Server starting...');
console.error('Error:', error);
```

After:

```typescript
import { logger } from './logger.js';

logger.info('Server starting...');
logger.error({ error }, 'Error occurred');
```

### From existing Pino setup

Before:

```typescript
import pino from 'pino';
const logger = pino();
```

After:

```typescript
import { logger } from './logger.js';
// Automatically handles MCP mode based on configuration
```

## Performance Considerations

- **stderr**: Minimal overhead, synchronous writes
- **file**: Async I/O with worker threads via Pino
- **syslog**: Network overhead, consider batching
- **null**: Zero overhead, no operations

## Security Considerations

- Sensitive fields are automatically redacted (passwords, tokens, etc.)
- File permissions: Ensure log files are not world-readable
- Syslog: Use TCP with TLS for sensitive environments
- Never log MCP protocol messages that may contain secrets

## Related Documentation

- [Logger Configuration](./OBSERVABILITY.md#structured-logging)
- [Environment Configuration](./CONFIG.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Pino Documentation](https://getpino.io/)

## Summary

The MCP-compatible logging system ensures your application can:

- Build MCP servers without stdout contamination
- Maintain comprehensive logging in production
- Switch between output modes based on context
- Debug effectively during development
- Scale with file rotation and syslog support

For MCP server development, simply set `MCP_MODE=true` and use the logger normally - all complexity is handled automatically.
