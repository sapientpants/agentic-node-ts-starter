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
 * Mask sensitive values in error messages
 */
function maskSensitiveValue(key: string, value: unknown): string {
  const keyUpper = key.toUpperCase();
  const isSensitive = SENSITIVE_KEYS.some((sensitive) => keyUpper.includes(sensitive));

  if (!isSensitive || value === undefined || value === null) {
    if (value === null || value === undefined) {
      return String(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (strValue.length <= 4) {
    return '***';
  }

  // Show first 2 and last 2 characters
  return `${strValue.slice(0, 2)}***${strValue.slice(-2)}`;
}

/**
 * Format Zod validation errors in a user-friendly way
 */
function formatZodError(error: z.ZodError): string {
  const groupedErrors = {
    missing: [] as string[],
    invalid: [] as string[],
    other: [] as string[],
  };

  if (!error.issues.length) {
    return 'Invalid configuration';
  }

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    const value = maskSensitiveValue(path, err.code === 'invalid_type' ? undefined : err.input);

    if (err.code === 'invalid_type' && 'received' in err && err.received === 'undefined') {
      groupedErrors.missing.push(`  • ${path}: Required but not provided`);
    } else if (err.code === 'invalid_type' || err.code === 'invalid_value') {
      groupedErrors.invalid.push(
        `  • ${path}: ${err.message}${value !== 'undefined' ? ` (received: "${value}")` : ''}`,
      );
    } else {
      groupedErrors.other.push(
        `  • ${path}: ${err.message}${value !== 'undefined' ? ` (received: "${value}")` : ''}`,
      );
    }
  });

  const sections: string[] = [];

  if (groupedErrors.missing.length > 0) {
    sections.push('Missing required variables:\n' + groupedErrors.missing.join('\n'));
  }

  if (groupedErrors.invalid.length > 0) {
    sections.push('Invalid format:\n' + groupedErrors.invalid.join('\n'));
  }

  if (groupedErrors.other.length > 0) {
    sections.push('Other errors:\n' + groupedErrors.other.join('\n'));
  }

  return sections.join('\n\n');
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
      // eslint-disable-next-line no-console
      console.error('\n❌ Invalid environment configuration:\n');
      // eslint-disable-next-line no-console
      console.error(formatZodError(error));
      // eslint-disable-next-line no-console
      console.error('\n💡 Tip: Check .env.example for valid configuration examples\n');
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
