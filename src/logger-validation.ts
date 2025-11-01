/**
 * Validation utilities for logger configuration.
 * Provides security validation for file paths and network hosts.
 */

import { normalize, isAbsolute } from 'path';
import { isIP } from 'net';

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
    'C:\\Windows',
    'C:\\Program Files',
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
  if (path.length > 4096) {
    throw new Error('Log file path is too long (max 4096 characters)');
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
  if (host.length > 255) {
    throw new Error('Syslog host is too long (max 255 characters)');
  }

  // Validate hostname format (RFC 1123)
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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
    throw new Error('Syslog port must be an integer');
  }

  if (port < 1 || port > 65535) {
    throw new Error('Syslog port must be between 1 and 65535');
  }

  // Warn about privileged ports
  if (port < 1024 && process.env.NODE_ENV === 'production') {
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
  const defaultMode = 0o640; // rw-r-----

  if (mode === undefined) {
    return defaultMode;
  }

  let numericMode: number;

  if (typeof mode === 'string') {
    // Parse octal string (e.g., "0640" or "640")
    numericMode = parseInt(mode, 8);
  } else {
    numericMode = mode;
  }

  if (isNaN(numericMode) || numericMode < 0 || numericMode > 0o777) {
    process.stderr.write(`Invalid file mode ${mode}, using default ${defaultMode.toString(8)}\n`);
    return defaultMode;
  }

  // Warn if permissions are too open
  if ((numericMode & 0o077) !== 0) {
    process.stderr.write('Warning: Log file permissions allow access to other users/groups\n');
  }

  return numericMode;
}
