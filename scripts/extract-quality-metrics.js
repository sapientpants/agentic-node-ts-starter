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
function extractMetrics() {
  const timestamp = new Date().toISOString();
  const coverage = extractCoverageMetrics();
  const duplication = extractDuplicationMetrics();
  const mutation = extractMutationMetrics();
  const packageInfo = getPackageInfo();

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
      threshold: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
    duplication: {
      percentage: duplication.percentage,
      lines: duplication.lines,
      tokens: duplication.tokens,
      clones: duplication.clones,
      threshold: {
        percentage: 2,
      },
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
      threshold: {
        score: 80,
      },
    },
    complexity: {
      // These would need to be extracted from ESLint output
      // For now, we'll note the thresholds
      threshold: {
        cyclomatic: 10,
        maxLines: 50,
        maxParams: 4,
        maxDepth: 3,
        maxStatements: 15,
      },
    },
  };

  return metrics;
}

/**
 * Main function
 */
function main() {
  console.log('Extracting quality metrics...');

  const metrics = extractMetrics();

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

main();
