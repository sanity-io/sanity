import fs from 'node:fs'
import path from 'node:path'

import type {FullResult, Reporter, TestCase} from '@playwright/test/reporter'

/**
 * Custom Playwright reporter that outputs a JSON summary of test results.
 *
 * Writes `test-summary.json` with counts and failed file paths.
 * Used by the CI workflow to build PR comments with test summaries.
 *
 * Usage with merge-reports:
 *   npx playwright merge-reports --reporter html,./e2e/reporters/summary.ts blob-reports
 */
export default class SummaryReporter implements Reporter {
  private tests: TestCase[] = []

  onTestEnd(test: TestCase) {
    this.tests.push(test)
  }

  onEnd(_result: FullResult) {
    const cwd = process.cwd()
    const counts = {passed: 0, failed: 0, flaky: 0, skipped: 0}
    const failedFileSet = new Set<string>()

    // Deduplicate by test ID — onTestEnd is called per attempt (including retries),
    // so we only want the last attempt for each test.
    const lastByTestId = new Map<string, TestCase>()
    for (const test of this.tests) {
      lastByTestId.set(test.id, test)
    }

    for (const test of lastByTestId.values()) {
      switch (test.outcome()) {
        case 'expected':
          counts.passed++
          break
        case 'unexpected':
          counts.failed++
          if (test.location.file) failedFileSet.add(test.location.file)
          break
        case 'flaky':
          counts.flaky++
          break
        case 'skipped':
          counts.skipped++
          break
      }
    }

    const failedFiles = [...failedFileSet].map((f) => path.relative(cwd, f))
    const summary = {
      ...counts,
      failedFiles,
      // Pre-formatted for use in shell code blocks: each file on its own line with \
      failedFilesFormatted: failedFiles.join(' \\\n  '),
    }
    fs.writeFileSync('test-summary.json', JSON.stringify(summary))
  }
}
