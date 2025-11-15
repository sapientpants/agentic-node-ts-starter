/**
 * Validation utilities for logger configuration.
 * Provides security validation for file paths and network hosts.
 */

import { normalize, isAbsolute } from 'node:path';
import { isIP } from 'node:net';

// Path validation constants
const MAX_PATH_LENGTH = 4096; // Maximum allowed path length

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
 * Validates a log file path to prevent security issues
 * @param path - The file path to validate
 * @throws Error if the path is invalid or potentially dangerous
 */
export function validateLogPath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new Error('Log file path must be a non-empty string');
  }

  // Normalize the path to resolve . and .. segments
  const normalizedPath = normalize(path);

  // Check for path traversal attempts
  if (path.includes('..')) {
    throw new Error('Log file path cannot contain parent directory references (..)');
  }

  // Define restricted system directories
  const restrictedPaths = [
    '/etc',
    '/usr',
    '/bin',
    '/sbin',
    '/boot',
    '/dev',
    '/proc',
    '/sys',
    '/root',
    String.raw`C:\Windows`,
    String.raw`C:\Program Files`,
  ];

  // Check if path starts with any restricted directory
  const absolutePath = isAbsolute(normalizedPath)
    ? normalizedPath
    : normalize(`/${normalizedPath}`);
  for (const restricted of restrictedPaths) {
    // Handle both Unix and Windows paths
    const normalizedRestricted = normalize(restricted);
    if (absolutePath.startsWith(normalizedRestricted)) {
      throw new Error(`Log file path cannot be in restricted directory: ${restricted}`);
    }
  }

  // Check for null bytes (security issue)
  if (path.includes('\0')) {
    throw new Error('Log file path cannot contain null bytes');
  }

  // Check path length (prevent buffer overflow attacks)
  if (path.length > MAX_PATH_LENGTH) {
    throw new Error(`Log file path is too long (max ${MAX_PATH_LENGTH} characters)`);
  }
}

/**
 * Validates a syslog host to ensure it's a valid hostname or IP address
 * @param host - The hostname or IP address to validate
 * @throws Error if the host is invalid
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
    // Log warning but don't throw - this is a soft restriction
    process.stderr.write('Warning: Using localhost for syslog in production is not recommended\n');
  }
}

/**
 * Validates syslog port number
 * @param port - The port number to validate
 * @throws Error if the port is invalid
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
    process.stderr.write(
      `Warning: Using privileged port ${port} for syslog may require elevated permissions\n`,
    );
  }
}

/**
 * Validates file permissions mode
 * @param mode - The octal permission mode
 * @returns The validated mode or default
 */
export function validateFileMode(mode: number | string | undefined): number {
  if (mode === undefined) {
    return DEFAULT_FILE_MODE;
  }

  // Parse octal string (e.g., "0640" or "640") or use numeric value
  const numericMode = typeof mode === 'string' ? Number.parseInt(mode, 8) : mode;

  if (Number.isNaN(numericMode) || numericMode < 0 || numericMode > MAX_FILE_MODE) {
    process.stderr.write(
      `Invalid file mode ${mode}, using default ${DEFAULT_FILE_MODE.toString(8)}\n`,
    );
    return DEFAULT_FILE_MODE;
  }

  // Warn if permissions are too open
  if ((numericMode & OTHER_USERS_PERMISSION_MASK) !== 0) {
    process.stderr.write('Warning: Log file permissions allow access to other users/groups\n');
  }

  return numericMode;
}
