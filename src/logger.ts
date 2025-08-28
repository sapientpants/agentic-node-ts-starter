import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';

/**
 * Logger configuration based on environment
 */
const getLoggerConfig = (): LoggerOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  // Base configuration
  const config: LoggerOptions = {
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

  // Development configuration - human-readable output
  if (isDevelopment && !isTest) {
    return {
      ...config,
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

  // Test configuration - minimize output
  if (isTest) {
    return {
      ...config,
      level: process.env.LOG_LEVEL || 'silent',
    };
  }

  // Production configuration - structured JSON
  return {
    ...config,
    // Add correlation ID support for production
    mixin() {
      return {
        // This would typically come from request context
        // Leaving as placeholder for OpenTelemetry integration
        correlationId: process.env.CORRELATION_ID,
      };
    },
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  };
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
const createLogger = (): Logger => {
  const baseLogger = pino(getLoggerConfig());
  return wrapLoggerWithContext(baseLogger);
};

/**
 * Default logger instance
 * Use this throughout the application for consistent logging
 */
export const logger = createLogger();

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
 * OpenTelemetry integration helper (placeholder)
 * This function demonstrates how to integrate with OpenTelemetry when needed
 */
export const withTraceContext = (log: Logger, traceId?: string, spanId?: string): Logger => {
  if (!traceId) return log;

  return log.withContext({
    trace_id: traceId,
    span_id: spanId,
    // OpenTelemetry trace flags could go here
  });
};

// Export Pino types for use in application
export type { LoggerOptions, LogContext as LoggerContext };

// Log startup information
if (process.env.NODE_ENV !== 'test') {
  logger.info(
    {
      node_env: process.env.NODE_ENV,
      log_level: logger.level,
      pid: process.pid,
    },
    'Logger initialized',
  );
}
