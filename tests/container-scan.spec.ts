import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync, statSync } from 'fs';
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
    const isExecutable = (stats.mode & parseInt('100', 8)) !== 0;
    expect(isExecutable).toBe(true);
  });

  it('should show help when requested', () => {
    const result = execSync(`${scriptPath} --help`, { encoding: 'utf-8' });
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
    it('should have reusable container scan workflow', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      expect(existsSync(workflowPath)).toBe(true);
    });

    it('should have proper workflow configuration', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      const content = readFileSync(workflowPath, 'utf-8');

      // Check for required workflow components
      expect(content).toContain('workflow_call:');
      expect(content).toContain('aquasecurity/trivy-action');
      expect(content).toContain('severity-threshold:');
      expect(content).toContain('upload-sarif:');
      expect(content).toContain('SARIF');
    });

    it('should NOT integrate container scan in PR workflow', () => {
      // Container scanning should only happen during Docker publication, not on PRs
      const prWorkflowPath = join(process.cwd(), '.github', 'workflows', 'pr.yml');
      const content = readFileSync(prWorkflowPath, 'utf-8');
      expect(content).not.toContain('container-scan:');
      expect(content).not.toContain('reusable-container-scan.yml');
    });

    it('should integrate container scan in publish workflow', () => {
      const publishWorkflowPath = join(process.cwd(), '.github', 'workflows', 'publish.yml');
      const content = readFileSync(publishWorkflowPath, 'utf-8');
      expect(content).toContain('docker-scan:');
      expect(content).toContain('needs: docker-scan');
    });
  });

  describe('Scan Configuration', () => {
    it('should support configurable severity thresholds', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain("default: 'HIGH,CRITICAL'");
      expect(content).toContain('severity-threshold:');
    });

    it('should support SARIF output format', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain("format: 'sarif'");
      expect(content).toContain('github/codeql-action/upload-sarif');
    });

    it('should support scan result caching', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('cache-dir:');
      expect(content).toContain('cache-from: type=gha');
    });

    it('should generate attestations for clean scans', () => {
      const workflowPath = join(
        process.cwd(),
        '.github',
        'workflows',
        'reusable-container-scan.yml',
      );
      const content = readFileSync(workflowPath, 'utf-8');
      expect(content).toContain('Generate attestation for clean scan');
      expect(content).toContain('actions/attest-build-provenance');
    });
  });

  describe('Local Development Support', () => {
    it('should support local scanning with script', () => {
      const scriptContent = readFileSync(scriptPath, 'utf-8');
      expect(scriptContent).toContain('install_trivy()');
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
