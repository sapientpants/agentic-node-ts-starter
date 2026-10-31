/**
 * Tests for configurable logging output destinations.
 * Verifies that logging works correctly with various output destinations.
 *
 * Each test builds its own logger with `createLogger(loadConfig(env))` from a plain
 * environment object; `process.env` is only touched for runtime-only variables.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ConfigError, loadConfig } from '../src/config.js';
import { createLogger, type LoggerInstance } from '../src/logger.js';

describe('Logger Output Configuration', () => {
  // Each test gets its own directory to avoid conflicts
  let testLogDir: string;
  let testLogFile: string;
  const instances: LoggerInstance[] = [];

  /**
   * Build a logger from the given environment, recorded so its transport is closed afterwards
   * @param {NodeJS.ProcessEnv} env - The environment variables to validate
   * @returns {LoggerInstance} The logger instance
   */
  const createTestLogger = (env: NodeJS.ProcessEnv): LoggerInstance => {
    const instance = createLogger(loadConfig(env));
    instances.push(instance);
    return instance;
  };

  /**
   * Build a development logger writing to the test log file without rotation
   * @param {NodeJS.ProcessEnv} env - Additional environment variables
   * @returns {LoggerInstance} The logger instance
   */
  const createFileLogger = (env: NodeJS.ProcessEnv = {}): LoggerInstance =>
    createTestLogger({
      NODE_ENV: 'development',
      LOG_OUTPUT: 'file',
      LOG_FILE_PATH: testLogFile,
      ...env,
    });

  /**
   * Poll until a condition holds or the attempts run out
   * @param {() => boolean} condition - The condition to wait for
   * @param {number} attempts - Maximum number of attempts
   * @param {number} delayMs - Delay between attempts in milliseconds
   * @returns {Promise<void>} Resolves when the condition holds or the attempts are exhausted
   */
  const waitFor = async (condition: () => boolean, attempts = 40, delayMs = 50): Promise<void> => {
    for (let attempt = 0; attempt < attempts && !condition(); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  };

  /**
   * Capture everything written to a process stream
   * @param {'stdout' | 'stderr'} streamName - The stream to capture
   * @returns {() => string} Returns everything captured so far
   */
  const captureStream = (streamName: 'stdout' | 'stderr'): (() => string) => {
    const spy = vi.spyOn(process[streamName], 'write').mockImplementation(() => true);
    return () => spy.mock.calls.map((call) => String(call[0])).join('');
  };

  beforeEach(() => {
    // Create a unique directory for this specific test
    const testId = randomUUID();
    testLogDir = join(process.cwd(), 'test-logs', testId);
    testLogFile = join(testLogDir, 'test.log');

    mkdirSync(testLogDir, { recursive: true });
  });

  afterEach(async () => {
    // Switching to the null output closes any transport worker the test opened.
    // Syslog is left alone: closing a transport whose host is unreachable blocks
    // until pino's flush timeout expires.
    for (const instance of instances.splice(0)) {
      if (instance.getLoggerOutputMode() !== 'syslog') instance.switchLogOutput('null');
    }
    vi.restoreAllMocks();

    // Add a delay to let any async file operations complete
    // This is especially important for pino-roll which has background operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clean up test log directory; async operations may still hold files, so tolerate failures
    try {
      rmSync(testLogDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      // Ignore errors - directory may still have async operations
    }

    // Clean up the parent test-logs directory if it's empty
    try {
      rmSync(join(process.cwd(), 'test-logs'), { recursive: true, force: true });
    } catch {
      // Ignore errors - directory may still have async operations
    }
  });

  describe('Output Mode Detection', () => {
    it('should default to stdout when LOG_OUTPUT not configured', () => {
      const { getLoggerOutputMode } = createTestLogger({ NODE_ENV: 'test' });

      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should use stderr when LOG_OUTPUT=stderr', () => {
      const { getLoggerOutputMode } = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: 'stderr' });

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should support all defined output modes', () => {
      const modes = ['stdout', 'stderr', 'file', 'syslog', 'null'];

      for (const mode of modes) {
        const { getLoggerOutputMode } = createTestLogger({ NODE_ENV: 'test', LOG_OUTPUT: mode });
        expect(getLoggerOutputMode()).toBe(mode);
      }
    });
  });

  describe('Programmatic Output Switching', () => {
    it('should switch output mode programmatically', () => {
      const { switchLogOutput, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
      });

      expect(getLoggerOutputMode()).toBe('stdout');

      switchLogOutput('stderr');

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should handle switching to same output mode gracefully', () => {
      const { switchLogOutput, getLoggerOutputMode } = createTestLogger({ NODE_ENV: 'test' });

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');

      // Second call should not cause issues
      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should support switching between different modes', () => {
      const { switchLogOutput, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_FILE_PATH: testLogFile,
      });

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');

      switchLogOutput('file');
      expect(getLoggerOutputMode()).toBe('file');

      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');
    });
  });

  describe('File Output Mode', () => {
    it('should write logs to file when LOG_OUTPUT=file', async () => {
      const { logger } = createFileLogger();

      logger.info('Test message for file output');

      // Wait for file to be created and content to be written
      // with a retry mechanism for CI environments
      let content = '';
      await waitFor(
        () => {
          content = existsSync(testLogFile) ? readFileSync(testLogFile, 'utf-8') : '';
          return content.includes('Test message for file output');
        },
        40,
        100,
      );

      expect(existsSync(testLogFile)).toBe(true);
      expect(content).toContain('Test message for file output');
    });

    it('should write logs through pino-roll when LOG_FILE_MAX_SIZE uses a two-letter unit (10MB)', async () => {
      const { logger } = createFileLogger({ LOG_FILE_MAX_SIZE: '10MB', LOG_FILE_MAX_FILES: '3' });

      // pino-roll rejects "10MB" verbatim; the logger must normalize it to bytes
      // before handing it to the transport, otherwise the worker thread crashes.
      logger.info('Test message with 10MB rotation size');

      // pino-roll appends a sequence number / date to the configured file name,
      // so look for any file in the test directory containing our message.
      let content = '';
      await waitFor(
        () => {
          const files = existsSync(testLogDir) ? readdirSync(testLogDir) : [];
          content =
            files
              .map((file) => readFileSync(join(testLogDir, file), 'utf-8'))
              .find((fileContent) =>
                fileContent.includes('Test message with 10MB rotation size'),
              ) ?? '';
          return content !== '';
        },
        40,
        100,
      );

      expect(content).toContain('Test message with 10MB rotation size');
    });

    it('should fall back to non-rotated file output when LOG_FILE_MAX_SIZE is invalid', () => {
      const stderrOutput = captureStream('stderr');

      const { logger, getLoggerOutputMode } = createFileLogger({ LOG_FILE_MAX_SIZE: 'not-a-size' });

      expect(stderrOutput()).toContain('Invalid LOG_FILE_MAX_SIZE "not-a-size"');
      expect(getLoggerOutputMode()).toBe('file');
      expect(logger).toBeDefined();
    });

    it('should create log directory if it does not exist', async () => {
      const nestedLogDir = join(testLogDir, 'nested', 'deep');
      const nestedLogPath = join(nestedLogDir, 'test.log');

      const { logger } = createFileLogger({ LOG_FILE_PATH: nestedLogPath });
      logger.info('Test nested directory creation');

      await waitFor(() => existsSync(nestedLogDir), 20);

      expect(existsSync(nestedLogDir)).toBe(true);
    });

    it.skipIf(process.platform === 'win32')(
      'should apply LOG_FILE_PERMISSIONS to the log directory and file',
      async () => {
        const nestedLogDir = join(testLogDir, 'restricted');
        const nestedLogPath = join(nestedLogDir, 'test.log');

        const { logger } = createFileLogger({
          LOG_FILE_PATH: nestedLogPath,
          LOG_FILE_PERMISSIONS: '600',
        });
        logger.info('Test file permissions');

        // Directory is created synchronously with the derived mode (600 -> 700)
        expect(existsSync(nestedLogDir)).toBe(true);
        expect(statSync(nestedLogDir).mode & 0o777).toBe(0o700);

        // Wait for the transport worker to create the file
        await waitFor(() => existsSync(nestedLogPath));
        expect(existsSync(nestedLogPath)).toBe(true);
        // open() applies the umask, so mask the expected mode the same way
        const umask = process.umask();
        expect(statSync(nestedLogPath).mode & 0o777).toBe(0o600 & ~umask);
      },
    );

    it.skipIf(process.platform === 'win32')(
      'should default to mode 640 and directory mode 750 when LOG_FILE_PERMISSIONS is unset',
      async () => {
        const nestedLogDir = join(testLogDir, 'defaults');
        const nestedLogPath = join(nestedLogDir, 'test.log');

        const { logger } = createFileLogger({ LOG_FILE_PATH: nestedLogPath });
        logger.info('Test default permissions');

        expect(statSync(nestedLogDir).mode & 0o777).toBe(0o750);

        await waitFor(() => existsSync(nestedLogPath));
        const umask = process.umask();
        expect(statSync(nestedLogPath).mode & 0o777).toBe(0o640 & ~umask);
      },
    );

    it.skipIf(process.platform === 'win32')(
      'should apply the derived directory mode to intermediate directories despite the umask',
      () => {
        const intermediateDir = join(testLogDir, 'level1');
        const nestedLogDir = join(intermediateDir, 'level2');
        const nestedLogPath = join(nestedLogDir, 'test.log');

        // 644 -> directory mode 755; a umask of 027 would otherwise strip it down to 750
        const previousUmask = process.umask(0o027);
        try {
          createFileLogger({ LOG_FILE_PATH: nestedLogPath, LOG_FILE_PERMISSIONS: '644' });
        } finally {
          process.umask(previousUmask);
        }

        expect(statSync(intermediateDir).mode & 0o777).toBe(0o755);
        expect(statSync(nestedLogDir).mode & 0o777).toBe(0o755);
      },
    );

    it('should keep the permissions of an existing log directory', () => {
      // testLogDir already exists (created in beforeEach with default mode)
      const before = statSync(testLogDir).mode & 0o777;

      createFileLogger({ LOG_FILE_PERMISSIONS: '600' });

      expect(statSync(testLogDir).mode & 0o777).toBe(before);
    });
  });

  describe('Null Output Mode', () => {
    it('should disable logging when LOG_OUTPUT=null', () => {
      const { logger } = createTestLogger({ NODE_ENV: 'development', LOG_OUTPUT: 'null' });

      // Logger should have silent level
      expect(logger.level).toBe('silent');
    });

    it('should not produce any output in null mode', () => {
      const stdoutOutput = captureStream('stdout');
      const stderrOutput = captureStream('stderr');

      const { logger } = createTestLogger({ NODE_ENV: 'development', LOG_OUTPUT: 'null' });
      logger.info('This should not appear');
      logger.error('This should not appear either');

      expect(stdoutOutput()).toBe('');
      expect(stderrOutput()).toBe('');
    });
  });

  describe('Stderr Output Mode', () => {
    it('should configure logger for stderr output', () => {
      const { getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'stderr',
      });

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should write raw JSON to stderr even in development', () => {
      const stderrOutput = captureStream('stderr');

      // In stderr mode, even in development, we shouldn't have pretty printing
      // This is to avoid terminal escape sequences when stderr is redirected
      const { logger } = createTestLogger({ NODE_ENV: 'development', LOG_OUTPUT: 'stderr' });
      logger.info({ answer: 42 }, 'stderr message');

      expect(stderrOutput()).toContain('"answer":42');
      expect(stderrOutput()).toContain('"msg":"stderr message"');
      expect(stderrOutput()).not.toContain('\u001B[');
    });
  });

  describe('Syslog Output Mode', () => {
    it('should configure logger for syslog output', () => {
      const { getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'syslog',
        LOG_SYSLOG_HOST: 'syslog.example.com',
        LOG_SYSLOG_PORT: '514',
        LOG_SYSLOG_PROTOCOL: 'tcp',
      });

      expect(getLoggerOutputMode()).toBe('syslog');
    });

    it('should use default syslog configuration when not specified', () => {
      const { logger, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'syslog',
      });

      // Should use defaults without errors
      expect(getLoggerOutputMode()).toBe('syslog');
      expect(logger).toBeDefined();
    });
  });

  describe('Logger Features with Different Outputs', () => {
    it('should preserve context functionality with stderr output', () => {
      const { logger } = createTestLogger({ NODE_ENV: 'development', LOG_OUTPUT: 'stderr' });

      const contextLogger = logger.withContext({ requestId: '12345' });
      expect(contextLogger).toBeDefined();
      expect(contextLogger.withContext).toBeDefined();
    });

    it('should preserve child logger functionality with file output', () => {
      const { createChildLogger } = createFileLogger();

      const childLogger = createChildLogger('test-module', { foo: 'bar' });
      expect(childLogger).toBeDefined();
      expect(childLogger.withContext).toBeDefined();
    });

    it('should preserve redaction with different outputs', () => {
      const stderrOutput = captureStream('stderr');
      const { logger } = createTestLogger({ NODE_ENV: 'development', LOG_OUTPUT: 'stderr' });

      logger.info(
        { username: 'test', password: 'secret123', apiKey: 'key-12345' },
        'Test redaction',
      );

      expect(stderrOutput()).toContain('"username":"test"');
      expect(stderrOutput()).not.toContain('secret123');
      expect(stderrOutput()).not.toContain('key-12345');
    });

    it('should maintain correlation ID support with different outputs', () => {
      process.env.CORRELATION_ID = 'test-correlation-123';
      const stderrOutput = captureStream('stderr');
      try {
        const { logger } = createTestLogger({ NODE_ENV: 'production', LOG_OUTPUT: 'stderr' });
        logger.info('with correlation id');

        expect(stderrOutput()).toContain('"correlationId":"test-correlation-123"');
      } finally {
        delete process.env.CORRELATION_ID;
      }
    });
  });

  describe('Error Handling', () => {
    it('should reject an unknown LOG_OUTPUT when the configuration is loaded', () => {
      // LOG_OUTPUT is validated once, by the configuration schema; the logger never
      // sees a value outside the supported set
      expect(() => loadConfig({ NODE_ENV: 'development', LOG_OUTPUT: 'invalid-mode' })).toThrow(
        ConfigError,
      );
    });

    it('should handle missing file path for file output', () => {
      // Not setting LOG_FILE_PATH - should use default
      const { logger, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'file',
      });

      // Should use default path without errors
      expect(getLoggerOutputMode()).toBe('file');
      expect(logger).toBeDefined();
    });
  });

  describe('Environment Integration', () => {
    it('should work correctly in production with stderr output', () => {
      const { logger, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'production',
        LOG_OUTPUT: 'stderr',
      });

      expect(getLoggerOutputMode()).toBe('stderr');
      expect(logger.level).toBe('info'); // Production default
    });

    it('should work correctly in development with file output', () => {
      const { logger, getLoggerOutputMode } = createFileLogger();

      expect(getLoggerOutputMode()).toBe('file');
      expect(logger.level).toBe('debug'); // Development default
    });

    it('should respect LOG_LEVEL override with any output', () => {
      const { logger } = createTestLogger({
        NODE_ENV: 'production',
        LOG_OUTPUT: 'syslog',
        LOG_LEVEL: 'debug',
      });

      expect(logger.level).toBe('debug');
    });
  });

  describe('Resource Management and Cleanup', () => {
    it('should handle multiple rapid output switches gracefully', () => {
      const { switchLogOutput, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
      });

      // Rapid switching should not cause issues
      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');

      switchLogOutput('stdout');
      expect(getLoggerOutputMode()).toBe('stdout');

      switchLogOutput('null');
      expect(getLoggerOutputMode()).toBe('null');

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should handle invalid file paths gracefully with fallback', () => {
      const { logger, getLoggerOutputMode } = createFileLogger({
        LOG_FILE_PATH: '../../../etc/passwd', // Should be blocked
      });

      // Falls back to stdout due to invalid path and reports the effective mode
      expect(getLoggerOutputMode()).toBe('stdout');
      expect(logger).toBeDefined();
    });

    it('should handle invalid syslog configuration gracefully', () => {
      const { logger, getLoggerOutputMode } = createTestLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'syslog',
        LOG_SYSLOG_HOST: 'invalid..host', // Invalid hostname
      });

      // Falls back to stdout due to invalid syslog config and reports the effective mode
      expect(getLoggerOutputMode()).toBe('stdout');
      expect(logger).toBeDefined();
    });
  });

  describe('Security Validation Integration', () => {
    it('should prevent path traversal in file logging', () => {
      // Capture the fallback logger output (pino JSON on stdout)
      const stdoutOutput = captureStream('stdout');

      createFileLogger({ LOG_FILE_PATH: '../../sensitive/file.log' });

      expect(stdoutOutput()).toContain('Invalid log file path');
      expect(stdoutOutput()).toContain('Falling back to stdout');
    });

    it('should validate file permissions and use secure defaults', () => {
      const stderrOutput = captureStream('stderr');

      createFileLogger({ LOG_FILE_PERMISSIONS: '644' }); // Should warn about being too open

      // Should warn about overly permissive permissions via process.stderr.write
      expect(stderrOutput()).toContain('allow access to other users');
    });

    it('should handle directory creation failure gracefully', () => {
      // Capture the fallback logger output (pino JSON on stdout)
      const stdoutOutput = captureStream('stdout');

      createFileLogger({ LOG_FILE_PATH: '/impossible/path/to/create/log.txt' });

      expect(stdoutOutput()).toContain('Failed to create log directory');
      expect(stdoutOutput()).toContain('Falling back to stdout');
    });
  });
});
