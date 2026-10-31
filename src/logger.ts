/**
 * Production-ready logger configuration using Pino.
 * This file is part of the template infrastructure and can be kept and customized.
 *
 * Supports multiple output destinations for flexible logging configuration.
 */

import pino, { type Logger as PinoLogger, type LoggerOptions, type DestinationStream } from 'pino';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  validateLogPath,
  validateSyslogHost,
  validateSyslogPort,
  validateFileMode,
  parseSizeToBytes,
  toPinoRollSize,
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
 * @returns {Record<string, string | number | undefined>} Environment configuration object
 */
const getEnvConfig = () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_OUTPUT: process.env.LOG_OUTPUT,
  LOG_FILE_PATH: process.env.LOG_FILE_PATH,
  LOG_FILE_MAX_SIZE: process.env.LOG_FILE_MAX_SIZE,
  LOG_FILE_MAX_FILES: process.env.LOG_FILE_MAX_FILES
    ? Number.parseInt(process.env.LOG_FILE_MAX_FILES, 10)
    : undefined,
  LOG_SYSLOG_HOST: process.env.LOG_SYSLOG_HOST,
  LOG_SYSLOG_PORT: process.env.LOG_SYSLOG_PORT
    ? Number.parseInt(process.env.LOG_SYSLOG_PORT, 10)
    : undefined,
  LOG_SYSLOG_PROTOCOL: process.env.LOG_SYSLOG_PROTOCOL as 'udp' | 'tcp' | undefined,
  APP_NAME: process.env.APP_NAME || 'agentic-node-ts-starter',
});

/**
 * Supported log output modes
 */
const OUTPUT_MODES = ['stdout', 'stderr', 'file', 'syslog', 'null'] as const;
type LogOutputMode = (typeof OUTPUT_MODES)[number];

const isOutputMode = (mode: string): mode is LogOutputMode =>
  (OUTPUT_MODES as readonly string[]).includes(mode);

/**
 * Determine the configured logging output destination
 * @returns {string} The log output mode requested via LOG_OUTPUT (defaults to stdout)
 */
const getConfiguredLogOutput = (): string => getEnvConfig().LOG_OUTPUT || 'stdout';

/**
 * Format an unknown error for log output
 * @param {unknown} error - The error to describe
 * @returns {string} The error message
 */
const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Resolve the validated log file mode from LOG_FILE_PERMISSIONS
 * @returns {number} The numeric file mode to apply to log files
 */
const getLogFileMode = (): number => validateFileMode(process.env.LOG_FILE_PERMISSIONS);

/**
 * Derive a directory mode from a file mode: every class that can read the
 * file also needs execute (search) permission on the directory.
 * @param {number} fileMode - The numeric log file mode
 * @returns {number} The numeric log directory mode
 */
const toDirectoryMode = (fileMode: number): number => {
  const OWNER_READ = 0o400;
  const GROUP_READ = 0o040;
  const OTHER_READ = 0o004;
  const OWNER_EXEC = 0o100;
  const GROUP_EXEC = 0o010;
  const OTHER_EXEC = 0o001;
  let dirMode = fileMode | OWNER_EXEC;
  if ((fileMode & OWNER_READ) === 0) dirMode |= OWNER_READ;
  if ((fileMode & GROUP_READ) !== 0) dirMode |= GROUP_EXEC;
  if ((fileMode & OTHER_READ) !== 0) dirMode |= OTHER_EXEC;
  return dirMode;
};

/**
 * Get file transport configuration
 * @param {number} fileMode - The validated numeric file mode for log files
 * @returns {{ target: string, options: object }} File transport configuration object
 */
const getFileTransportConfig = (fileMode: number) => {
  const rawMaxSize = getEnvConfig().LOG_FILE_MAX_SIZE;
  const maxSize = parseSizeToBytes(rawMaxSize);

  if (rawMaxSize !== undefined && rawMaxSize !== '' && maxSize === undefined) {
    process.stderr.write(
      `Invalid LOG_FILE_MAX_SIZE "${rawMaxSize}" (expected e.g. 10M, 100KB, 1.5G), disabling log rotation\n`,
    );
  }

  if (maxSize !== undefined) {
    // For rotation, use pino-roll transport if size limits are specified.
    // pino-roll only understands single-letter units, so pass the normalized byte count.
    const maxFiles = getEnvConfig().LOG_FILE_MAX_FILES;
    return {
      target: 'pino-roll',
      options: {
        file: getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH,
        size: toPinoRollSize(maxSize),
        mode: fileMode,
        ...(maxFiles !== undefined ? { limit: { count: maxFiles } } : {}),
      },
    };
  }

  // Default to pino/file transport without rotation
  return {
    target: 'pino/file',
    options: {
      destination: getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH,
      mkdir: true,
      mode: fileMode,
    },
  };
};

/**
 * Get syslog transport configuration
 * @returns {{ target: string, options: object }} Syslog transport configuration object
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
 * Environment flags for configuration
 */
interface EnvFlags {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Read the environment flags from NODE_ENV
 * @returns {EnvFlags} Environment flags object
 */
const getEnvFlags = (): EnvFlags => {
  const { NODE_ENV } = getEnvConfig();
  return {
    isProduction: NODE_ENV === 'production',
    isDevelopment: NODE_ENV === 'development',
    isTest: NODE_ENV === 'test',
  };
};

/**
 * Configuration for a pino transport worker
 */
interface TransportConfig {
  target: string;
  options: Record<string, unknown>;
}

/**
 * A stream that pino can write to and optionally flush
 */
interface OutputStream extends DestinationStream {
  flush?: (callback: (error?: Error | null) => void) => void;
}

/**
 * An open log destination together with the hook that releases its resources
 */
interface LogOutput {
  mode: LogOutputMode;
  stream: OutputStream;
  close: () => void;
}

/**
 * The destination all log lines are currently written to.
 * Assigned once at startup (see below) and replaced by {@link switchLogOutput}.
 */
let activeOutput: LogOutput;

/**
 * The stream handed to the root pino instance. It forwards every line to the
 * active output, so the root logger and all of its children (whenever they were
 * created) follow a runtime switch without being re-created.
 */
const delegatingStream: OutputStream = {
  write: (chunk: string): void => {
    activeOutput.stream.write(chunk);
  },
  flush: (callback): void => {
    const { stream } = activeOutput;
    if (typeof stream.flush === 'function') {
      stream.flush(callback);
    } else {
      callback();
    }
  },
};

/**
 * Timestamp function that matches the active output: pino-syslog needs epoch
 * milliseconds, every other destination gets ISO strings.
 * @returns {string} The pino timestamp fragment
 */
const timestamp = (): string =>
  activeOutput.mode === 'syslog'
    ? pino.stdTimeFunctions.epochTime()
    : pino.stdTimeFunctions.isoTime();

/**
 * Create base logger configuration
 * @param {string} logLevel - The logging level
 * @returns {LoggerOptions} Base logger configuration object
 */
const createBaseConfig = (logLevel: string): LoggerOptions => ({
  level: logLevel,
  timestamp,
  redact: {
    paths: REDACTED_PATHS,
    remove: true,
  },
});

/**
 * Create production-specific logger configuration
 * @param {LoggerOptions} baseConfig - The base configuration to extend
 * @returns {LoggerOptions} Production logger configuration object
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
 * @param {LoggerOptions} baseConfig - The base configuration to extend
 * @returns {LoggerOptions} Test logger configuration object
 */
const createTestConfig = (baseConfig: LoggerOptions): LoggerOptions => ({
  ...baseConfig,
  level: process.env.LOG_LEVEL || 'silent',
});

/**
 * Logger configuration based on environment. Output destinations are not part
 * of the configuration; they are managed through {@link LogOutput}.
 * @param {EnvFlags} env - Environment flags object
 * @returns {LoggerOptions} Logger configuration object
 */
const getLoggerConfig = (env: EnvFlags): LoggerOptions => {
  const { LOG_LEVEL } = getEnvConfig();
  const logLevel = LOG_LEVEL || (env.isProduction ? 'info' : 'debug');
  const baseConfig = createBaseConfig(logLevel);

  if (env.isTest) return createTestConfig(baseConfig);
  return env.isProduction ? createProductionConfig(baseConfig) : baseConfig;
};

/**
 * Collect the directories on the way to `dir` that do not exist yet, ordered
 * from the outermost missing ancestor down to `dir` itself.
 * @param {string} dir - The directory whose missing ancestors to collect
 * @returns {string[]} Directories that `mkdirSync(dir, { recursive: true })` would create
 */
const collectMissingDirectories = (dir: string): string[] => {
  const missing: string[] = [];
  let current = dir;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dir derived from validated log path
  while (!existsSync(current)) {
    missing.unshift(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return missing;
};

/**
 * Ensure log directory exists with permissions derived from the log file mode.
 * Existing directories keep their current mode so that externally managed
 * permissions are not silently overwritten.
 * @param {string} logPath - The log file path
 * @param {number} fileMode - The validated numeric log file mode
 * @throws {Error} If the directory cannot be created
 */
const ensureLogDirectory = (logPath: string, fileMode: number): void => {
  const logDir = dirname(logPath);
  const dirMode = toDirectoryMode(fileMode);
  try {
    const missingDirs = collectMissingDirectories(logDir);
    if (missingDirs.length > 0) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- logPath validated by validateLogPath
      mkdirSync(logDir, { recursive: true, mode: dirMode });
      // mkdir applies the process umask to every directory it creates (including
      // intermediate ones); chmod each of them so the configured mode holds exactly
      for (const dir of missingDirs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- dir derived from validated log path
        chmodSync(dir, dirMode);
      }
    }
  } catch (error) {
    throw new Error(`Failed to create log directory: ${describeError(error)}`, { cause: error });
  }
};

/**
 * Detect whether a process stream has been monkey-patched (e.g. by a test spy).
 * Mirrors pino's own check: patched streams are used directly so the patch sees
 * the output, pristine ones get a faster sonic-boom destination.
 * @param {NodeJS.WriteStream} stream - The process stream to inspect
 * @returns {boolean} True if `write` has been replaced on the instance
 */
const isTampered = (stream: NodeJS.WriteStream): boolean => {
  const prototype = Object.getPrototypeOf(stream) as { write?: unknown };
  return stream.write !== prototype.write;
};

/**
 * Open a process stream (stdout or stderr) as a log output.
 * Process streams are never closed when switching away from them.
 * @param {1 | 2} fd - The file descriptor to write to
 * @param {LogOutputMode} mode - The mode to report for this output
 * @returns {LogOutput} The opened output
 */
const openProcessStream = (fd: 1 | 2, mode: LogOutputMode): LogOutput => {
  const processStream = fd === 1 ? process.stdout : process.stderr;
  const stream: OutputStream = isTampered(processStream) ? processStream : pino.destination(fd);
  return { mode, stream, close: () => undefined };
};

/**
 * Open a pino transport (worker thread) as a log output.
 * Closing it ends the worker so switching away does not leak threads or file handles.
 * @param {LogOutputMode} mode - The mode to report for this output
 * @param {TransportConfig} transportConfig - The pino transport configuration
 * @returns {LogOutput} The opened output
 */
const openTransport = (mode: LogOutputMode, transportConfig: TransportConfig): LogOutput => {
  const stream = pino.transport(transportConfig);
  // A transport worker that fails (unreachable syslog host, read-only log file, a
  // close that times out) emits 'error'; without a listener Node would crash the
  // process over a logging problem.
  stream.on('error', (error: unknown) => {
    fallbackLogger.warn({ mode, error: describeError(error) }, 'Log transport error');
  });
  const close = (): void => {
    try {
      stream.end();
    } catch (error) {
      fallbackLogger.warn({ error: describeError(error) }, 'Failed to close log transport');
    }
  };
  return { mode, stream, close };
};

/**
 * Open the stdout output: pretty-printed in development, raw JSON otherwise
 * @param {EnvFlags} env - Environment flags object
 * @returns {LogOutput} The opened output
 */
const openStdoutOutput = (env: EnvFlags): LogOutput => {
  if (env.isDevelopment && !env.isTest) {
    return openTransport('stdout', {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss.l',
        singleLine: false,
      },
    });
  }
  return openProcessStream(1, 'stdout');
};

/**
 * Open the file output after validating the configured path
 * @returns {LogOutput} The opened output
 * @throws {Error} If the log path is invalid or its directory cannot be created
 */
const openFileOutput = (): LogOutput => {
  const logPath = getEnvConfig().LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH;
  try {
    validateLogPath(logPath);
  } catch (error) {
    throw new Error(`Invalid log file path: ${describeError(error)}`, { cause: error });
  }
  const fileMode = getLogFileMode();
  ensureLogDirectory(logPath, fileMode);
  return openTransport('file', getFileTransportConfig(fileMode));
};

/**
 * Open the syslog output after validating the configured host and port
 * @returns {LogOutput} The opened output
 * @throws {Error} If the syslog configuration is invalid
 */
const openSyslogOutput = (): LogOutput => {
  const { LOG_SYSLOG_HOST, LOG_SYSLOG_PORT } = getEnvConfig();
  try {
    validateSyslogHost(LOG_SYSLOG_HOST || 'localhost');
    validateSyslogPort(LOG_SYSLOG_PORT);
  } catch (error) {
    throw new Error(`Invalid syslog configuration: ${describeError(error)}`, { cause: error });
  }
  return openTransport('syslog', getSyslogTransportConfig());
};

/**
 * Output that discards everything
 */
const NULL_OUTPUT: LogOutput = {
  mode: 'null',
  stream: { write: () => undefined },
  close: () => undefined,
};

/**
 * Open the requested log output.
 *
 * Under NODE_ENV=test no transport worker is started: file and syslog report
 * their mode but write to the (silenced) process stdout.
 * @param {string} requestedMode - The output mode to open
 * @param {EnvFlags} env - Environment flags object
 * @returns {LogOutput} The opened output
 * @throws {Error} If the mode is unknown or its configuration is invalid
 */
const openOutput = (requestedMode: string, env: EnvFlags): LogOutput => {
  if (!isOutputMode(requestedMode)) {
    throw new Error(
      `Unknown log output mode "${requestedMode}" (expected one of: ${OUTPUT_MODES.join(', ')})`,
    );
  }
  switch (requestedMode) {
    case 'null':
      return NULL_OUTPUT;
    case 'stderr':
      return openProcessStream(2, 'stderr');
    case 'stdout':
      return openStdoutOutput(env);
    case 'file':
      return env.isTest ? openProcessStream(1, 'file') : openFileOutput();
    case 'syslog':
      return env.isTest ? openProcessStream(1, 'syslog') : openSyslogOutput();
  }
};

/**
 * Open the output configured via LOG_OUTPUT, falling back to stdout when the
 * configuration is invalid so that startup never fails because of logging.
 * @param {EnvFlags} env - Environment flags object
 * @returns {LogOutput} The opened output
 */
const openInitialOutput = (env: EnvFlags): LogOutput => {
  const configured = getConfiguredLogOutput();
  try {
    return openOutput(configured, env);
  } catch (error) {
    fallbackLogger.error(
      { context: 'log output', requested: configured, error: describeError(error) },
      'Invalid log output configuration',
    );
    fallbackLogger.error(FALLBACK_TO_STDOUT_MESSAGE);
    return openStdoutOutput(env);
  }
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
 * @param {PinoLogger} baseLogger - The base Pino logger to wrap
 * @returns {Logger} Logger with withContext method
 */
const wrapLoggerWithContext = (baseLogger: PinoLogger): Logger => {
  const logger = baseLogger as Logger;
  logger.withContext = function (context: LogContext): Logger {
    // Recursively wrap the child logger to ensure it also has withContext
    return wrapLoggerWithContext(baseLogger.child(context));
  };
  return logger;
};

const startupEnv = getEnvFlags();
activeOutput = openInitialOutput(startupEnv);

/**
 * Default logger instance
 * Use this throughout the application for consistent logging
 */
export const logger: Logger = wrapLoggerWithContext(
  pino(getLoggerConfig(startupEnv), delegatingStream),
);

/**
 * Level to restore when leaving the null output
 */
let levelBeforeNull: string | null = null;

/**
 * The null output also silences the logger so that log arguments are not even
 * serialized; leaving it restores the previous level.
 * @param {LogOutputMode | null} previousMode - The mode being left (null at startup)
 * @param {LogOutputMode} nextMode - The mode being entered
 */
const applyOutputLevel = (previousMode: LogOutputMode | null, nextMode: LogOutputMode): void => {
  if (nextMode === 'null') {
    levelBeforeNull = logger.level;
    logger.level = 'silent';
    return;
  }
  if (previousMode === 'null' && levelBeforeNull !== null) {
    logger.level = levelBeforeNull;
    levelBeforeNull = null;
  }
};

applyOutputLevel(null, activeOutput.mode);

/**
 * Switch logger output to a different destination at runtime.
 *
 * Dynamically changes where log messages are written without restarting the application.
 * This is useful for debugging, testing, or changing log destinations based on runtime conditions.
 *
 * The switch applies to the exported {@link logger} and to every child logger derived
 * from it, including children created before the switch. The previous destination's
 * transport (file, syslog, pretty-printer) is closed once the new one is active.
 * If the new destination cannot be opened, an error is thrown and the current
 * destination stays active.
 * @param {string} outputMode - The destination to switch to. Valid values:
 *   - `'stdout'` - Standard output (console)
 *   - `'stderr'` - Standard error stream
 *   - `'file'` - Write to log file (configured via LOG_FILE_PATH)
 *   - `'syslog'` - Send to syslog server (requires syslog configuration)
 *   - `'null'` - Discard all log messages
 * @throws {Error} If the output mode is unknown, or if its configuration is invalid
 *   (e.g., switching to 'file' with a LOG_FILE_PATH that fails validation or whose
 *   directory cannot be created, or to 'syslog' with an invalid host or port)
 * @example
 * ```typescript
 * // Switch to file logging
 * switchLogOutput('file');
 * logger.info('This will be written to the log file');
 *
 * // Switch to null output (disable logging)
 * switchLogOutput('null');
 * logger.info('This message will be discarded');
 *
 * // Switch back to console
 * switchLogOutput('stdout');
 * logger.info('Back to console output');
 * ```
 */
export const switchLogOutput = (outputMode: string): void => {
  if (activeOutput.mode === outputMode) {
    logger.debug(`Logger already using ${outputMode} output`);
    return;
  }

  const previous = activeOutput;
  // Throws on an unknown mode or invalid configuration; the previous output stays active
  const next = openOutput(outputMode, getEnvFlags());

  activeOutput = next;
  applyOutputLevel(previous.mode, next.mode);
  previous.close();

  logger.info(
    { previousMode: previous.mode, newMode: next.mode },
    `Logger output switched to ${next.mode}`,
  );
};

/**
 * Get the current logger output mode.
 *
 * Returns the destination log messages are actually being written to.
 * Useful for debugging, testing, or conditional logic based on logging configuration.
 * @returns {string} The current output mode as a string. Possible values:
 *   - `'stdout'` - Logging to standard output
 *   - `'stderr'` - Logging to standard error stream
 *   - `'file'` - Logging to file
 *   - `'syslog'` - Logging to syslog server
 *   - `'null'` - Logging disabled
 * @example
 * ```typescript
 * const currentMode = getLoggerOutputMode();
 * console.log(`Current logger output: ${currentMode}`); // e.g., "Current logger output: stdout"
 *
 * // Conditional logic based on output mode
 * if (getLoggerOutputMode() === 'file') {
 *   // Perform file-specific operations
 *   console.log('Logs are being written to file');
 * }
 * ```
 * This is the effective mode: if LOG_OUTPUT was unknown or its configuration failed
 * validation at startup, the logger fell back to stdout and this returns `'stdout'`.
 * After a successful {@link switchLogOutput} it returns the mode that was switched to.
 */
export const getLoggerOutputMode = (): string => activeOutput.mode;

/**
 * Create a child logger with specific context
 * Useful for module-specific logging
 * @param {string} name - The name/module for the logger context
 * @param {LogContext} context - Additional context to include
 * @returns {Logger} Child logger instance
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
 * @param {Logger} log - The logger instance to enhance with trace context
 * @param {string | undefined} traceId - The trace ID from OpenTelemetry context
 * @param {string | undefined} spanId - The span ID from OpenTelemetry context
 * @returns {Logger} Logger instance with trace context attached
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
export type { LoggerOptions } from 'pino';
// Log startup information
if (getEnvConfig().NODE_ENV !== 'test') {
  logger.info(
    {
      node_env: getEnvConfig().NODE_ENV,
      log_level: logger.level,
      pid: process.pid,
      log_output: getLoggerOutputMode(),
    },
    'Logger initialized',
  );
}
