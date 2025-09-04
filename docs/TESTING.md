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

Property-based testing helps find edge cases you might not think of by testing properties that should always hold true.

#### Basic Example with fast-check

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';

// Simple property test for an add function
describe('add function (property tests)', () => {
  // Test commutativity: a + b should always equal b + a
  it('is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return add(a, b) === add(b, a);
      }),
    );
  });

  // Test identity: adding 0 should not change the value
  it('has identity element 0', () => {
    fc.assert(
      fc.property(fc.integer(), (a) => {
        return add(a, 0) === a;
      }),
    );
  });

  // Test associativity with three numbers
  it('is associative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
        return add(add(a, b), c) === add(a, add(b, c));
      }),
    );
  });
});
```

#### Using Vitest's Built-in Integration

```typescript
import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';

describe('String utilities (property tests)', () => {
  // Vitest's it.prop() provides cleaner syntax
  it.prop([fc.string()])('trim removes only leading/trailing whitespace', (str) => {
    const trimmed = str.trim();
    expect(trimmed).not.toMatch(/^\s|\s$/);
    expect(trimmed.length).toBeLessThanOrEqual(str.length);
  });

  it.prop([fc.array(fc.integer())])('sort is idempotent', (arr) => {
    const sorted1 = [...arr].sort((a, b) => a - b);
    const sorted2 = [...sorted1].sort((a, b) => a - b);
    expect(sorted2).toEqual(sorted1);
  });
});
```

#### When to Use Property-Based vs Example-Based Tests

**Use Property-Based Tests When:**

- Testing mathematical properties (commutativity, associativity, distributivity)
- Testing invariants that should always hold (e.g., "output is never negative")
- Testing reversible operations (encode/decode, serialize/deserialize)
- Testing business rules with complex edge cases
- You want to discover unexpected edge cases
- The function has clear mathematical or logical properties

**Use Example-Based Tests When:**

- Testing specific known edge cases or regression bugs
- Testing UI behavior or user interactions
- Testing integration points with external systems
- Documentation through examples is important
- The expected output for specific inputs is well-defined
- Quick smoke tests for basic functionality

**Best Practice: Use Both!**

```typescript
describe('discount calculation', () => {
  // Example-based tests for specific cases
  it('applies 10% discount correctly', () => {
    expect(applyDiscount(100, 10)).toBe(90);
  });

  it('handles zero discount', () => {
    expect(applyDiscount(100, 0)).toBe(100);
  });

  // Property-based tests for invariants
  it.prop([fc.float({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 100 })])(
    'discount never exceeds original price',
    (price, discountPercent) => {
      const discounted = applyDiscount(price, discountPercent);
      expect(discounted).toBeLessThanOrEqual(price);
      expect(discounted).toBeGreaterThanOrEqual(0);
    },
  );
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

> **⚠️ IMPORTANT**: This template enforces **80% minimum coverage** for all metrics. Tests will fail if coverage drops below this threshold.

### Coverage Metrics (All require 80% minimum)

- **Lines**: 80% of code lines must be executed
- **Branches**: 80% of conditional branches must be tested
- **Functions**: 80% of functions must be called
- **Statements**: 80% of statements must be executed

### Running Tests Locally

```bash
# Development workflow
pnpm test:watch     # Watch mode - re-runs tests on file changes
pnpm test           # Run tests once

# Coverage commands
pnpm test:coverage  # Run tests with coverage report (enforces 80% threshold)
pnpm coverage:report # Generate detailed HTML report
pnpm coverage:open  # Open HTML report in browser

# Quick verification
pnpm verify         # Run all checks including tests
```

### Understanding Coverage Output

```bash
$ pnpm test:coverage

 ✓ tests/add.spec.ts (3)
 ✓ tests/config.spec.ts (15)

 Coverage report:
 ------------|---------|----------|---------|---------|-------------------
 File        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
 ------------|---------|----------|---------|---------|-------------------
 All files   |   85.42 |    82.35 |   88.46 |   85.42 |
  config.ts  |   95.65 |    88.89 |     100 |   95.65 | 45-47
  index.ts   |   66.67 |       75 |      50 |   66.67 | 15,22-24
 ------------|---------|----------|---------|---------|-------------------

 ✅ Coverage threshold met (80% minimum required)
```

If coverage is below 80%, you'll see:

```bash
 ❌ Coverage threshold not met:
 - Branches: 75% (minimum 80%)
 - Functions: 78% (minimum 80%)
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

### 5. Use Property-Based Testing for Core Logic

Property tests are especially valuable for:

- **Business rules**: Invariants that must always hold
- **Data transformations**: Encoding, parsing, serialization
- **Mathematical operations**: Calculations, algorithms
- **Security boundaries**: Input validation, sanitization

```typescript
// Example: Testing a price calculation with multiple properties
describe('calculateTotal', () => {
  it.prop([
    fc.array(fc.float({ min: 0.01, max: 10000 }), { minLength: 1 }),
    fc.integer({ min: 0, max: 100 }),
    fc.float({ min: 0, max: 0.3 }),
  ])('total is always positive and reasonable', (items, discountPercent, taxRate) => {
    const total = calculateTotal(items, discountPercent, taxRate);

    // Properties that should always be true
    expect(total).toBeGreaterThan(0);
    expect(total).toBeFinite();

    // Discount should never make total negative
    const subtotal = items.reduce((sum, item) => sum + item, 0);
    expect(total).toBeLessThanOrEqual(subtotal * (1 + taxRate));
  });
});
```

**Common Properties to Test:**

- **Idempotence**: `f(f(x)) === f(x)`
- **Round-trip**: `decode(encode(x)) === x`
- **Commutativity**: `f(a, b) === f(b, a)`
- **Associativity**: `f(f(a, b), c) === f(a, f(b, c))`
- **Invariants**: Output constraints that always hold
- **Monotonicity**: If `a < b` then `f(a) < f(b)`

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
