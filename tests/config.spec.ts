/**
 * Tests for environment configuration - Template infrastructure.
 * These tests verify the configuration loader and can be kept/customized.
 *
 * `loadConfig` is pure, so every test hands it a plain environment object
 * instead of mutating `process.env` and re-importing the module.
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { ConfigError, config, getConfig, hasConfig, loadConfig } from '../src/config.js';

/**
 * Format a Zod error the way loadConfig reports it: the module keeps its
 * formatter private, so tests read the ConfigError message instead.
 * @param {z.ZodError} error - The validation error to format
 * @returns {string} The formatted report (without the header and tip lines)
 */
const formatZodError = (error: z.ZodError): string => {
  const sections = new ConfigError(error).message.split('\n\n');
  return sections.slice(1, -1).join('\n\n');
};

/**
 * Run loadConfig on an invalid environment and return the error message
 * @param {NodeJS.ProcessEnv} env - The environment to validate
 * @returns {string} The ConfigError message
 */
const loadErrorMessage = (env: NodeJS.ProcessEnv): string => {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error.message;
    throw error;
  }
  throw new Error('expected loadConfig to throw');
};

/**
 * Report a single issue for `key` with the given raw input and return the
 * "(received: ...)" fragment of the message, or '' when none is shown
 * @param {string} key - The variable name of the issue
 * @param {unknown} input - The raw input attached to the issue
 * @returns {string} The displayed received value
 */
const receivedValue = (key: string, input: unknown): string => {
  const error = {
    issues: [{ code: 'custom', path: [key], message: 'bad', input }],
  } as unknown as z.ZodError;
  const match = /\(received: "(.*)"\)/s.exec(formatZodError(error));
  return match?.[1] ?? '';
};

describe('Configuration', () => {
  describe('successful configuration loading', () => {
    it('should load configuration with all required fields', () => {
      const loaded = loadConfig({ NODE_ENV: 'test' });

      expect(loaded.NODE_ENV).toBe('test');
      expect(loaded.APP_NAME).toBe('agentic-node-ts-starter');
    });

    it('should parse boolean environment variables correctly', () => {
      const loaded = loadConfig({ ENABLE_METRICS: 'true', FORCE_COLOR: 'false' });

      expect(loaded.ENABLE_METRICS).toBe(true);
      expect(loaded.FORCE_COLOR).toBe(false);
    });

    it('should accept various boolean formats', () => {
      expect(loadConfig({ ENABLE_METRICS: 'yes' }).ENABLE_METRICS).toBe(true);
      expect(loadConfig({ ENABLE_METRICS: '1' }).ENABLE_METRICS).toBe(true);
      expect(loadConfig({ ENABLE_METRICS: 'no' }).ENABLE_METRICS).toBe(false);
      expect(loadConfig({ ENABLE_METRICS: '0' }).ENABLE_METRICS).toBe(false);
    });

    it('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test', 'staging'];

      for (const env of validEnvs) {
        expect(loadConfig({ NODE_ENV: env }).NODE_ENV).toBe(env);
      }
    });

    it('should handle optional fields correctly', () => {
      const loaded = loadConfig({ NODE_ENV: 'test' });

      expect(loaded.DEBUG).toBeUndefined();
      expect(loaded.FORCE_COLOR).toBeUndefined();
      expect(loaded.LOG_FILE_PATH).toBeUndefined();
    });

    it('should parse the logging variables', () => {
      const loaded = loadConfig({
        LOG_OUTPUT: 'syslog',
        LOG_SYSLOG_HOST: 'syslog.example.com',
        LOG_SYSLOG_PORT: '1514',
        LOG_SYSLOG_PROTOCOL: 'tcp',
        LOG_FILE_MAX_FILES: '7',
      });

      expect(loaded.LOG_OUTPUT).toBe('syslog');
      expect(loaded.LOG_SYSLOG_HOST).toBe('syslog.example.com');
      expect(loaded.LOG_SYSLOG_PORT).toBe(1514);
      expect(loaded.LOG_SYSLOG_PROTOCOL).toBe('tcp');
      expect(loaded.LOG_FILE_MAX_FILES).toBe(7);
    });

    it('should read process.env when called without arguments', () => {
      const loaded = loadConfig();

      expect(loaded).toEqual(config);
      expect(loaded).not.toBe(config);
    });

    it('should not mutate the environment it is given', () => {
      const env = { NODE_ENV: 'production', ENABLE_METRICS: 'true' };
      const snapshot = { ...env };

      loadConfig(env);

      expect(env).toEqual(snapshot);
    });
  });

  describe('default values', () => {
    it('should use default values when env vars not set', () => {
      const loaded = loadConfig({ NODE_ENV: 'test' });

      expect(loaded.ENABLE_METRICS).toBe(false);
      expect(loaded.TIMEOUT_MS).toBe(30000);
      expect(loaded.APP_NAME).toBe('agentic-node-ts-starter');
      expect(loaded.LOG_OUTPUT).toBe('stdout');
    });

    it('should default NODE_ENV to development', () => {
      expect(loadConfig({}).NODE_ENV).toBe('development');
    });

    it('should use environment-specific defaults for LOG_LEVEL', () => {
      expect(loadConfig({ NODE_ENV: 'production' }).LOG_LEVEL).toBe('info');
      expect(loadConfig({ NODE_ENV: 'development' }).LOG_LEVEL).toBe('debug');
      expect(loadConfig({ NODE_ENV: 'staging' }).LOG_LEVEL).toBe('debug');
      expect(loadConfig({ NODE_ENV: 'test' }).LOG_LEVEL).toBe('silent');
      expect(loadConfig({ NODE_ENV: 'production', LOG_LEVEL: 'error' }).LOG_LEVEL).toBe('error');
      expect(loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
    });
  });

  describe('validation errors', () => {
    it('should throw a ConfigError on invalid NODE_ENV', () => {
      expect(() => loadConfig({ NODE_ENV: 'invalid' })).toThrow(ConfigError);
    });

    it('should throw a ConfigError on invalid boolean format', () => {
      expect(() => loadConfig({ ENABLE_METRICS: 'maybe' })).toThrow(ConfigError);
    });

    it('should throw a ConfigError on unknown LOG_OUTPUT', () => {
      expect(() => loadConfig({ LOG_OUTPUT: 'invalid-mode' })).toThrow(ConfigError);
    });

    it('should describe every invalid variable in the error message', () => {
      let error: unknown;
      try {
        loadConfig({ NODE_ENV: 'nope', TIMEOUT_MS: 'thirty', API_TOKEN_UNUSED: 'ignored' });
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(ConfigError);
      if (!(error instanceof ConfigError)) return;
      expect(error.name).toBe('ConfigError');
      expect(error.message).toContain('Invalid environment configuration');
      expect(error.message).toContain('NODE_ENV:');
      expect(error.message).toContain('(received: "nope")');
      expect(error.message).toContain('TIMEOUT_MS:');
      expect(error.message).toContain('(received: "thirty")');
      expect(error.message).toContain('.env.example');
      expect(error.cause).toBeInstanceOf(z.ZodError);
    });

    it('should redact sensitive values from the cause as well as the message', () => {
      // Simulates a user-added secret variable; the shipped schema has none
      const SecretSchema = z.object({ API_TOKEN: z.string().min(32) });
      const result = SecretSchema.safeParse(
        { API_TOKEN: 'too-short-value' },
        { reportInput: true },
      );
      expect(result.success).toBe(false);
      if (result.success) return;

      const error = new ConfigError(result.error);

      expect(error.message).toContain('API_TOKEN:');
      expect(error.message).toContain('(received: "***")');
      expect(error.message).not.toContain('too-short-value');

      // Node prints an uncaught error's cause (issues included) when the config
      // singleton throws at import, so the cause must not carry the raw value either
      expect(error.cause).toBeInstanceOf(z.ZodError);
      if (!(error.cause instanceof z.ZodError)) return;
      expect(error.cause.issues[0]?.input).toBe('***');
      expect(error.cause.message).not.toContain('too-short-value');
    });

    it('should not call process.exit', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        expect(() => loadConfig({ NODE_ENV: 'invalid' })).toThrow(ConfigError);
        expect(exitSpy).not.toHaveBeenCalled();
      } finally {
        exitSpy.mockRestore();
      }
    });
  });

  describe('error formatting', () => {
    it('should format missing required variable errors', () => {
      // Zod 4 invalid_type issues carry `input`, not `received`
      const mockError = {
        issues: [
          {
            code: 'invalid_type' as const,
            expected: 'string',
            path: ['REQUIRED_FIELD'],
            message: 'Invalid input: expected string, received undefined',
            input: undefined,
          },
        ],
      } as unknown as z.ZodError;

      const formatted = formatZodError(mockError);
      expect(formatted).toContain('Missing required variables');
      expect(formatted).toContain('REQUIRED_FIELD: Required but not provided');
      expect(formatted).not.toContain('received:');
    });

    it('should format invalid format errors', () => {
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
      expect(formatted).toContain('SOME_FIELD: Expected string, received number (received: "123")');
    });

    it('should handle empty error list', () => {
      const mockError = {
        issues: [],
      } as unknown as z.ZodError;

      const formatted = formatZodError(mockError);
      expect(formatted).toBe('Invalid configuration');
      expect(new ConfigError(mockError).message).toContain('.env.example');
    });

    it('should show received values for real schema errors (loadConfig parses with reportInput)', () => {
      const formatted = loadErrorMessage({
        NODE_ENV: 'nope',
        TIMEOUT_MS: 'thirty',
        LOG_LEVEL: 'verbose',
      });
      expect(formatted).toContain('NODE_ENV:');
      expect(formatted).toContain('(received: "nope")');
      expect(formatted).toContain('(received: "thirty")');
      expect(formatted).toContain('(received: "verbose")');
    });

    it('should omit received values when parsing without reportInput', () => {
      const schema = z.object({ NODE_ENV: z.enum(['development', 'production']) });
      const result = schema.safeParse({ NODE_ENV: 'nope' });
      expect(result.success).toBe(false);
      if (result.success) return;

      const formatted = formatZodError(result.error);
      expect(formatted).toContain('NODE_ENV:');
      expect(formatted).not.toContain('received:');
    });

    it('should not report wrong-type values as missing when parsing without reportInput', () => {
      const schema = z.object({ MISSING_FIELD: z.string(), WRONG_TYPE: z.string() });
      const result = schema.safeParse({ WRONG_TYPE: 123 });
      expect(result.success).toBe(false);
      if (result.success) return;

      const formatted = formatZodError(result.error);
      expect(formatted).toContain('Invalid format:');
      expect(formatted).toContain('WRONG_TYPE: Invalid input: expected string, received number');
      expect(formatted).not.toContain('WRONG_TYPE: Required but not provided');
      // Without reportInput the formatter cannot tell a missing key from undefined input
      expect(formatted).not.toContain('MISSING_FIELD: Required but not provided');
    });

    it('should redact sensitive values for real schema errors', () => {
      const schema = z.object({ API_TOKEN: z.string().min(32), DB_PASSWORD: z.enum(['a']) });
      const result = schema.safeParse(
        { API_TOKEN: 'sk-super-secret-value', DB_PASSWORD: 'hunter2' },
        { reportInput: true },
      );
      expect(result.success).toBe(false);
      if (result.success) return;

      const formatted = formatZodError(result.error);
      expect(formatted).toContain('API_TOKEN:');
      expect(formatted).toContain('DB_PASSWORD:');
      expect(formatted).toContain('(received: "***")');
      expect(formatted).not.toContain('sk-super-secret-value');
      expect(formatted).not.toContain('hunter2');
    });
  });

  describe('sensitive value masking', () => {
    it('should fully redact sensitive values', () => {
      expect(receivedValue('PASSWORD', 'my-secret-password')).toBe('***');
      expect(receivedValue('TOKEN', 'sk-1234567890abcdef')).toBe('***');
      expect(receivedValue('SECRET', 'abc')).toBe('***');
      expect(receivedValue('encryption_key', 'lowercase-key')).toBe('***');
      expect(receivedValue('NORMAL_VAR', 'visible')).toBe('visible');
    });

    it('should not redact undefined and null values', () => {
      // An undefined input is not displayed at all; null is shown as-is
      expect(receivedValue('PASSWORD', undefined)).toBe('');
      expect(receivedValue('SECRET', null)).toBe('null');
    });

    it('should stringify non-string values', () => {
      expect(receivedValue('COUNT', 42)).toBe('42');
      expect(receivedValue('RATIO', 3.14)).toBe('3.14');
      expect(receivedValue('ENABLED', true)).toBe('true');
      expect(receivedValue('ID', BigInt(12345))).toBe('12345');
      expect(receivedValue('SOME_SYMBOL', Symbol('test'))).toBe('Symbol(test)');
      expect(receivedValue('DATA', { key: 'value' })).toBe('{"key":"value"}');
      expect(receivedValue('LIST', [1, 2])).toBe('[1,2]');
      expect(receivedValue('CALLBACK', function testFunc() {})).toContain('testFunc');
    });
  });

  describe('singleton and helper functions', () => {
    it('should expose the configuration loaded from process.env', () => {
      expect(config.NODE_ENV).toBe('test');
      expect(config.LOG_LEVEL).toBeDefined();
      expect(config.LOG_OUTPUT).toBeDefined();
    });

    it('should provide getConfig helper', () => {
      expect(getConfig('NODE_ENV')).toBe(config.NODE_ENV);
      expect(getConfig('ENABLE_METRICS')).toBe(config.ENABLE_METRICS);
      expect(getConfig('LOG_LEVEL')).toBe(config.LOG_LEVEL);
    });

    it('should provide hasConfig helper', () => {
      expect(hasConfig('NODE_ENV')).toBe(true); // Has default value
      expect(hasConfig('LOG_OUTPUT')).toBe(true); // Has default value
      expect(hasConfig('LOG_FILE_PATH')).toBe(config.LOG_FILE_PATH !== undefined);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical production configuration', () => {
      const loaded = loadConfig({
        NODE_ENV: 'production',
        ENABLE_METRICS: 'true',
        LOG_LEVEL: 'warn',
        TIMEOUT_MS: '60000',
      });

      expect(loaded.NODE_ENV).toBe('production');
      expect(loaded.ENABLE_METRICS).toBe(true);
      expect(loaded.LOG_LEVEL).toBe('warn');
      expect(loaded.TIMEOUT_MS).toBe(60000);
    });

    it('should handle typical development configuration', () => {
      const loaded = loadConfig({
        NODE_ENV: 'development',
        ENABLE_METRICS: 'false',
        DEBUG: 'app:*',
        FORCE_COLOR: 'true',
      });

      expect(loaded.NODE_ENV).toBe('development');
      expect(loaded.ENABLE_METRICS).toBe(false);
      expect(loaded.DEBUG).toBe('app:*');
      expect(loaded.FORCE_COLOR).toBe(true);
      expect(loaded.LOG_LEVEL).toBe('debug'); // Default for development
    });

    it('should handle minimal configuration', () => {
      // Only set NODE_ENV, everything else uses defaults
      const loaded = loadConfig({ NODE_ENV: 'test' });

      expect(loaded.NODE_ENV).toBe('test');
      expect(loaded.APP_NAME).toBe('agentic-node-ts-starter');
      expect(loaded.ENABLE_METRICS).toBe(false); // Default
    });
  });
});
