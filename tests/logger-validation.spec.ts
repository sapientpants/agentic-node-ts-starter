/**
 * Tests for logger validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateLogPath,
  validateSyslogHost,
  validateSyslogPort,
  validateFileMode,
  parseSizeToBytes,
  toPinoRollSize,
} from '../src/logger-validation.js';

describe('Logger Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validateLogPath', () => {
    it('should accept valid relative paths', () => {
      expect(() => validateLogPath('logs/app.log')).not.toThrow();
      expect(() => validateLogPath('./logs/app.log')).not.toThrow();
      expect(() => validateLogPath('var/log/myapp.log')).not.toThrow();
    });

    it('should accept valid absolute paths in safe directories', () => {
      expect(() => validateLogPath('/tmp/app.log')).not.toThrow();
      expect(() => validateLogPath('/var/log/myapp/app.log')).not.toThrow();
      expect(() => validateLogPath('/home/user/logs/app.log')).not.toThrow();
    });

    it('should reject paths with parent directory references', () => {
      expect(() => validateLogPath('../logs/app.log')).toThrow(
        'cannot contain parent directory references',
      );
      expect(() => validateLogPath('logs/../../../etc/passwd')).toThrow(
        'cannot contain parent directory references',
      );
      expect(() => validateLogPath('/var/log/../../../etc/passwd')).toThrow(
        'cannot contain parent directory references',
      );
      expect(() => validateLogPath('logs\\..\\app.log')).toThrow(
        'cannot contain parent directory references',
      );
    });

    it('should reject paths in restricted directories', () => {
      expect(() => validateLogPath('/etc/app.log')).toThrow('cannot be in restricted directory');
      expect(() => validateLogPath('/usr/bin/app.log')).toThrow(
        'cannot be in restricted directory',
      );
      expect(() => validateLogPath('/boot/app.log')).toThrow('cannot be in restricted directory');
      expect(() => validateLogPath('/root/app.log')).toThrow('cannot be in restricted directory');
      expect(() => validateLogPath('/etc')).toThrow('cannot be in restricted directory');
    });

    it('should only treat whole directories as restricted', () => {
      expect(() => validateLogPath('/etcetera/logs/app.log')).not.toThrow();
      expect(() => validateLogPath('/binaries/app.log')).not.toThrow();
      expect(() => validateLogPath('/rooted/app.log')).not.toThrow();
    });

    it('should allow paths inside the working directory even under a restricted root', () => {
      expect(() => validateLogPath('logs/app.log', { cwd: '/usr/src/app' })).not.toThrow();
      expect(() =>
        validateLogPath('/usr/src/app/logs/app.log', { cwd: '/usr/src/app' }),
      ).not.toThrow();
      expect(() => validateLogPath('/usr/src/other/app.log', { cwd: '/usr/src/app' })).toThrow(
        'cannot be in restricted directory',
      );
    });

    it('should reject Windows system directories when validating for win32', () => {
      const win32 = { platform: 'win32' as const, cwd: String.raw`C:\app` };
      expect(() => validateLogPath(String.raw`C:\Windows\System32\app.log`, win32)).toThrow(
        'cannot be in restricted directory',
      );
      expect(() => validateLogPath(String.raw`c:\windows\app.log`, win32)).toThrow(
        'cannot be in restricted directory',
      );
      expect(() => validateLogPath(String.raw`C:\Program Files\App\app.log`, win32)).toThrow(
        'cannot be in restricted directory',
      );
      expect(() => validateLogPath(String.raw`C:\WindowsLogs\app.log`, win32)).not.toThrow();
      expect(() => validateLogPath(String.raw`C:\Users\me\app.log`, win32)).not.toThrow();
      expect(() => validateLogPath(String.raw`logs\app.log`, win32)).not.toThrow();
      expect(() => validateLogPath('/etc/app.log', win32)).not.toThrow();
    });

    it('should reject paths with null bytes', () => {
      expect(() => validateLogPath('logs/app\0.log')).toThrow('cannot contain null bytes');
      expect(() => validateLogPath('logs/app.log\0')).toThrow('cannot contain null bytes');
    });

    it('should reject extremely long paths', () => {
      const longPath = 'a'.repeat(5000);
      expect(() => validateLogPath(longPath)).toThrow('path is too long');
    });

    it('should reject invalid input types', () => {
      expect(() => validateLogPath('')).toThrow('must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(() => validateLogPath(null as any)).toThrow('must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(() => validateLogPath(undefined as any)).toThrow('must be a non-empty string');
    });
  });

  describe('validateSyslogHost', () => {
    it('should accept valid hostnames', () => {
      expect(() => validateSyslogHost('localhost')).not.toThrow();
      expect(() => validateSyslogHost('syslog.example.com')).not.toThrow();
      expect(() => validateSyslogHost('log-server-01.internal')).not.toThrow();
      expect(() => validateSyslogHost('syslog')).not.toThrow();
    });

    it('should accept valid IP addresses', () => {
      expect(() => validateSyslogHost('192.168.1.1')).not.toThrow();
      expect(() => validateSyslogHost('10.0.0.1')).not.toThrow();
      expect(() => validateSyslogHost('127.0.0.1')).not.toThrow();
      expect(() => validateSyslogHost('::1')).not.toThrow();
      expect(() => validateSyslogHost('2001:db8::1')).not.toThrow();
    });

    it('should reject invalid hostnames', () => {
      expect(() => validateSyslogHost('-invalid.com')).toThrow('must be a valid hostname');
      expect(() => validateSyslogHost('invalid-.com')).toThrow('must be a valid hostname');
      expect(() => validateSyslogHost('invalid..com')).toThrow('must be a valid hostname');
      expect(() => validateSyslogHost('invalid@host.com')).toThrow('must be a valid hostname');
      expect(() => validateSyslogHost('invalid host.com')).toThrow('must be a valid hostname');
    });

    it('should warn about localhost in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      process.env.NODE_ENV = 'production';

      validateSyslogHost('localhost');
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('localhost for syslog in production'),
      );
      expect(stderrSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should reject extremely long hostnames', () => {
      const longHost = 'a'.repeat(300) + '.com';
      expect(() => validateSyslogHost(longHost)).toThrow('too long');
    });

    it('should reject invalid input types', () => {
      expect(() => validateSyslogHost('')).toThrow('must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(() => validateSyslogHost(null as any)).toThrow('must be a non-empty string');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(() => validateSyslogHost(undefined as any)).toThrow('must be a non-empty string');
    });
  });

  describe('validateSyslogPort', () => {
    it('should accept valid port numbers', () => {
      expect(() => validateSyslogPort(514)).not.toThrow();
      expect(() => validateSyslogPort(1234)).not.toThrow();
      expect(() => validateSyslogPort(65535)).not.toThrow();
      expect(() => validateSyslogPort(undefined)).not.toThrow(); // Optional
    });

    it('should reject invalid port numbers', () => {
      expect(() => validateSyslogPort(0)).toThrow('must be between 1 and 65535');
      expect(() => validateSyslogPort(-1)).toThrow('must be between 1 and 65535');
      expect(() => validateSyslogPort(65536)).toThrow('must be between 1 and 65535');
      expect(() => validateSyslogPort(100000)).toThrow('must be between 1 and 65535');
    });

    it('should reject non-integer values', () => {
      expect(() => validateSyslogPort(514.5)).toThrow('must be an integer');
      expect(() => validateSyslogPort(NaN)).toThrow('must be an integer');
    });

    it('should warn about privileged ports in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      process.env.NODE_ENV = 'production';

      validateSyslogPort(80);
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('privileged port'));
      expect(stderrSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });
  });

  describe('validateFileMode', () => {
    it('should accept valid octal modes', () => {
      expect(validateFileMode(0o640)).toBe(0o640);
      expect(validateFileMode(0o644)).toBe(0o644);
      expect(validateFileMode(0o600)).toBe(0o600);
      expect(validateFileMode('640')).toBe(0o640);
      expect(validateFileMode('0640')).toBe(0o640);
    });

    it('should return default for undefined', () => {
      expect(validateFileMode(undefined)).toBe(0o640);
    });

    it('should warn about overly permissive modes through the fallback logger', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      validateFileMode(0o666);
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('allow access to other users'),
      );

      stdoutSpy.mockClear();
      validateFileMode(0o777);
      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('allow access to other users'),
      );
      expect(stderrSpy).not.toHaveBeenCalled();

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should warn about invalid modes through the fallback logger', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      expect(validateFileMode('invalid')).toBe(0o640);
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid file mode'));
      expect(stderrSpy).not.toHaveBeenCalled();

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should return default for invalid modes', () => {
      expect(validateFileMode(-1)).toBe(0o640);
      expect(validateFileMode(0o1000)).toBe(0o640);
      expect(validateFileMode('invalid')).toBe(0o640);
      expect(validateFileMode(NaN)).toBe(0o640);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle unicode characters in file paths', () => {
      expect(() => validateLogPath('./logs/测试.log')).not.toThrow();
      expect(() => validateLogPath('./logs/café.log')).not.toThrow();
    });

    it('should reject paths with control characters', () => {
      expect(() => validateLogPath('./logs/app\u0001.log')).not.toThrow(); // Allow most control chars
      expect(() => validateLogPath('./logs/app\u0000.log')).toThrow('null bytes'); // But block null bytes
    });

    it('should handle very deep directory structures', () => {
      const deepPath = 'logs/' + 'deep/'.repeat(50) + 'app.log';
      if (deepPath.length <= 4096) {
        expect(() => validateLogPath(deepPath)).not.toThrow();
      }
    });

    it('should validate IPv6 addresses in syslog host', () => {
      expect(() => validateSyslogHost('2001:db8:85a3::8a2e:370:7334')).not.toThrow();
      expect(() => validateSyslogHost('::1')).not.toThrow();
      expect(() => validateSyslogHost('2001:db8::1')).not.toThrow();
      // Test clearly invalid IPv6 format
      expect(() => validateSyslogHost('2001:db8::g')).toThrow(); // Invalid hex character
    });

    it('should handle edge cases in hostname validation', () => {
      expect(() => validateSyslogHost('a')).not.toThrow(); // Single character
      expect(() => validateSyslogHost('1')).not.toThrow(); // Single digit
      expect(() => validateSyslogHost('a.b')).not.toThrow(); // Minimum domain
      expect(() => validateSyslogHost('xn--nxasmq6b')).not.toThrow(); // Punycode domain
    });

    it('should handle boundary values for ports', () => {
      expect(() => validateSyslogPort(1)).not.toThrow(); // Minimum valid port
      expect(() => validateSyslogPort(65535)).not.toThrow(); // Maximum valid port
      expect(() => validateSyslogPort(1023)).not.toThrow(); // Just below privileged
      expect(() => validateSyslogPort(1024)).not.toThrow(); // Just above privileged
    });
  });
  describe('parseSizeToBytes', () => {
    const KB = 1024;
    const MB = 1024 * KB;
    const GB = 1024 * MB;
    const TB = 1024 * GB;

    it('should parse plain byte counts', () => {
      expect(parseSizeToBytes('1024')).toBe(1024);
      expect(parseSizeToBytes('1024B')).toBe(1024);
    });

    it('should parse single-letter units', () => {
      expect(parseSizeToBytes('10K')).toBe(10 * KB);
      expect(parseSizeToBytes('10M')).toBe(10 * MB);
      expect(parseSizeToBytes('1G')).toBe(GB);
      expect(parseSizeToBytes('2T')).toBe(2 * TB);
    });

    it('should parse two-letter units such as 10MB', () => {
      expect(parseSizeToBytes('10MB')).toBe(10 * MB);
      expect(parseSizeToBytes('100KB')).toBe(100 * KB);
      expect(parseSizeToBytes('1GB')).toBe(GB);
    });

    it('should be case-insensitive and tolerate whitespace', () => {
      expect(parseSizeToBytes('10mb')).toBe(10 * MB);
      expect(parseSizeToBytes('1.5 G')).toBe(Math.floor(1.5 * GB));
      expect(parseSizeToBytes('100 KB')).toBe(100 * KB);
      expect(parseSizeToBytes(' 10M ')).toBe(10 * MB);
    });

    it('should floor fractional byte results', () => {
      expect(parseSizeToBytes('1.5K')).toBe(1536);
      expect(parseSizeToBytes('0.5')).toBeUndefined();
    });

    it('should return undefined for empty or invalid input', () => {
      expect(parseSizeToBytes(undefined)).toBeUndefined();
      expect(parseSizeToBytes('')).toBeUndefined();
      expect(parseSizeToBytes('   ')).toBeUndefined();
      expect(parseSizeToBytes('0')).toBeUndefined();
      expect(parseSizeToBytes('abc')).toBeUndefined();
      expect(parseSizeToBytes('10X')).toBeUndefined();
      expect(parseSizeToBytes('10MBB')).toBeUndefined();
      expect(parseSizeToBytes('-10M')).toBeUndefined();
      expect(parseSizeToBytes('10 M B')).toBeUndefined();
    });
  });

  describe('toPinoRollSize', () => {
    it('should produce a byte string pino-roll accepts', () => {
      expect(toPinoRollSize(10 * 1024 * 1024)).toBe('10485760b');
      expect(toPinoRollSize(1)).toBe('1b');
    });

    it('should floor non-integer byte counts', () => {
      expect(toPinoRollSize(1536.7)).toBe('1536b');
    });

    it('should round-trip common LOG_FILE_MAX_SIZE values into the pino-roll format', () => {
      // pino-roll's own parser only matches /^([\d.]+)(\w?)$/ with a b/k/m/g unit
      const pinoRollFormat = /^\d+b$/;
      for (const input of ['10M', '10MB', '1.5 G', '100 KB', '2T', '512']) {
        const bytes = parseSizeToBytes(input);
        expect(bytes).toBeDefined();
        expect(toPinoRollSize(bytes as number)).toMatch(pinoRollFormat);
      }
    });
  });
});
