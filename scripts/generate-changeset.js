#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Generate a changeset from conventional commits since the last tag
 */

// Get the last tag or use entire history
function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

// Get commits since last tag
function getCommitsSinceTag(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const commits = execSync(`git log ${range} --pretty=format:"%H|%s|%b"`, { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, body = ''] = line.split('|');
      return { hash, subject, body };
    });

  return commits;
}

// Parse conventional commit
function parseCommit(commit) {
  const conventionalRegex =
    /^(feat|fix|docs|style|refactor|perf|test|chore|revert)(\(.+\))?(!)?:\s*(.+)$/;
  const match = commit.subject.match(conventionalRegex);

  if (!match) return null;

  const [, type, scope, breaking, description] = match;
  const isBreaking = breaking === '!' || commit.body.includes('BREAKING CHANGE');

  return {
    type,
    scope: scope?.replace(/[()]/g, ''),
    breaking: isBreaking,
    description,
    hash: commit.hash.substring(0, 7),
  };
}

// Determine version bump type
function getVersionBump(commits) {
  const parsed = commits.map(parseCommit).filter(Boolean);

  if (parsed.length === 0) return null;

  // Check for breaking changes
  if (parsed.some((c) => c.breaking)) {
    return 'major';
  }

  // Check for features
  if (parsed.some((c) => c.type === 'feat')) {
    return 'minor';
  }

  // Check for fixes
  if (parsed.some((c) => c.type === 'fix' || c.type === 'perf')) {
    return 'patch';
  }

  // No releasable changes
  return null;
}

// Generate changeset content
function generateChangesetContent(commits, bump) {
  const parsed = commits.map(parseCommit).filter(Boolean);
  const packageName = JSON.parse(execSync('cat package.json', { encoding: 'utf-8' })).name;

  // Group commits by type
  const grouped = {};
  parsed.forEach((commit) => {
    if (!grouped[commit.type]) {
      grouped[commit.type] = [];
    }
    grouped[commit.type].push(commit);
  });

  // Build description
  let description = [];

  // Add breaking changes first
  const breaking = parsed.filter((c) => c.breaking);
  if (breaking.length > 0) {
    description.push('### ⚠️ Breaking Changes\n');
    breaking.forEach((c) => {
      description.push(`- ${c.description} (${c.hash})`);
    });
    description.push('');
  }

  // Add features
  if (grouped.feat) {
    description.push('### ✨ Features\n');
    grouped.feat.forEach((c) => {
      if (!c.breaking) {
        description.push(`- ${c.scope ? `**${c.scope}**: ` : ''}${c.description} (${c.hash})`);
      }
    });
    description.push('');
  }

  // Add fixes
  if (grouped.fix) {
    description.push('### 🐛 Bug Fixes\n');
    grouped.fix.forEach((c) => {
      description.push(`- ${c.scope ? `**${c.scope}**: ` : ''}${c.description} (${c.hash})`);
    });
    description.push('');
  }

  // Add performance improvements
  if (grouped.perf) {
    description.push('### ⚡ Performance\n');
    grouped.perf.forEach((c) => {
      description.push(`- ${c.scope ? `**${c.scope}**: ` : ''}${c.description} (${c.hash})`);
    });
    description.push('');
  }

  return `---
"${packageName}": ${bump}
---

${description.join('\n').trim()}
`;
}

// Main function
function main() {
  const lastTag = getLastTag();
  // eslint-disable-next-line no-console
  console.log(`📊 Analyzing commits since: ${lastTag || 'beginning'}`);

  const commits = getCommitsSinceTag(lastTag);

  if (commits.length === 0) {
    // eslint-disable-next-line no-console
    console.log('⏭️ No commits found');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Found ${commits.length} commits`);

  const bump = getVersionBump(commits);

  if (!bump) {
    // eslint-disable-next-line no-console
    console.log('⏭️ No releasable changes found (only chore/docs/style/test commits)');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`📝 Generating ${bump} changeset`);

  // Create .changeset directory if it doesn't exist
  const changesetDir = join(process.cwd(), '.changeset');
  if (!existsSync(changesetDir)) {
    mkdirSync(changesetDir, { recursive: true });
  }

  // Generate random changeset name
  const adjectives = ['brave', 'clever', 'kind', 'quick', 'gentle', 'happy', 'wise', 'calm'];
  const nouns = ['pandas', 'kittens', 'puppies', 'dolphins', 'eagles', 'foxes', 'owls', 'tigers'];
  const verbs = ['dance', 'sing', 'jump', 'play', 'swim', 'fly', 'run', 'laugh'];

  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${verbs[Math.floor(Math.random() * verbs.length)]}`;
  const filename = join(changesetDir, `${name}.md`);

  // Generate and write changeset
  const content = generateChangesetContent(commits, bump);
  writeFileSync(filename, content);

  // eslint-disable-next-line no-console
  console.log(`✅ Created changeset: ${filename}`);
  // eslint-disable-next-line no-console
  console.log(`📦 Version bump: ${bump}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
