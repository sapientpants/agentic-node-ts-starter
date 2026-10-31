/**
 * Tests for runtime log output switching.
 * Verifies that switches reach child loggers, release transports, and fail safely.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type * as PinoModule from 'pino';
import { loadConfig } from '../src/config.js';
import { createLogger, type LoggerInstance } from '../src/logger.js';

const originalEnv = process.env;

describe('Logger Output Switching', () => {
  let testLogDir: string;
  let testLogFile: string;
  const instances: LoggerInstance[] = [];

  /**
   * Build a development logger writing to stderr, recorded so its transport is closed afterwards
   * @param {NodeJS.ProcessEnv} env - Additional environment variables
   * @returns {LoggerInstance} The logger instance
   */
  const createTestLogger = (env: NodeJS.ProcessEnv = {}): LoggerInstance => {
    const instance = createLogger(
      loadConfig({ NODE_ENV: 'development', LOG_OUTPUT: 'stderr', ...env }),
    );
    instances.push(instance);
    return instance;
  };

  beforeEach(() => {
    // Use the OS temp dir: other logger specs remove the shared ./test-logs folder in parallel
    testLogDir = mkdtempSync(join(tmpdir(), 'logger-switching-'));
    testLogFile = join(testLogDir, 'test.log');
  });

  afterEach(async () => {
    process.env = originalEnv;
    for (const instance of instances.splice(0)) instance.switchLogOutput('null');
    vi.restoreAllMocks();
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

  /**
   * Replace pino.transport with a wrapper so tests can observe the transport streams
   * the logger module creates. This needs a fresh module instance, so it is the one
   * place where the module registry is reset and the logger is re-imported.
   * @param {(stream: ReturnType<typeof PinoModule.transport>) => void} onTransport - Called with each created stream
   */
  const mockPinoTransport = (
    onTransport: (stream: ReturnType<typeof PinoModule.transport>) => void,
  ): void => {
    vi.doMock('pino', async (importOriginal) => {
      const actual = await importOriginal<typeof PinoModule>();
      const realPino = actual.default;
      const transport = (...args: Parameters<typeof realPino.transport>) => {
        const stream = realPino.transport(...args);
        onTransport(stream);
        return stream;
      };
      const mockedPino = Object.assign(
        (...args: Parameters<typeof realPino>) => realPino(...args),
        realPino,
        { transport },
      );
      return { ...actual, default: mockedPino };
    });
  };

  /**
   * Import a fresh copy of the logger module against the given environment
   * @param {NodeJS.ProcessEnv} env - The environment the fresh module should load
   * @returns {Promise<typeof import('../src/logger.js')>} The freshly loaded module
   */
  const importFreshLogger = async (
    env: NodeJS.ProcessEnv,
  ): Promise<typeof import('../src/logger.js')> => {
    vi.resetModules();
    process.env = { ...originalEnv, ...env };
    return import('../src/logger.js');
  };

  it('should route child loggers created before the switch to the new destination', async () => {
    const { createChildLogger, switchLogOutput } = createTestLogger({
      LOG_FILE_PATH: testLogFile,
    });

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
    const endSpies: Array<ReturnType<typeof vi.spyOn>> = [];
    mockPinoTransport((stream) => {
      endSpies.push(vi.spyOn(stream, 'end'));
    });

    try {
      const { switchLogOutput } = await importFreshLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'stderr',
        LOG_FILE_PATH: testLogFile,
      });

      switchLogOutput('file');
      expect(endSpies).toHaveLength(1);
      expect(endSpies[0]).not.toHaveBeenCalled();

      switchLogOutput('stderr');
      expect(endSpies[0]).toHaveBeenCalledTimes(1);
    } finally {
      vi.doUnmock('pino');
    }
  });

  it('should survive a transport worker error without crashing the process', async () => {
    const streams: Array<ReturnType<typeof PinoModule.transport>> = [];
    mockPinoTransport((stream) => {
      streams.push(stream);
    });
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    try {
      const { switchLogOutput, getLoggerOutputMode } = await importFreshLogger({
        NODE_ENV: 'development',
        LOG_OUTPUT: 'stderr',
        LOG_FILE_PATH: testLogFile,
      });

      switchLogOutput('file');
      expect(streams).toHaveLength(1);

      // An unhandled 'error' event would throw ERR_UNHANDLED_ERROR here
      expect(() => streams[0]?.emit('error', new Error('worker exploded'))).not.toThrow();
      expect(getLoggerOutputMode()).toBe('file');

      const allOutput = stdoutSpy.mock.calls.map((call) => String(call[0])).join('');
      expect(allOutput).toContain('Log transport error');
      expect(allOutput).toContain('worker exploded');
      switchLogOutput('null');
    } finally {
      vi.doUnmock('pino');
    }
  });

  it('should throw on an unknown mode and keep the current output', () => {
    const { switchLogOutput, getLoggerOutputMode } = createTestLogger();

    expect(() => switchLogOutput('bogus')).toThrow(/Unknown log output mode "bogus"/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should throw on invalid file configuration and keep the current output', () => {
    const { switchLogOutput, getLoggerOutputMode } = createTestLogger({
      LOG_FILE_PATH: '../../../etc/passwd',
    });

    expect(() => switchLogOutput('file')).toThrow(/Invalid log file path/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should throw on invalid syslog configuration and keep the current output', () => {
    const { switchLogOutput, getLoggerOutputMode } = createTestLogger({
      LOG_SYSLOG_HOST: 'invalid..host',
    });

    expect(() => switchLogOutput('syslog')).toThrow(/Invalid syslog configuration/);
    expect(getLoggerOutputMode()).toBe('stderr');
  });

  it('should silence the logger in null mode and restore the level afterwards', () => {
    const { logger, switchLogOutput } = createTestLogger({ LOG_LEVEL: 'warn' });

    expect(logger.level).toBe('warn');

    switchLogOutput('null');
    expect(logger.level).toBe('silent');

    switchLogOutput('stderr');
    expect(logger.level).toBe('warn');
  });

  it('should log the switch on the new destination and report the same mode as a no-op', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { logger, switchLogOutput, getLoggerOutputMode } = createTestLogger({
      LOG_OUTPUT: 'null',
    });

    switchLogOutput('stderr');
    switchLogOutput('stderr');
    logger.info('after switch');

    expect(getLoggerOutputMode()).toBe('stderr');
    const allOutput = stderrSpy.mock.calls.map((call) => String(call[0])).join('');
    expect(allOutput).toContain('Logger output switched to stderr');
    expect(allOutput).toContain('"previousMode":"null"');
    expect(allOutput).toContain('Logger already using stderr output');
    expect(allOutput).toContain('after switch');
  });
});
