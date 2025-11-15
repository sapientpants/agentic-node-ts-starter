/**
 * Tests for logger infrastructure - Template code.
 * These tests verify the production-ready logger and can be kept/customized.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Logger } from '../src/logger.js';

// Store original env
const originalEnv = process.env;

describe('Logger', () => {
  let logger: Logger;
  let createChildLogger: (name: string, context?: Record<string, unknown>) => Logger;
  let withTraceContext: (logger: Logger, traceId?: string, spanId?: string) => Logger;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Import fresh module for each test
    const loggerModule = await import('../src/logger.js');
    logger = loggerModule.logger;
    createChildLogger = loggerModule.createChildLogger;
    withTraceContext = loggerModule.withTraceContext;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('logger instance', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.warn).toBeDefined();
    });

    it('should have withContext method', () => {
      expect(logger.withContext).toBeDefined();
      expect(typeof logger.withContext).toBe('function');
    });

    it('should create logger with context', () => {
      const contextLogger = logger.withContext({ userId: '123' });
      expect(contextLogger).toBeDefined();
      expect(contextLogger.info).toBeDefined();
    });
  });

  describe('createChildLogger', () => {
    it('should create a child logger with module name', () => {
      const childLogger = createChildLogger('test-module');
      expect(childLogger).toBeDefined();
      expect(childLogger.info).toBeDefined();
    });

    it('should create a child logger with module name and context', () => {
      const childLogger = createChildLogger('test-module', { requestId: 'abc' });
      expect(childLogger).toBeDefined();
      expect(childLogger.info).toBeDefined();
    });

    it('should have withContext method on child logger', () => {
      const childLogger = createChildLogger('test-module');
      expect(childLogger.withContext).toBeDefined();

      const contextLogger = childLogger.withContext({ additional: 'data' });
      expect(contextLogger).toBeDefined();
    });
  });

  describe('withTraceContext', () => {
    it('should return original logger when no traceId provided', () => {
      const result = withTraceContext(logger);
      expect(result).toBe(logger);
    });

    it('should return logger with trace context when traceId provided', () => {
      const result = withTraceContext(logger, 'trace-123');
      expect(result).toBeDefined();
      expect(result).not.toBe(logger);
      expect(result.info).toBeDefined();
    });

    it('should include both traceId and spanId when provided', () => {
      const result = withTraceContext(logger, 'trace-123', 'span-456');
      expect(result).toBeDefined();
      expect(result).not.toBe(logger);
    });
  });

  describe('environment-based configuration', () => {
    it('should use test configuration in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
      // In test environment, logger should be set to silent or use LOG_LEVEL env var
      expect(() => logger.info('test')).not.toThrow();
    });

    it('should respect LOG_LEVEL environment variable', () => {
      // Set LOG_LEVEL and verify logger still functions
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'error';

      // Logger should still work with different log level
      expect(() => logger.error('test error')).not.toThrow();
      expect(() => logger.info('test info')).not.toThrow();

      // Restore original
      if (originalLogLevel !== undefined) {
        process.env.LOG_LEVEL = originalLogLevel;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });

    it('should use development configuration when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      vi.resetModules();
      const { logger: devLogger } = await import('../src/logger.js');
      expect(devLogger).toBeDefined();
      expect(() => devLogger.info('dev test')).not.toThrow();
      // Development config should have pretty-print transport
      expect(() => devLogger.debug('debug test')).not.toThrow();
    });

    it('should use production configuration when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORRELATION_ID = 'test-correlation';
      vi.resetModules();
      const { logger: prodLogger } = await import('../src/logger.js');
      expect(prodLogger).toBeDefined();
      expect(() => prodLogger.info('prod test')).not.toThrow();
      // Production should support correlation ID mixin
      expect(() => prodLogger.error(new Error('test'), 'error')).not.toThrow();
    });

    it('should default to development when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;
      vi.resetModules();
      const { logger: defaultLogger } = await import('../src/logger.js');
      expect(defaultLogger).toBeDefined();
      expect(() => defaultLogger.debug('default test')).not.toThrow();
    });

    it('should handle startup logging in non-test environments', async () => {
      process.env.NODE_ENV = 'production';
      vi.resetModules();

      // Production mode will log startup message
      const { logger: prodLogger } = await import('../src/logger.js');

      // Verify logger was initialized without errors
      expect(prodLogger).toBeDefined();
      expect(prodLogger.level).toBe('info');
    });

    it('should use info level in production by default', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;
      vi.resetModules();

      const { logger: prodLogger } = await import('../src/logger.js');
      expect(prodLogger).toBeDefined();
      expect(prodLogger.level).toBe('info');
    });

    it('should use debug level in non-production by default', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL;
      vi.resetModules();

      const { logger: devLogger } = await import('../src/logger.js');
      expect(devLogger).toBeDefined();
      expect(devLogger.level).toBe('debug');
    });

    it('should use silent level in test when LOG_LEVEL not set', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.LOG_LEVEL;
      vi.resetModules();

      const { logger: testLogger } = await import('../src/logger.js');
      expect(testLogger).toBeDefined();
      expect(testLogger.level).toBe('silent');
    });
  });

  describe('logger methods', () => {
    it('should support all standard log levels', () => {
      expect(() => logger.trace('trace message')).not.toThrow();
      expect(() => logger.debug('debug message')).not.toThrow();
      expect(() => logger.info('info message')).not.toThrow();
      expect(() => logger.warn('warn message')).not.toThrow();
      expect(() => logger.error('error message')).not.toThrow();
      expect(() => logger.fatal('fatal message')).not.toThrow();
    });

    it('should support logging with context objects', () => {
      expect(() => logger.info({ user: 'test' }, 'message with context')).not.toThrow();
      expect(() => logger.error({ error: new Error('test') }, 'error with context')).not.toThrow();
    });

    it('should support child logger creation chains', () => {
      const child1 = logger.withContext({ level1: 'data' });
      const child2 = child1.withContext({ level2: 'more' });
      expect(child2).toBeDefined();
      expect(() => child2.info('nested context')).not.toThrow();
    });

    it('should preserve withContext method on child loggers', () => {
      const child = logger.withContext({ test: 'context' });
      expect(child.withContext).toBeDefined();
      expect(typeof child.withContext).toBe('function');

      // Verify nested children also have the method
      const grandchild = child.withContext({ nested: true });
      expect(grandchild.withContext).toBeDefined();
      expect(typeof grandchild.withContext).toBe('function');

      // And can continue chaining
      const greatGrandchild = grandchild.withContext({ deep: 'very' });
      expect(greatGrandchild.withContext).toBeDefined();
      expect(() => greatGrandchild.info('deep nested logging')).not.toThrow();
    });
  });

  describe('logger configuration', () => {
    it('should have required methods for redaction', () => {
      // Verify the logger is configured but don't test the actual redaction
      // as that would require inspecting the output
      const testData = {
        password: 'secret',
        token: 'bearer-token',
        api_key: 'key123',
        safe: 'visible',
      };
      expect(() => logger.info(testData, 'test redaction')).not.toThrow();
    });

    it('should handle various data types in context', () => {
      expect(() => logger.info({ string: 'text' }, 'string context')).not.toThrow();
      expect(() => logger.info({ number: 42 }, 'number context')).not.toThrow();
      expect(() => logger.info({ boolean: true }, 'boolean context')).not.toThrow();
      expect(() => logger.info({ array: [1, 2, 3] }, 'array context')).not.toThrow();
      expect(() => logger.info({ nested: { deep: 'value' } }, 'nested context')).not.toThrow();
    });

    it('should handle nested sensitive data redaction', () => {
      const nestedData = {
        user: {
          password: 'secret',
          token: 'bearer-token',
        },
        safe: 'visible',
      };
      expect(() => logger.info(nestedData, 'nested redaction')).not.toThrow();
    });

    it('should configure production logger with mixin and formatters', async () => {
      process.env.NODE_ENV = 'production';
      process.env.CORRELATION_ID = 'test-123';
      vi.resetModules();

      const { logger: prodLogger } = await import('../src/logger.js');

      // Verify production logger works with correlation ID
      expect(() => prodLogger.info({ action: 'test' }, 'production log')).not.toThrow();
      expect(() => prodLogger.error(new Error('test error'), 'error log')).not.toThrow();
    });

    it('should handle all redacted field patterns', () => {
      const sensitiveData = {
        authorization: 'Bearer token',
        apiKey: 'key-123',
        nested: {
          password: 'secret',
          token: 'token-456',
          secret: 'hidden',
          api_key: 'api-789',
        },
      };
      expect(() => logger.info(sensitiveData, 'all patterns')).not.toThrow();
    });

    it('should handle logger in unknown environment', async () => {
      process.env.NODE_ENV = 'staging';
      vi.resetModules();

      const { logger: stagingLogger } = await import('../src/logger.js');
      expect(stagingLogger).toBeDefined();
      // Should default to production-like config
      expect(() => stagingLogger.info('staging test')).not.toThrow();
    });
  });

  describe('production configuration specifics', () => {
    it('should apply formatters in production', async () => {
      process.env.NODE_ENV = 'production';
      vi.resetModules();

      // Capture output to verify formatting
      const outputs: string[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string | Uint8Array): boolean => {
        if (typeof chunk === 'string') {
          outputs.push(chunk);
        }
        return true;
      }) as typeof process.stdout.write;

      const { logger: prodLogger } = await import('../src/logger.js');
      prodLogger.info({ test: 'data' }, 'formatted message');

      process.stdout.write = originalWrite;

      // Should have written JSON output
      expect(outputs.length).toBeGreaterThan(0);
      const output = outputs.join('');
      expect(output).toContain('formatted message');
    });

    it('should not crash without CORRELATION_ID in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CORRELATION_ID;
      vi.resetModules();

      const { logger: prodLogger } = await import('../src/logger.js');
      expect(() => prodLogger.info('no correlation id')).not.toThrow();
    });
  });

  describe('switchLogOutput', () => {
    it('should switch logger output to stdout', async () => {
      const { switchLogOutput, getLoggerOutputMode } = await import('../src/logger.js');

      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should switch logger output to stderr', async () => {
      const { switchLogOutput, getLoggerOutputMode } = await import('../src/logger.js');

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should switch logger output to null', async () => {
      const { switchLogOutput, getLoggerOutputMode } = await import('../src/logger.js');

      switchLogOutput('null');
      expect(getLoggerOutputMode()).toBe('null');
    });

    it('should handle cleanup errors when switching from file output', async () => {
      // Mock console.warn to capture cleanup warnings
      // eslint-disable-next-line no-console
      const originalWarn = console.warn;
      const warnings: unknown[] = [];
      // eslint-disable-next-line no-console
      console.warn = (...args: unknown[]) => {
        warnings.push(args);
      };

      try {
        vi.resetModules();
        const { switchLogOutput, getLoggerOutputMode } = await import('../src/logger.js');

        // First switch to file output (if supported)
        try {
          process.env.LOG_FILE_PATH = '/tmp/test.log';
          switchLogOutput('file');
        } catch {
          // File output might not be available in test environment, skip this test
          // eslint-disable-next-line no-console
          console.warn = originalWarn;
          return;
        }

        // Now switch away from file to trigger cleanup
        switchLogOutput('stdout');
        expect(getLoggerOutputMode()).toBe('stdout');

        // The cleanup should have attempted to close the file stream
        // Even if cleanup fails, the switch should succeed
      } finally {
        // eslint-disable-next-line no-console
        console.warn = originalWarn;
        delete process.env.LOG_FILE_PATH;
      }
    });

    it('should create logger without destination when destination is null', async () => {
      // Test the branch where destination is falsy in createLogger
      vi.resetModules();
      process.env.LOG_OUTPUT = 'stdout';

      const { logger } = await import('../src/logger.js');

      // Logger should still work even when created without explicit destination
      expect(() => logger.info('test')).not.toThrow();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
    });

    it('should create logger with stderr destination', async () => {
      // Test the branch where destination is pino.destination(2) for stderr
      vi.resetModules();
      process.env.LOG_OUTPUT = 'stderr';
      process.env.NODE_ENV = 'test';

      const { logger } = await import('../src/logger.js');

      // Logger should be created with stderr destination
      expect(logger).toBeDefined();
      expect(() => logger.info('test to stderr')).not.toThrow();
    });

    it('should handle switchLogOutput with various modes including null', async () => {
      vi.resetModules();
      const { switchLogOutput, getLoggerOutputMode } = await import('../src/logger.js');

      // Test switching through different modes to cover all branches
      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');

      switchLogOutput('null');
      expect(getLoggerOutputMode()).toBe('null');

      // Switch back to stdout
      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');
    });
  });
});
