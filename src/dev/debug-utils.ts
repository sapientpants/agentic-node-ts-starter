/**
 * Development and debugging utilities - Template infrastructure.
 * This file provides helpful debugging tools and can be kept and customized.
 * Only available in development mode.
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

import { createChildLogger } from '../logger.js';
import { performance } from 'node:perf_hooks';

const logger = createChildLogger('debug-utils');

/**
 * Performance timer for debugging slow operations
 */
export class PerformanceTimer {
  private readonly startTime: number;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    logger.debug({ label }, 'Performance timer started');
  }

  /**
   * Mark an intermediate checkpoint
   * @param {string} checkpointLabel - The checkpoint label
   * @returns {number} Elapsed time in milliseconds
   */
  checkpoint(checkpointLabel: string): number {
    const elapsed = performance.now() - this.startTime;
    logger.debug(
      { label: this.label, checkpoint: checkpointLabel, elapsed_ms: elapsed.toFixed(2) },
      'Performance checkpoint',
    );
    return elapsed;
  }

  /**
   * Stop the timer and log the result
   * @returns {number} Total elapsed time in milliseconds
   */
  end(): number {
    const elapsed = performance.now() - this.startTime;
    logger.info({ label: this.label, elapsed_ms: elapsed.toFixed(2) }, 'Performance timer ended');
    return elapsed;
  }
}

/**
 * A class method that can be wrapped by a standard (TC39) method decorator.
 */
type DecoratedMethod<This, Args extends any[], Return> = (this: This, ...args: Args) => Return;

/**
 * Ensure a decorator is applied to a method and return its name.
 * @param {string} decoratorName - The decorator name used in error messages
 * @param {DecoratorContext} context - The decorator context
 * @returns {string} The decorated method name
 */
function requireMethodContext(
  decoratorName: string,
  context: Pick<DecoratorContext, 'kind' | 'name'>,
): string {
  const name = String(context.name);
  if (context.kind !== 'method') {
    throw new Error(
      `@${decoratorName} decorator can only be applied to methods, but ${name} is not a method`,
    );
  }
  return name;
}

/**
 * Resolve the owner name for a decorated method at call time.
 * @param {unknown} self - The `this` value of the call
 * @param {boolean} isStatic - Whether the method is static
 * @returns {string} The class name, or 'anonymous' if it cannot be determined
 */
function getOwnerName(self: unknown, isStatic: boolean): string {
  const owner = isStatic ? self : (self as { constructor?: unknown } | null)?.constructor;
  const name = typeof owner === 'function' ? owner.name : undefined;
  return name !== undefined && name !== '' ? name : 'anonymous';
}

/**
 * Decorator for timing method execution (standard TC39 decorator)
 * @param {DecoratedMethod} value - The decorated method
 * @param {ClassMethodDecoratorContext} context - The decorator context
 * @returns {DecoratedMethod} The original method, or a timed wrapper in development
 */
export function timed<This, Args extends any[], Return>(
  value: DecoratedMethod<This, Args, Return>,
  context: ClassMethodDecoratorContext<This, DecoratedMethod<This, Args, Return>>,
): DecoratedMethod<This, Args, Return> {
  const methodName = requireMethodContext('timed', context);

  if (process.env.NODE_ENV !== 'development') {
    return value;
  }

  return function (this: This, ...args: Args): Return {
    const timer = new PerformanceTimer(`${getOwnerName(this, context.static)}.${methodName}`);
    try {
      const result = value.apply(this, args);

      // Handle async functions
      if (result instanceof Promise) {
        // eslint-disable-next-line promise/prefer-await-to-then -- Using finally for performance measurement
        return result.finally(() => timer.end()) as Return;
      }

      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };
}

/**
 * Memory usage monitoring
 * @param {string} [label] - The label for the memory check (default: 'memory-check')
 * @returns {void}
 */
export function logMemoryUsage(label: string = 'memory-check'): void {
  if (process.env.NODE_ENV !== 'development') return;

  const usage = process.memoryUsage();
  logger.debug(
    {
      label,
      memory: {
        rss_mb: Math.round(usage.rss / 1024 / 1024),
        heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
        external_mb: Math.round(usage.external / 1024 / 1024),
      },
    },
    'Memory usage',
  );
}

/**
 * Deep object inspection for debugging
 * @param {unknown} obj - The object to inspect
 * @param {string} [label] - The label for the inspection (default: 'inspect')
 * @param {number} [maxDepth] - The maximum depth for nested objects (default: 3)
 * @returns {void}
 */
export function inspect(obj: unknown, label: string = 'inspect', maxDepth: number = 3): void {
  if (process.env.NODE_ENV !== 'development') return;

  logger.debug(
    {
      label,
      object: JSON.stringify(obj, null, 2),
      type: typeof obj,
      max_depth: maxDepth,
    },
    'Object inspection',
  );
}

/**
 * Log function entry
 * @param {string} functionName - The function name
 * @param {unknown[]} args - The function arguments
 * @returns {void}
 */
const logFunctionEntry = (functionName: string, args: any[]): void => {
  logger.debug(
    {
      function: functionName,
      arguments: args,
      timestamp: new Date().toISOString(),
    },
    'Function called',
  );
};

/**
 * Log successful function completion
 * @param {string} functionName - The function name
 * @param {unknown} result - The function result
 * @returns {void}
 */
const logFunctionSuccess = (functionName: string, result: any): void => {
  logger.debug(
    {
      function: functionName,
      result,
      status: 'completed',
    },
    'Function completed',
  );
};

/**
 * Log function error
 * @param {string} functionName - The function name
 * @param {unknown} error - The error that occurred
 * @returns {void}
 */
const logFunctionError = (functionName: string, error: unknown): void => {
  logger.error(
    {
      function: functionName,
      error: error instanceof Error ? error.message : error,
      status: 'error',
    },
    'Function failed',
  );
};

/**
 * Handle async function result
 * @param {string} functionName - The function name
 * @param {Promise<unknown>} promise - The async function promise
 * @returns {Promise<unknown>} The original promise
 */
// eslint-disable-next-line @typescript-eslint/promise-function-async -- Intentionally not async to chain promises
const handleAsyncResult = (functionName: string, promise: Promise<any>): Promise<any> => {
  return (
    promise
      // eslint-disable-next-line promise/prefer-await-to-then -- Debug utility uses promise chains for logging
      .then((res) => {
        logger.debug(
          {
            function: functionName,
            result: res,
            status: 'resolved',
          },
          'Async function completed',
        );
        return res;
      })
      // eslint-disable-next-line promise/prefer-await-to-then -- Debug utility uses promise chains for logging
      .catch((error) => {
        logger.error(
          {
            function: functionName,
            error: error.message,
            status: 'rejected',
          },
          'Async function failed',
        );
        throw error;
      })
  );
};

/**
 * Function call tracer for debugging (standard TC39 decorator)
 * @param {DecoratedMethod} value - The decorated method
 * @param {ClassMethodDecoratorContext} context - The decorator context
 * @returns {DecoratedMethod} The original method, or a traced wrapper in development
 */
export function trace<This, Args extends any[], Return>(
  value: DecoratedMethod<This, Args, Return>,
  context: ClassMethodDecoratorContext<This, DecoratedMethod<This, Args, Return>>,
): DecoratedMethod<This, Args, Return> {
  const methodName = requireMethodContext('trace', context);

  if (process.env.NODE_ENV !== 'development') {
    return value;
  }

  return function (this: This, ...args: Args): Return {
    const functionName = `${getOwnerName(this, context.static)}.${methodName}`;

    logFunctionEntry(functionName, args);

    try {
      const result = value.apply(this, args);

      if (result instanceof Promise) {
        return handleAsyncResult(functionName, result) as Return;
      }

      logFunctionSuccess(functionName, result);
      return result;
    } catch (error) {
      logFunctionError(functionName, error);
      throw error;
    }
  };
}

/**
 * Simple assertion function for development debugging
 * @param {boolean} condition - The condition to assert
 * @param {string} message - The error message if assertion fails
 * @returns {void}
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (process.env.NODE_ENV === 'production') return;

  if (!condition) {
    logger.error({ assertion_failed: message }, 'Assertion failed');
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Development-only feature flag
 * @param {() => T} fn - The function to execute in development mode
 * @returns {T | undefined} The function result in development, undefined in production
 */
export function devOnly<T>(fn: () => T): T | undefined {
  return process.env.NODE_ENV === 'development' ? fn() : undefined;
}

/**
 * Create a development console with enhanced debugging
 */
export const devConsole = {
  /**
   * Log with automatic JSON formatting
   * @param {unknown} obj - The object to log
   * @param {string} [label] - Optional label for the log entry
   * @returns {void}
   */
  log: (obj: unknown, label?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(label ? `[${label}]` : '[DEV]', JSON.stringify(obj, null, 2));
    }
  },

  /**
   * Table display for arrays/objects
   * @param {Record<string, unknown>[] | Record<string, unknown>} data - The data to display
   * @returns {void}
   */
  table: (data: Record<string, any>[] | Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.table(data);
    }
  },

  /**
   * Group related log statements
   * @param {string} label - The group label
   * @param {() => void} fn - The function to execute within the group
   * @returns {void}
   */
  group: (label: string, fn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  },

  /**
   * Time a code block
   * @param {string} label - The timer label
   * @param {() => T} fn - The function to time
   * @returns {T} The function result
   */
  time: <T>(label: string, fn: () => T): T => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
      try {
        return fn();
      } finally {
        console.timeEnd(label);
      }
    }
    return fn();
  },
};

/* eslint-enable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
