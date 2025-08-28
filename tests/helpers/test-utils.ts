/**
 * Test utilities and helpers for consistent testing patterns
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi, expect } from 'vitest';
import type { MockedFunction } from 'vitest';

/**
 * Create a properly typed mock function
 */
export function createMockFn<T extends (...args: any[]) => any>(): MockedFunction<T> {
  return vi.fn() as MockedFunction<T>;
}

/**
 * Wait for a specific amount of time (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock logger that captures log calls for testing
 */
export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

/**
 * Assert that an error has a specific message
 */
export function expectErrorMessage(error: unknown, expectedMessage: string | RegExp): void {
  if (!(error instanceof Error)) {
    throw new Error(`Expected error to be an instance of Error, got ${typeof error}`);
  }

  if (typeof expectedMessage === 'string') {
    expect(error.message).toBe(expectedMessage);
  } else {
    expect(error.message).toMatch(expectedMessage);
  }
}

/**
 * Create a test environment with common setup
 */
export function createTestEnvironment() {
  const mocks = {
    logger: createMockLogger(),
  };

  const cleanup = () => {
    vi.clearAllMocks();
  };

  return { mocks, cleanup };
}

/**
 * Helper to test async functions that should throw
 */
export async function expectAsyncThrow<T = any>(
  fn: () => Promise<T>,
  expectedError?: string | RegExp | Error,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expectErrorMessage(error, expectedError);
      } else if (expectedError instanceof RegExp) {
        expectErrorMessage(error, expectedError);
      } else if (expectedError instanceof Error) {
        expect(error).toEqual(expectedError);
      }
    }
  }
}

/**
 * Generate test data with optional overrides
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    age: 25,
    ...overrides,
  };
}

interface TestUser {
  id: string;
  email: string;
  age: number;
}
