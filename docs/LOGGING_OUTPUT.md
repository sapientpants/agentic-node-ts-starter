# Configurable Logging Output Guide

Comprehensive guide to all logging output destinations, including configuration, security, and best practices. This feature provides flexibility for different deployment scenarios, from development debugging to production environments.

> **Referenced from**: [README Features](../README.md#features) - Configurable logging output

## Overview

The logging system supports five output destinations to accommodate various deployment and operational needs:

| Destination | Use Case                             | Configuration Complexity | Performance Impact |
| ----------- | ------------------------------------ | ------------------------ | ------------------ |
| **stdout**  | Default console logging, development | None (default)           | Minimal            |
| **stderr**  | When stdout is used for data output  | Minimal                  | Minimal            |
| **file**    | Persistent logs with rotation        | Moderate                 | Low (async I/O)    |
| **syslog**  | Centralized enterprise logging       | Moderate                 | Network dependent  |
| **null**    | Testing, performance critical paths  | Minimal                  | Zero               |

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

## Complete Configuration Reference

### Core Environment Variables

| Variable     | Type   | Default  | Required | Description                                               |
| ------------ | ------ | -------- | -------- | --------------------------------------------------------- |
| `LOG_OUTPUT` | string | `stdout` | No       | Output destination: stdout, stderr, file, syslog, null    |
| `LOG_LEVEL`  | string | auto\*   | No       | Log level: trace, debug, info, warn, error, fatal, silent |

\* Default is `info` in production, `debug` in development, `silent` in test

## Output Destinations - Complete Guide

### 1. stdout - Standard Output (Default)

**When to use**: Default for most applications, development, containers logging to stdout

#### Configuration

```bash
# .env or environment variables
LOG_OUTPUT=stdout  # Optional, this is the default
LOG_LEVEL=info     # Optional, see defaults above
```

#### Example Usage

```typescript
import { logger } from './logger.js';

logger.info('Application started');
logger.debug({ config }, 'Configuration loaded');
logger.error({ err }, 'Database connection failed');
```

#### Docker Integration

```dockerfile
# Dockerfile
ENV LOG_OUTPUT=stdout
ENV LOG_LEVEL=info
```

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - LOG_OUTPUT=stdout
      - LOG_LEVEL=info
```

### 2. stderr - Standard Error Stream

**When to use**: CLI tools outputting data to stdout, pipe-based architectures, debugging

#### Configuration

```bash
# .env
LOG_OUTPUT=stderr
LOG_LEVEL=warn  # Often only warnings/errors to stderr
```

#### Use Cases & Examples

```bash
# CLI tool that outputs JSON data
./my-cli process data.csv > output.json 2> errors.log
# Data goes to output.json, logs go to errors.log
```

```typescript
// CLI implementation
import { logger, switchLogOutput } from './logger.js';

// Ensure logs don't interfere with data output
switchLogOutput('stderr');

logger.info('Processing started'); // Goes to stderr
console.log(JSON.stringify(data)); // Goes to stdout
```

### 3. file - File-Based Logging with Rotation

**When to use**: Services requiring persistent logs, audit trails, debugging production issues

#### Complete Configuration

```bash
# .env
LOG_OUTPUT=file
LOG_FILE_PATH=./logs/app.log    # Path to log file
LOG_FILE_MAX_SIZE=10M            # Max size before rotation (K, M, G suffixes)
LOG_FILE_MAX_FILES=5             # Number of rotated files to keep
LOG_FILE_PERMISSIONS=640         # Unix file permissions (octal)
```

#### Rotation Settings Explained

| Setting                | Default | Examples            | Description                          |
| ---------------------- | ------- | ------------------- | ------------------------------------ |
| `LOG_FILE_MAX_SIZE`    | `10M`   | `100K`, `50M`, `1G` | Size threshold for rotation          |
| `LOG_FILE_MAX_FILES`   | `5`     | `10`, `30`          | Number of old files to retain        |
| `LOG_FILE_PERMISSIONS` | `640`   | `600`, `644`        | File permissions (owner-group-other) |

#### Security Features

- **Path Validation**: Prevents directory traversal attacks
- **System Directory Protection**: Blocks writing to `/etc`, `/usr`, `/bin`, etc.
- **Secure Defaults**: Files created with mode 640 (rw-r-----)
- **Directory Creation**: Parent directories created with mode 750

#### Production Example

```bash
# Production configuration
LOG_OUTPUT=file
LOG_FILE_PATH=/var/log/myapp/production.log
LOG_FILE_MAX_SIZE=100M
LOG_FILE_MAX_FILES=30  # Keep 30 days of logs
LOG_FILE_PERMISSIONS=600  # Only owner can read/write
LOG_LEVEL=info
```

#### Rotation Behavior

```
app.log           # Current log file
app.log.1         # Most recent rotated file
app.log.2         # Second most recent
...
app.log.5         # Oldest kept file (deleted next)
```

### 4. syslog - Centralized Network Logging

**When to use**: Enterprise environments, centralized logging infrastructure, compliance requirements

#### Complete Configuration

```bash
# .env
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=syslog.example.com  # Hostname or IP
LOG_SYSLOG_PORT=514                 # Standard syslog port
LOG_SYSLOG_PROTOCOL=tcp              # tcp or udp
LOG_LEVEL=info
```

#### Configuration Options

| Variable              | Default     | Options      | Description           |
| --------------------- | ----------- | ------------ | --------------------- |
| `LOG_SYSLOG_HOST`     | `localhost` | Hostname/IP  | Syslog server address |
| `LOG_SYSLOG_PORT`     | `514`       | 1-65535      | Server port           |
| `LOG_SYSLOG_PROTOCOL` | `udp`       | `udp`, `tcp` | Transport protocol    |

#### Security Validations

- **Hostname Validation**: Prevents injection attacks
- **Port Range Check**: Validates 1-65535
- **Privileged Port Warning**: Warns if port < 1024 in production
- **Localhost Warning**: Alerts when using localhost in production

#### Enterprise Setup Examples

```bash
# Internal syslog server
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=syslog.internal.corp.com
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=tcp

# AWS CloudWatch via syslog
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=logs.us-east-1.amazonaws.com
LOG_SYSLOG_PORT=514
LOG_SYSLOG_PROTOCOL=tcp

# Splunk Universal Forwarder
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=splunk-forwarder.local
LOG_SYSLOG_PORT=9514
LOG_SYSLOG_PROTOCOL=tcp
```

### 5. null - Disable Logging

**When to use**: Performance testing, specific test scenarios, ultra-high-performance code paths

#### Configuration

```bash
# .env
LOG_OUTPUT=null
```

#### Use Cases

```typescript
// Conditionally disable logging
if (process.env.BENCHMARK_MODE === 'true') {
  switchLogOutput('null');
}

// Or via environment
// LOG_OUTPUT=null npm run benchmark
```

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

Before (direct Pino usage):

```typescript
import pino from 'pino';
const logger = pino();
```

After (using configured logger):

```typescript
import { logger } from './logger.js';
// Automatically uses configured output destination
```

## Performance Considerations

- **stdout/stderr**: Minimal overhead, synchronous writes
- **file**: Async I/O with worker threads via Pino
- **syslog**: Network overhead, consider batching
- **null**: Zero overhead, no operations

## Security Features & Validations

### Comprehensive Security Measures

The logging system implements multiple layers of security validation:

#### 1. Automatic Data Redaction

**What's Protected**: Fields containing sensitive patterns are automatically redacted:

- `password`, `passwd`, `pwd`
- `token`, `api_key`, `apiKey`
- `secret`, `credential`
- `auth`, `authorization`
- Credit card patterns
- Social security numbers

```typescript
logger.info({
  user: 'john',
  password: 'secret123', // Automatically redacted to '***'
  api_key: 'sk-abc123xyz', // Redacted to '***'
  data: 'safe-info', // Not redacted
});
```

#### 2. File Output Security

**Path Validation** (implemented in `src/logger-validation.ts`):

| Validation          | Description                        | Example Blocked       |
| ------------------- | ---------------------------------- | --------------------- |
| Directory Traversal | Blocks `../` patterns              | `../../../etc/passwd` |
| System Directories  | Prevents writing to system paths   | `/etc/`, `/usr/bin/`  |
| Null Bytes          | Rejects paths with null characters | `file\0.log`          |
| Path Length         | Limits to 4096 characters          | Extremely long paths  |
| Special Characters  | Blocks control characters          | Paths with `\n`, `\r` |

**File Permissions**:

```bash
# Permission modes (octal)
LOG_FILE_PERMISSIONS=640  # rw-r----- (default, recommended)
LOG_FILE_PERMISSIONS=600  # rw------- (more restrictive)
LOG_FILE_PERMISSIONS=644  # rw-r--r-- (less restrictive, avoid)

# Directory creation
# Directories are always created with mode 750 (rwxr-x---)
```

#### 3. Syslog Security

**Validation Checks**:

| Check            | Description                     | Action                |
| ---------------- | ------------------------------- | --------------------- |
| Hostname Format  | Validates DNS names and IPs     | Rejects invalid hosts |
| Port Range       | Ensures 1-65535                 | Rejects invalid ports |
| Privileged Ports | Warns if port < 1024            | Warning in production |
| Localhost Check  | Detects localhost in production | Warning issued        |
| Protocol         | Validates tcp/udp only          | Rejects others        |

**Security Warnings Example**:

```bash
# This configuration will trigger warnings:
NODE_ENV=production
LOG_OUTPUT=syslog
LOG_SYSLOG_HOST=localhost  # ⚠️ Warning: localhost in production
LOG_SYSLOG_PORT=514        # ⚠️ Warning: privileged port in production
```

#### 4. Input Validation

All configuration inputs undergo validation:

```typescript
// These are all validated and sanitized:
- LOG_OUTPUT: Must be one of: stdout, stderr, file, syslog, null
- LOG_FILE_PATH: Path validation, no traversal
- LOG_FILE_MAX_SIZE: Valid size format (10K, 5M, 1G)
- LOG_SYSLOG_HOST: Valid hostname or IP
- LOG_SYSLOG_PORT: Integer 1-65535
- LOG_FILE_PERMISSIONS: Valid octal format
```

### Security Best Practices

1. **Never log credentials directly** - Use structured logging and rely on automatic redaction
2. **Use restrictive file permissions** - Default 640 or stricter 600 for sensitive environments
3. **Implement log rotation** - Prevent disk exhaustion with size limits and file counts
4. **Use centralized logging in production** - Syslog with TCP/TLS for security
5. **Monitor log sizes** - Set alerts for unusual growth patterns
6. **Audit log access** - Track who reads log files in production
7. **Consider encryption** - For highly sensitive environments, encrypt at rest
8. **Regular cleanup** - Archive and remove old logs per retention policy
9. **Validate all inputs** - The system validates all configuration automatically
10. **Test security features** - Verify redaction and validation work as expected

## Related Documentation

- [Logger Configuration](./OBSERVABILITY.md#structured-logging)
- [Environment Configuration](./CONFIG.md)
- [Pino Documentation](https://getpino.io/)

## Quick Decision Matrix

| Scenario                  | Recommended Output | Key Configuration                 |
| ------------------------- | ------------------ | --------------------------------- |
| Local Development         | `stdout` (default) | `LOG_LEVEL=debug`                 |
| CLI Tool with Data Output | `stderr`           | Separates logs from data          |
| Production Web Service    | `file` or `syslog` | Rotation + centralization         |
| Docker/Kubernetes         | `stdout`           | Container logs handle it          |
| Performance Testing       | `null`             | Zero overhead                     |
| Debugging Production      | `file`             | `LOG_LEVEL=trace`, large rotation |
| Compliance/Audit          | `syslog`           | Centralized, tamper-proof         |

## Summary

The logging output system provides:

✅ **Five output destinations** for different use cases  
✅ **Automatic security validations** preventing common vulnerabilities  
✅ **File rotation** preventing disk space issues  
✅ **Centralized logging support** via syslog  
✅ **Runtime switching** for dynamic scenarios  
✅ **Zero-config defaults** that work out of the box  
✅ **Production-ready security** with path validation and redaction

Configure via environment variables or switch programmatically at runtime based on your needs.
