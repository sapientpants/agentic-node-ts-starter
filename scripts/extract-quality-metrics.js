#!/usr/bin/env node

/**
 * Extract Quality Metrics Script
 *
 * This script extracts quality metrics from various report files and outputs
 * a consolidated quality-metrics.json file for use in README badges and dashboards.
 *
 * Metrics extracted:
 * - Test coverage (from coverage/coverage-summary.json)
 * - Code duplication (from reports/jscpd/html/jscpd-report.json)
 * - Mutation testing score (from reports/stryker-incremental.json, if available)
 *
 * Thresholds are read from the config files that enforce them (vitest.config.ts,
 * .jscpd.json, stryker.config.json, eslint.config.js) rather than hard-coded here,
 * so quality-metrics.json cannot drift from what the toolchain actually checks.
 *
 * Usage:
 *   node scripts/extract-quality-metrics.js
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Read JSON file with error handling
 */
function readJsonFile(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract test coverage metrics from coverage-summary.json
 */
function extractCoverageMetrics() {
  const coveragePath = join(projectRoot, 'coverage', 'coverage-summary.json');
  const coverage = readJsonFile(coveragePath);

  if (!coverage || !coverage.total) {
    console.warn('No coverage data found, using defaults');
    return {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0,
    };
  }

  return {
    lines: coverage.total.lines.pct,
    statements: coverage.total.statements.pct,
    functions: coverage.total.functions.pct,
    branches: coverage.total.branches.pct,
  };
}

/**
 * Extract code duplication metrics from jscpd report
 */
function extractDuplicationMetrics() {
  const jscpdPath = join(projectRoot, 'reports', 'jscpd', 'html', 'jscpd-report.json');
  const jscpd = readJsonFile(jscpdPath);

  if (!jscpd || !jscpd.statistics || !jscpd.statistics.total) {
    console.warn('No duplication data found, using defaults');
    return {
      percentage: 0,
      lines: 0,
      tokens: 0,
      clones: 0,
    };
  }

  const total = jscpd.statistics.total;
  return {
    percentage: total.percentage || 0,
    lines: total.duplicatedLines || 0,
    tokens: total.duplicatedTokens || 0,
    clones: total.clones || 0,
  };
}

/**
 * Extract mutation testing score from Stryker report
 */
function extractMutationMetrics() {
  const strykerPath = join(projectRoot, 'reports', 'stryker-incremental.json');
  const stryker = readJsonFile(strykerPath);

  if (!stryker || !stryker.files) {
    console.warn('No mutation testing data found, using defaults');
    return {
      mutationScore: null,
      killed: 0,
      survived: 0,
      timeout: 0,
      noCoverage: 0,
      ignored: 0,
      runtimeErrors: 0,
      compileErrors: 0,
      totalMutants: 0,
    };
  }

  // Calculate aggregated mutation score from all files
  let totalKilled = 0;
  let totalSurvived = 0;
  let totalTimeout = 0;
  let totalNoCoverage = 0;
  let totalIgnored = 0;
  let totalRuntimeErrors = 0;
  let totalCompileErrors = 0;

  Object.values(stryker.files).forEach((file) => {
    totalKilled += file.killed || 0;
    totalSurvived += file.survived || 0;
    totalTimeout += file.timeout || 0;
    totalNoCoverage += file.noCoverage || 0;
    totalIgnored += file.ignored || 0;
    totalRuntimeErrors += file.runtimeErrors || 0;
    totalCompileErrors += file.compileErrors || 0;
  });

  const totalMutants =
    totalKilled +
    totalSurvived +
    totalTimeout +
    totalNoCoverage +
    totalIgnored +
    totalRuntimeErrors +
    totalCompileErrors;

  // Runtime errors are counted as detected (mutants that cause observable failures)
  const totalDetected = totalKilled + totalTimeout + totalRuntimeErrors;
  const totalValid = totalMutants - totalIgnored - totalCompileErrors;
  const mutationScore = totalValid > 0 ? Math.round((totalDetected / totalValid) * 100) : null;

  return {
    mutationScore,
    killed: totalKilled,
    survived: totalSurvived,
    timeout: totalTimeout,
    noCoverage: totalNoCoverage,
    ignored: totalIgnored,
    runtimeErrors: totalRuntimeErrors,
    compileErrors: totalCompileErrors,
    totalMutants,
  };
}

/**
 * Coverage thresholds enforced by `pnpm test:coverage`. Node strips the type
 * annotations from vitest.config.ts natively, so it is imported as-is.
 */
async function loadCoverageThresholds() {
  const { default: vitestConfig } = await import('../vitest.config.ts');
  const thresholds = vitestConfig.test?.coverage?.thresholds;
  if (!thresholds) {
    throw new Error('vitest.config.ts does not define test.coverage.thresholds');
  }
  const { lines, statements, functions, branches } = thresholds;
  return { lines, statements, functions, branches };
}

/**
 * Duplication threshold enforced by `pnpm duplication` (jscpd).
 */
function loadDuplicationThreshold() {
  const jscpd = readJsonFile(join(projectRoot, '.jscpd.json'));
  if (typeof jscpd?.threshold !== 'number') {
    throw new Error('.jscpd.json does not define a numeric threshold');
  }
  return { percentage: jscpd.threshold };
}

/**
 * Mutation score thresholds from stryker.config.json: `high` is the target score,
 * `break` is the score below which `pnpm mutation-test` fails.
 */
function loadMutationThresholds() {
  const stryker = readJsonFile(join(projectRoot, 'stryker.config.json'));
  const thresholds = stryker?.thresholds;
  if (typeof thresholds?.high !== 'number' || typeof thresholds?.break !== 'number') {
    throw new Error(
      'stryker.config.json does not define numeric thresholds.high and thresholds.break',
    );
  }
  return { score: thresholds.high, break: thresholds.break };
}

/**
 * ESLint limit rules are configured as `['error', 10]` or `['error', { max: 10 }]`.
 */
function ruleLimit(rule) {
  const option = Array.isArray(rule) ? rule[1] : undefined;
  if (typeof option === 'number') {
    return option;
  }
  if (typeof option?.max === 'number') {
    return option.max;
  }
  throw new Error(`Cannot read a numeric limit from ESLint rule ${JSON.stringify(rule)}`);
}

/**
 * Complexity limits enforced by `pnpm lint` on production code (the `src/` block of
 * eslint.config.js; test files have their own relaxed block).
 */
async function loadComplexityThresholds() {
  const { default: eslintConfig } = await import('../eslint.config.js');
  const block = eslintConfig.find(
    (config) =>
      config.rules?.complexity !== undefined &&
      (config.files ?? []).some((pattern) => pattern.startsWith('src/')),
  );
  if (!block) {
    throw new Error('eslint.config.js has no src/ block with a complexity rule');
  }
  return {
    cyclomatic: ruleLimit(block.rules.complexity),
    maxLines: ruleLimit(block.rules['max-lines-per-function']),
    maxParams: ruleLimit(block.rules['max-params']),
    maxDepth: ruleLimit(block.rules['max-depth']),
    maxStatements: ruleLimit(block.rules['max-statements']),
  };
}

/**
 * Read package.json once and extract version info
 */
function getPackageInfo() {
  const packagePath = join(projectRoot, 'package.json');
  const packageJson = readJsonFile(packagePath);
  return {
    version: packageJson?.version || '0.0.0',
    nodeVersion: packageJson?.engines?.node || '>=22.0.0',
  };
}

/**
 * Main extraction function
 */
async function extractMetrics() {
  const timestamp = new Date().toISOString();
  const coverage = extractCoverageMetrics();
  const duplication = extractDuplicationMetrics();
  const mutation = extractMutationMetrics();
  const packageInfo = getPackageInfo();
  const thresholds = {
    coverage: await loadCoverageThresholds(),
    duplication: loadDuplicationThreshold(),
    mutation: loadMutationThresholds(),
    complexity: await loadComplexityThresholds(),
  };

  const metrics = {
    schemaVersion: '1.0.0',
    generatedAt: timestamp,
    version: packageInfo.version,
    nodeVersion: packageInfo.nodeVersion,
    coverage: {
      lines: coverage.lines,
      statements: coverage.statements,
      functions: coverage.functions,
      branches: coverage.branches,
      threshold: thresholds.coverage,
    },
    duplication: {
      percentage: duplication.percentage,
      lines: duplication.lines,
      tokens: duplication.tokens,
      clones: duplication.clones,
      threshold: thresholds.duplication,
    },
    mutation: {
      score: mutation.mutationScore,
      killed: mutation.killed,
      survived: mutation.survived,
      timeout: mutation.timeout,
      noCoverage: mutation.noCoverage,
      ignored: mutation.ignored,
      runtimeErrors: mutation.runtimeErrors,
      compileErrors: mutation.compileErrors,
      totalMutants: mutation.totalMutants,
      threshold: thresholds.mutation,
    },
    complexity: {
      // Measured values would need ESLint output; only the enforced limits are recorded.
      threshold: thresholds.complexity,
    },
  };

  return metrics;
}

/**
 * Main function
 */
async function main() {
  console.log('Extracting quality metrics...');

  const metrics = await extractMetrics();

  const outputPath = join(projectRoot, 'quality-metrics.json');
  writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n');

  console.log(`✓ Quality metrics extracted to ${outputPath}`);
  console.log('\nSummary:');
  console.log(
    `  Coverage: ${metrics.coverage.lines}% lines, ${metrics.coverage.branches}% branches`,
  );
  console.log(
    `  Duplication: ${metrics.duplication.percentage}% (${metrics.duplication.clones} clones)`,
  );
  console.log(
    `  Mutation Score: ${metrics.mutation.score !== null ? `${metrics.mutation.score}%` : 'N/A'}`,
  );
}

await main();
