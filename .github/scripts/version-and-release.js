#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

const exec = (cmd) => execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
// eslint-disable-next-line no-console
const log = (msg) => console.log(msg);

async function main() {
  try {
    // Check for changesets
    const hasChangesets =
      fs.existsSync('.changeset') &&
      fs.readdirSync('.changeset').some((f) => f.endsWith('.md') && f !== 'README.md');

    if (!hasChangesets) {
      // Check for releasable commits
      let lastTag = '';
      try {
        lastTag = exec('git describe --tags --abbrev=0');
      } catch {
        lastTag = '';
      }

      const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const commits = exec(`git log ${commitRange} --pretty=format:"%s"`).split('\n');
      const hasReleasableCommits = commits.some((c) =>
        /^(feat|fix|perf|refactor)(\(.+\))?:/.test(c),
      );

      if (!hasReleasableCommits) {
        log('⏭️ No releasable commits found, skipping release');
        process.exit(0);
      }

      log('❌ Found releasable commits but no changeset');
      log('Commits that require a changeset:');
      commits
        .filter((c) => /^(feat|fix|perf|refactor)(\(.+\))?:/.test(c))
        .forEach((c) => log(`  - ${c}`));
      log('\nPlease add a changeset by running: pnpm changeset');
      process.exit(1);
    }

    // Get current version
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const currentVersion = pkg.version;
    log(`Current version: ${currentVersion}`);

    // Apply changesets
    exec('pnpm changeset version');

    // Check if version changed
    const updatedPkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const newVersion = updatedPkg.version;

    if (currentVersion === newVersion) {
      log('⏭️ No version change');
      process.exit(0);
    }

    log(`📦 Version changed to: ${newVersion}`);

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=true\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
