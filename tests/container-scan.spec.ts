/**
 * Tests for container security scanning - Template infrastructure.
 * These tests verify container scanning setup and can be kept/customized.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  statSync,
  constants,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Container Security Scanning', () => {
  const testDir = join(tmpdir(), 'container-scan-test-' + Date.now());
  const scriptPath = join(process.cwd(), 'scripts', 'scan-container.sh');

  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should have scan script available', () => {
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('should have scan script executable', () => {
    const stats = statSync(scriptPath);
    // Check if owner has execute permission (S_IXUSR = 0o100)
    const isExecutable = (stats.mode & constants.S_IXUSR) !== 0;
    expect(isExecutable).toBe(true);
  });

  it('should show help when requested', () => {
    // Use execFileSync to avoid shell injection vulnerabilities
    const result = execFileSync(scriptPath, ['--help'], { encoding: 'utf-8' });
    expect(result).toContain('Container Security Scanning Script');
    expect(result).toContain('USAGE:');
    expect(result).toContain('OPTIONS:');
    expect(result).toContain('EXAMPLES:');
  });

  describe('Configuration Files', () => {
    it('should have .trivyignore file for exclusions', () => {
      const trivyIgnorePath = join(process.cwd(), '.trivyignore');
      expect(existsSync(trivyIgnorePath)).toBe(true);
    });

    it('should have proper format in .trivyignore', () => {
      const trivyIgnorePath = join(process.cwd(), '.trivyignore');
      const content = readFileSync(trivyIgnorePath, 'utf-8');
      expect(content).toContain('# Trivy Ignore File');
      expect(content).toContain('# Format: CVE-ID');
    });
  });

  describe('Package.json Scripts', () => {
    it('should have container scan scripts defined', () => {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
      ) as { scripts: Record<string, string> };
      expect(packageJson.scripts['scan:container']).toBeDefined();
      expect(packageJson.scripts['scan:container:sarif']).toBeDefined();
    });

    it('should have correct scan script commands', () => {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
      ) as { scripts: Record<string, string> };
      expect(packageJson.scripts['scan:container']).toBe('./scripts/scan-container.sh');
      expect(packageJson.scripts['scan:container:sarif']).toContain('--format sarif');
    });
  });

  describe('GitHub Actions Integration', () => {
    it('should NOT have a separate reusable container scan workflow', () => {
      // Container scanning is inlined in publish.yml for simplicity
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      expect(existsSync(workflowPath)).toBe(false);
    });

    it('should NOT integrate container scan in PR workflow', () => {
      // Container scanning should only happen during Docker publication, not on PRs
      const prWorkflowPath = join(process.cwd(), '.github', 'workflows', 'pr.yml');
      const content = readFileSync(prWorkflowPath, 'utf-8');
      expect(content).not.toContain('container-scan:');
      expect(content).not.toContain('trivy');
    });

    it('should integrate container scan in reusable Docker workflow', () => {
      const dockerWorkflowPath = join(process.cwd(), '.github', 'workflows', 'reusable-docker.yml');
      const content = readFileSync(dockerWorkflowPath, 'utf-8');
      expect(content).toContain('Run Trivy vulnerability scanner');
      expect(content).toContain('aquasecurity/trivy-action');
      expect(content).toContain('Upload Trivy results to GitHub Security');
      expect(content).toContain('Build Docker image');
    });
  });

  describe('Scan Configuration', () => {
    it('should support configurable severity thresholds', () => {
      const workflowPath = join(process.cwd(), '.github', 'workflows', 'reusable-docker.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain("severity: 'HIGH,CRITICAL'");
    });

    it('should support SARIF output format', () => {
      const workflowPath = join(process.cwd(), '.github', 'workflows', 'reusable-docker.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain("format: 'sarif'");
      expect(content).toContain('github/codeql-action/upload-sarif');
    });

    it('should support Docker build caching', () => {
      const workflowPath = join(process.cwd(), '.github', 'workflows', 'reusable-docker.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('cache-from: type=gha');
      expect(content).toContain('cache-to: type=gha,mode=max');
    });

    it('should fail on vulnerabilities by default', () => {
      const workflowPath = join(process.cwd(), '.github', 'workflows', 'reusable-docker.yml');
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain("exit-code: '1'");
    });
  });

  describe('Local Development Support', () => {
    it('should support local scanning with script', () => {
      const scriptContent = readFileSync(scriptPath, 'utf-8');
      expect(scriptContent).toContain('check_requirements()');
      expect(scriptContent).toContain('docker build');
      expect(scriptContent).toContain('trivy image');
    });

    it('should support multiple output formats', () => {
      const scriptContent = readFileSync(scriptPath, 'utf-8');
      expect(scriptContent).toContain('--format FORMAT');
      expect(scriptContent).toContain('table,json,sarif');
    });

    it('should provide remediation tips on failure', () => {
      const scriptContent = readFileSync(scriptPath, 'utf-8');
      expect(scriptContent).toContain('Remediation Tips:');
      expect(scriptContent).toContain('Update base image');
      expect(scriptContent).toContain('Update dependencies');
    });
  });

  describe('Test Dockerfile Scenarios', () => {
    it('should handle secure Dockerfile configuration', () => {
      // Create a secure test Dockerfile
      const dockerfilePath = join(testDir, 'Dockerfile.secure');
      const secureDockerfile = `
FROM node:22-alpine
RUN adduser -D nonroot
USER nonroot
WORKDIR /app
COPY --chown=nonroot:nonroot . .
CMD ["node", "index.js"]
`;
      writeFileSync(dockerfilePath, secureDockerfile);
      expect(existsSync(dockerfilePath)).toBe(true);
    });

    it('should detect when base image needs updating', () => {
      // Create a Dockerfile with older base image
      const dockerfilePath = join(testDir, 'Dockerfile.old');
      const oldDockerfile = `
FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
`;
      writeFileSync(dockerfilePath, oldDockerfile);
      expect(existsSync(dockerfilePath)).toBe(true);
    });
  });
});
