/**
 * Fallback logger for configuration and initialization problems.
 * This file is part of the template infrastructure and can be kept and customized.
 *
 * Used when the main logger cannot be configured yet (or at all): every warning
 * emitted while validating and opening log outputs goes through this single
 * channel. It writes through `process.stdout.write` looked up at call time, so
 * output is never lost to a stream that was replaced (e.g. by a test spy) after
 * this module was loaded.
 */

import pino from 'pino';

/**
 * Pino logger that writes structured JSON warnings and errors to stdout
 */
export const fallbackLogger = pino(
  { level: 'warn', timestamp: pino.stdTimeFunctions.isoTime },
  {
    write: (chunk: string): void => {
      process.stdout.write(chunk);
    },
  },
);
