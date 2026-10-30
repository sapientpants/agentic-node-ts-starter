/**
 * Tests for runtime log output switching.
 * Verifies that switches reach child loggers, release transports, and fail safely.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type * as PinoModule from 'pino';
import type { Logger } from '../src/logger.js';

const originalEnv = process.env;

describe('Logger Output Switching', () => {
  let logger: Logger;
  let switchLogOutput: (outputMode: string) => void;
  let getLoggerOutputMode: () => string;
  let createChildLogger: (name: string, context?: Record<string, unknown>) => Logger;

  let testLogDir: string;
  let testLogFile: string;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'development', LOG_OUTPUT: 'stderr' };

    // Use the OS temp dir: other logger specs remove the shared ./test-logs folder in parallel
    testLogDir = mkdtempSync(join(tmpdir(), 'logger-switching-'));
    testLogFile = join(testLogDir, 'test.log');
  });

  afterEach(async () => {
    process.env = originalEnv;
    vi.clearAllMocks();
    // Let transport workers finish before removing their files
    await new Promise((resolve) => setTimeout(resolve, 100));
    rmSync(testLogDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  const waitForFileContent = async (file: string, needle: string): Promise<string> => {
    let content = '';
    for (let attempt = 0; attempt < 40 && !content.includes(needle); attempt++) {
      content = existsSync(file) ? readFileSync(file, 'utf-8') : '';
      if (!content.includes(needle)) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return content;
  };

  it('should route child loggers created before the switch to the new destination', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';
    process.env.LOG_FILE_PATH = testLogFile;
    delete process.env.LOG_FILE_MAX_SIZE;

    const loggerModule = await import('../src/logger.js');
    createChildLogger = loggerModule.createChildLogger;
    switchLogOutput = loggerModule.switchLogOutput;

    // Both the module-level child and a grandchild exist before the switch
    const childLogger = createChildLogger('early-module');
    const grandchildLogger = childLogger.withContext({ requestId: 'req-1' });

    switchLogOutput('file');
    childLogger.info('child message after switch');
    grandchildLogger.info('grandchild message after switch');

    const content = await waitForFileContent(testLogFile, 'grandchild message after switch');
    expect(content).toContain('child message after switch');
    expect(content).toContain('"module":"early-module"');
    expect(content).toContain('"requestId":"req-1"');
  });

  it('should close the previous transport when switching away from it', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';
    process.env.LOG_FILE_PATH = testLogFile;

    const endSpies: Array<ReturnType<typeof vi.spyOn>> = [];
    vi.doMock('pino', async (importOriginal) => {
      const actual = await importOriginal<typeof PinoModule>();
      const realPino = actual.default;
      const transport = (...args: Parameters<typeof realPino.transport>) => {
        const stream = realPino.transport(...args);
        endSpies.push(vi.spyOn(stream, 'end'));
        return stream;
      };
      const mockedPino = Object.assign(
        (...args: Parameters<typeof realPino>) => realPino(...args),
        realPino,
        { transport },
      );
      return { ...actual, default: mockedPino };
    });

    try {
      const loggerModule = await import('../src/logger.js');
      switchLogOutput = loggerModule.switchLogOutput;

      switchLogOutput('file');
      expect(endSpies).toHaveLength(1);
      expect(endSpies[0]).not.toHaveBeenCalled();

      switchLogOutput('stderr');
      expect(endSpies[0]).toHaveBeenCalledTimes(1);
    } finally {
      vi.doUnmock('pino');
    }
  });

  it('should throw on an unknown mode and keep the current output', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';

    const loggerModule = await import('../src/logger.js');
    switchLogOutput = loggerModule.switchLogOutput;
    getLoggerOutputMode = loggerModule.getLoggerOutputMode;

    expect(() => switchLogOutput('bogus')).toThrow(/Unknown log output mode "bogus"/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should throw on invalid file configuration and keep the current output', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';
    process.env.LOG_FILE_PATH = '../../../etc/passwd';

    const loggerModule = await import('../src/logger.js');
    switchLogOutput = loggerModule.switchLogOutput;
    getLoggerOutputMode = loggerModule.getLoggerOutputMode;

    expect(() => switchLogOutput('file')).toThrow(/Invalid log file path/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should throw on invalid syslog configuration and keep the current output', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';
    process.env.LOG_SYSLOG_HOST = 'invalid..host';

    const loggerModule = await import('../src/logger.js');
    switchLogOutput = loggerModule.switchLogOutput;
    getLoggerOutputMode = loggerModule.getLoggerOutputMode;

    expect(() => switchLogOutput('syslog')).toThrow(/Invalid syslog configuration/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should silence the logger in null mode and restore the level afterwards', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_OUTPUT = 'stderr';
    process.env.LOG_LEVEL = 'warn';

    const loggerModule = await import('../src/logger.js');
    logger = loggerModule.logger;
    switchLogOutput = loggerModule.switchLogOutput;

    expect(logger.level).toBe('warn');

    switchLogOutput('null');
    expect(logger.level).toBe('silent');

    switchLogOutput('stderr');
    expect(logger.level).toBe('warn');
  });
});
