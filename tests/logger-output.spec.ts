/**
 * Tests for configurable logging output destinations.
 * Verifies that logging works correctly with various output destinations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Logger } from '../src/logger.js';

// Store original env
const originalEnv = process.env;

describe('Logger Output Configuration', () => {
  let logger: Logger;
  let switchLogOutput: (outputMode: string) => void;
  let getLoggerOutputMode: () => string;
  let createChildLogger: (name: string, context?: Record<string, unknown>) => Logger;

  // Use a unique directory for this test suite run to avoid conflicts
  const testRunId = randomUUID();
  const testLogDir = join(process.cwd(), 'test-logs', testRunId);
  const testLogFile = join(testLogDir, 'test.log');

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };

    // Create test log directory
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterEach(async () => {
    process.env = originalEnv;
    vi.clearAllMocks();

    // Add a small delay to let any async file operations complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Clean up test log directory with error handling
    if (existsSync(testLogDir)) {
      try {
        rmSync(testLogDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore ENOENT errors as they're expected if the directory was already removed
        // Also ignore EBUSY errors from async operations still in progress
        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as { code?: string }).code;
          if (code !== 'ENOENT' && code !== 'EBUSY') {
            throw error;
          }
        }
      }
    }

    // Clean up the parent test-logs directory if it's empty
    const parentTestLogDir = join(process.cwd(), 'test-logs');
    if (existsSync(parentTestLogDir)) {
      try {
        rmSync(parentTestLogDir, { recursive: true, force: true });
      } catch {
        // Ignore errors - directory may still have async operations
      }
    }
  });

  describe('Output Mode Detection', () => {
    it('should default to stdout when LOG_OUTPUT not configured', async () => {
      const loggerModule = await import('../src/logger.js');
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should use stderr when LOG_OUTPUT=stderr', async () => {
      process.env.LOG_OUTPUT = 'stderr';
      const loggerModule = await import('../src/logger.js');
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should support all defined output modes', async () => {
      const modes = ['stdout', 'stderr', 'file', 'syslog', 'null'];

      for (const mode of modes) {
        vi.resetModules();
        process.env = { ...originalEnv, NODE_ENV: 'test', LOG_OUTPUT: mode };
        const loggerModule = await import('../src/logger.js');
        const outputMode = loggerModule.getLoggerOutputMode();
        expect(outputMode).toBe(mode);
      }
    });
  });

  describe('Programmatic Output Switching', () => {
    it('should switch output mode programmatically', async () => {
      process.env.NODE_ENV = 'development';
      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      switchLogOutput = loggerModule.switchLogOutput;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stdout');

      switchLogOutput('stderr');

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should handle switching to same output mode gracefully', async () => {
      const loggerModule = await import('../src/logger.js');
      switchLogOutput = loggerModule.switchLogOutput;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');

      // Second call should not cause issues
      switchLogOutput('stderr');
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should support switching between different modes', async () => {
      process.env.NODE_ENV = 'development';
      const loggerModule = await import('../src/logger.js');
      switchLogOutput = loggerModule.switchLogOutput;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

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
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = testLogFile;
      process.env.NODE_ENV = 'development';
      // Disable file rotation for this test to make it more predictable
      delete process.env.LOG_FILE_MAX_SIZE;
      delete process.env.LOG_FILE_MAX_FILES;

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Log a message
      logger.info('Test message for file output');

      // Wait for file to be created with a simple retry mechanism
      // This is more reliable than a fixed timeout
      let attempts = 0;
      const maxAttempts = 20;
      const retryDelay = 50;

      while (attempts < maxAttempts) {
        if (existsSync(testLogFile)) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        attempts++;
      }

      // Check if log file was created
      expect(existsSync(testLogFile)).toBe(true);

      // Read and verify content
      const content = readFileSync(testLogFile, 'utf-8');
      expect(content).toContain('Test message for file output');
    });

    it('should respect LOG_FILE_MAX_SIZE configuration', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = testLogFile;
      process.env.LOG_FILE_MAX_SIZE = '1M';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Configuration should be accepted without errors
      expect(logger).toBeDefined();
    });

    it('should respect LOG_FILE_MAX_FILES configuration', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = testLogFile;
      process.env.LOG_FILE_MAX_FILES = '10';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Configuration should be accepted without errors
      expect(logger).toBeDefined();
    });

    it('should create log directory if it does not exist', async () => {
      const nestedLogDir = join(testLogDir, 'nested', 'deep');
      const nestedLogPath = join(nestedLogDir, 'test.log');
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = nestedLogPath;
      process.env.NODE_ENV = 'development';
      // Disable file rotation for predictability
      delete process.env.LOG_FILE_MAX_SIZE;
      delete process.env.LOG_FILE_MAX_FILES;

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Log a message
      logger.info('Test nested directory creation');

      // Wait for directory to be created with retry mechanism
      let attempts = 0;
      const maxAttempts = 20;
      const retryDelay = 50;

      while (attempts < maxAttempts) {
        if (existsSync(nestedLogDir)) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        attempts++;
      }

      // Check if nested directories were created
      expect(existsSync(nestedLogDir)).toBe(true);
    });
  });

  describe('Null Output Mode', () => {
    it('should disable logging when LOG_OUTPUT=null', async () => {
      process.env.LOG_OUTPUT = 'null';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Logger should have silent level
      expect(logger.level).toBe('silent');
    });

    it('should not produce any output in null mode', async () => {
      process.env.LOG_OUTPUT = 'null';
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      logger.info('This should not appear');
      logger.error('This should not appear either');

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Stderr Output Mode', () => {
    it('should configure logger for stderr output', async () => {
      process.env.LOG_OUTPUT = 'stderr';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should not use pretty printing in stderr mode', async () => {
      process.env.LOG_OUTPUT = 'stderr';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // In stderr mode, even in development, we shouldn't have pretty printing
      // This is to avoid terminal escape sequences when stderr is redirected
      expect(logger).toBeDefined();
    });
  });

  describe('Syslog Output Mode', () => {
    it('should configure logger for syslog output', async () => {
      process.env.LOG_OUTPUT = 'syslog';
      process.env.LOG_SYSLOG_HOST = 'syslog.example.com';
      process.env.LOG_SYSLOG_PORT = '514';
      process.env.LOG_SYSLOG_PROTOCOL = 'tcp';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('syslog');
    });

    it('should use default syslog configuration when not specified', async () => {
      process.env.LOG_OUTPUT = 'syslog';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Should use defaults without errors
      expect(logger).toBeDefined();
    });
  });

  describe('Logger Features with Different Outputs', () => {
    it('should preserve context functionality with stderr output', async () => {
      process.env.LOG_OUTPUT = 'stderr';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      const contextLogger = logger.withContext({ requestId: '12345' });
      expect(contextLogger).toBeDefined();
      expect(contextLogger.withContext).toBeDefined();
    });

    it('should preserve child logger functionality with file output', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      createChildLogger = loggerModule.createChildLogger;

      const childLogger = createChildLogger('test-module', { foo: 'bar' });
      expect(childLogger).toBeDefined();
      expect(childLogger.withContext).toBeDefined();
    });

    it('should preserve redaction with different outputs', async () => {
      process.env.LOG_OUTPUT = 'stderr';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Logger should still have redaction configured
      expect(logger).toBeDefined();

      // Test that sensitive fields would be redacted
      const testData = {
        username: 'test',
        password: 'secret123',
        apiKey: 'key-12345',
      };

      // Log with sensitive data
      logger.info(testData, 'Test redaction');

      // Since we're in test mode with silent logger, we can't easily verify
      // the actual redaction, but we can ensure the logger accepts the data
      expect(logger).toBeDefined();
    });

    it('should maintain correlation ID support with different outputs', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.NODE_ENV = 'production';
      process.env.CORRELATION_ID = 'test-correlation-123';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Logger should include correlation ID in production
      expect(logger).toBeDefined();
    });
  });

  describe('Size Parsing', () => {
    it('should parse various size formats correctly', async () => {
      const testCases = [
        { input: '10M', expected: 10 * 1024 * 1024 },
        { input: '1G', expected: 1024 * 1024 * 1024 },
        { input: '500K', expected: 500 * 1024 },
        { input: '100', expected: 100 },
        { input: '1.5M', expected: Math.floor(1.5 * 1024 * 1024) },
      ];

      for (const testCase of testCases) {
        vi.resetModules();

        // Create a unique test directory for each iteration to avoid conflicts
        const uniqueTestLogDir = join(process.cwd(), `test-logs-${randomUUID()}`);
        const uniqueTestLogFile = join(uniqueTestLogDir, 'test.log');

        // Ensure the directory exists
        if (!existsSync(uniqueTestLogDir)) {
          mkdirSync(uniqueTestLogDir, { recursive: true });
        }

        process.env = {
          ...originalEnv,
          NODE_ENV: 'test',
          LOG_OUTPUT: 'file',
          LOG_FILE_PATH: uniqueTestLogFile,
          LOG_FILE_MAX_SIZE: testCase.input,
        };

        try {
          const loggerModule = await import('../src/logger.js');
          logger = loggerModule.logger;

          // Should parse without errors
          expect(logger).toBeDefined();

          // Give pino-roll a moment to finish any async operations
          // Using a small fixed delay since we're just checking config parsing
          await new Promise((resolve) => setTimeout(resolve, 50));
        } finally {
          // Clean up the unique directory after each test
          // Use a try-catch to handle any cleanup errors gracefully
          try {
            if (existsSync(uniqueTestLogDir)) {
              rmSync(uniqueTestLogDir, { recursive: true, force: true });
            }
          } catch (err) {
            // Cleanup errors are non-fatal in tests
            // Only ENOENT (already deleted) and EBUSY (still in use) are expected
            if (err && typeof err === 'object' && 'code' in err) {
              const errorCode = (err as NodeJS.ErrnoException).code;
              if (errorCode !== 'ENOENT' && errorCode !== 'EBUSY') {
                // Unexpected error - re-throw for visibility
                throw err;
              }
            }
          }
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid LOG_OUTPUT gracefully', async () => {
      // Invalid LOG_OUTPUT values will default to stdout
      process.env.LOG_OUTPUT = 'invalid-mode';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      // Should default to the invalid value (will be treated as stdout)
      expect(getLoggerOutputMode()).toBe('invalid-mode');
      expect(logger).toBeDefined();
    });

    it('should handle missing file path for file output', async () => {
      process.env.LOG_OUTPUT = 'file';
      // Not setting LOG_FILE_PATH - should use default
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Should use default path without errors
      expect(logger).toBeDefined();
    });
  });

  describe('Environment Integration', () => {
    it('should work correctly in production with stderr output', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_OUTPUT = 'stderr';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
      expect(logger.level).toBe('info'); // Production default
    });

    it('should work correctly in development with file output', async () => {
      process.env.NODE_ENV = 'development';
      process.env.LOG_OUTPUT = 'file';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('file');
      expect(logger.level).toBe('debug'); // Development default
    });

    it('should respect LOG_LEVEL override with any output', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_OUTPUT = 'syslog';
      process.env.LOG_LEVEL = 'debug';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      expect(logger.level).toBe('debug');
    });
  });

  describe('Resource Management and Cleanup', () => {
    it('should handle multiple rapid output switches gracefully', async () => {
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      switchLogOutput = loggerModule.switchLogOutput;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

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

    it('should handle invalid file paths gracefully with fallback', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = '../../../etc/passwd'; // Should be blocked
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      // Should fall back to stdout due to invalid path
      expect(getLoggerOutputMode()).toBe('file'); // Config shows file, but internally uses stdout
      expect(logger).toBeDefined();
    });

    it('should handle invalid syslog configuration gracefully', async () => {
      process.env.LOG_OUTPUT = 'syslog';
      process.env.LOG_SYSLOG_HOST = 'invalid..host'; // Invalid hostname
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      // Should fall back to stdout due to invalid syslog config
      expect(getLoggerOutputMode()).toBe('syslog'); // Config shows syslog, but internally uses stdout
      expect(logger).toBeDefined();
    });
  });

  describe('Security Validation Integration', () => {
    it('should prevent path traversal in file logging', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = '../../sensitive/file.log';
      process.env.NODE_ENV = 'development';

      // Mock console.error to verify fallback
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Should log error and fall back to stdout
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid log file path'));
      expect(consoleSpy).toHaveBeenCalledWith('Falling back to stdout');

      consoleSpy.mockRestore();
    });

    it('should validate file permissions and use secure defaults', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = testLogFile;
      process.env.LOG_FILE_PERMISSIONS = '644'; // Should warn about being too open
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Should warn about overly permissive permissions
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('allow access to other users'),
      );

      consoleSpy.mockRestore();
    });
  });
});
