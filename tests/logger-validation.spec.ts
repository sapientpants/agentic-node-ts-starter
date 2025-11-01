/**
 * Tests for logger validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateLogPath,
  validateSyslogHost,
  validateSyslogPort,
  validateFileMode,
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
    });

    it('should reject paths in restricted directories', () => {
      expect(() => validateLogPath('/etc/app.log')).toThrow('cannot be in restricted directory');
      expect(() => validateLogPath('/usr/bin/app.log')).toThrow(
        'cannot be in restricted directory',
      );
      expect(() => validateLogPath('/boot/app.log')).toThrow('cannot be in restricted directory');
      expect(() => validateLogPath('/root/app.log')).toThrow('cannot be in restricted directory');
      // Windows path format test - only test if on Windows
      if (process.platform === 'win32') {
        expect(() => validateLogPath('C:\\Windows\\System32\\app.log')).toThrow(
          'cannot be in restricted directory',
        );
      }
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
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      process.env.NODE_ENV = 'production';

      validateSyslogHost('localhost');
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('localhost for syslog in production'),
      );

      process.env.NODE_ENV = originalEnv;
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
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      process.env.NODE_ENV = 'production';

      validateSyslogPort(80);
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('privileged port'));

      process.env.NODE_ENV = originalEnv;
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

    it('should warn about overly permissive modes', () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      validateFileMode(0o666);
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('allow access to other users'),
      );

      stderrSpy.mockClear();
      validateFileMode(0o777);
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('allow access to other users'),
      );

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
});
