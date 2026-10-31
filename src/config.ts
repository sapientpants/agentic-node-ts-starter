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
 * This module has no runtime dependencies on the rest of the application: it
 * only parses and validates. Logging the loaded configuration is the job of the
 * entry point (see `src/index.ts`).
 *
 * To extend with your own variables:
 * 1. Add new fields to EnvSchema below
 * 2. TypeScript will automatically provide types
 * 3. Add corresponding entries to .env.example
 * ============================================================================
 */

import { z } from 'zod';

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
 * Raw environment schema
 * Add your application-specific environment variables here
 */
const EnvSchema = z.object({
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

  // Logging configuration (defaults to info in production, silent in test, debug otherwise)
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
    .default('stdout')
    .describe('Logger output destination (stdout, stderr, file, syslog, null)'),

  // File logging configuration (when LOG_OUTPUT=file)
  LOG_FILE_PATH: z.string().optional().describe('Path to log file when using file output'),

  LOG_FILE_MAX_SIZE: z
    .string()
    .optional()
    .describe('Maximum size of log file before rotation (e.g., 10M, 100MB, 1.5G)'),

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

type Env = z.infer<typeof EnvSchema>;

/**
 * Resolve the LOG_LEVEL default from the environment
 * @param {Env['NODE_ENV']} nodeEnv - The validated NODE_ENV value
 * @returns {NonNullable<Env['LOG_LEVEL']>} The default log level for that environment
 */
function defaultLogLevel(nodeEnv: Env['NODE_ENV']): NonNullable<Env['LOG_LEVEL']> {
  if (nodeEnv === 'production') return 'info';
  return nodeEnv === 'test' ? 'silent' : 'debug';
}

/**
 * Environment configuration schema: the raw schema plus defaults that depend
 * on other variables
 */
const ConfigSchema = EnvSchema.transform((env) => ({
  ...env,
  LOG_LEVEL: env.LOG_LEVEL ?? defaultLogLevel(env.NODE_ENV),
}));

/**
 * Inferred TypeScript type from the schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * List of sensitive keys whose values must never appear in error messages
 */
const SENSITIVE_KEYS = ['PASSWORD', 'TOKEN', 'SECRET', 'KEY'];

/**
 * Convert a received value to a string for display in error messages.
 * Environment variables are always strings; other types are only reachable
 * when the schema is used programmatically.
 * @param {unknown} value - The value to convert to a string
 * @returns {string} String representation of the value
 */
function valueToString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}

/**
 * Whether a variable name indicates a secret whose value must never be shown
 * @param {string} key - The environment variable name
 * @returns {boolean} true if the name contains one of the sensitive markers
 */
function isSensitiveKey(key: string): boolean {
  const keyUpper = key.toUpperCase();
  return SENSITIVE_KEYS.some((sensitive) => keyUpper.includes(sensitive));
}

/**
 * Convert a received value to a display string, fully redacting it when the
 * variable name indicates a secret.
 * @param {string} key - The environment variable name
 * @param {unknown} value - The received value
 * @returns {string} Display string, '***' for sensitive values
 */
function maskSensitiveValue(key: string, value: unknown): string {
  if (value === undefined || value === null) {
    return valueToString(value);
  }

  return isSensitiveKey(key) ? '***' : valueToString(value);
}

/**
 * Copy a Zod error with the raw input of every sensitive variable replaced by '***'.
 * Issues carry the offending value because loadConfig parses with `reportInput`,
 * and Node prints an uncaught error's `cause` (issues included) when the config
 * singleton throws at import, so the cause must be as safe to print as the message.
 * @param {z.ZodError} error - The original validation error
 * @returns {z.ZodError} An equivalent error that no longer holds secret values
 */
function redactSensitiveInputs(error: z.ZodError): z.ZodError {
  return new z.ZodError(error.issues.map(redactIssueInput));
}

/**
 * Replace the raw input of a single issue by '***' when its variable is sensitive
 * @param {z.core.$ZodIssue} issue - The validation issue
 * @returns {z.core.$ZodIssue} The issue, redacted if needed
 */
function redactIssueInput(issue: z.core.$ZodIssue): z.core.$ZodIssue {
  if (!('input' in issue) || !isSensitiveKey(issue.path.join('.'))) {
    return issue;
  }
  // Some issue variants type `input` narrowly (e.g. a number for not_multiple_of);
  // the placeholder deliberately replaces the value whatever its type was.
  return { ...issue, input: '***' } as z.core.$ZodIssue;
}

/**
 * Format received value for error messages
 * @param {string} value - The received value string to format
 * @returns {string} Formatted string for display in error messages
 */
function formatReceivedValue(value: string): string {
  return value === 'undefined' ? '' : ` (received: "${value}")`;
}

/**
 * Build error sections from grouped errors
 * @param {Record<string, string[]>} groupedErrors - Record mapping error category keys to arrays of error messages
 * @returns {string[]} Array of formatted error section strings
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
 * @param {z.ZodError} error - The Zod validation error to format
 * @returns {string} Formatted error message string
 */
function formatZodError(error: z.ZodError): string {
  if (!error.issues.length) {
    return 'Invalid configuration';
  }

  const groupedErrors = { missing: [] as string[], invalid: [] as string[], other: [] as string[] };

  for (const err of error.issues) {
    const path = err.path.join('.');
    // `input` is only present on issues when parsing with `reportInput: true` (see loadConfig).
    // Check for the property explicitly so a wrong-type value parsed without reportInput
    // is not misreported as a missing variable.
    const receivedValue = formatReceivedValue(maskSensitiveValue(path, err.input));

    if (err.code === 'invalid_type' && 'input' in err && err.input === undefined) {
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
 * Thrown by {@link loadConfig} when the environment fails validation.
 * The message lists every offending variable (secrets masked) and is safe to
 * print; so is the `cause`, a {@link z.ZodError} whose sensitive inputs are redacted.
 */
export class ConfigError extends Error {
  constructor(zodError: z.ZodError) {
    super(
      [
        '❌ Invalid environment configuration:',
        formatZodError(zodError),
        '💡 Tip: Check .env.example for valid configuration examples',
      ].join('\n\n'),
      { cause: redactSensitiveInputs(zodError) },
    );
    this.name = 'ConfigError';
  }
}

/**
 * Load and validate environment configuration.
 *
 * Pure: it only reads the given environment and has no side effects, so it can
 * be called with a plain object in tests instead of mutating `process.env`.
 * @param {NodeJS.ProcessEnv} env - The environment to validate (defaults to `process.env`)
 * @returns {Config} Validated configuration object
 * @throws {ConfigError} If the environment is invalid
 * @example
 * ```typescript
 * const config = loadConfig({ NODE_ENV: 'production', LOG_OUTPUT: 'stderr' });
 * ```
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // reportInput makes Zod attach the offending value to each issue so
  // formatZodError can show it (masked for secrets)
  const result = ConfigSchema.safeParse(env, { reportInput: true });
  if (!result.success) {
    throw new ConfigError(result.error);
  }
  return result.data;
}

/**
 * Singleton configuration instance, validated from `process.env` on first import.
 * Importing this module with an invalid environment throws a {@link ConfigError},
 * so the application fails to start with a clear message.
 */
export const config: Config = loadConfig();

/**
 * Type-safe configuration getter
 *
 * Template API: the template itself reads `config` directly, so this has no
 * production caller here. It is kept as a documented helper for applications
 * built on the template (see docs/CONFIG.md).
 * @public
 * @param {K} key - Configuration key to retrieve
 * @returns {Config[K]} The configuration value for the specified key
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
 *
 * Template API: kept as a documented helper for applications built on the
 * template (see docs/CONFIG.md); the template itself has no caller.
 * @public
 * @param {K} key - Configuration key to check
 * @returns {boolean} true if the configuration value is defined
 * @example
 * ```typescript
 * if (hasConfig('DATABASE_URL')) {
 *   connectToDatabase(config.DATABASE_URL);
 * }
 * ```
 */
export function hasConfig<K extends keyof Config>(key: K): boolean {
  // eslint-disable-next-line security/detect-object-injection -- key is type-safe
  return config[key] !== undefined;
}
