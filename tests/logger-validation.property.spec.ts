/**
 * Property-based tests for the log path validation - Template infrastructure.
 * These tests verify invariants of `validateLogPath` across generated paths.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateLogPath } from '../src/logger-validation.js';

/** A path segment that is neither empty, `.` nor `..` and contains no separators or null bytes */
const safeSegment = fc
  .stringMatching(/^[A-Za-z0-9._-]{1,16}$/)
  .filter((segment) => segment !== '.' && segment !== '..');

/** A relative path made only of safe segments */
const safeRelativePath = fc
  .array(safeSegment, { minLength: 1, maxLength: 6 })
  .map((segments) => segments.join('/'));

const POSIX = { platform: 'linux' as const, cwd: '/home/app' };
const RESTRICTED_ROOTS = [
  '/etc',
  '/usr',
  '/bin',
  '/sbin',
  '/boot',
  '/dev',
  '/proc',
  '/sys',
  '/root',
];

describe('validateLogPath (property-based)', () => {
  it('accepts any relative path built from safe segments', () => {
    fc.assert(
      fc.property(safeRelativePath, (relativePath) => {
        expect(() => validateLogPath(relativePath, POSIX)).not.toThrow();
      }),
    );
  });

  it('accepts file names with consecutive dots as long as no segment is exactly ".."', () => {
    fc.assert(
      fc.property(safeSegment, fc.integer({ min: 2, max: 5 }), (name, dots) => {
        expect(() => validateLogPath(`logs/${name}${'.'.repeat(dots)}log`, POSIX)).not.toThrow();
      }),
    );
  });

  it('rejects any path containing a ".." segment, wherever it appears', () => {
    fc.assert(
      fc.property(
        fc.array(safeSegment, { maxLength: 3 }),
        fc.array(safeSegment, { maxLength: 3 }),
        (before, after) => {
          const traversal = [...before, '..', ...after].join('/');
          expect(() => validateLogPath(traversal, POSIX)).toThrow(
            'cannot contain parent directory references',
          );
        },
      ),
    );
  });

  it('rejects absolute paths under a restricted directory and accepts directories that only share a prefix', () => {
    fc.assert(
      fc.property(fc.constantFrom(...RESTRICTED_ROOTS), safeRelativePath, (root, rest) => {
        expect(() => validateLogPath(`${root}/${rest}`, POSIX)).toThrow(
          'cannot be in restricted directory',
        );
        expect(() => validateLogPath(`${root}extra/${rest}`, POSIX)).not.toThrow();
      }),
    );
  });

  it('never rejects a path because of a restricted directory when it lies inside the working directory', () => {
    fc.assert(
      fc.property(fc.constantFrom(...RESTRICTED_ROOTS), safeRelativePath, (root, rest) => {
        const cwd = `${root}/app`;
        expect(() => validateLogPath(rest, { platform: 'linux', cwd })).not.toThrow();
        expect(() => validateLogPath(`${cwd}/${rest}`, { platform: 'linux', cwd })).not.toThrow();
      }),
    );
  });
});
