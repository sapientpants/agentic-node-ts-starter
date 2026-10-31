/**
 * Production-ready logger configuration using Pino.
 * This file is part of the template infrastructure and can be kept and customized.
 *
 * Supports multiple output destinations for flexible logging configuration.
 *
 * The logger is driven entirely by the validated {@link Config}: it never reads
 * `process.env` itself. {@link createLogger} builds an independent logger from a
 * configuration object; the module-level exports (`logger`, `switchLogOutput`,
 * `getLoggerOutputMode`, `createChildLogger`) are thin wrappers around a default
 * instance created from the application configuration.
 */

import pino, { type Logger as PinoLogger, type LoggerOptions, type DestinationStream } from 'pino';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config, type Config } from './config.js';
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
const DEFAULT_SYSLOG_HOST = 'localhost';
const DEFAULT_SYSLOG_PORT = 514;
const FALLBACK_TO_STDOUT_MESSAGE = 'Falling back to stdout';

/**
 * Fallback logger for initialization errors
 * Used when the main logger configuration fails. It writes through
 * `process.stdout.write` looked up at call time, so output is never lost to a
 * stream that was replaced (e.g. by a test spy) after this module was loaded.
 */
const fallbackLogger = pino(
  { level: 'warn', timestamp: pino.stdTimeFunctions.isoTime },
  {
    write: (chunk: string): void => {
      process.stdout.write(chunk);
    },
  },
);

/**
 * The subset of the validated configuration that drives the logger
 */
export type LoggerConfig = Pick<
  Config,
  | 'NODE_ENV'
  | 'APP_NAME'
  | 'LOG_LEVEL'
  | 'LOG_OUTPUT'
  | 'LOG_FILE_PATH'
  | 'LOG_FILE_MAX_SIZE'
  | 'LOG_FILE_MAX_FILES'
  | 'LOG_FILE_PERMISSIONS'
  | 'LOG_SYSLOG_HOST'
  | 'LOG_SYSLOG_PORT'
  | 'LOG_SYSLOG_PROTOCOL'
>;

/**
 * Supported log output modes (kept in sync with the LOG_OUTPUT schema)
 */
const OUTPUT_MODES = [
  'stdout',
  'stderr',
  'file',
  'syslog',
  'null',
] as const satisfies readonly Config['LOG_OUTPUT'][];
type LogOutputMode = (typeof OUTPUT_MODES)[number];

const isOutputMode = (mode: string): mode is LogOutputMode =>
  (OUTPUT_MODES as readonly string[]).includes(mode);

/**
 * Format an unknown error for log output
 * @param {unknown} error - The error to describe
 * @returns {string} The error message
 */
const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Resolve the log file path, falling back to the default when unset or empty
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {string} The log file path
 */
const getLogFilePath = (loggerConfig: LoggerConfig): string =>
  loggerConfig.LOG_FILE_PATH || DEFAULT_LOG_FILE_PATH;

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
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @param {number} fileMode - The validated numeric file mode for log files
 * @returns {{ target: string, options: object }} File transport configuration object
 */
const getFileTransportConfig = (loggerConfig: LoggerConfig, fileMode: number) => {
  const rawMaxSize = loggerConfig.LOG_FILE_MAX_SIZE;
  const maxSize = parseSizeToBytes(rawMaxSize);

  if (rawMaxSize !== undefined && rawMaxSize !== '' && maxSize === undefined) {
    process.stderr.write(
      `Invalid LOG_FILE_MAX_SIZE "${rawMaxSize}" (expected e.g. 10M, 100KB, 1.5G), disabling log rotation\n`,
    );
  }

  if (maxSize !== undefined) {
    // For rotation, use pino-roll transport if size limits are specified.
    // pino-roll only understands single-letter units, so pass the normalized byte count.
    const maxFiles = loggerConfig.LOG_FILE_MAX_FILES;
    return {
      target: 'pino-roll',
      options: {
        file: getLogFilePath(loggerConfig),
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
      destination: getLogFilePath(loggerConfig),
      mkdir: true,
      mode: fileMode,
    },
  };
};

/**
 * Get syslog transport configuration
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {{ target: string, options: object }} Syslog transport configuration object
 */
const getSyslogTransportConfig = (loggerConfig: LoggerConfig) => {
  return {
    target: 'pino-syslog',
    options: {
      host: loggerConfig.LOG_SYSLOG_HOST || DEFAULT_SYSLOG_HOST,
      port: loggerConfig.LOG_SYSLOG_PORT ?? DEFAULT_SYSLOG_PORT,
      protocol: loggerConfig.LOG_SYSLOG_PROTOCOL ?? 'udp',
      app: loggerConfig.APP_NAME,
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
 * Derive the environment flags from the configured NODE_ENV
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {EnvFlags} Environment flags object
 */
const getEnvFlags = (loggerConfig: LoggerConfig): EnvFlags => ({
  isProduction: loggerConfig.NODE_ENV === 'production',
  isDevelopment: loggerConfig.NODE_ENV === 'development',
  isTest: loggerConfig.NODE_ENV === 'test',
});

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
 * Mutable per-logger state: the destination all log lines are currently written
 * to (replaced by `switchLogOutput`) and the level to restore when leaving the
 * null output.
 */
interface OutputState {
  active: LogOutput;
  levelBeforeNull: string | null;
}

/**
 * Create the stream handed to a root pino instance. It forwards every line to
 * the active output, so the root logger and all of its children (whenever they
 * were created) follow a runtime switch without being re-created.
 * @param {OutputState} state - The state holding the active output
 * @returns {OutputStream} The delegating stream
 */
const createDelegatingStream = (state: OutputState): OutputStream => ({
  write: (chunk: string): void => {
    state.active.stream.write(chunk);
  },
  flush: (callback): void => {
    const { stream } = state.active;
    if (typeof stream.flush === 'function') {
      stream.flush(callback);
    } else {
      callback();
    }
  },
});

/**
 * Create a timestamp function that matches the active output: pino-syslog needs
 * epoch milliseconds, every other destination gets ISO strings.
 * @param {OutputState} state - The state holding the active output
 * @returns {() => string} The pino timestamp function
 */
const createTimestamp = (state: OutputState) => (): string =>
  state.active.mode === 'syslog'
    ? pino.stdTimeFunctions.epochTime()
    : pino.stdTimeFunctions.isoTime();

/**
 * Create base logger configuration
 * @param {string} logLevel - The logging level
 * @param {() => string} timestamp - The pino timestamp function
 * @returns {LoggerOptions} Base logger configuration object
 */
const createBaseConfig = (logLevel: string, timestamp: () => string): LoggerOptions => ({
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
 * Logger configuration based on environment. Output destinations are not part
 * of the configuration; they are managed through {@link LogOutput}. The log
 * level comes straight from the validated configuration, which already applies
 * the per-environment default (info in production, silent in test, debug otherwise).
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @param {() => string} timestamp - The pino timestamp function
 * @returns {LoggerOptions} Logger configuration object
 */
const getLoggerOptions = (loggerConfig: LoggerConfig, timestamp: () => string): LoggerOptions => {
  const baseConfig = createBaseConfig(loggerConfig.LOG_LEVEL, timestamp);
  return getEnvFlags(loggerConfig).isProduction ? createProductionConfig(baseConfig) : baseConfig;
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
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {LogOutput} The opened output
 * @throws {Error} If the log path is invalid or its directory cannot be created
 */
const openFileOutput = (loggerConfig: LoggerConfig): LogOutput => {
  const logPath = getLogFilePath(loggerConfig);
  try {
    validateLogPath(logPath);
  } catch (error) {
    throw new Error(`Invalid log file path: ${describeError(error)}`, { cause: error });
  }
  const fileMode = validateFileMode(loggerConfig.LOG_FILE_PERMISSIONS);
  ensureLogDirectory(logPath, fileMode);
  return openTransport('file', getFileTransportConfig(loggerConfig, fileMode));
};

/**
 * Open the syslog output after validating the configured host and port
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {LogOutput} The opened output
 * @throws {Error} If the syslog configuration is invalid
 */
const openSyslogOutput = (loggerConfig: LoggerConfig): LogOutput => {
  try {
    validateSyslogHost(loggerConfig.LOG_SYSLOG_HOST || DEFAULT_SYSLOG_HOST);
    validateSyslogPort(loggerConfig.LOG_SYSLOG_PORT);
  } catch (error) {
    throw new Error(`Invalid syslog configuration: ${describeError(error)}`, { cause: error });
  }
  return openTransport('syslog', getSyslogTransportConfig(loggerConfig));
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
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {LogOutput} The opened output
 * @throws {Error} If the mode is unknown or its configuration is invalid
 */
const openOutput = (requestedMode: string, loggerConfig: LoggerConfig): LogOutput => {
  if (!isOutputMode(requestedMode)) {
    throw new Error(
      `Unknown log output mode "${requestedMode}" (expected one of: ${OUTPUT_MODES.join(', ')})`,
    );
  }
  const env = getEnvFlags(loggerConfig);
  switch (requestedMode) {
    case 'null':
      return NULL_OUTPUT;
    case 'stderr':
      return openProcessStream(2, 'stderr');
    case 'stdout':
      return openStdoutOutput(env);
    case 'file':
      return env.isTest ? openProcessStream(1, 'file') : openFileOutput(loggerConfig);
    case 'syslog':
      return env.isTest ? openProcessStream(1, 'syslog') : openSyslogOutput(loggerConfig);
  }
};

/**
 * Open the output configured via LOG_OUTPUT, falling back to stdout when its
 * configuration is invalid (e.g. a log file path that fails validation or an
 * invalid syslog host) so that startup never fails because of logging.
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {LogOutput} The opened output
 */
const openInitialOutput = (loggerConfig: LoggerConfig): LogOutput => {
  const configured: string = loggerConfig.LOG_OUTPUT;
  try {
    return openOutput(configured, loggerConfig);
  } catch (error) {
    fallbackLogger.error(
      { context: 'log output', requested: configured, error: describeError(error) },
      'Invalid log output configuration',
    );
    fallbackLogger.error(FALLBACK_TO_STDOUT_MESSAGE);
    return openStdoutOutput(getEnvFlags(loggerConfig));
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

/**
 * The null output also silences the logger so that log arguments are not even
 * serialized; leaving it restores the previous level.
 * @param {OutputState} state - The state holding the level to restore
 * @param {Logger} logger - The root logger whose level to adjust
 * @param {LogOutputMode | null} previousMode - The mode being left (null at startup)
 * @param {LogOutputMode} nextMode - The mode being entered
 */
const applyOutputLevel = (
  state: OutputState,
  logger: Logger,
  previousMode: LogOutputMode | null,
  nextMode: LogOutputMode,
): void => {
  if (nextMode === 'null') {
    state.levelBeforeNull = logger.level;
    logger.level = 'silent';
    return;
  }
  if (previousMode === 'null' && state.levelBeforeNull !== null) {
    logger.level = state.levelBeforeNull;
    state.levelBeforeNull = null;
  }
};

/**
 * Build the output-switching function for one logger instance
 * @param {OutputState} state - The state holding the active output
 * @param {Logger} logger - The root logger of the instance
 * @param {LoggerConfig} loggerConfig - The logger configuration
 * @returns {(outputMode: string) => void} The switch function
 */
const createSwitchLogOutput =
  (state: OutputState, logger: Logger, loggerConfig: LoggerConfig) =>
  (outputMode: string): void => {
    if (state.active.mode === outputMode) {
      logger.debug(`Logger already using ${outputMode} output`);
      return;
    }

    const previous = state.active;
    // Throws on an unknown mode or invalid configuration; the previous output stays active
    const next = openOutput(outputMode, loggerConfig);

    state.active = next;
    applyOutputLevel(state, logger, previous.mode, next.mode);
    previous.close();

    logger.info(
      { previousMode: previous.mode, newMode: next.mode },
      `Logger output switched to ${next.mode}`,
    );
  };

/**
 * A logger together with the functions that control its output destination
 */
export interface LoggerInstance {
  /** The root logger */
  logger: Logger;
  /** Switch the output destination at runtime (see {@link switchLogOutput}) */
  switchLogOutput: (outputMode: string) => void;
  /** The destination log lines are currently written to (see {@link getLoggerOutputMode}) */
  getLoggerOutputMode: () => string;
  /** Create a child logger with a module name and optional context */
  createChildLogger: (name: string, context?: LogContext) => Logger;
}

/**
 * Create an independent logger from a validated configuration.
 *
 * Opens the configured output (falling back to stdout if its configuration is
 * invalid) and returns the root logger with its own `switchLogOutput` and
 * `getLoggerOutputMode`. Nothing is logged on creation.
 * @param {LoggerConfig} loggerConfig - The validated configuration (or a subset of it)
 * @returns {LoggerInstance} The logger and its output controls
 * @example
 * ```typescript
 * const { logger, switchLogOutput } = createLogger(
 *   loadConfig({ NODE_ENV: 'production', LOG_OUTPUT: 'stderr' }),
 * );
 * ```
 */
export const createLogger = (loggerConfig: LoggerConfig): LoggerInstance => {
  const state: OutputState = { active: openInitialOutput(loggerConfig), levelBeforeNull: null };
  const logger = wrapLoggerWithContext(
    pino(getLoggerOptions(loggerConfig, createTimestamp(state)), createDelegatingStream(state)),
  );
  applyOutputLevel(state, logger, null, state.active.mode);

  return {
    logger,
    switchLogOutput: createSwitchLogOutput(state, logger, loggerConfig),
    getLoggerOutputMode: () => state.active.mode,
    createChildLogger: (name, context = {}) => logger.withContext({ module: name, ...context }),
  };
};

/**
 * Default logger instance, created from the application configuration
 */
const defaultInstance = createLogger(config);

/**
 * Default logger instance
 * Use this throughout the application for consistent logging
 */
export const logger: Logger = defaultInstance.logger;

/**
 * Switch logger output to a different destination at runtime.
 *
 * Template API: the template itself never switches output, so this has no
 * production caller here. It is kept as a documented feature for applications
 * built on the template (see docs/LOGGING_OUTPUT.md).
 *
 * Dynamically changes where log messages are written without restarting the application.
 * This is useful for debugging, testing, or changing log destinations based on runtime conditions.
 *
 * The switch applies to the exported {@link logger} and to every child logger derived
 * from it, including children created before the switch. The previous destination's
 * transport (file, syslog, pretty-printer) is closed once the new one is active.
 * If the new destination cannot be opened, an error is thrown and the current
 * destination stays active.
 * @public
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
export const switchLogOutput: (outputMode: string) => void = defaultInstance.switchLogOutput;

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
 * This is the effective mode: if the configured LOG_OUTPUT failed validation at
 * startup (invalid file path or syslog host), the logger fell back to stdout and
 * this returns `'stdout'`. After a successful {@link switchLogOutput} it returns
 * the mode that was switched to.
 */
export const getLoggerOutputMode: () => string = defaultInstance.getLoggerOutputMode;

/**
 * Create a child logger with specific context
 * Useful for module-specific logging
 * @param {string} name - The name/module for the logger context
 * @param {LogContext} context - Additional context to include
 * @returns {Logger} Child logger instance
 */
export const createChildLogger: (name: string, context?: LogContext) => Logger =
  defaultInstance.createChildLogger;

/**
 * OpenTelemetry integration helper
 *
 * Template API: kept as the documented bridge for applications that add
 * tracing (see docs/OBSERVABILITY.md); the template itself has no caller.
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
 * @public
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
