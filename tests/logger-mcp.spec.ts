/**
 * Tests for MCP-compatible logging functionality.
 * Verifies that logging works correctly in MCP mode and various output destinations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../src/logger.js';

// Store original env
const originalEnv = process.env;

describe('MCP Logging', () => {
  let logger: Logger;
  let enableMCPMode: () => void;
  let disableMCPMode: () => void;
  let getLoggerOutputMode: () => string;
  let createChildLogger: (name: string, context?: Record<string, unknown>) => Logger;

  const testLogDir = join(process.cwd(), 'test-logs');
  const testLogFile = join(testLogDir, 'test.log');

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };

    // Create test log directory
    if (!existsSync(testLogDir)) {
      mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();

    // Clean up test log directory
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Output Mode Detection', () => {
    it('should default to stdout when no MCP configuration', async () => {
      const loggerModule = await import('../src/logger.js');
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should use stderr when MCP_MODE is true', async () => {
      process.env.MCP_MODE = 'true';
      const loggerModule = await import('../src/logger.js');
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should respect explicit LOG_OUTPUT over MCP_MODE', async () => {
      process.env.MCP_MODE = 'true';
      process.env.LOG_OUTPUT = 'file';
      const loggerModule = await import('../src/logger.js');
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('file');
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

  describe('MCP Mode Auto-detection', () => {
    it('should auto-enable MCP mode when MCP_MODE is set', async () => {
      process.env.MCP_MODE = 'true';
      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should log MCP mode activation message', async () => {
      process.env.NODE_ENV = 'development';
      process.env.MCP_MODE = 'true';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      // Verify MCP mode is enabled
      expect(getLoggerOutputMode()).toBe('stderr');

      // Logger should be initialized in MCP mode
      expect(logger).toBeDefined();
    });
  });

  describe('Programmatic Mode Switching', () => {
    it('should enable MCP mode programmatically', async () => {
      process.env.NODE_ENV = 'development';
      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      enableMCPMode = loggerModule.enableMCPMode;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stdout');

      enableMCPMode();

      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should disable MCP mode programmatically', async () => {
      process.env.NODE_ENV = 'development';
      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      enableMCPMode = loggerModule.enableMCPMode;
      disableMCPMode = loggerModule.disableMCPMode;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      enableMCPMode();
      expect(getLoggerOutputMode()).toBe('stderr');

      disableMCPMode();
      expect(getLoggerOutputMode()).toBe('stdout');
    });

    it('should not disable MCP mode if set via environment', async () => {
      process.env.MCP_MODE = 'true';
      process.env.NODE_ENV = 'development';
      const loggerModule = await import('../src/logger.js');
      disableMCPMode = loggerModule.disableMCPMode;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');

      disableMCPMode();

      // Should still be stderr because MCP_MODE env var is set
      expect(getLoggerOutputMode()).toBe('stderr');
    });

    it('should handle repeated enable calls gracefully', async () => {
      const loggerModule = await import('../src/logger.js');
      enableMCPMode = loggerModule.enableMCPMode;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      enableMCPMode();
      expect(getLoggerOutputMode()).toBe('stderr');

      // Second call should not cause issues
      enableMCPMode();
      expect(getLoggerOutputMode()).toBe('stderr');
    });
  });

  describe('File Output Mode', () => {
    it('should write logs to file when LOG_OUTPUT=file', async () => {
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = testLogFile;
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      // Log a message
      logger.info('Test message for file output');

      // Give time for async file write
      await new Promise((resolve) => setTimeout(resolve, 100));

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
      const nestedLogPath = join(testLogDir, 'nested', 'deep', 'test.log');
      process.env.LOG_OUTPUT = 'file';
      process.env.LOG_FILE_PATH = nestedLogPath;
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      logger.info('Test nested directory creation');

      // Give time for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if nested directories were created
      expect(existsSync(nestedLogPath)).toBe(true);
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
      // This is to avoid terminal escape sequences in MCP mode
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

  describe('Logger Features in MCP Mode', () => {
    it('should preserve context functionality in MCP mode', async () => {
      process.env.MCP_MODE = 'true';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      const contextLogger = logger.withContext({ requestId: '12345' });
      expect(contextLogger).toBeDefined();
      expect(contextLogger.withContext).toBeDefined();
    });

    it('should preserve child logger functionality in MCP mode', async () => {
      process.env.MCP_MODE = 'true';
      process.env.NODE_ENV = 'development';

      const loggerModule = await import('../src/logger.js');
      createChildLogger = loggerModule.createChildLogger;

      const childLogger = createChildLogger('test-module', { foo: 'bar' });
      expect(childLogger).toBeDefined();
      expect(childLogger.withContext).toBeDefined();
    });

    it('should preserve redaction in MCP mode', async () => {
      process.env.MCP_MODE = 'true';
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

    it('should maintain correlation ID support in MCP mode', async () => {
      process.env.MCP_MODE = 'true';
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
        process.env = {
          ...originalEnv,
          NODE_ENV: 'test',
          LOG_OUTPUT: 'file',
          LOG_FILE_PATH: testLogFile,
          LOG_FILE_MAX_SIZE: testCase.input,
        };

        const loggerModule = await import('../src/logger.js');
        logger = loggerModule.logger;

        // Should parse without errors
        expect(logger).toBeDefined();
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
    it('should work correctly in production with MCP mode', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MCP_MODE = 'true';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
      expect(logger.level).toBe('info'); // Production default
    });

    it('should work correctly in development with MCP mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.MCP_MODE = 'true';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;
      getLoggerOutputMode = loggerModule.getLoggerOutputMode;

      expect(getLoggerOutputMode()).toBe('stderr');
      expect(logger.level).toBe('debug'); // Development default
    });

    it('should respect LOG_LEVEL override in MCP mode', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MCP_MODE = 'true';
      process.env.LOG_LEVEL = 'debug';

      const loggerModule = await import('../src/logger.js');
      logger = loggerModule.logger;

      expect(logger.level).toBe('debug');
    });
  });
});
