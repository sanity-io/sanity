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
  private passed = 0
  private failed = 0
  private flaky = 0
  private skipped = 0
  private failedFiles = new Set<string>()

  onTestEnd(test: TestCase) {
    switch (test.outcome()) {
      case 'expected':
        this.passed++
        break
      case 'unexpected':
        this.failed++
        if (test.location.file) this.failedFiles.add(test.location.file)
        break
      case 'flaky':
        this.flaky++
        break
      case 'skipped':
        this.skipped++
        break
    }
  }

  onEnd(_result: FullResult) {
    const cwd = process.cwd()
    const failedFiles = [...this.failedFiles].map((f) => path.relative(cwd, f))
    const summary = {
      passed: this.passed,
      failed: this.failed,
      flaky: this.flaky,
      skipped: this.skipped,
      failedFiles,
      // Pre-formatted for use in shell code blocks: each file on its own line with \
      failedFilesFormatted: failedFiles.join(' \\\n  '),
    }
    fs.writeFileSync('test-summary.json', JSON.stringify(summary))
  }
}
