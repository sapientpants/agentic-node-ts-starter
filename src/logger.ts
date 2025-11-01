/**
 * Production-ready logger configuration using Pino.
 * This file is part of the template infrastructure and can be kept and customized.
 *
 * Supports multiple output destinations for flexible logging configuration.
 */

import pino, { type Logger as PinoLogger, type LoggerOptions, type DestinationStream } from 'pino';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import {
  validateLogPath,
  validateSyslogHost,
  validateSyslogPort,
  validateFileMode,
} from './logger-validation.js';

/**
 * Constants for logger configuration
 */
const DEFAULT_LOG_FILE_PATH = './logs/app.log';
const FALLBACK_TO_STDOUT_MESSAGE = 'Falling back to stdout';

/**
 * Fallback logger for initialization errors
 * Used when the main logger configuration fails
 */
const fallbackLogger = pino({
  level: 'warn',
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Get environment configuration safely
 * This avoids circular dependency with config module
 */
const getEnvConfig = () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_OUTPUT: process.env.LOG_OUTPUT,
  LOG_FILE_PATH: process.env.LOG_FILE_PATH,
  LOG_FILE_MAX_SIZE: process.env.LOG_FILE_MAX_SIZE,
  LOG_FILE_MAX_FILES: process.env.LOG_FILE_MAX_FILES
    ? parseInt(process.env.LOG_FILE_MAX_FILES, 10)
    : undefined,
  LOG_SYSLOG_HOST: process.env.LOG_SYSLOG_HOST,
  LOG_SYSLOG_PORT: process.env.LOG_SYSLOG_PORT
    ? parseInt(process.env.LOG_SYSLOG_PORT, 10)
    : undefined,
  LOG_SYSLOG_PROTOCOL: process.env.LOG_SYSLOG_PROTOCOL as 'udp' | 'tcp' | undefined,
  APP_NAME: process.env.APP_NAME || 'agentic-node-ts-starter',
});

/**
 * Runtime state for dynamic logger configuration
 */
let currentLoggerInstance: Logger | null = null;
let currentOutputMode: string | null = null;
let currentFileStream: DestinationStream | null = null;

/**
 * Determine the effective logging output destination
 */
const getEffectiveLogOutput = (): string => {
  const envConfig = getEnvConfig();
  // Use configured output or default to stdout
  return envConfig.LOG_OUTPUT || 'stdout';
};

/**
 * Parse size string (e.g., "10M", "1G") to bytes
 */
const parseSizeToBytes = (size: string | undefined): number | undefined => {
  if (!size) return undefined;

  const match = size.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)B?$/i);
  if (!match || !match[1]) return undefined;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || '';

  const multipliers: Record<string, number> = {
    '': 1,
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
    T: 1024 * 1024 * 1024 * 1024,
  };

  return Math.floor(value * (multipliers[unit] || 1));
};

/**
 * Get file transport configuration
 */
const getFileTransportConfig = () => {
  const maxSize = parseSizeToBytes(getEnvConfig().LOG_FILE_MAX_SIZE);

  if (maxSize) {
    // For rotation, use pino-roll transport if size limits are specified
    return {
      target: 'pino-roll',
      options: {
        file: getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH,
        size: getEnvConfig().LOG_FILE_MAX_SIZE || '10M',
        ...(getEnvConfig().LOG_FILE_MAX_FILES && {
          limit: { count: getEnvConfig().LOG_FILE_MAX_FILES },
        }),
      },
    };
  }

  // Default to pino/file transport without rotation
  return {
    target: 'pino/file',
    options: {
      destination: getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH,
      mkdir: true,
    },
  };
};

/**
 * Get syslog transport configuration
 */
const getSyslogTransportConfig = () => {
  return {
    target: 'pino-syslog',
    options: {
      host: getEnvConfig().LOG_SYSLOG_HOST || 'localhost',
      port: getEnvConfig().LOG_SYSLOG_PORT || 514,
      protocol: getEnvConfig().LOG_SYSLOG_PROTOCOL || 'udp',
      app: getEnvConfig().APP_NAME,
    },
  };
};

/**
 * Redacted field paths for sensitive data
 */
const REDACTED_PATHS = [
  'password',
  'token',
  'secret',
  'authorization',
  'api_key',
  'apiKey',
  '*.password',
  '*.token',
  '*.secret',
  '*.authorization',
  '*.api_key',
  '*.apiKey',
];

/**
 * Create base logger configuration
 */
const createBaseConfig = (logLevel: string): LoggerOptions => ({
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: REDACTED_PATHS,
    remove: true,
  },
});

/**
 * Create production-specific logger configuration
 */
const createProductionConfig = (baseConfig: LoggerOptions): LoggerOptions => ({
  ...baseConfig,
  mixin() {
    return {
      correlationId: process.env.CORRELATION_ID,
    };
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

/**
 * Create test environment configuration
 */
const createTestConfig = (baseConfig: LoggerOptions): LoggerOptions => ({
  ...baseConfig,
  level: process.env.LOG_LEVEL || 'silent',
});

/**
 * Create null output configuration (disabled logging)
 */
const createNullConfig = (baseConfig: LoggerOptions): LoggerOptions => ({
  ...baseConfig,
  level: 'silent',
});

/**
 * Create file output configuration with validation
 */
const createFileConfig = (
  baseConfig: LoggerOptions,
  productionConfig: LoggerOptions,
  isProduction: boolean,
): LoggerOptions => {
  const logPath = getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH;

  try {
    validateLogPath(logPath);
  } catch (error) {
    logValidationError('log file path', error);
    return isProduction ? productionConfig : baseConfig;
  }

  if (!ensureLogDirectory(logPath)) {
    return isProduction ? productionConfig : baseConfig;
  }

  const transportConfig = getFileTransportConfig();
  return {
    ...(isProduction ? productionConfig : baseConfig),
    transport: transportConfig,
  };
};

/**
 * Create syslog output configuration with validation
 */
const createSyslogConfig = (
  baseConfig: LoggerOptions,
  productionConfig: LoggerOptions,
  isProduction: boolean,
): LoggerOptions => {
  const syslogHost = getEnvConfig().LOG_SYSLOG_HOST || 'localhost';
  const syslogPort = getEnvConfig().LOG_SYSLOG_PORT;

  try {
    validateSyslogHost(syslogHost);
    validateSyslogPort(syslogPort);
  } catch (error) {
    logValidationError('syslog configuration', error);
    return isProduction ? productionConfig : baseConfig;
  }

  const transportConfig = getSyslogTransportConfig();
  const syslogBaseConfig = {
    ...baseConfig,
    timestamp: pino.stdTimeFunctions.epochTime,
  };
  const syslogProductionConfig = {
    ...productionConfig,
    timestamp: pino.stdTimeFunctions.epochTime,
  };

  return {
    ...(isProduction ? syslogProductionConfig : syslogBaseConfig),
    transport: transportConfig,
  };
};

/**
 * Environment flags for configuration
 */
interface EnvFlags {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Create stdout output configuration
 */
const createStdoutConfig = (
  baseConfig: LoggerOptions,
  productionConfig: LoggerOptions,
  env: EnvFlags,
): LoggerOptions => {
  if (env.isDevelopment && !env.isTest) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss.l',
          singleLine: false,
        },
      },
    };
  }

  return env.isProduction ? productionConfig : baseConfig;
};

/**
 * Log validation error and fallback message
 */
const logValidationError = (context: string, error: unknown): void => {
  fallbackLogger.error(
    { context, error: error instanceof Error ? error.message : String(error) },
    `Invalid ${context}`,
  );
  fallbackLogger.error(FALLBACK_TO_STDOUT_MESSAGE);
};

/**
 * Ensure log directory exists with proper permissions
 */
const ensureLogDirectory = (logPath: string): boolean => {
  validateFileMode(process.env.LOG_FILE_PERMISSIONS);
  try {
    mkdirSync(dirname(logPath), { recursive: true, mode: 0o750 });
    return true;
  } catch (error) {
    fallbackLogger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to create log directory',
    );
    fallbackLogger.error(FALLBACK_TO_STDOUT_MESSAGE);
    return false;
  }
};

/**
 * Logger configuration based on environment and output mode
 */
const getLoggerConfig = (outputMode?: string): LoggerOptions => {
  const { NODE_ENV, LOG_LEVEL } = getEnvConfig();
  const env: EnvFlags = {
    isProduction: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isTest: NODE_ENV === 'test',
  };
  const logLevel = LOG_LEVEL || (env.isProduction ? 'info' : 'debug');
  const effectiveOutput = outputMode || getEffectiveLogOutput();
  const baseConfig = createBaseConfig(logLevel);
  const productionConfig = createProductionConfig(baseConfig);

  if (env.isTest) return createTestConfig(baseConfig);
  if (effectiveOutput === 'null') return createNullConfig(baseConfig);
  if (effectiveOutput === 'file') {
    return createFileConfig(baseConfig, productionConfig, env.isProduction);
  }
  if (effectiveOutput === 'syslog') {
    return createSyslogConfig(baseConfig, productionConfig, env.isProduction);
  }
  if (effectiveOutput === 'stderr') {
    return env.isProduction ? productionConfig : baseConfig;
  }
  return createStdoutConfig(baseConfig, productionConfig, env);
};

/**
 * Get the appropriate destination stream based on output mode
 */
const getDestination = (outputMode?: string): DestinationStream | undefined => {
  const effectiveOutput = outputMode || getEffectiveLogOutput();

  // stderr output uses file descriptor 2
  if (effectiveOutput === 'stderr') {
    return pino.destination(2);
  }

  // stdout is the default, let pino handle it
  // File and syslog are handled via transports
  return undefined;
};

/**
 * Custom logger type with context support
 */
export type LogContext = Record<string, unknown>;

export interface Logger extends PinoLogger {
  withContext: (context: LogContext) => Logger;
}

/**
 * Wrap a Pino logger with the withContext method
 */
const wrapLoggerWithContext = (baseLogger: PinoLogger): Logger => {
  const logger = baseLogger as Logger;
  logger.withContext = function (context: LogContext): Logger {
    // Recursively wrap the child logger to ensure it also has withContext
    return wrapLoggerWithContext(baseLogger.child(context));
  };
  return logger;
};

/**
 * Create a logger instance with the provided configuration
 */
const createLogger = (outputMode?: string): Logger => {
  const config = getLoggerConfig(outputMode);
  const destination = getDestination(outputMode);

  const baseLogger = destination ? pino(config, destination) : pino(config);

  return wrapLoggerWithContext(baseLogger);
};

/**
 * Default logger instance
 * Use this throughout the application for consistent logging
 */
export const logger = (() => {
  const effectiveOutput = getEffectiveLogOutput();
  currentOutputMode = effectiveOutput;
  currentLoggerInstance = createLogger();
  return currentLoggerInstance;
})();

/**
 * Cleanup resources when switching output modes
 * @param previousMode - The previous output mode
 */
const cleanupPreviousOutput = (previousMode: string | null): void => {
  if (previousMode === 'file' && currentFileStream) {
    try {
      // Attempt to close the file stream
      const stream = currentFileStream as unknown as { end?: () => void };
      if (typeof stream.end === 'function') {
        stream.end();
      }
      currentFileStream = null;
    } catch (error) {
      fallbackLogger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to cleanup file stream',
      );
    }
  }
  // Additional cleanup for other transports could be added here
};

/**
 * Switch logger output to a different destination at runtime
 * @param outputMode - The destination to switch to (stdout, stderr, file, syslog, null)
 *
 * Note: This implementation mutates the exported logger instance to maintain
 * backward compatibility with existing code that imports the logger directly.
 * While this approach is more complex than a factory pattern, it ensures that
 * all existing logger references throughout the application automatically use
 * the new output destination without requiring code changes.
 */
export const switchLogOutput = (outputMode: string): void => {
  if (currentOutputMode === outputMode) {
    logger.debug(`Logger already using ${outputMode} output`);
    return;
  }

  const previousMode = currentOutputMode;

  // Cleanup resources from previous mode
  cleanupPreviousOutput(previousMode);

  currentOutputMode = outputMode;
  const newLogger = createLogger(outputMode);

  // Replace the exported logger's methods with the new instance
  // This approach maintains the same logger reference for all imports
  Object.setPrototypeOf(logger, Object.getPrototypeOf(newLogger) as object);
  Object.keys(newLogger).forEach((key) => {
    // Use Record type for dynamic property assignment
    const loggerRecord = logger as unknown as Record<string, unknown>;
    const newLoggerRecord = newLogger as unknown as Record<string, unknown>;
    loggerRecord[key] = newLoggerRecord[key];
  });

  logger.info({ previousMode, newMode: outputMode }, `Logger output switched to ${outputMode}`);
};

/**
 * Get current logger output mode
 */
export const getLoggerOutputMode = (): string => {
  return currentOutputMode || getEffectiveLogOutput();
};

/**
 * Create a child logger with specific context
 * Useful for module-specific logging
 * @param name - The name/module for the logger context
 * @param context - Additional context to include
 */
export const createChildLogger = (name: string, context: LogContext = {}): Logger => {
  return logger.withContext({ module: name, ...context });
};

/**
 * OpenTelemetry integration helper
 *
 * This function provides a bridge for future OpenTelemetry integration.
 * Once OpenTelemetry is implemented, this will automatically extract
 * trace context from the active span.
 *
 * Future usage:
 * ```typescript
 * import { trace } from '@opentelemetry/api';
 * const span = trace.getActiveSpan();
 * const spanContext = span?.spanContext();
 * const tracedLogger = withTraceContext(logger, spanContext?.traceId, spanContext?.spanId);
 * ```
 *
 * @param log - The logger instance to enhance with trace context
 * @param traceId - The trace ID from OpenTelemetry context
 * @param spanId - The span ID from OpenTelemetry context
 * @returns Logger instance with trace context attached
 */
export const withTraceContext = (log: Logger, traceId?: string, spanId?: string): Logger => {
  if (!traceId) return log;

  return log.withContext({
    trace_id: traceId,
    span_id: spanId,
    // Future OpenTelemetry fields:
    // - trace_flags: span?.spanContext().traceFlags
    // - trace_state: span?.spanContext().traceState?.serialize()
    // - baggage: propagation.getBaggage(context.active())
  });
};

// Export Pino types for use in application
export type { LoggerOptions, LogContext as LoggerContext };

// Log startup information
if (getEnvConfig().NODE_ENV !== 'test') {
  const effectiveOutput = getEffectiveLogOutput();

  logger.info(
    {
      node_env: getEnvConfig().NODE_ENV,
      log_level: logger.level,
      pid: process.pid,
      log_output: effectiveOutput,
    },
    'Logger initialized',
  );
}
