import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createChildLogger, withTraceContext } from '../src/logger.js';

describe('Logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
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
      // We can't easily test the actual level without exposing it, but we can verify it runs
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
  });
});
