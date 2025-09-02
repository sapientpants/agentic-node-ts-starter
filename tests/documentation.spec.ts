/**
 * Tests for documentation - Template infrastructure.
 * These tests verify documentation quality and can be kept/customized.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

describe('Documentation', () => {
  describe('Required Documentation Files', () => {
    const requiredDocs = [
      'README.md',
      'CLAUDE.md',
      'docs/GETTING_STARTED.md',
      'docs/TROUBLESHOOTING.md',
      'docs/PROCESS.md',
      'docs/OBSERVABILITY.md',
    ];

    requiredDocs.forEach((doc) => {
      it(`should have ${doc}`, () => {
        const docPath = join(projectRoot, doc);
        expect(existsSync(docPath), `Missing required documentation: ${doc}`).toBe(true);
      });
    });
  });

  describe('Documentation Links', () => {
    it('should have valid internal links in README', () => {
      const readmePath = join(projectRoot, 'README.md');
      const readmeContent = readFileSync(readmePath, 'utf-8');

      // Extract markdown links
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links: Array<{ text: string; url: string }> = [];
      let match;

      while ((match = linkPattern.exec(readmeContent)) !== null) {
        links.push({ text: match[1] ?? '', url: match[2] ?? '' });
      }

      // Check internal links (starting with ./ or ../)
      const internalLinks = links.filter(
        (link) => link.url.startsWith('./') || link.url.startsWith('../'),
      );

      internalLinks.forEach((link) => {
        // Remove anchors for file existence check
        const cleanUrl = link.url.split('#')[0] ?? '';
        const linkPath = join(projectRoot, cleanUrl);
        expect(existsSync(linkPath), `Broken link in README: [${link.text}](${link.url})`).toBe(
          true,
        );
      });
    });
  });

  describe('Code Examples in Documentation', () => {
    it('should have valid TypeScript syntax in code blocks', () => {
      const docsToCheck = ['docs/GETTING_STARTED.md', 'CLAUDE.md'];

      docsToCheck.forEach((docFile) => {
        const docPath = join(projectRoot, docFile);
        if (!existsSync(docPath)) return;

        const content = readFileSync(docPath, 'utf-8');

        // Extract TypeScript code blocks
        const tsCodeBlockPattern = /```(?:typescript|ts)\n([\s\S]*?)```/g;
        const codeBlocks: string[] = [];
        let match;

        while ((match = tsCodeBlockPattern.exec(content)) !== null) {
          if (match[1]) {
            codeBlocks.push(match[1]);
          }
        }

        // Basic syntax checks (not full compilation)
        codeBlocks.forEach((code, index) => {
          // Check for common syntax errors
          const openBraces = (code.match(/{/g) || []).length;
          const closeBraces = (code.match(/}/g) || []).length;
          expect(openBraces, `Unbalanced braces in ${docFile} code block ${index + 1}`).toBe(
            closeBraces,
          );

          const openParens = (code.match(/\(/g) || []).length;
          const closeParens = (code.match(/\)/g) || []).length;
          expect(openParens, `Unbalanced parentheses in ${docFile} code block ${index + 1}`).toBe(
            closeParens,
          );
        });
      });
    });
  });

  describe('Commands in Documentation', () => {
    it('should have valid npm scripts referenced in docs', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
        scripts: Record<string, string>;
      };
      const availableScripts = Object.keys(packageJson.scripts);

      const docsToCheck = [
        'README.md',
        'docs/GETTING_STARTED.md',
        'docs/TROUBLESHOOTING.md',
        'CLAUDE.md',
      ];

      docsToCheck.forEach((docFile) => {
        const docPath = join(projectRoot, docFile);
        if (!existsSync(docPath)) return;

        const content = readFileSync(docPath, 'utf-8');

        // Find pnpm commands in code blocks only (must be within backticks)
        // Match: `pnpm command` but not flags like --version
        const commandPattern = /`pnpm\s+([a-z:_]+[a-z:]*)`/g;
        const commands: string[] = [];
        let match;

        while ((match = commandPattern.exec(content)) !== null) {
          if (match[1]) {
            commands.push(match[1]);
          }
        }

        // Check if commands exist in package.json
        commands.forEach((cmd) => {
          // Skip common pnpm/npm commands that aren't in scripts
          const skipCommands = [
            'install',
            'init',
            'ci',
            'add',
            'remove',
            'update',
            'dedupe',
            'prune',
            'audit',
            'outdated',
            'why',
            'list',
            'run',
            'exec',
            'dlx',
            'create',
            'link',
            'unlink',
            'publish',
            'pack',
            'store',
            'config',
          ];
          if (skipCommands.includes(cmd)) return;

          expect(
            availableScripts.includes(cmd),
            `Invalid command "pnpm ${cmd}" in ${docFile}. Available: ${availableScripts.join(', ')}`,
          ).toBe(true);
        });
      });
    });
  });

  describe('Version Requirements', () => {
    it('should have consistent version requirements across docs', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
        engines?: { node?: string };
        packageManager?: string;
      };
      const requiredNodeVersion = packageJson.engines?.node || '';
      const requiredPnpmVersion = packageJson.packageManager?.split('@')[1] ?? '';

      const docsToCheck = ['README.md', 'docs/GETTING_STARTED.md'];

      docsToCheck.forEach((docFile) => {
        const docPath = join(projectRoot, docFile);
        if (!existsSync(docPath)) return;

        const content = readFileSync(docPath, 'utf-8');

        // Check Node.js version mentions
        if (requiredNodeVersion && content.includes('Node')) {
          const nodeVersionPattern = /Node\.js\s+(?:>=?\s*)?(\d+)/gi;
          const matches = [...content.matchAll(nodeVersionPattern)];

          matches.forEach((match) => {
            const mentionedVersion = match[1];
            const requiredMajor = requiredNodeVersion.match(/\d+/)?.[0] || '';
            expect(mentionedVersion, `Inconsistent Node.js version in ${docFile}`).toBe(
              requiredMajor,
            );
          });
        }

        // Check pnpm version mentions
        if (requiredPnpmVersion && content.includes('pnpm')) {
          const pnpmVersionPattern = /pnpm[@\s]+(\d+\.\d+\.\d+)/gi;
          const matches = [...content.matchAll(pnpmVersionPattern)];

          matches.forEach((match) => {
            const mentionedVersion = match[1];
            expect(mentionedVersion, `Inconsistent pnpm version in ${docFile}`).toBe(
              requiredPnpmVersion,
            );
          });
        }
      });
    });
  });
});
