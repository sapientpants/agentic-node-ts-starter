/**
 * Tests for development debugging utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PerformanceTimer,
  timed,
  trace,
  logMemoryUsage,
  inspect,
  assert,
  devOnly,
  devConsole,
} from '../../src/dev/debug-utils.js';

describe('Debug Utils', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set to development for most tests
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('PerformanceTimer', () => {
    it('should create a timer with a label', () => {
      const timer = new PerformanceTimer('test-operation');
      expect(timer).toBeDefined();
    });

    it('should track elapsed time at checkpoint', async () => {
      const timer = new PerformanceTimer('test-operation');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const elapsed = timer.checkpoint('mid-point');
      expect(elapsed).toBeGreaterThan(0);
    });

    it('should return elapsed time when ended', async () => {
      const timer = new PerformanceTimer('test-operation');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const elapsed = timer.end();
      expect(elapsed).toBeGreaterThan(0);
    });

    it('should allow multiple checkpoints', async () => {
      const timer = new PerformanceTimer('test-operation');
      const elapsed1 = timer.checkpoint('checkpoint-1');
      await new Promise((resolve) => setTimeout(resolve, 5));
      const elapsed2 = timer.checkpoint('checkpoint-2');
      expect(elapsed2).toBeGreaterThanOrEqual(elapsed1);
    });
  });

  describe('@timed decorator', () => {
    it('should time synchronous methods in development', () => {
      // Test by calling the decorator directly
      const descriptor = {
        value: vi.fn((x: number) => x * 2),
      };
      const target = { constructor: { name: 'TestClass' } };

      timed(target, 'syncMethod', descriptor);
      const result = descriptor.value(5);
      expect(result).toBe(10);
    });

    it('should time asynchronous methods in development', async () => {
      const descriptor = {
        value: vi.fn(async (x: number) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return x * 2;
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      timed(target, 'asyncMethod', descriptor);
      const result = await descriptor.value(5);
      expect(result).toBe(10);
    });

    it('should handle errors in timed methods', () => {
      const descriptor = {
        value: vi.fn(() => {
          throw new Error('Test error');
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      timed(target, 'errorMethod', descriptor);
      expect(() => descriptor.value()).toThrow('Test error');
    });

    it('should handle errors in async timed methods', async () => {
      const descriptor = {
        value: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new Error('Async test error');
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      timed(target, 'asyncErrorMethod', descriptor);
      await expect(descriptor.value()).rejects.toThrow('Async test error');
    });

    it('should not time methods in production', () => {
      process.env.NODE_ENV = 'production';

      const descriptor = {
        value: vi.fn((x: number) => x * 2),
      };
      const target = { constructor: { name: 'TestClass' } };

      const result = timed(target, 'syncMethod', descriptor);
      expect(result).toBe(descriptor);
    });

    it('should throw error when applied to non-function', () => {
      const descriptor = {
        value: 'not a function',
      };
      const target = { constructor: { name: 'TestClass' } };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => timed(target, 'notAMethod', descriptor as any)).toThrow(
        '@timed decorator can only be applied to methods',
      );
    });
  });

  describe('@trace decorator', () => {
    it('should trace synchronous method calls in development', () => {
      const descriptor = {
        value: vi.fn((a: number, b: number) => a + b),
      };
      const target = { constructor: { name: 'TestClass' } };

      trace(target, 'add', descriptor);
      const result = descriptor.value(2, 3);
      expect(result).toBe(5);
    });

    it('should trace successful async method calls', async () => {
      const descriptor = {
        value: vi.fn(async (id: number) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return `data-${id}`;
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      trace(target, 'fetchData', descriptor);
      const result = await descriptor.value(123);
      expect(result).toBe('data-123');
    });

    it('should trace failed async method calls', async () => {
      const descriptor = {
        value: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new Error('Async failure');
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      trace(target, 'failingMethod', descriptor);
      await expect(descriptor.value()).rejects.toThrow('Async failure');
    });

    it('should trace errors in synchronous methods', () => {
      const descriptor = {
        value: vi.fn(() => {
          throw new Error('Sync error');
        }),
      };
      const target = { constructor: { name: 'TestClass' } };

      trace(target, 'errorMethod', descriptor);
      expect(() => descriptor.value()).toThrow('Sync error');
    });

    it('should not trace in production mode', () => {
      process.env.NODE_ENV = 'production';

      const descriptor = {
        value: vi.fn((a: number, b: number) => a + b),
      };
      const target = { constructor: { name: 'TestClass' } };

      const result = trace(target, 'add', descriptor);
      expect(result).toBe(descriptor);
    });

    it('should throw error when applied to non-function', () => {
      const descriptor = {
        value: 'not a function',
      };
      const target = { constructor: { name: 'TestClass' } };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(() => trace(target, 'notAMethod', descriptor as any)).toThrow(
        '@trace decorator can only be applied to methods',
      );
    });
  });

  describe('logMemoryUsage', () => {
    it('should log memory usage in development', () => {
      expect(() => logMemoryUsage('test-label')).not.toThrow();
    });

    it('should log memory usage with default label', () => {
      expect(() => logMemoryUsage()).not.toThrow();
    });

    it('should not log in production', () => {
      process.env.NODE_ENV = 'production';
      expect(() => logMemoryUsage('test-label')).not.toThrow();
    });
  });

  describe('inspect', () => {
    it('should inspect objects in development', () => {
      const obj = { name: 'test', value: 123 };
      expect(() => inspect(obj, 'test-object')).not.toThrow();
    });

    it('should inspect objects with default label', () => {
      const obj = { name: 'test' };
      expect(() => inspect(obj)).not.toThrow();
    });

    it('should inspect objects with custom max depth', () => {
      const obj = { nested: { deep: { value: 1 } } };
      expect(() => inspect(obj, 'nested-object', 5)).not.toThrow();
    });

    it('should not inspect in production', () => {
      process.env.NODE_ENV = 'production';
      const obj = { name: 'test' };
      expect(() => inspect(obj)).not.toThrow();
    });
  });

  describe('assert', () => {
    it('should pass when condition is true', () => {
      expect(() => assert(true, 'Should pass')).not.toThrow();
    });

    it('should throw when condition is false in development', () => {
      expect(() => assert(false, 'Should fail')).toThrow('Assertion failed: Should fail');
    });

    it('should not throw in production even when condition is false', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assert(false, 'Should not fail in production')).not.toThrow();
    });
  });

  describe('devOnly', () => {
    it('should execute function in development', () => {
      const result = devOnly(() => 'development value');
      expect(result).toBe('development value');
    });

    it('should return complex values in development', () => {
      const result = devOnly(() => ({ test: true, value: 123 }));
      expect(result).toEqual({ test: true, value: 123 });
    });

    it('should return undefined in production', () => {
      process.env.NODE_ENV = 'production';
      const result = devOnly(() => 'should not execute');
      expect(result).toBeUndefined();
    });
  });

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  describe('devConsole', () => {
    let consoleLogSpy: any;
    let consoleTableSpy: any;
    let consoleGroupSpy: any;
    let consoleGroupEndSpy: any;
    let consoleTimeSpy: any;
    let consoleTimeEndSpy: any;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => undefined);
      consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => undefined);
      consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
      consoleTimeSpy = vi.spyOn(console, 'time').mockImplementation(() => undefined);
      consoleTimeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
      consoleTimeSpy.mockRestore();
      consoleTimeEndSpy.mockRestore();
    });

    describe('log', () => {
      it('should log objects with default label in development', () => {
        devConsole.log({ test: 'value' });
        expect(consoleLogSpy).toHaveBeenCalledWith('[DEV]', expect.stringContaining('test'));
      });

      it('should log objects with custom label in development', () => {
        devConsole.log({ test: 'value' }, 'custom');
        expect(consoleLogSpy).toHaveBeenCalledWith('[custom]', expect.stringContaining('test'));
      });

      it('should not log in production', () => {
        process.env.NODE_ENV = 'production';
        devConsole.log({ test: 'value' });
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });
    });

    describe('table', () => {
      it('should display table for arrays in development', () => {
        const data = [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ];
        devConsole.table(data);
        expect(consoleTableSpy).toHaveBeenCalledWith(data);
      });

      it('should display table for objects in development', () => {
        const data = { name: 'Alice', age: 30 };
        devConsole.table(data);
        expect(consoleTableSpy).toHaveBeenCalledWith(data);
      });

      it('should not display table in production', () => {
        process.env.NODE_ENV = 'production';
        devConsole.table({ test: 'value' });
        expect(consoleTableSpy).not.toHaveBeenCalled();
      });
    });

    describe('group', () => {
      it('should group console output in development', () => {
        const fn = vi.fn();
        devConsole.group('Test Group', fn);
        expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
        expect(fn).toHaveBeenCalled();
        expect(consoleGroupEndSpy).toHaveBeenCalled();
      });

      it('should end group even if function throws', () => {
        const fn = vi.fn(() => {
          throw new Error('Test error');
        });
        expect(() => devConsole.group('Error Group', fn)).toThrow('Test error');
        expect(consoleGroupSpy).toHaveBeenCalled();
        expect(consoleGroupEndSpy).toHaveBeenCalled();
      });

      it('should not group or execute function in production', () => {
        process.env.NODE_ENV = 'production';
        const fn = vi.fn(() => 'result');
        devConsole.group('Test Group', fn);
        expect(consoleGroupSpy).not.toHaveBeenCalled();
        expect(fn).not.toHaveBeenCalled();
        expect(consoleGroupEndSpy).not.toHaveBeenCalled();
      });
    });

    describe('time', () => {
      it('should time code execution in development', () => {
        const result = devConsole.time('test-timer', () => 42);
        expect(result).toBe(42);
        expect(consoleTimeSpy).toHaveBeenCalledWith('test-timer');
        expect(consoleTimeEndSpy).toHaveBeenCalledWith('test-timer');
      });

      it('should end timer even if function throws', () => {
        expect(() =>
          devConsole.time('error-timer', () => {
            throw new Error('Test error');
          }),
        ).toThrow('Test error');
        expect(consoleTimeSpy).toHaveBeenCalled();
        expect(consoleTimeEndSpy).toHaveBeenCalled();
      });

      it('should execute function but not time in production', () => {
        process.env.NODE_ENV = 'production';
        const result = devConsole.time('test-timer', () => 42);
        expect(result).toBe(42);
        expect(consoleTimeSpy).not.toHaveBeenCalled();
        expect(consoleTimeEndSpy).not.toHaveBeenCalled();
      });
    });
  });
});
