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
      class Calculator {
        @timed
        double(x: number): number {
          return x * 2;
        }
      }

      expect(new Calculator().double(5)).toBe(10);
    });

    it('should time asynchronous methods in development', async () => {
      class Calculator {
        @timed
        async double(x: number): Promise<number> {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return x * 2;
        }
      }

      await expect(new Calculator().double(5)).resolves.toBe(10);
    });

    it('should preserve `this` and support static methods', () => {
      class Counter {
        static instances = 0;
        private count = 0;

        @timed
        increment(): number {
          this.count += 1;
          return this.count;
        }

        @timed
        static create(): Counter {
          Counter.instances += 1;
          return new Counter();
        }
      }

      const counter = Counter.create();
      counter.increment();
      expect(counter.increment()).toBe(2);
      expect(Counter.instances).toBe(1);
    });

    it('should handle errors in timed methods', () => {
      class Failing {
        @timed
        fail(): never {
          throw new Error('Test error');
        }
      }

      expect(() => new Failing().fail()).toThrow('Test error');
    });

    it('should handle errors in async timed methods', async () => {
      class Failing {
        @timed
        async fail(): Promise<never> {
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new Error('Async test error');
        }
      }

      await expect(new Failing().fail()).rejects.toThrow('Async test error');
    });

    it('should return the original method in production', () => {
      process.env.NODE_ENV = 'production';

      const original = function (this: unknown, x: number): number {
        return x * 2;
      };
      const context = {
        kind: 'method',
        name: 'double',
        static: false,
      } as ClassMethodDecoratorContext;

      expect(timed(original, context)).toBe(original);
    });

    it('should throw error when applied to a non-method', () => {
      const context = {
        kind: 'field',
        name: 'notAMethod',
      } as unknown as ClassMethodDecoratorContext;

      expect(() => timed(() => undefined, context)).toThrow(
        '@timed decorator can only be applied to methods',
      );
    });
  });

  describe('@trace decorator', () => {
    it('should trace synchronous method calls in development', () => {
      class MathService {
        @trace
        add(a: number, b: number): number {
          return a + b;
        }
      }

      expect(new MathService().add(2, 3)).toBe(5);
    });

    it('should trace successful async method calls', async () => {
      class DataService {
        @trace
        async fetchData(): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return 'data';
        }
      }

      await expect(new DataService().fetchData()).resolves.toBe('data');
    });

    it('should trace failed async method calls', async () => {
      class DataService {
        @trace
        async failingMethod(): Promise<never> {
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new Error('Async error');
        }
      }

      await expect(new DataService().failingMethod()).rejects.toThrow('Async error');
    });

    it('should trace errors in synchronous methods', () => {
      class Failing {
        @trace
        errorMethod(): never {
          throw new Error('Sync error');
        }
      }

      expect(() => new Failing().errorMethod()).toThrow('Sync error');
    });

    it('should trace static methods using the class name', () => {
      class Registry {
        @trace
        static describe(): string {
          return 'registry';
        }
      }

      expect(Registry.describe()).toBe('registry');
    });

    it('should return the original method in production', () => {
      process.env.NODE_ENV = 'production';

      const original = function (this: unknown, a: number, b: number): number {
        return a + b;
      };
      const context = { kind: 'method', name: 'add', static: false } as ClassMethodDecoratorContext;

      expect(trace(original, context)).toBe(original);
    });

    it('should throw error when applied to a non-method', () => {
      const context = {
        kind: 'getter',
        name: 'notAMethod',
      } as unknown as ClassMethodDecoratorContext;

      expect(() => trace(() => undefined, context)).toThrow(
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
