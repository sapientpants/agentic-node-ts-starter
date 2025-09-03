# Configurable Logging Output Guide

This guide explains how to configure logging output destinations in your application. This feature provides flexibility for different deployment scenarios, from development debugging to production environments.

## Overview

The logging system supports multiple output destinations to accommodate various use cases:

- **stdout** - Standard output for normal console logging
- **stderr** - Standard error stream for when stdout is used for data
- **file** - File-based logging with rotation support
- **syslog** - Network syslog for centralized logging
- **null** - Disable logging entirely

## Quick Start

### Basic Configuration

1. **Set output via environment variable:**

```bash
# .env
LOG_OUTPUT=stderr  # Redirect logs to stderr
```

1. **Or use file logging:**

```bash
# .env
LOG_OUTPUT=file
LOG_FILE_PATH=./logs/app.log
```

1. **Use the logger normally in your code:**

```typescript
import { logger } from './logger.js';

// Logs go to configured destination
logger.info('Application starting...');
logger.debug({ request }, 'Processing request');
```

## Configuration Options

### Environment Variables

#### Core Settings

| Variable     | Type   | Default  | Description                                            |
| ------------ | ------ | -------- | ------------------------------------------------------ |
| `LOG_OUTPUT` | string | `stdout` | Output destination: stdout, stderr, file, syslog, null |
| `LOG_LEVEL`  | string | auto     | Log level: trace, debug, info, warn, error, fatal      |

#### Output Destinations

##### `stdout` (default)

Standard output - normal logging behavior for console applications.

```bash
LOG_OUTPUT=stdout
```

##### `stderr`

Standard error stream - useful when stdout is used for application output.

```bash
LOG_OUTPUT=stderr
```

Use cases:

- CLI tools that output data to stdout
- Applications using stdio for inter-process communication
- Docker containers where stdout is parsed for data

##### `file`

Write logs to a file with optional rotation.

```bash
LOG_OUTPUT=file
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10M       # Rotate when file reaches 10MB
LOG_FILE_MAX_FILES=5        # Keep maximum 5 rotated files
```

##### `syslog`

Send logs to a syslog daemon for centralized logging.

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

### Runtime Output Switching

You can change the logging output destination at runtime:

```typescript
import { logger, switchLogOutput, getLoggerOutputMode } from './logger.js';

// Check current output
console.log('Current output:', getLoggerOutputMode()); // 'stdout'

// Switch to stderr
switchLogOutput('stderr');
console.log('Current output:', getLoggerOutputMode()); // 'stderr'

// Switch to file
switchLogOutput('file');
```

### Using with Different Architectures

Here's an example of a service that switches output based on context:

```typescript
import { logger, switchLogOutput } from './logger.js';
import { createInterface } from 'readline';

// Use stderr for logging when using stdio for data
if (process.env.USE_STDIO_FOR_DATA === 'true') {
  switchLogOutput('stderr');
  logger.info('Logging redirected to stderr');
}

// Set up stdio communication
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Handle incoming data
rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    logger.debug({ data }, 'Received data'); // Goes to stderr

    // Process the data
    const response = processData(data);

    // Send response via stdout
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    logger.error({ error }, 'Failed to process data'); // Goes to stderr
  }
});
```

## Use Cases

### 1. CLI Tool with Data Output

```bash
# .env for CLI tool
LOG_OUTPUT=stderr
LOG_LEVEL=warn
```

```typescript
// CLI outputs data to stdout, logs to stderr
logger.info('Processing file...'); // Goes to stderr
console.log(JSON.stringify(results)); // Data to stdout
```

### 2. Long-Running Service with Log Rotation

```bash
# .env for service
LOG_OUTPUT=file
LOG_FILE_PATH=/var/log/myapp/service.log
LOG_FILE_MAX_SIZE=100M
LOG_FILE_MAX_FILES=10
LOG_LEVEL=info
```

### 3. Development with Detailed Logging

```bash
# .env for development
NODE_ENV=development
LOG_OUTPUT=stdout
LOG_LEVEL=debug
```

### 4. Production with Centralized Logging

```bash
# .env for production
NODE_ENV=production
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=syslog.internal.company.com
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=tcp
LOG_LEVEL=warn
```

### 5. Testing with Logging Disabled

```bash
# .env for testing
LOG_OUTPUT=null
```

## Testing Different Outputs

### Manual Testing

1. **Test stderr redirection:**

```bash
# Run with stderr output
LOG_OUTPUT=stderr npm start 2>error.log

# Logs should appear in error.log
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
// test-output-switching.ts
import { logger, switchLogOutput, getLoggerOutputMode } from './logger.js';

console.log('Initial mode:', getLoggerOutputMode());
logger.info('This goes to stdout');

switchLogOutput('stderr');
console.log('After switching:', getLoggerOutputMode());
logger.info('This goes to stderr');

switchLogOutput('file');
logger.info('This goes to a file');
```

### Automated Testing

Run the comprehensive test suite:

```bash
# Run output configuration tests
pnpm test tests/logger-output.spec.ts

# Run all logger tests
pnpm test tests/logger*.spec.ts
```

## Best Practices

### 1. Choose the Right Output for Your Use Case

- **stdout**: Default for most applications
- **stderr**: When stdout is used for data output
- **file**: For services that need persistent logs
- **syslog**: For enterprise environments with centralized logging
- **null**: For testing or when logging would interfere

### 2. Use Environment Variables for Static Configuration

```bash
# Production configuration
LOG_OUTPUT=syslog
LOG_LEVEL=info
```

### 3. Use Programmatic API for Dynamic Scenarios

```typescript
// Switch based on runtime conditions
if (isInteractiveMode()) {
  switchLogOutput('stdout');
} else {
  switchLogOutput('file');
}
```

### 4. Configure Rotation for File Logging

```bash
# Prevent disk space issues
LOG_FILE_MAX_SIZE=100M
LOG_FILE_MAX_FILES=5
```

### 5. Test Your Configuration

```bash
# Verify logs are going where expected
LOG_OUTPUT=stderr npm start 2>&1 | grep "Logger initialized"
```

## Troubleshooting

### Issue: Logs not appearing

**Solution:** Check if LOG_OUTPUT is set correctly:

```bash
echo $LOG_OUTPUT
# Should show: stdout, stderr, file, syslog, or null
```

### Issue: File logs not being created

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

**Solution:** Adjust rotation settings:

```bash
# Larger files, less frequent rotation
LOG_FILE_MAX_SIZE=500M
LOG_FILE_MAX_FILES=3
```

## Migration Guide

### From console.log

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
// Automatically uses configured output destination
```

## Performance Considerations

- **stdout/stderr**: Minimal overhead, synchronous writes
- **file**: Async I/O with worker threads via Pino
- **syslog**: Network overhead, consider batching
- **null**: Zero overhead, no operations

## Security Considerations

- Sensitive fields are automatically redacted (passwords, tokens, etc.)
- File permissions: Ensure log files are not world-readable
- Syslog: Use TCP with TLS for sensitive environments
- Never log sensitive data that could expose credentials

## Related Documentation

- [Logger Configuration](./OBSERVABILITY.md#structured-logging)
- [Environment Configuration](./CONFIG.md)
- [Pino Documentation](https://getpino.io/)

## Summary

The configurable logging output system ensures your application can:

- Adapt to different deployment environments
- Integrate with existing logging infrastructure
- Maintain clean separation between application output and logs
- Scale from development to production seamlessly
- Debug issues effectively with appropriate log destinations

Choose the right output destination for your use case and configure it via environment variables or programmatically at runtime.
