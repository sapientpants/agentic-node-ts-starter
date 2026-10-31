/**
 * Property-based tests for the configuration loader - Template infrastructure.
 * These tests verify invariants of `loadConfig` across generated environments.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ConfigError, loadConfig } from '../src/config.js';

const NODE_ENVS = ['development', 'production', 'test', 'staging'] as const;
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
const LOG_OUTPUTS = ['stdout', 'stderr', 'file', 'syslog', 'null'] as const;
const TRUE_WORDS = ['true', '1', 'yes'] as const;
const FALSE_WORDS = ['false', '0', 'no'] as const;

const digits = fc.integer({ min: 0, max: 1_000_000 }).map(String);

/**
 * A fully valid environment with every supported variable set
 */
const validEnv = fc.record({
  NODE_ENV: fc.constantFrom(...NODE_ENVS),
  APP_NAME: fc.string({ minLength: 1 }),
  LOG_LEVEL: fc.constantFrom(...LOG_LEVELS),
  LOG_OUTPUT: fc.constantFrom(...LOG_OUTPUTS),
  ENABLE_METRICS: fc.constantFrom(...TRUE_WORDS, ...FALSE_WORDS),
  TIMEOUT_MS: digits,
  LOG_FILE_MAX_FILES: digits,
  LOG_SYSLOG_PORT: digits,
  LOG_SYSLOG_PROTOCOL: fc.constantFrom('udp', 'tcp'),
});

describe('loadConfig (property-based)', () => {
  it('is deterministic and does not mutate its input', () => {
    fc.assert(
      fc.property(validEnv, (env) => {
        const snapshot = { ...env };
        const first = loadConfig(env);
        const second = loadConfig(env);
        expect(first).toEqual(second);
        expect(env).toEqual(snapshot);
      }),
    );
  });

  it('keeps explicitly set enum values and converts numeric strings to numbers', () => {
    fc.assert(
      fc.property(validEnv, (env) => {
        const loaded = loadConfig(env);
        expect(loaded.NODE_ENV).toBe(env.NODE_ENV);
        expect(loaded.LOG_LEVEL).toBe(env.LOG_LEVEL);
        expect(loaded.LOG_OUTPUT).toBe(env.LOG_OUTPUT);
        expect(loaded.APP_NAME).toBe(env.APP_NAME);
        expect(loaded.TIMEOUT_MS).toBe(Number(env.TIMEOUT_MS));
        expect(loaded.LOG_FILE_MAX_FILES).toBe(Number(env.LOG_FILE_MAX_FILES));
        expect(loaded.LOG_SYSLOG_PORT).toBe(Number(env.LOG_SYSLOG_PORT));
      }),
    );
  });

  it('parses every accepted boolean spelling', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TRUE_WORDS), (word) => {
        expect(loadConfig({ ENABLE_METRICS: word }).ENABLE_METRICS).toBe(true);
      }),
    );
    fc.assert(
      fc.property(fc.constantFrom(...FALSE_WORDS), (word) => {
        expect(loadConfig({ ENABLE_METRICS: word }).ENABLE_METRICS).toBe(false);
      }),
    );
  });

  it('always resolves LOG_LEVEL to a valid level, defaulting per environment', () => {
    fc.assert(
      fc.property(fc.constantFrom(...NODE_ENVS), (nodeEnv) => {
        const loaded = loadConfig({ NODE_ENV: nodeEnv });
        expect(LOG_LEVELS).toContain(loaded.LOG_LEVEL);
        const expected =
          nodeEnv === 'production' ? 'info' : nodeEnv === 'test' ? 'silent' : 'debug';
        expect(loaded.LOG_LEVEL).toBe(expected);
      }),
    );
  });

  it('rejects any NODE_ENV outside the allowed set with a ConfigError', () => {
    fc.assert(
      fc.property(
        fc.string().filter((value) => !(NODE_ENVS as readonly string[]).includes(value)),
        (nodeEnv) => {
          expect(() => loadConfig({ NODE_ENV: nodeEnv })).toThrow(ConfigError);
        },
      ),
    );
  });

  it('rejects non-numeric TIMEOUT_MS values with a ConfigError', () => {
    fc.assert(
      fc.property(
        fc.string().filter((value) => !/^\d+$/.test(value)),
        (timeout) => {
          expect(() => loadConfig({ TIMEOUT_MS: timeout })).toThrow(ConfigError);
        },
      ),
    );
  });
});
