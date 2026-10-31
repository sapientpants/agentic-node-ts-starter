/**
 * Validation utilities for logger configuration.
 * Provides security validation for file paths and network hosts.
 */

import path from 'node:path';
import { isIP } from 'node:net';
import { fallbackLogger } from './logger-fallback.js';

// Path validation constants
const MAX_PATH_LENGTH = 4096; // Maximum allowed path length

// System directories that must never receive log files, per platform.
// Each entry is compared as a whole directory, so `/etcetera/app.log` is not
// mistaken for a path under `/etc`.
const RESTRICTED_DIRECTORIES: Record<'posix' | 'win32', readonly string[]> = {
  posix: ['/etc', '/usr', '/bin', '/sbin', '/boot', '/dev', '/proc', '/sys', '/root'],
  win32: [String.raw`C:\Windows`, String.raw`C:\Program Files`],
};

// Network validation constants
const MAX_HOSTNAME_LENGTH = 255; // Maximum hostname length per RFC 1123
const MIN_PORT_NUMBER = 1; // Minimum valid port number
const MAX_PORT_NUMBER = 65535; // Maximum valid port number
const PRIVILEGED_PORT_THRESHOLD = 1024; // Ports below this require elevated permissions

// File permission constants
const DEFAULT_FILE_MODE = 0o640; // Default file permissions: rw-r-----
const MAX_FILE_MODE = 0o777; // Maximum allowed file permissions
const OTHER_USERS_PERMISSION_MASK = 0o077; // Mask for checking other users/groups permissions

/**
 * Options that pin down the environment a log path is validated against.
 * They default to the current process and exist so that platform-specific
 * behavior can be exercised deterministically.
 */
export interface LogPathValidationOptions {
  /** Platform whose path rules and restricted directories apply (default: `process.platform`) */
  platform?: NodeJS.Platform;
  /** Working directory relative paths are resolved against (default: `process.cwd()`) */
  cwd?: string;
}

/**
 * Whether `candidate` is `directory` itself or located somewhere below it
 * @param {string} candidate - An absolute, normalized path
 * @param {string} directory - An absolute, normalized directory path
 * @param {string} separator - The platform path separator
 * @returns {boolean} true when the candidate is inside the directory
 */
const isWithinDirectory = (candidate: string, directory: string, separator: string): boolean =>
  candidate === directory || candidate.startsWith(directory + separator);

/**
 * Throws if any segment of the raw path is a parent directory reference.
 * Only whole `..` segments count, so file names such as `app..log` are fine.
 * @param {string} logPath - The raw, unresolved path
 * @throws {Error} if the path contains a `..` segment
 */
const assertNoParentReferences = (logPath: string): void => {
  const segments = logPath.split(/[/\\]/);
  if (segments.includes('..')) {
    throw new Error('Log file path cannot contain parent directory references (..)');
  }
};

/**
 * Throws if the resolved path lies inside a restricted system directory.
 * Anything inside the working directory is allowed: the operator chose to run
 * the application there (e.g. a container whose working directory is `/usr/src/app`).
 * @param {string} resolvedPath - The absolute path to check
 * @param {string} cwd - The working directory the path was resolved against
 * @param {NodeJS.Platform} platform - The platform whose rules apply
 * @throws {Error} if the path is inside a restricted directory
 */
const assertNotRestricted = (
  resolvedPath: string,
  cwd: string,
  platform: NodeJS.Platform,
): void => {
  const isWindows = platform === 'win32';
  const pathApi = isWindows ? path.win32 : path.posix;
  // Windows file systems are case-insensitive, so compare in lower case there
  const canonical = isWindows ? resolvedPath.toLowerCase() : resolvedPath;
  const canonicalCwd = isWindows ? pathApi.resolve(cwd).toLowerCase() : pathApi.resolve(cwd);
  if (isWithinDirectory(canonical, canonicalCwd, pathApi.sep)) {
    return;
  }
  for (const restricted of RESTRICTED_DIRECTORIES[isWindows ? 'win32' : 'posix']) {
    const canonicalRestricted = isWindows ? restricted.toLowerCase() : restricted;
    if (isWithinDirectory(canonical, canonicalRestricted, pathApi.sep)) {
      throw new Error(`Log file path cannot be in restricted directory: ${restricted}`);
    }
  }
};

/**
 * Validates a log file path to prevent security issues.
 * Relative paths are resolved against the working directory before the
 * restricted-directory check, so `etc/app.log` is a file below the working
 * directory rather than `/etc/app.log`.
 * @param {string} logPath - The file path to validate
 * @param {LogPathValidationOptions} [options] - Platform and working directory overrides
 * @throws {Error} if the path is invalid or potentially dangerous
 */
export function validateLogPath(logPath: string, options: LogPathValidationOptions = {}): void {
  if (!logPath || typeof logPath !== 'string') {
    throw new Error('Log file path must be a non-empty string');
  }

  // Cheap checks on the raw string first (security issue / buffer overflow guard)
  if (logPath.includes('\0')) {
    throw new Error('Log file path cannot contain null bytes');
  }
  if (logPath.length > MAX_PATH_LENGTH) {
    throw new Error(`Log file path is too long (max ${MAX_PATH_LENGTH} characters)`);
  }

  assertNoParentReferences(logPath);

  const platform = options.platform ?? process.platform;
  const cwd = options.cwd ?? process.cwd();
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  assertNotRestricted(pathApi.resolve(cwd, logPath), cwd, platform);
}

/**
 * Validates a syslog host to ensure it's a valid hostname or IP address
 * @param {string} host - The hostname or IP address to validate
 * @throws {Error} if the host is invalid
 */
export function validateSyslogHost(host: string): void {
  if (!host || typeof host !== 'string') {
    throw new Error('Syslog host must be a non-empty string');
  }

  // Check if it's a valid IP address
  if (isIP(host)) {
    return; // Valid IP address
  }

  // Check host length first
  if (host.length > MAX_HOSTNAME_LENGTH) {
    throw new Error(`Syslog host is too long (max ${MAX_HOSTNAME_LENGTH} characters)`);
  }

  // Validate hostname format (RFC 1123)
  const hostnameRegex =
    // eslint-disable-next-line security/detect-unsafe-regex -- RFC 1123 hostname validation, bounded by length check above
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

  if (!hostnameRegex.test(host)) {
    throw new Error('Syslog host must be a valid hostname or IP address');
  }

  // Check for localhost variants (might want to restrict in production)
  const localhostVariants = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  if (process.env.NODE_ENV === 'production' && localhostVariants.includes(host.toLowerCase())) {
    // Warn but don't throw - this is a soft restriction
    fallbackLogger.warn({ host }, 'Using localhost for syslog in production is not recommended');
  }
}

/**
 * Validates syslog port number
 * @param {number | undefined} port - The port number to validate
 * @throws {Error | TypeError | RangeError} if the port is invalid
 */
export function validateSyslogPort(port: number | undefined): void {
  if (port === undefined) {
    return; // Optional, will use default
  }

  if (!Number.isInteger(port)) {
    throw new TypeError('Syslog port must be an integer');
  }

  if (port < MIN_PORT_NUMBER || port > MAX_PORT_NUMBER) {
    throw new RangeError(`Syslog port must be between ${MIN_PORT_NUMBER} and ${MAX_PORT_NUMBER}`);
  }

  // Warn about privileged ports
  if (port < PRIVILEGED_PORT_THRESHOLD && process.env.NODE_ENV === 'production') {
    fallbackLogger.warn(
      { port },
      `Using privileged port ${port} for syslog may require elevated permissions`,
    );
  }
}

/**
 * Validates file permissions mode
 * @param {number | string | undefined} mode - The octal permission mode
 * @returns {number} The validated mode or default
 */
export function validateFileMode(mode: number | string | undefined): number {
  if (mode === undefined) {
    return DEFAULT_FILE_MODE;
  }

  // Parse octal string (e.g., "0640" or "640") or use numeric value
  const numericMode = typeof mode === 'string' ? Number.parseInt(mode, 8) : mode;

  if (Number.isNaN(numericMode) || numericMode < 0 || numericMode > MAX_FILE_MODE) {
    fallbackLogger.warn(
      { mode },
      `Invalid file mode ${mode}, using default ${DEFAULT_FILE_MODE.toString(8)}`,
    );
    return DEFAULT_FILE_MODE;
  }

  // Warn if permissions are too open
  if ((numericMode & OTHER_USERS_PERMISSION_MASK) !== 0) {
    fallbackLogger.warn(
      { mode: numericMode.toString(8) },
      'Log file permissions allow access to other users/groups',
    );
  }

  return numericMode;
}

const SIZE_MULTIPLIERS: Record<string, number> = {
  '': 1,
  K: 1024,
  M: 1024 * 1024,
  G: 1024 * 1024 * 1024,
  T: 1024 * 1024 * 1024 * 1024,
};

/**
 * Parses a human-readable size string (e.g., "10M", "1.5GB", "100 KB") to bytes.
 * Accepts an optional K/M/G/T unit (case-insensitive), an optional trailing "B",
 * and whitespace between the number and the unit.
 * @param {string | undefined} size - The size string to parse
 * @returns {number | undefined} The size in whole bytes, or undefined if the string is empty or invalid
 */
export function parseSizeToBytes(size: string | undefined): number | undefined {
  if (size === undefined || size.trim() === '') return undefined;

  // eslint-disable-next-line security/detect-unsafe-regex -- Simple size parsing regex, no exponential backtracking
  const regex = /^(\d+(?:\.\d+)?)\s*([KMGT]?)B?$/i;
  const match = regex.exec(size.trim());
  if (!match?.[1]) return undefined;

  const value = Number.parseFloat(match[1]);
  const unit = (match[2] ?? '').toUpperCase();

  // eslint-disable-next-line security/detect-object-injection -- unit comes from regex match, constrained to [KMGT] or empty string
  const bytes = Math.floor(value * (SIZE_MULTIPLIERS[unit] ?? 1));
  return bytes > 0 ? bytes : undefined;
}

/**
 * Converts a byte count into the size format understood by pino-roll.
 * pino-roll only accepts `<number><unit>` with a single-letter unit (`b`, `k`, `m`, `g`),
 * so richer formats such as "10MB" or "1.5 G" must be normalized before being passed on.
 * @param {number} bytes - The size in bytes
 * @returns {string} A pino-roll compatible size string (e.g., "10485760b")
 */
export function toPinoRollSize(bytes: number): string {
  return `${Math.floor(bytes)}b`;
}
