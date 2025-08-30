# Code Patterns & Examples

Copy-paste ready patterns for common tasks in your TypeScript application.

## Table of Contents

- [Validation with Zod](#validation-with-zod)
- [Property-Based Testing](#property-based-testing)
- [Structured Logging](#structured-logging)
- [Error Handling](#error-handling)
- [Async Patterns](#async-patterns)
- [Type-Safe Environment Variables](#type-safe-environment-variables)

## Validation with Zod

### Basic Schema Definition

```typescript
import { z } from 'zod';

// Define a schema
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().max(120),
  roles: z.array(z.enum(['admin', 'user', 'guest'])),
  metadata: z.record(z.string()).optional(),
});

// Infer the TypeScript type
type User = z.infer<typeof UserSchema>;

// Parse with validation
export function validateUser(data: unknown): User {
  return UserSchema.parse(data); // Throws if invalid
}

// Safe parse without throwing
export function safeValidateUser(data: unknown) {
  const result = UserSchema.safeParse(data);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}
```

### API Request Validation

```typescript
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).max(5).default([]),
  published: z.boolean().default(false),
});

export async function createPost(requestBody: unknown) {
  // Validate input
  const validatedData = CreatePostSchema.parse(requestBody);

  // Now validatedData is fully typed and validated
  console.log(validatedData.title); // TypeScript knows this is a string

  // Process the post...
  return { id: 'post-123', ...validatedData };
}
```

## Property-Based Testing

### Basic Property Test

```typescript
import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

// Function to test
function reverseString(s: string): string {
  return s.split('').reverse().join('');
}

describe('reverseString', () => {
  // Property: reversing twice returns original
  it.prop([fc.string()])('reversing twice returns original', (str) => {
    expect(reverseString(reverseString(str))).toBe(str);
  });

  // Property: length is preserved
  it.prop([fc.string()])('preserves string length', (str) => {
    expect(reverseString(str).length).toBe(str.length);
  });
});
```

### Testing Business Logic

```typescript
import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

// Business logic: Calculate discount
function calculateDiscount(price: number, discountPercent: number): number {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - discountPercent / 100);
}

describe('calculateDiscount', () => {
  // Property: discount never makes price negative
  it.prop([fc.float({ min: 0, max: 10000 }), fc.float({ min: 0, max: 100 })])(
    'never returns negative price',
    (price, discount) => {
      const result = calculateDiscount(price, discount);
      expect(result).toBeGreaterThanOrEqual(0);
    },
  );

  // Property: 0% discount returns original price
  it.prop([fc.float({ min: 0, max: 10000 })])('0% discount returns original price', (price) => {
    expect(calculateDiscount(price, 0)).toBe(price);
  });

  // Property: 100% discount returns 0
  it.prop([fc.float({ min: 0, max: 10000 })])('100% discount returns 0', (price) => {
    expect(calculateDiscount(price, 100)).toBe(0);
  });
});
```

## Structured Logging

### Basic Logging Setup

```typescript
import { createLogger, createChildLogger } from './logger.js';

// Create a root logger
const logger = createLogger('app');

// Log with structured data
logger.info({ userId: '123', action: 'login' }, 'User logged in');
logger.error({ err: new Error('Connection failed'), retries: 3 }, 'Database error');

// Create child loggers for modules
const dbLogger = createChildLogger('database');
dbLogger.debug({ query: 'SELECT * FROM users', duration: 45 }, 'Query executed');
```

### Request Logging Pattern

```typescript
import { createChildLogger } from './logger.js';

const logger = createChildLogger('api');

export async function handleRequest(req: Request) {
  const requestId = crypto.randomUUID();
  const requestLogger = logger.child({ requestId });

  requestLogger.info(
    {
      method: req.method,
      url: req.url,
      headers: req.headers,
    },
    'Request received',
  );

  try {
    const result = await processRequest(req);

    requestLogger.info(
      {
        statusCode: 200,
        duration: Date.now() - startTime,
      },
      'Request completed',
    );

    return result;
  } catch (error) {
    requestLogger.error(
      {
        err: error,
        statusCode: 500,
      },
      'Request failed',
    );

    throw error;
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// Usage
function getUser(id: string) {
  const user = db.findUser(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}
```

### Error Handling with Result Pattern

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export async function fetchUserSafe(id: string): Promise<Result<User>> {
  try {
    const user = await fetchUser(id);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Usage
const result = await fetchUserSafe('123');
if (result.success) {
  console.log('User:', result.data);
} else {
  console.error('Error:', result.error.message);
}
```

## Async Patterns

### Promise with Timeout

```typescript
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs),
    ),
  ]);
}

// Usage
try {
  const data = await withTimeout(fetchData(), 5000);
  console.log('Data received:', data);
} catch (error) {
  console.error('Failed to fetch data:', error);
}
```

### Retry Pattern

```typescript
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    delay?: number;
    backoff?: number;
  } = {},
): Promise<T> {
  const { attempts = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (i < attempts - 1) {
        const waitTime = delay * Math.pow(backoff, i);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}

// Usage
const data = await retry(() => fetch('/api/data').then((r) => r.json()), {
  attempts: 3,
  delay: 1000,
  backoff: 2,
});
```

## Type-Safe Environment Variables

### Environment Schema

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(32),
  ENABLE_FEATURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

type Env = z.infer<typeof EnvSchema>;

// Parse and validate environment
export function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

// Export validated env
export const env = loadEnv();

// Usage with full type safety
console.log(env.NODE_ENV); // TypeScript knows this is 'development' | 'production' | 'test'
console.log(env.PORT); // TypeScript knows this is number
console.log(env.ENABLE_FEATURE); // TypeScript knows this is boolean
```

## Testing Patterns

### Test Fixtures

```typescript
import { beforeEach, afterEach } from 'vitest';

export function setupTestDatabase() {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.migrate();
  });

  afterEach(async () => {
    await db.close();
    await db.destroy();
  });

  return () => db;
}

// Usage in tests
describe('User Service', () => {
  const getDb = setupTestDatabase();

  it('creates a user', async () => {
    const db = getDb();
    const user = await db.createUser({ name: 'Test' });
    expect(user.id).toBeDefined();
  });
});
```

---

_These patterns are designed to be copied and adapted for your specific needs. Remember to install required dependencies (`zod`, `@fast-check/vitest`) if not already present._
