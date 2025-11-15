/**
 * Development and debugging utilities - Template infrastructure.
 * This file provides helpful debugging tools and can be kept and customized.
 * Only available in development mode.
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

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
   */
  end(): number {
    const elapsed = performance.now() - this.startTime;
    logger.info({ label: this.label, elapsed_ms: elapsed.toFixed(2) }, 'Performance timer ended');
    return elapsed;
  }
}

/**
 * Decorator for timing function execution
 */
export function timed(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  if (process.env.NODE_ENV !== 'development') {
    return descriptor;
  }

  const method = descriptor.value;

  // Validate that we're decorating a method
  if (typeof method !== 'function') {
    throw new Error(
      `@timed decorator can only be applied to methods, but ${propertyName} is not a function`,
    );
  }

  descriptor.value = function (...args: any[]) {
    const timer = new PerformanceTimer(`${target.constructor.name}.${propertyName}`);
    try {
      const result = method.apply(this, args);

      // Handle async functions
      if (result instanceof Promise) {
        // eslint-disable-next-line promise/prefer-await-to-then -- Using finally for performance measurement
        return result.finally(() => timer.end());
      }

      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };

  return descriptor;
}

/**
 * Memory usage monitoring
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
 * Function call tracer for debugging
 */
export function trace(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  if (process.env.NODE_ENV !== 'development') {
    return descriptor;
  }

  const method = descriptor.value;

  if (typeof method !== 'function') {
    throw new Error(
      `@trace decorator can only be applied to methods, but ${propertyName} is not a function`,
    );
  }

  descriptor.value = function (...args: any[]) {
    const functionName = `${target.constructor.name}.${propertyName}`;

    logFunctionEntry(functionName, args);

    try {
      const result = method.apply(this, args);

      if (result instanceof Promise) {
        return handleAsyncResult(functionName, result);
      }

      logFunctionSuccess(functionName, result);
      return result;
    } catch (error) {
      logFunctionError(functionName, error);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Simple assertion function for development debugging
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
 */
export function devOnly<T>(fn: () => T): T | undefined {
  if (process.env.NODE_ENV === 'development') {
    return fn();
  }
  return undefined;
}

/**
 * Create a development console with enhanced debugging
 */
export const devConsole = {
  /**
   * Log with automatic JSON formatting
   */
  log: (obj: unknown, label?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(label ? `[${label}]` : '[DEV]', JSON.stringify(obj, null, 2));
    }
  },

  /**
   * Table display for arrays/objects
   */
  table: (data: Record<string, any>[] | Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.table(data);
    }
  },

  /**
   * Group related log statements
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

/* eslint-enable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
