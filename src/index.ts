/**
 * ============================================================================
 * EXAMPLE CODE - REPLACE WITH YOUR IMPLEMENTATION
 * ============================================================================
 * This file contains example code demonstrating the template's capabilities.
 * It should be removed or replaced with your actual application code.
 *
 * The startup log below is the one piece to keep: the entry point is where the
 * validated configuration and the logger are brought together, so neither
 * `src/config.ts` nor `src/logger.ts` has to log anything at import time.
 *
 * See docs/GETTING_STARTED.md#clean-up-example-code for cleanup instructions.
 * ============================================================================
 */

import { z } from 'zod';
import { config } from './config.js';
import { createChildLogger, getLoggerOutputMode, logger as rootLogger } from './logger.js';

const logger = createChildLogger('index');

logger.info(
  {
    environment: config.NODE_ENV,
    app: config.APP_NAME,
    log_level: rootLogger.level,
    log_output: getLoggerOutputMode(),
    pid: process.pid,
  },
  'Configuration loaded successfully',
);

export function add(a: number, b: number): number {
  logger.debug({ a, b }, 'Adding two numbers');
  const result = a + b;
  logger.debug({ result }, 'Addition result');
  return result;
}

// Example of a zod-validated function input
export const CreateUser = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'Invalid UUID format',
    ),
  email: z.string().regex(/^[\w.%+-]+@[\w.-]+\.[a-z]{2,}$/i, 'Invalid email format'),
  age: z.number().int().min(13),
});
export type CreateUser = z.infer<typeof CreateUser>;
