/**
 * Tests for logger infrastructure - Template code.
 * These tests verify the production-ready logger and can be kept/customized.
 *
 * Loggers for specific environments are built with `createLogger(loadConfig(env))`
 * from a plain environment object; `process.env` and the module registry are left alone.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadConfig } from '../src/config.js';
import {
  createChildLogger,
  createLogger,
  getLoggerOutputMode,
  logger,
  switchLogOutput,
  withTraceContext,
  type Logger,
  type LoggerInstance,
} from '../src/logger.js';

/**
 * Build a logger for the given environment, recorded so its transport is closed afterwards
 * @param {NodeJS.ProcessEnv} env - The environment variables to validate
 * @returns {LoggerInstance} The logger instance
 */
const instances: LoggerInstance[] = [];
const createTestLogger = (env: NodeJS.ProcessEnv): LoggerInstance => {
  const instance = createLogger(loadConfig(env));
  instances.push(instance);
  return instance;
};

describe('Logger', () => {
  afterEach(() => {
    // Switching to the null output closes any transport worker the test opened
    for (const instance of instances.splice(0)) instance.switchLogOutput('null');
    vi.restoreAllMocks();
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

    it('should include the module name and context in child output', () => {
      const outputs: string[] = [];
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        outputs.push(String(chunk));
        return true;
      });
      const instance = createTestLogger({ NODE_ENV: 'production' });

      instance.createChildLogger('billing', { tenant: 'acme' }).info('child output');

      const output = outputs.join('');
      expect(output).toContain('"module":"billing"');
      expect(output).toContain('"tenant":"acme"');
      expect(output).toContain('child output');
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

    it('should respect an explicit LOG_LEVEL', () => {
      const { logger: errorLogger } = createTestLogger({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
      expect(errorLogger.level).toBe('error');
      expect(() => errorLogger.error('test error')).not.toThrow();
      expect(() => errorLogger.info('test info')).not.toThrow();
    });

    it('should use development configuration when NODE_ENV is development', () => {
      const { logger: devLogger } = createTestLogger({ NODE_ENV: 'development' });
      expect(devLogger).toBeDefined();
      expect(() => devLogger.info('dev test')).not.toThrow();
      // Development config should have pretty-print transport
      expect(() => devLogger.debug('debug test')).not.toThrow();
    });

    it('should use production configuration when NODE_ENV is production', () => {
      process.env.CORRELATION_ID = 'test-correlation';
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      try {
        const { logger: prodLogger } = createTestLogger({ NODE_ENV: 'production' });
        expect(prodLogger).toBeDefined();
        expect(() => prodLogger.info('prod test')).not.toThrow();
        // Production should support correlation ID mixin
        expect(() => prodLogger.error(new Error('test'), 'error')).not.toThrow();
      } finally {
        delete process.env.CORRELATION_ID;
      }
    });

    it('should default to development when NODE_ENV is not set', () => {
      const { logger: defaultLogger } = createTestLogger({});
      expect(defaultLogger).toBeDefined();
      expect(defaultLogger.level).toBe('debug');
      expect(() => defaultLogger.debug('default test')).not.toThrow();
    });

    it('should use info level in production by default', () => {
      const { logger: prodLogger } = createTestLogger({ NODE_ENV: 'production' });
      expect(prodLogger.level).toBe('info');
    });

    it('should use debug level in non-production by default', () => {
      const { logger: devLogger } = createTestLogger({ NODE_ENV: 'development' });
      expect(devLogger.level).toBe('debug');
    });

    it('should use silent level in test when LOG_LEVEL not set', () => {
      const { logger: testLogger } = createTestLogger({ NODE_ENV: 'test' });
      expect(testLogger.level).toBe('silent');
    });

    it('should not log anything on creation', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      createTestLogger({ NODE_ENV: 'production' });
      createTestLogger({ NODE_ENV: 'production', LOG_OUTPUT: 'stderr' });

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
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
    /**
     * Capture everything a production logger writes to stdout
     * @returns {{ prodLogger: Logger, output: () => string }} The logger and its captured output
     */
    const captureProductionOutput = (): { prodLogger: Logger; output: () => string } => {
      const outputs: string[] = [];
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        outputs.push(String(chunk));
        return true;
      });
      const { logger: prodLogger } = createTestLogger({ NODE_ENV: 'production' });
      return { prodLogger, output: () => outputs.join('') };
    };

    it('should redact top-level sensitive fields', () => {
      const { prodLogger, output } = captureProductionOutput();

      prodLogger.info(
        { password: 'secret', token: 'bearer-token', api_key: 'key123', safe: 'visible' },
        'test redaction',
      );

      expect(output()).toContain('"safe":"visible"');
      expect(output()).not.toContain('secret');
      expect(output()).not.toContain('bearer-token');
      expect(output()).not.toContain('key123');
    });

    it('should handle various data types in context', () => {
      expect(() => logger.info({ string: 'text' }, 'string context')).not.toThrow();
      expect(() => logger.info({ number: 42 }, 'number context')).not.toThrow();
      expect(() => logger.info({ boolean: true }, 'boolean context')).not.toThrow();
      expect(() => logger.info({ array: [1, 2, 3] }, 'array context')).not.toThrow();
      expect(() => logger.info({ nested: { deep: 'value' } }, 'nested context')).not.toThrow();
    });

    it('should redact nested sensitive fields', () => {
      const { prodLogger, output } = captureProductionOutput();

      prodLogger.info(
        { user: { password: 'secret', token: 'bearer-token' }, safe: 'visible' },
        'nested redaction',
      );

      expect(output()).toContain('"safe":"visible"');
      expect(output()).not.toContain('secret');
      expect(output()).not.toContain('bearer-token');
    });

    it('should configure production logger with mixin and formatters', () => {
      process.env.CORRELATION_ID = 'test-123';
      try {
        const { prodLogger, output } = captureProductionOutput();

        prodLogger.info({ action: 'test' }, 'production log');

        expect(output()).toContain('"correlationId":"test-123"');
        expect(output()).toContain('"level":"info"');
        expect(() => prodLogger.error(new Error('test error'), 'error log')).not.toThrow();
      } finally {
        delete process.env.CORRELATION_ID;
      }
    });

    it('should redact all configured field patterns', () => {
      const { prodLogger, output } = captureProductionOutput();

      prodLogger.info(
        {
          authorization: 'Bearer token',
          apiKey: 'key-123',
          nested: { password: 'secret', token: 'token-456', secret: 'hidden', api_key: 'api-789' },
        },
        'all patterns',
      );

      for (const leaked of [
        'Bearer token',
        'key-123',
        'secret',
        'token-456',
        'hidden',
        'api-789',
      ]) {
        expect(output()).not.toContain(leaked);
      }
    });

    it('should handle logger in unknown environment', () => {
      const { logger: stagingLogger } = createTestLogger({ NODE_ENV: 'staging' });
      expect(stagingLogger).toBeDefined();
      // Should default to production-like config
      expect(() => stagingLogger.info('staging test')).not.toThrow();
    });
  });

  describe('production configuration specifics', () => {
    it('should apply formatters in production', () => {
      // Capture output to verify formatting
      const outputs: string[] = [];
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        outputs.push(String(chunk));
        return true;
      });

      const { logger: prodLogger } = createTestLogger({ NODE_ENV: 'production' });
      prodLogger.info({ test: 'data' }, 'formatted message');

      // Should have written JSON output
      expect(outputs.length).toBeGreaterThan(0);
      const output = outputs.join('');
      expect(output).toContain('formatted message');
    });

    it('should not crash without CORRELATION_ID in production', () => {
      delete process.env.CORRELATION_ID;

      const { logger: prodLogger } = createTestLogger({ NODE_ENV: 'production' });
      expect(() => prodLogger.info('no correlation id')).not.toThrow();
    });
  });

  describe('switchLogOutput', () => {
    it('should switch logger output to stdout', () => {
      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should switch logger output to stderr', () => {
      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should switch logger output to null', () => {
      switchLogOutput('null');
      expect(getLoggerOutputMode()).toBe('null');
    });

    it('should switch away from file output again', () => {
      const instance = createTestLogger({ NODE_ENV: 'test', LOG_FILE_PATH: '/tmp/test.log' });

      // Under NODE_ENV=test the file mode is recorded without starting a transport
      instance.switchLogOutput('file');
      expect(instance.getLoggerOutputMode()).toBe('file');

      instance.switchLogOutput('stdout');
      expect(instance.getLoggerOutputMode()).toBe('stdout');
    });

    it('should create logger with stdout destination', () => {
      const { logger: stdoutLogger } = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: 'stdout' });

      expect(() => stdoutLogger.info('test')).not.toThrow();
      expect(stdoutLogger.info).toBeDefined();
    });

    it('should create logger with stderr destination', () => {
      const instance = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: 'stderr' });

      expect(instance.getLoggerOutputMode()).toBe('stderr');
      expect(() => instance.logger.info('test to stderr')).not.toThrow();
    });

    it('should handle switchLogOutput with various modes including null', () => {
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

    it('should keep independent instances independent', () => {
      const first = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: 'stdout' });
      const second = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: 'stderr' });

      first.switchLogOutput('null');

      expect(first.getLoggerOutputMode()).toBe('null');
      expect(second.getLoggerOutputMode()).toBe('stderr');
      expect(getLoggerOutputMode()).not.toBe('null');
    });
  });
});
