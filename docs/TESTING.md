# Testing Guide

Comprehensive guide to testing in the Agentic Node + TypeScript Starter template.

## Test Setup

This template uses **Vitest** for testing with the following features:

- Fast execution with native ESM support
- TypeScript support out of the box
- Property-based testing with fast-check
- Coverage reporting with V8
- Watch mode for development
- UI mode for visual test exploration

## Test Structure

### File Organization

```
tests/
├── *.spec.ts          # Unit tests
├── *.property.spec.ts # Property-based tests
├── helpers/           # Test utilities
│   └── *.ts
└── templates/         # Test templates to copy
    ├── unit-test.template.ts
    └── property-test.template.ts
```

### Naming Conventions

- Unit tests: `*.spec.ts`
- Property tests: `*.property.spec.ts`
- Test files are placed in the `tests/` directory

## Writing Tests

### Basic Unit Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });

    it('should handle zero', () => {
      expect(add(0, 0)).toBe(0);
    });
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest';

describe('Async Operations', () => {
  it('should fetch user data', async () => {
    const user = await fetchUser('123');

    expect(user).toMatchObject({
      id: '123',
      name: expect.any(String),
      email: expect.stringContaining('@'),
    });
  });

  it('should handle errors', async () => {
    await expect(fetchUser('invalid')).rejects.toThrow('User not found');
  });
});
```

### Property-Based Testing

```typescript
import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

describe('String utilities (property tests)', () => {
  it.prop([fc.string()])('trim removes only leading/trailing whitespace', (str) => {
    const trimmed = str.trim();
    expect(trimmed).not.toMatch(/^\s|\s$/);
    expect(trimmed).toBe(str.trim()); // Idempotent
  });

  it.prop([fc.array(fc.integer())])('sort is idempotent', (arr) => {
    const sorted1 = [...arr].sort((a, b) => a - b);
    const sorted2 = [...sorted1].sort((a, b) => a - b);
    expect(sorted2).toEqual(sorted1);
  });
});
```

## Mocking and Stubbing

### Using Vitest Mocks

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock a module
vi.mock('./database', () => ({
  getUser: vi.fn(),
  saveUser: vi.fn(),
}));

import { getUser, saveUser } from './database';

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and transform user', async () => {
    const mockUser = { id: '1', name: 'John' };
    vi.mocked(getUser).mockResolvedValue(mockUser);

    const result = await getUserWithDefaults('1');

    expect(getUser).toHaveBeenCalledWith('1');
    expect(result).toHaveProperty('createdAt');
  });
});
```

### Mocking Time and Timers

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Time-dependent code', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledOnce();
  });
});
```

## Coverage Requirements

This template enforces **80% minimum coverage** for:

- Lines
- Branches
- Functions
- Statements

### Running Coverage

```bash
# Run tests with coverage
pnpm test:coverage

# Generate detailed HTML report
pnpm coverage:report

# Open coverage report in browser
pnpm coverage:open
```

### Coverage Configuration

Coverage thresholds are set in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },
}
```

### Improving Coverage

1. **Identify gaps**: Check the coverage report
2. **Test edge cases**: Empty inputs, errors, boundaries
3. **Test all branches**: Both if/else paths
4. **Test error handling**: Catch blocks and error conditions

Example of comprehensive testing:

```typescript
// Function to test
function processValue(value: number | null): string {
  if (value === null) {
    return 'no value';
  }
  if (value < 0) {
    throw new Error('Negative values not allowed');
  }
  if (value > 100) {
    return 'too large';
  }
  return `value: ${value}`;
}

// Comprehensive tests
describe('processValue', () => {
  it('handles null input', () => {
    expect(processValue(null)).toBe('no value');
  });

  it('handles normal values', () => {
    expect(processValue(50)).toBe('value: 50');
  });

  it('handles boundary at 100', () => {
    expect(processValue(100)).toBe('value: 100');
  });

  it('handles values over 100', () => {
    expect(processValue(101)).toBe('too large');
  });

  it('throws for negative values', () => {
    expect(() => processValue(-1)).toThrow('Negative values not allowed');
  });
});
```

## Test Commands

### Development

```bash
# Run tests once
pnpm test

# Watch mode (re-runs on changes)
pnpm test:watch

# Run specific test file
pnpm test calculator.spec.ts

# Run tests matching pattern
pnpm test -- -t "should add"

# Visual UI mode
pnpm test:ui
```

### CI/CD

```bash
# Run with coverage (CI mode)
pnpm test:coverage

# Quick check (no coverage)
pnpm quick-check

# Full verification
pnpm verify
```

## Best Practices

### 1. Test Structure

- **Arrange**: Set up test data and conditions
- **Act**: Execute the code being tested
- **Assert**: Verify the results

### 2. Test Independence

- Tests should not depend on execution order
- Clean up after each test
- Don't share mutable state between tests

### 3. Descriptive Names

```typescript
// ❌ Bad
it('test 1', () => {});

// ✅ Good
it('should return user name when user exists', () => {});
```

### 4. Single Assertion Principle

Keep tests focused on one behavior:

```typescript
// ❌ Bad - testing multiple things
it('should process order', () => {
  const order = processOrder(data);
  expect(order.id).toBeDefined();
  expect(order.total).toBe(100);
  expect(order.status).toBe('pending');
  expect(order.items).toHaveLength(3);
});

// ✅ Good - separate concerns
it('should generate order id', () => {
  const order = processOrder(data);
  expect(order.id).toBeDefined();
});

it('should calculate order total', () => {
  const order = processOrder(data);
  expect(order.total).toBe(100);
});
```

### 5. Use Property-Based Testing

For core business logic, use property tests to find edge cases:

```typescript
it.prop([fc.integer({ min: 1, max: 100 })])(
  'discount never exceeds original price',
  (discountPercent) => {
    const price = 100;
    const discounted = applyDiscount(price, discountPercent);
    expect(discounted).toBeLessThanOrEqual(price);
    expect(discounted).toBeGreaterThanOrEqual(0);
  },
);
```

## Troubleshooting

### Common Issues

#### Tests timing out

```typescript
// Increase timeout for specific test
it('should process large dataset', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Module resolution errors

- Ensure `.js` extension in imports
- Check `tsconfig.json` module resolution

#### Coverage not meeting threshold

- Run `pnpm coverage:open` to see uncovered lines
- Focus on untested branches and error cases
- Consider if threshold is appropriate for your code

#### Flaky tests

- Check for timing dependencies
- Ensure proper async/await usage
- Mock external dependencies
- Use `vi.useFakeTimers()` for time-dependent code

---

_Remember: Good tests are an investment in code quality and confidence. Write tests that give you confidence your code works as intended._
