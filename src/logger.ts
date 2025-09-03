/**
 * Production-ready logger configuration using Pino.
 * This file is part of the template infrastructure and can be kept and customized.
 *
 * Supports MCP (Model Context Protocol) mode for stdio-based communication.
 */

import pino, { type Logger as PinoLogger, type LoggerOptions, type DestinationStream } from 'pino';

/**
 * Get environment configuration safely
 * This avoids circular dependency with config module
 */
const getEnvConfig = () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_OUTPUT: process.env.LOG_OUTPUT,
  MCP_MODE:
    process.env.MCP_MODE === 'true' ||
    process.env.MCP_MODE === '1' ||
    process.env.MCP_MODE === 'yes',
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

/**
 * Determine the effective logging output destination
 */
const getEffectiveLogOutput = (): string => {
  const envConfig = getEnvConfig();
  // Explicit LOG_OUTPUT takes precedence
  if (envConfig.LOG_OUTPUT) {
    return envConfig.LOG_OUTPUT;
  }

  // MCP mode auto-detection
  if (envConfig.MCP_MODE) {
    return 'stderr';
  }

  // Default to stdout
  return 'stdout';
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

  return {
    target: 'pino/file',
    options: {
      destination: getEnvConfig().LOG_FILE_PATH || './logs/app.log',
      mkdir: true,
      ...(maxSize && {
        // For rotation, we'll use pino-roll transport if size limits are specified
        target: 'pino-roll',
        options: {
          file: getEnvConfig().LOG_FILE_PATH || './logs/app.log',
          size: getEnvConfig().LOG_FILE_MAX_SIZE || '10M',
          ...(getEnvConfig().LOG_FILE_MAX_FILES && {
            limit: { count: getEnvConfig().LOG_FILE_MAX_FILES },
          }),
        },
      }),
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
 * Logger configuration based on environment and output mode
 */
const getLoggerConfig = (outputMode?: string): LoggerOptions => {
  const isProduction = getEnvConfig().NODE_ENV === 'production';
  const isDevelopment = getEnvConfig().NODE_ENV === 'development';
  const isTest = getEnvConfig().NODE_ENV === 'test';
  const logLevel = getEnvConfig().LOG_LEVEL || (isProduction ? 'info' : 'debug');
  const effectiveOutput = outputMode || getEffectiveLogOutput();

  // Base configuration
  const baseConfig: LoggerOptions = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields by default
    redact: {
      paths: [
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
      ],
      remove: true,
    },
  };

  // Production mixin for correlation IDs
  const productionConfig: LoggerOptions = {
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
  };

  // Test configuration - minimize output
  if (isTest) {
    return {
      ...baseConfig,
      level: process.env.LOG_LEVEL || 'silent',
    };
  }

  // Handle null output (disable logging)
  if (effectiveOutput === 'null') {
    return {
      ...baseConfig,
      level: 'silent',
    };
  }

  // Handle file output
  if (effectiveOutput === 'file') {
    const transportConfig = getFileTransportConfig();
    return {
      ...(isProduction ? productionConfig : baseConfig),
      transport: transportConfig,
    };
  }

  // Handle syslog output
  if (effectiveOutput === 'syslog') {
    const transportConfig = getSyslogTransportConfig();
    return {
      ...(isProduction ? productionConfig : baseConfig),
      transport: transportConfig,
    };
  }

  // Handle stderr output - no pretty printing to avoid escape sequences
  if (effectiveOutput === 'stderr') {
    return isProduction ? productionConfig : baseConfig;
  }

  // Default stdout output
  // Development gets pretty printing, production gets structured JSON
  if (isDevelopment && !isTest) {
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

  return isProduction ? productionConfig : baseConfig;
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
 * Enable MCP mode programmatically at runtime
 * Redirects all subsequent logs to stderr to keep stdout clean for protocol messages
 */
export const enableMCPMode = (): void => {
  if (currentOutputMode === 'stderr') {
    logger.debug('MCP mode already enabled');
    return;
  }

  // Create new logger instance with stderr output
  currentOutputMode = 'stderr';
  const newLogger = createLogger('stderr');

  // Replace the exported logger's methods with the new instance
  Object.setPrototypeOf(logger, Object.getPrototypeOf(newLogger) as object);
  Object.keys(newLogger).forEach((key) => {
    // Use type assertion to handle dynamic property assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    (logger as any)[key] = (newLogger as any)[key];
  });

  logger.info(
    { previousMode: currentOutputMode, newMode: 'stderr' },
    'MCP mode enabled - logs redirected to stderr',
  );
};

/**
 * Disable MCP mode and restore default logging behavior
 */
export const disableMCPMode = (): void => {
  if (currentOutputMode !== 'stderr' || getEnvConfig().MCP_MODE) {
    logger.debug('MCP mode not enabled or set via environment');
    return;
  }

  // Restore original logging mode
  currentOutputMode = 'stdout';
  const newLogger = createLogger('stdout');

  // Replace the exported logger's methods with the new instance
  Object.setPrototypeOf(logger, Object.getPrototypeOf(newLogger) as object);
  Object.keys(newLogger).forEach((key) => {
    // Use type assertion to handle dynamic property assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    (logger as any)[key] = (newLogger as any)[key];
  });

  logger.info('MCP mode disabled - logs restored to stdout');
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
  const isMCPMode = getEnvConfig().MCP_MODE || effectiveOutput === 'stderr';

  logger.info(
    {
      node_env: getEnvConfig().NODE_ENV,
      log_level: logger.level,
      pid: process.pid,
      log_output: effectiveOutput,
      mcp_mode: isMCPMode,
    },
    isMCPMode
      ? 'Logger initialized in MCP mode - stdout reserved for protocol'
      : 'Logger initialized',
  );
}
