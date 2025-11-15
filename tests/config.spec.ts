/**
 * Tests for environment configuration - Template infrastructure.
 * These tests verify the configuration loader and can be kept/customized.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

describe('Configuration', () => {
  // Store original env
  const originalEnv = process.env;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalExit = process.exit;
  // eslint-disable-next-line no-console
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules();
    // Create a fresh copy of env for each test
    process.env = { ...originalEnv };
    // Mock process.exit
    process.exit = vi.fn() as never;
    // Mock console.error to suppress output during tests
    // eslint-disable-next-line no-console
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original env and functions
    process.env = originalEnv;
    process.exit = originalExit;
    // eslint-disable-next-line no-console
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('successful configuration loading', () => {
    it('should load configuration with all required fields', async () => {
      process.env.NODE_ENV = 'test';

      const { config } = await import('../src/config.js');

      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBe('test');
      expect(config.APP_NAME).toBe('agentic-node-ts-starter');
    });

    it('should parse boolean environment variables correctly', async () => {
      process.env.ENABLE_METRICS = 'true';
      process.env.FORCE_COLOR = 'false';

      const { config } = await import('../src/config.js');

      expect(config.ENABLE_METRICS).toBe(true);
      expect(config.FORCE_COLOR).toBe(false);
    });

    it('should accept various boolean formats', async () => {
      // Test 'yes'
      process.env.ENABLE_METRICS = 'yes';
      let module = await import('../src/config.js');
      expect(module.config.ENABLE_METRICS).toBe(true);

      // Reset and test '1'
      vi.resetModules();
      process.env.ENABLE_METRICS = '1';
      module = await import('../src/config.js');
      expect(module.config.ENABLE_METRICS).toBe(true);

      // Reset and test 'no'
      vi.resetModules();
      process.env.ENABLE_METRICS = 'no';
      module = await import('../src/config.js');
      expect(module.config.ENABLE_METRICS).toBe(false);

      // Reset and test '0'
      vi.resetModules();
      process.env.ENABLE_METRICS = '0';
      module = await import('../src/config.js');
      expect(module.config.ENABLE_METRICS).toBe(false);
    });

    it('should accept valid NODE_ENV values', async () => {
      const validEnvs = ['development', 'production', 'test', 'staging'];

      for (const env of validEnvs) {
        vi.resetModules();
        process.env.NODE_ENV = env;
        const { config } = await import('../src/config.js');
        expect(config.NODE_ENV).toBe(env);
      }
    });

    it('should handle optional fields correctly', async () => {
      process.env.NODE_ENV = 'test';
      // Don't set optional fields

      const { config } = await import('../src/config.js');

      // Check that optional fields can be undefined
      expect(config.DEBUG).toBeUndefined();
      expect(config.FORCE_COLOR).toBeUndefined();
    });
  });

  describe('default values', () => {
    it('should use default values when env vars not set', async () => {
      process.env.NODE_ENV = 'test';

      const { config } = await import('../src/config.js');

      expect(config.ENABLE_METRICS).toBe(false);
      expect(config.TIMEOUT_MS).toBe(30000);
      expect(config.APP_NAME).toBe('agentic-node-ts-starter');
    });

    it('should use environment-specific defaults for LOG_LEVEL', async () => {
      // Test production default
      process.env.NODE_ENV = 'production';
      let module = await import('../src/config.js');
      expect(module.config.LOG_LEVEL).toBe('info');

      // Test development default
      vi.resetModules();
      process.env.NODE_ENV = 'development';
      module = await import('../src/config.js');
      expect(module.config.LOG_LEVEL).toBe('debug');

      // Test explicit override
      vi.resetModules();
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'error';
      module = await import('../src/config.js');
      expect(module.config.LOG_LEVEL).toBe('error');
    });
  });

  describe('validation errors', () => {
    it('should exit process on invalid NODE_ENV', async () => {
      process.env.NODE_ENV = 'invalid';

      await expect(import('../src/config.js')).rejects.toThrow();
    });

    it('should exit process on invalid boolean format', async () => {
      process.env.ENABLE_METRICS = 'maybe';

      await expect(import('../src/config.js')).rejects.toThrow();
    });
  });

  describe('error formatting', () => {
    it('should format missing required variable errors', async () => {
      const { __testExports } = await import('../src/config.js');
      const { formatZodError } = __testExports;

      // Create a mock Zod error for a missing required field
      const mockError = {
        issues: [
          {
            code: 'invalid_type' as const,
            path: ['REQUIRED_FIELD'],
            message: 'Required',
            received: 'undefined' as const,
          },
        ],
      } as unknown as z.ZodError;

      const formatted = formatZodError(mockError);
      expect(formatted).toContain('Missing required variables');
      expect(formatted).toContain('REQUIRED_FIELD');
    });

    it('should format invalid format errors', async () => {
      const { __testExports } = await import('../src/config.js');
      const { formatZodError } = __testExports;

      // Create a mock Zod error for invalid format
      const mockError = {
        issues: [
          {
            code: 'invalid_type' as const,
            path: ['SOME_FIELD'],
            message: 'Expected string, received number',
            input: 123,
          },
        ],
      } as z.ZodError;

      const formatted = formatZodError(mockError);
      expect(formatted).toContain('Invalid format');
      expect(formatted).toContain('SOME_FIELD');
    });

    it('should handle empty error list', async () => {
      const { __testExports } = await import('../src/config.js');
      const { formatZodError } = __testExports;

      const mockError = {
        issues: [],
      } as unknown as z.ZodError;

      const formatted = formatZodError(mockError);
      expect(formatted).toBe('Invalid configuration');
    });
  });

  describe('sensitive value masking', () => {
    it('should mask sensitive values in error messages', async () => {
      const { __testExports } = await import('../src/config.js');
      const { maskSensitiveValue } = __testExports;

      expect(maskSensitiveValue('PASSWORD', 'my-secret-password')).toBe('my***rd');
      expect(maskSensitiveValue('TOKEN', 'sk-1234567890abcdef')).toBe('sk***ef');
      expect(maskSensitiveValue('SECRET', 'abc')).toBe('***');
      expect(maskSensitiveValue('NORMAL_VAR', 'visible')).toBe('visible');
    });

    it('should handle undefined and null values', async () => {
      const { __testExports } = await import('../src/config.js');
      const { maskSensitiveValue } = __testExports;

      expect(maskSensitiveValue('PASSWORD', undefined)).toBe('undefined');
      expect(maskSensitiveValue('SECRET', null)).toBe('null');
    });

    it('should handle special JavaScript types', async () => {
      const { __testExports } = await import('../src/config.js');
      const { maskSensitiveValue } = __testExports;

      // Test symbol (use non-sensitive key name)
      const sym = Symbol('test');
      expect(maskSensitiveValue('SOME_SYMBOL', sym)).toContain('Symbol(test)');

      // Test bigint (use non-sensitive key name)
      expect(maskSensitiveValue('ID', BigInt(12345))).toBe('12345');

      // Test function (use non-sensitive key name)
      const fn = function testFunc() {};
      expect(maskSensitiveValue('CALLBACK', fn)).toContain('Function');

      // Test object
      expect(maskSensitiveValue('DATA', { key: 'value' })).toContain('key');
    });

    it('should handle number and boolean types in valueToString', async () => {
      const { __testExports } = await import('../src/config.js');
      const { maskSensitiveValue } = __testExports;

      // Test number types (non-sensitive key to use valueToString directly)
      expect(maskSensitiveValue('COUNT', 42)).toBe('42');
      expect(maskSensitiveValue('RATIO', 3.14)).toBe('3.14');
      expect(maskSensitiveValue('ZERO', 0)).toBe('0');

      // Test boolean types (non-sensitive key to use valueToString directly)
      expect(maskSensitiveValue('ENABLED', true)).toBe('true');
      expect(maskSensitiveValue('DISABLED', false)).toBe('false');
    });

    it('should handle all edge case types in valueToString', async () => {
      const { __testExports } = await import('../src/config.js');
      const { maskSensitiveValue } = __testExports;

      // Test explicit undefined
      expect(maskSensitiveValue('OPTIONAL', undefined)).toBe('undefined');

      // Test string type (explicitly test the string case branch)
      expect(maskSensitiveValue('TEXT', 'hello')).toBe('hello');
      expect(maskSensitiveValue('NAME', 'world')).toBe('world');

      // Test function without a name (uses variable name)
      const anonFunc = () => {};
      const result = maskSensitiveValue('HANDLER', anonFunc);
      expect(result).toContain('[Function:');
      // Arrow functions get named after their variable
      expect(result).toMatch(/\[Function:\s*\w+\]/);
    });
  });

  describe('config helper functions', () => {
    it('should provide getConfig helper', async () => {
      process.env.ENABLE_METRICS = 'true';
      process.env.LOG_LEVEL = 'warn';

      const { getConfig } = await import('../src/config.js');

      expect(getConfig('LOG_LEVEL')).toBe('warn');
      expect(getConfig('ENABLE_METRICS')).toBe(true);
      expect(getConfig('NODE_ENV')).toBe('test');
    });

    it('should provide hasConfig helper', async () => {
      process.env.DEBUG = 'app:*';
      // Don't set FORCE_COLOR

      const { hasConfig } = await import('../src/config.js');

      expect(hasConfig('DEBUG')).toBe(true);
      expect(hasConfig('FORCE_COLOR')).toBe(false);
      expect(hasConfig('NODE_ENV')).toBe(true); // Has default value
    });

    it('should provide getConfigKeys helper', async () => {
      const { getConfigKeys } = await import('../src/config.js');

      const keys = getConfigKeys();

      expect(keys).toBeInstanceOf(Array);
      expect(keys).toContain('NODE_ENV');
      expect(keys).toContain('ENABLE_METRICS');
      expect(keys.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('TypeScript type inference', () => {
    it('should export Config type', async () => {
      const module = await import('../src/config.js');

      // This test primarily ensures the module exports the type
      // Actual type checking happens at compile time
      expect(module).toHaveProperty('config');
      expect(module).toHaveProperty('getConfig');
      expect(module).toHaveProperty('hasConfig');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical production configuration', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_METRICS = 'true';
      process.env.LOG_LEVEL = 'warn';
      process.env.TIMEOUT_MS = '60000';

      const { config } = await import('../src/config.js');

      expect(config.NODE_ENV).toBe('production');
      expect(config.ENABLE_METRICS).toBe(true);
      expect(config.LOG_LEVEL).toBe('warn');
      expect(config.TIMEOUT_MS).toBe(60000);
    });

    it('should handle typical development configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_METRICS = 'false';
      process.env.DEBUG = 'app:*';
      process.env.FORCE_COLOR = 'true';

      const { config } = await import('../src/config.js');

      expect(config.NODE_ENV).toBe('development');
      expect(config.ENABLE_METRICS).toBe(false);
      expect(config.DEBUG).toBe('app:*');
      expect(config.FORCE_COLOR).toBe(true);
      expect(config.LOG_LEVEL).toBe('debug'); // Default for development
    });

    it('should handle minimal configuration', async () => {
      // Only set NODE_ENV, everything else uses defaults
      process.env.NODE_ENV = 'test';

      const { config } = await import('../src/config.js');

      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBe('test');
      expect(config.APP_NAME).toBe('agentic-node-ts-starter');
      expect(config.ENABLE_METRICS).toBe(false); // Default
    });
  });
});
