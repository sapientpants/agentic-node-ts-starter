/**
 * ============================================================================
 * TEMPLATE INFRASTRUCTURE - KEEP AND CUSTOMIZE
 * ============================================================================
 * MANDATORY production-ready environment configuration using Zod validation.
 * This file provides type-safe access to environment variables with validation
 * at application startup, ensuring configuration errors are caught early.
 *
 * The application will NOT start without valid configuration.
 *
 * To extend with your own variables:
 * 1. Add new fields to ConfigSchema below
 * 2. TypeScript will automatically provide types
 * 3. Add corresponding entries to .env.example
 * ============================================================================
 */

import { z } from 'zod';
import { createChildLogger } from './logger.js';

const logger = createChildLogger('config');

/**
 * Custom Zod transformer for boolean environment variables
 */
const BooleanSchema = z
  .union([
    z
      .enum(['true', 'false', '1', '0', 'yes', 'no'])
      .transform((value) => value === 'true' || value === '1' || value === 'yes'),
    z.boolean(),
  ])
  .describe('Boolean value (true/false, 1/0, yes/no)');

/**
 * Environment configuration schema
 * Add your application-specific environment variables here
 */
const ConfigSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development')
    .describe('Application environment'),

  // Application settings
  APP_NAME: z
    .string()
    .min(1)
    .default('agentic-node-ts-starter')
    .describe('Application name for logging and metrics'),

  // Logging configuration
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .optional()
    .describe('Logging level'),

  // Feature flags
  ENABLE_METRICS: BooleanSchema.default(false).describe('Enable metrics collection'),

  // Timeouts
  TIMEOUT_MS: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .default(30000)
    .describe('General operation timeout in milliseconds'),

  // Development settings
  FORCE_COLOR: BooleanSchema.optional().describe('Force colored output in terminals'),
  DEBUG: z.string().optional().describe('Debug namespaces to enable'),

  // Logging Configuration
  LOG_OUTPUT: z
    .enum(['stdout', 'stderr', 'file', 'syslog', 'null'])
    .optional()
    .describe('Logger output destination (stdout, stderr, file, syslog, null)'),

  // File logging configuration (when LOG_OUTPUT=file)
  LOG_FILE_PATH: z.string().optional().describe('Path to log file when using file output'),

  LOG_FILE_MAX_SIZE: z
    .string()
    .optional()
    .describe('Maximum size of log file before rotation (e.g., 10M, 1G)'),

  LOG_FILE_MAX_FILES: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .optional()
    .describe('Maximum number of rotated log files to keep'),

  // Syslog configuration (when LOG_OUTPUT=syslog)
  LOG_SYSLOG_HOST: z.string().optional().describe('Syslog server hostname'),

  LOG_SYSLOG_PORT: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .optional()
    .describe('Syslog server port'),

  LOG_SYSLOG_PROTOCOL: z.enum(['udp', 'tcp']).optional().describe('Syslog protocol (udp or tcp)'),

  // File permissions configuration
  LOG_FILE_PERMISSIONS: z
    .string()
    .optional()
    .describe('Octal file permissions for log files (e.g., 640, 0640)'),

  // Test configuration
  LOG_TEST_FILE_TIMEOUT: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .optional()
    .describe('Timeout in milliseconds for file write tests in CI'),
});

/**
 * Inferred TypeScript type from the schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * List of sensitive keys that should be masked in error messages
 */
const SENSITIVE_KEYS = ['PASSWORD', 'TOKEN', 'SECRET', 'KEY'];

/**
 * Convert value to string safely
 */
// eslint-disable-next-line complexity -- Switch exhaustiveness requires all typeof cases
function valueToString(value: unknown): string {
  // Handle null/undefined
  if (value == null) {
    return String(value);
  }

  // Handle string early
  if (typeof value === 'string') {
    return value;
  }

  const valueType = typeof value;

  // Use switch to handle remaining types
  switch (valueType) {
    case 'string':
      return value as string;
    case 'number':
      return String(value as number);
    case 'boolean':
      return String(value as boolean);
    case 'bigint':
      return (value as bigint).toString();
    case 'symbol':
      return (value as symbol).toString();
    case 'object':
      return JSON.stringify(value);
    case 'function':
      return `[Function: ${(value as { name?: string }).name || 'anonymous'}]`;
    case 'undefined':
      return 'undefined';
    default:
      return '[Unknown]';
  }
}

function maskSensitiveValue(key: string, value: unknown): string {
  const keyUpper = key.toUpperCase();
  const isSensitive = SENSITIVE_KEYS.some((sensitive) => keyUpper.includes(sensitive));

  if (!isSensitive || value === undefined || value === null) {
    return valueToString(value);
  }

  const strValue = valueToString(value);
  if (strValue.length <= 4) {
    return '***';
  }

  // Show first 2 and last 2 characters
  return `${strValue.slice(0, 2)}***${strValue.slice(-2)}`;
}

/**
 * Format received value for error messages
 */
function formatReceivedValue(value: string): string {
  return value === 'undefined' ? '' : ` (received: "${value}")`;
}

/**
 * Build error sections from grouped errors
 */
function buildErrorSections(groupedErrors: Record<string, string[]>): string[] {
  const sections: string[] = [];
  const sectionTitles: Record<string, string> = {
    missing: 'Missing required variables',
    invalid: 'Invalid format',
    other: 'Other errors',
  };

  for (const [key, title] of Object.entries(sectionTitles)) {
    // eslint-disable-next-line security/detect-object-injection -- key comes from Object.entries() which is safe
    const errors = groupedErrors[key];
    if (errors && errors.length > 0) {
      sections.push(`${title}:\n${errors.join('\n')}`);
    }
  }

  return sections;
}

/**
 * Format Zod validation errors in a user-friendly way
 */
function formatZodError(error: z.ZodError): string {
  if (!error.issues.length) {
    return 'Invalid configuration';
  }

  const groupedErrors = { missing: [] as string[], invalid: [] as string[], other: [] as string[] };

  for (const err of error.issues) {
    const path = err.path.join('.');
    const value = maskSensitiveValue(path, err.code === 'invalid_type' ? undefined : err.input);
    const receivedValue = formatReceivedValue(value);

    if (err.code === 'invalid_type' && 'received' in err && err.received === 'undefined') {
      groupedErrors.missing.push(`  • ${path}: Required but not provided`);
    } else if (err.code === 'invalid_type' || err.code === 'invalid_value') {
      groupedErrors.invalid.push(`  • ${path}: ${err.message}${receivedValue}`);
    } else {
      groupedErrors.other.push(`  • ${path}: ${err.message}${receivedValue}`);
    }
  }

  return buildErrorSections(groupedErrors).join('\n\n');
}

/**
 * Load and validate environment configuration
 */
function loadConfig(): Config {
  try {
    const parsed = ConfigSchema.parse(process.env);

    // Apply LOG_LEVEL default based on validated NODE_ENV if not set
    if (!parsed.LOG_LEVEL) {
      parsed.LOG_LEVEL = parsed.NODE_ENV === 'production' ? 'info' : 'debug';
    }

    // Log successful configuration load in non-test environments
    if (parsed.NODE_ENV !== 'test') {
      logger.info(
        {
          environment: parsed.NODE_ENV,
          app: parsed.APP_NAME,
        },
        'Configuration loaded successfully',
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      process.stderr.write('\n❌ Invalid environment configuration:\n\n');
      process.stderr.write(formatZodError(error));
      process.stderr.write('\n\n💡 Tip: Check .env.example for valid configuration examples\n\n');
      // eslint-disable-next-line n/no-process-exit -- Fatal config error at startup requires process.exit
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Singleton configuration instance
 * Validates environment variables on first import
 */
export const config = loadConfig();

/**
 * Type-safe configuration getter
 * @param key - Configuration key to retrieve
 * @returns The configuration value for the specified key
 *
 * @example
 * ```typescript
 * const port = getConfig('PORT'); // TypeScript knows this is a number
 * const enableMetrics = getConfig('ENABLE_METRICS'); // TypeScript knows this is a boolean
 * ```
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  // eslint-disable-next-line security/detect-object-injection -- key is type-safe, constrained to keyof Config
  return config[key];
}

/**
 * Check if a configuration value is defined (for optional configs)
 * @param key - Configuration key to check
 * @returns true if the configuration value is defined
 *
 * @example
 * ```typescript
 * if (hasConfig('DATABASE_URL')) {
 *   connectToDatabase(config.DATABASE_URL);
 * }
 * ```
 */
export function hasConfig<K extends keyof Config>(key: K): boolean {
  // eslint-disable-next-line security/detect-object-injection, sonarjs/different-types-comparison -- key is type-safe; comparison needed for optional properties
  return config[key] !== undefined;
}

/**
 * Get all configuration keys (useful for debugging)
 * @returns Array of configuration keys
 */
export function getConfigKeys(): Array<keyof Config> {
  return Object.keys(config) as Array<keyof Config>;
}

/**
 * Export schema for testing purposes
 */
export const __testExports = {
  ConfigSchema,
  formatZodError,
  maskSensitiveValue,
};
