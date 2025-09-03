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
   PORT=3000
   DATABASE_URL=postgresql://localhost/myapp
   ```

3. **Use configuration in your code:**

   ```typescript
   import { config } from './config.js';

   // TypeScript knows config.PORT is a number
   const server = app.listen(config.PORT, () => {
     console.log(`Server running on port ${config.PORT}`);
   });

   // TypeScript knows config.ENABLE_METRICS is a boolean
   if (config.ENABLE_METRICS) {
     setupMetrics();
   }

   // Check if optional config exists
   if (config.DATABASE_URL) {
     await connectDatabase(config.DATABASE_URL);
   }
   ```

## Configuration Variables

### Core Settings

| Variable   | Type   | Default                   | Description                                         |
| ---------- | ------ | ------------------------- | --------------------------------------------------- |
| `NODE_ENV` | string | `development`             | Environment: development, production, test, staging |
| `PORT`     | number | `3000`                    | Server port (1-65535)                               |
| `HOST`     | string | `0.0.0.0`                 | Server host address                                 |
| `APP_NAME` | string | `agentic-node-ts-starter` | Application name for logging                        |

### Logging

| Variable    | Type   | Default          | Description                      |
| ----------- | ------ | ---------------- | -------------------------------- |
| `LOG_LEVEL` | string | `info` / `debug` | Log level (see note below)       |
| `DEBUG`     | string | -                | Debug namespaces (e.g., `app:*`) |

**Note:** `LOG_LEVEL` defaults to `info` in production, `debug` in development.

### Feature Flags

| Variable                   | Type    | Default | Description                  |
| -------------------------- | ------- | ------- | ---------------------------- |
| `ENABLE_METRICS`           | boolean | `false` | Enable metrics collection    |
| `ENABLE_HEALTHCHECK`       | boolean | `true`  | Enable health check endpoint |
| `ENABLE_GRACEFUL_SHUTDOWN` | boolean | `true`  | Enable graceful shutdown     |

### External Services (Optional)

| Variable       | Type   | Required | Description                     |
| -------------- | ------ | -------- | ------------------------------- |
| `DATABASE_URL` | string | No       | PostgreSQL connection string    |
| `REDIS_URL`    | string | No       | Redis connection string         |
| `API_BASE_URL` | string | No       | Base URL for external API calls |

### Security

| Variable         | Type   | Required | Description                       |
| ---------------- | ------ | -------- | --------------------------------- |
| `CORS_ORIGIN`    | string | No       | CORS origins (default: `*`)       |
| `SESSION_SECRET` | string | No       | Session secret (min 32 chars)     |
| `API_KEY`        | string | No       | API key for external services     |
| `JWT_SECRET`     | string | No       | JWT signing secret (min 32 chars) |

### Rate Limiting & Timeouts

| Variable               | Type   | Default | Description                     |
| ---------------------- | ------ | ------- | ------------------------------- |
| `REQUEST_TIMEOUT_MS`   | number | `30000` | Request timeout in milliseconds |
| `MAX_REQUEST_SIZE`     | string | `10mb`  | Maximum request body size       |
| `RATE_LIMIT_MAX`       | number | `100`   | Max requests per window         |
| `RATE_LIMIT_WINDOW_MS` | number | `60000` | Rate limit window (ms)          |

## Adding Custom Configuration

To add your own environment variables:

1. **Update the schema in `src/config.ts`:**

   ```typescript
   const ConfigSchema = z.object({
     // ... existing configuration ...

     // Add your custom variables
     STRIPE_API_KEY: z.string().min(1).describe('Stripe API key'),

     SMTP_HOST: z.string().optional().describe('SMTP server host'),

     MAX_UPLOAD_SIZE: z
       .string()
       .regex(/^\d+$/)
       .transform(Number)
       .default('5242880') // 5MB in bytes
       .describe('Maximum upload size in bytes'),

     FEATURE_NEW_UI: BooleanSchema.default('false').describe('Enable new UI features'),
   });
   ```

2. **TypeScript automatically provides types:**

   ```typescript
   import { config } from './config.js';

   // TypeScript knows about your new variables
   const stripe = new Stripe(config.STRIPE_API_KEY);

   if (config.SMTP_HOST) {
     setupEmailTransport(config.SMTP_HOST);
   }
   ```

3. **Update `.env.example`:**

   ```bash
   # Stripe Configuration
   STRIPE_API_KEY=sk_test_...

   # Email Configuration (optional)
   # SMTP_HOST=smtp.example.com

   # Upload Settings
   MAX_UPLOAD_SIZE=5242880  # 5MB

   # Feature Flags
   FEATURE_NEW_UI=false
   ```

## Validation Types

The configuration module supports various validation types:

### Strings

```typescript
// Basic string
API_KEY: z.string(),

// String with minimum length
SECRET: z.string().min(32),

// String matching pattern
LOCALE: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
```

### Numbers

```typescript
// Number from string input
PORT: z.string().regex(/^\d+$/).transform(Number),

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

### URLs

```typescript
// URL validation
DATABASE_URL: z.string().url(),

// Optional URL
WEBHOOK_URL: z.string().url().optional(),
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
  • DATABASE_URL: Required but not provided
  • API_KEY: Required but not provided

Invalid format:
  • PORT: Must be a valid port number (received: "abc")
  • ENABLE_METRICS: Invalid enum value (received: "maybe")

Other errors:
  • SESSION_SECRET: String must contain at least 32 character(s)

💡 Tip: Check .env.example for valid configuration examples
```

### Sensitive Value Protection

Sensitive values are automatically masked in error messages:

- `DATABASE_URL`, `REDIS_URL` → Shows only first and last 2 characters
- `API_KEY`, `JWT_SECRET`, `SESSION_SECRET` → Masked
- Any variable containing `PASSWORD`, `TOKEN`, `SECRET`, or `KEY` → Masked

## Helper Functions

The configuration module provides helper functions for common tasks:

### `getConfig(key)`

Type-safe configuration getter:

```typescript
import { getConfig } from './config.js';

const port = getConfig('PORT'); // TypeScript knows this is a number
const metrics = getConfig('ENABLE_METRICS'); // TypeScript knows this is a boolean
```

### `hasConfig(key)`

Check if optional configuration exists:

```typescript
import { hasConfig, config } from './config.js';

if (hasConfig('DATABASE_URL')) {
  // TypeScript knows config.DATABASE_URL is defined here
  await connectDatabase(config.DATABASE_URL);
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
if (config.PORT > 8000) {
  // PORT is number
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

// Good: No default for required external service
API_ENDPOINT: z.string().url(), // No default, must be provided
```

### 5. **Group Related Configuration**

Organize your schema logically:

```typescript
const ConfigSchema = z.object({
  // Server
  PORT: /* ... */,
  HOST: /* ... */,

  // Database
  DATABASE_URL: /* ... */,
  DATABASE_POOL_SIZE: /* ... */,

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
ENV PORT=8080
```

Or use docker-compose:

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DATABASE_URL=postgresql://db/myapp
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
  PORT: '8080'
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
stringData:
  DATABASE_URL: postgresql://user:pass@db/myapp
  JWT_SECRET: your-secret-key
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
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
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
    process.env.DATABASE_URL = 'postgresql://prod/db';

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
NODE_ENV=test
PORT=0  // Let OS assign random port
DATABASE_URL=postgresql://localhost/test_db
LOG_LEVEL=silent
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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is required');
}
```

After:

```typescript
import { config } from './config.js';

// Validation happens automatically
const dbUrl = config.DATABASE_URL; // TypeScript knows this exists
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
