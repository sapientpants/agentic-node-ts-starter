# Configuration Guide

This guide explains how to use and extend the type-safe environment configuration system provided by the starter template.

> **Important**: Configuration is mandatory. The application validates all environment variables at startup and will exit with clear error messages if configuration is invalid or missing.

## Overview

The configuration module (`src/config.ts`) provides:

- 🔒 **Type-safe** environment variable access with full TypeScript support
- ✅ **Validation** at application startup using Zod schemas
- 🚨 **Clear error messages** when configuration is invalid
- 🔐 **Sensitive value masking** in error outputs
- 🎯 **Sensible defaults** for optional configuration
- 📝 **Auto-generated types** from your schema

## Quick Start

1. **Copy the example configuration:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**

   ```bash
   NODE_ENV=development
   APP_NAME=my-app
   LOG_LEVEL=debug
   ```

3. **Use configuration in your code:**

   ```typescript
   import { config } from './config.js';

   // TypeScript knows config.ENABLE_METRICS is a boolean
   if (config.ENABLE_METRICS) {
     setupMetrics();
   }

   // Check if optional config exists
   if (config.DEBUG) {
     enableDebugMode(config.DEBUG);
   }
   ```

## Configuration Variables

### Core Settings

| Variable   | Type   | Default                   | Description                                         |
| ---------- | ------ | ------------------------- | --------------------------------------------------- |
| `NODE_ENV` | string | `development`             | Environment: development, production, test, staging |
| `APP_NAME` | string | `agentic-node-ts-starter` | Application name for logging                        |

### Logging

| Variable    | Type   | Default          | Description                      |
| ----------- | ------ | ---------------- | -------------------------------- |
| `LOG_LEVEL` | string | `info` / `debug` | Log level (see note below)       |
| `DEBUG`     | string | -                | Debug namespaces (e.g., `app:*`) |

**Note:** `LOG_LEVEL` defaults to `info` in production, `debug` in development.

### Feature Flags

| Variable         | Type    | Default | Description               |
| ---------------- | ------- | ------- | ------------------------- |
| `ENABLE_METRICS` | boolean | `false` | Enable metrics collection |

### Timeouts

| Variable     | Type   | Default | Description                               |
| ------------ | ------ | ------- | ----------------------------------------- |
| `TIMEOUT_MS` | number | `30000` | General operation timeout in milliseconds |

### Development Settings (Optional)

| Variable      | Type    | Description                      |
| ------------- | ------- | -------------------------------- |
| `DEBUG`       | string  | Debug namespaces (e.g., `app:*`) |
| `FORCE_COLOR` | boolean | Force colored terminal output    |

## Adding Custom Configuration

To add your own environment variables:

1. **Update the schema in `src/config.ts`:**

   ```typescript
   const ConfigSchema = z.object({
     // ... existing configuration ...

     // Add your custom variables
     MY_CUSTOM_VAR: z.string().min(1).describe('My custom variable'),

     BATCH_SIZE: z
       .string()
       .regex(/^\d+$/)
       .transform(Number)
       .default('100')
       .describe('Processing batch size'),

     FEATURE_FLAG: BooleanSchema.default('false').describe('Enable new feature'),
   });
   ```

2. **TypeScript automatically provides types:**

   ```typescript
   import { config } from './config.js';

   // TypeScript knows about your new variables
   const batchSize = config.BATCH_SIZE;

   if (config.FEATURE_FLAG) {
     enableNewFeature();
   }
   ```

3. **Update `.env.example`:**

   ```bash
   # Custom Configuration
   MY_CUSTOM_VAR=example-value

   # Processing Settings
   BATCH_SIZE=100

   # Feature Flags
   FEATURE_FLAG=false
   ```

## Validation Types

The configuration module supports various validation types:

### Strings

```typescript
// Basic string
MY_VAR: z.string(),

// String with minimum length
SECRET: z.string().min(32),

// String matching pattern
LOCALE: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
```

### Numbers

```typescript
// Number from string input
BATCH_SIZE: z.string().regex(/^\d+$/).transform(Number),

// Number with range validation
WORKERS: z.string()
  .transform(Number)
  .refine(n => n >= 1 && n <= 10),
```

### Booleans

```typescript
// Boolean accepting multiple formats
ENABLE_FEATURE: BooleanSchema, // accepts: true/false, 1/0, yes/no
```

### Enums

```typescript
// String enum
ENVIRONMENT: z.enum(['development', 'staging', 'production']),

// With default
LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
```

### Arrays

```typescript
// Comma-separated list
ALLOWED_HOSTS: z.string()
  .transform(s => s.split(',').map(h => h.trim()))
  .default('localhost'),
```

## Error Handling

When configuration validation fails, the application provides clear error messages:

```
❌ Invalid environment configuration:

Missing required variables:
  • MY_CUSTOM_VAR: Required but not provided

Invalid format:
  • TIMEOUT_MS: Must be a valid number (received: "abc")
  • ENABLE_METRICS: Invalid enum value (received: "maybe")

Other errors:
  • SECRET: String must contain at least 32 character(s)

💡 Tip: Check .env.example for valid configuration examples
```

### Sensitive Value Protection

Sensitive values are automatically masked in error messages:

- Any variable containing `PASSWORD`, `TOKEN`, `SECRET`, or `KEY` → Masked
- Shows only first and last 2 characters for longer values

## Helper Functions

The configuration module provides helper functions for common tasks:

### `getConfig(key)`

Type-safe configuration getter:

```typescript
import { getConfig } from './config.js';

const logLevel = getConfig('LOG_LEVEL'); // TypeScript knows this is a string
const metrics = getConfig('ENABLE_METRICS'); // TypeScript knows this is a boolean
```

### `hasConfig(key)`

Check if optional configuration exists:

```typescript
import { hasConfig, config } from './config.js';

if (hasConfig('DEBUG')) {
  // TypeScript knows config.DEBUG is defined here
  enableDebugMode(config.DEBUG);
}
```

### `getConfigKeys()`

Get all configuration keys (useful for debugging):

```typescript
import { getConfigKeys } from './config.js';

console.log('Loaded configuration keys:', getConfigKeys());
```

## Best Practices

### 1. **Fail Fast**

Configuration is validated at application startup. Invalid configuration causes immediate exit with clear error messages.

### 2. **Use TypeScript**

Let TypeScript guide you:

```typescript
// ✅ TypeScript knows the types
if (config.TIMEOUT_MS > 5000) {
  // TIMEOUT_MS is number
  // ...
}

// ❌ TypeScript error: Property 'UNKNOWN' does not exist
console.log(config.UNKNOWN);
```

### 3. **Document Your Variables**

Always add descriptions to your schema:

```typescript
MY_VARIABLE: z.string()
  .describe('Controls the widget behavior in production'),
```

### 4. **Provide Defaults When Sensible**

```typescript
// Good: Sensible default for optional feature
CACHE_TTL: z.string()
  .transform(Number)
  .default('3600'), // 1 hour default

// Good: No default for required custom config
API_ENDPOINT: z.string().url(), // No default, must be provided
```

### 5. **Group Related Configuration**

Organize your schema logically:

```typescript
const ConfigSchema = z.object({
  // Core
  NODE_ENV: /* ... */,
  APP_NAME: /* ... */,

  // Logging
  LOG_LEVEL: /* ... */,
  DEBUG: /* ... */,

  // Feature Flags
  ENABLE_FEATURE_X: /* ... */,
  ENABLE_FEATURE_Y: /* ... */,
});
```

## Deployment Considerations

### Docker

Set environment variables in your Dockerfile:

```dockerfile
ENV NODE_ENV=production
ENV LOG_LEVEL=info
```

Or use docker-compose:

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - ENABLE_METRICS=true
```

### Kubernetes

Use ConfigMaps and Secrets:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: production
  LOG_LEVEL: info
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
stringData:
  MY_SECRET: your-secret-value
```

### Cloud Platforms

- **Heroku**: Set via `heroku config:set`
- **Vercel**: Configure in project settings
- **AWS**: Use Parameter Store or Secrets Manager
- **Azure**: Use App Configuration or Key Vault

### CI/CD

Never commit `.env` files. Instead:

1. Use `.env.example` as documentation
2. Set secrets in CI/CD environment
3. Use platform-specific secret management

Example GitHub Actions:

```yaml
- name: Run tests
  env:
    NODE_ENV: test
    LOG_LEVEL: silent
  run: pnpm test
```

## Testing

### Unit Tests

Test configuration with different environment setups:

```typescript
describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should load production config', async () => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEY = 'test-api-key';

    const { config } = await import('./config.js');

    expect(config.NODE_ENV).toBe('production');
    expect(config.LOG_LEVEL).toBe('info'); // production default
  });
});
```

### Integration Tests

Use test-specific configuration:

```typescript
// test.env
NODE_ENV = test;
LOG_LEVEL = silent;
TIMEOUT_MS = 1000;
```

## Troubleshooting

### Common Issues

1. **"Invalid environment configuration" on startup**
   - Check error message for specific variables
   - Verify `.env` file is in project root
   - Ensure values match expected format

2. **TypeScript doesn't recognize new variables**
   - Restart TypeScript server in your IDE
   - Ensure you've added to `ConfigSchema`
   - Check for typos in variable names

3. **Configuration works locally but not in production**
   - Verify all required variables are set in production
   - Check for different Node.js versions
   - Ensure `.env` is not being used in production

4. **Sensitive values appearing in logs**
   - Add variable names to `SENSITIVE_KEYS` array
   - Use structured logging with redaction
   - Review error handling code

### Debug Mode

Enable debug output for configuration loading:

```typescript
// In src/config.ts, temporarily add:
console.log('Raw environment:', process.env);
console.log('Parsed config:', config);
```

## Migration Guide

### From Plain `process.env`

Before:

```typescript
const port = process.env.PORT || 3000;
const enableMetrics = process.env.ENABLE_METRICS === 'true';
```

After:

```typescript
import { config } from './config.js';

const port = config.PORT; // Already parsed as number
const enableMetrics = config.ENABLE_METRICS; // Already boolean
```

### From dotenv

Before:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is required');
}
```

After:

```typescript
import { config } from './config.js';

// Validation happens automatically
const apiKey = config.API_KEY; // TypeScript knows this exists if required
```

## Summary

The configuration module provides a robust, type-safe way to manage environment variables in your application. By validating configuration at startup and providing clear error messages, it helps catch configuration issues early in development rather than in production.

Key benefits:

- ✅ **Type safety**: Full TypeScript support
- ✅ **Validation**: Catch errors at startup
- ✅ **Documentation**: Self-documenting with descriptions
- ✅ **Security**: Automatic sensitive value masking
- ✅ **Developer experience**: Clear errors and sensible defaults

For more examples and patterns, see the test file at `tests/config.spec.ts`.
