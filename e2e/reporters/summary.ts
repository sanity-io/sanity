import fs from 'node:fs'
import path from 'node:path'

import {
  type FullResult,
  type Reporter,
  type TestCase,
  type TestError,
  type TestResult,
} from '@playwright/test/reporter'

// Matches ANSI CSI color/style sequences that Playwright embeds in error output.
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

function formatError(error: TestError): string {
  const parts: string[] = []
  // `stack` includes the message; fall back to `message` when there is no stack.
  const body = error.stack || error.message
  if (body) parts.push(stripAnsi(body))
  if (error.snippet) parts.push(stripAnsi(error.snippet))
  return parts.join('\n\n')
}

/**
 * Playwright attaches `error-context.md` (an ARIA/YAML snapshot of the page at
 * the moment of failure, intended for AI agents) to every failed test.
 */
function readErrorContext(result: TestResult): string | undefined {
  const attachment = result.attachments.find((a) => a.name === 'error-context')
  if (!attachment) return undefined
  if (attachment.body) return attachment.body.toString('utf8')
  if (attachment.path && fs.existsSync(attachment.path)) {
    return fs.readFileSync(attachment.path, 'utf8')
  }
  return undefined
}

function formatFailedTest(test: TestCase, relativeFile: string): string {
  const lines: string[] = []
  const title = test.titlePath().filter(Boolean).join(' › ')
  const outcome = test.outcome()
  const icon = outcome === 'flaky' ? '⚠️' : '❌'
  lines.push(`## ${icon} ${title}`)
  lines.push('')
  lines.push(`- Location: \`${relativeFile}:${test.location.line}:${test.location.column}\``)
  const projectName = test.parent.project()?.name
  if (projectName) lines.push(`- Browser (Playwright project): ${projectName}`)
  if (outcome === 'flaky') {
    lines.push(`- Status: flaky — failed, then passed on retry (${test.results.length} attempts)`)
  } else {
    lines.push(
      `- Status: failed (${test.results.length} attempt${test.results.length === 1 ? '' : 's'}, all failed)`,
    )
  }
  lines.push('')

  const lastFailed = [...test.results].reverse().find((r) => r.errors.length > 0)
  if (lastFailed) {
    const attemptLabel =
      test.results.length > 1 ? ` (attempt ${lastFailed.retry + 1} of ${test.results.length})` : ''
    lines.push(`### Error${attemptLabel}`)
    lines.push('')
    lines.push('```')
    lines.push(lastFailed.errors.map(formatError).join('\n\n'))
    lines.push('```')
    lines.push('')

    const errorContext = readErrorContext(lastFailed)
    if (errorContext) {
      lines.push('### Page snapshot at the moment of failure')
      lines.push('')
      lines.push(errorContext.trim())
      lines.push('')
    }

    const otherAttachments = lastFailed.attachments.filter(
      (a) => a.name !== 'error-context' && !a.name.startsWith('_'),
    )
    if (otherAttachments.length > 0) {
      lines.push('### Other attachments (available in the HTML report at this deployment root)')
      lines.push('')
      for (const attachment of otherAttachments) {
        lines.push(`- ${attachment.name} (${attachment.contentType})`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Custom Playwright reporter that outputs machine-readable test results.
 *
 * Writes two files (used by the CI `merge-reports` / `deploy-report` jobs):
 * - `test-summary.json` — counts and failed file paths, used to build the PR comment.
 * - `playwright-report/agent-report.md` — a plain-markdown failure digest (error
 *   messages, code snippets, and Playwright's error-context page snapshots) meant
 *   to be fetched by AI agents in a single request. It is deployed alongside the
 *   HTML report, at `<report-url>/agent-report.md`.
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
    const failedTests: TestCase[] = []
    const flakyTests: TestCase[] = []

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
          failedTests.push(test)
          if (test.location.file) failedFileSet.add(test.location.file)
          break
        case 'flaky':
          counts.flaky++
          flakyTests.push(test)
          break
        case 'skipped':
          counts.skipped++
          break
      }
    }

    const failedFiles = [...failedFileSet].map((f) => path.relative(cwd, f))
    const summary = {
      ...counts,
      hasFailures: counts.failed > 0,
      failedFiles,
      // Pre-formatted for use in shell code blocks: each file on its own line with \
      failedFilesFormatted: failedFiles.join(' \\\n  '),
    }
    fs.writeFileSync('test-summary.json', JSON.stringify(summary))

    this.writeAgentReport(cwd, _result.status, counts, failedTests, flakyTests)
  }

  private writeAgentReport(
    cwd: string,
    runStatus: FullResult['status'],
    counts: {passed: number; failed: number; flaky: number; skipped: number},
    failedTests: TestCase[],
    flakyTests: TestCase[],
  ) {
    const lines: string[] = []
    lines.push('# E2E test report (agent-friendly)')
    lines.push('')
    lines.push(
      'Plain-markdown digest of the Playwright e2e run, generated for AI agents. The interactive HTML report (screenshots, videos, traces) is served from this same deployment root.',
    )
    lines.push('')

    const runUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined
    if (process.env.GITHUB_SHA) lines.push(`- Commit: ${process.env.GITHUB_SHA}`)
    if (runUrl) lines.push(`- Workflow run: ${runUrl}`)
    lines.push(
      `- Summary: ${counts.passed} passed, ${counts.failed} failed, ${counts.flaky} flaky, ${counts.skipped} skipped`,
    )
    lines.push('')

    if (failedTests.length === 0 && flakyTests.length === 0) {
      if (runStatus === 'passed' && counts.skipped === 0) {
        lines.push('All tests passed — no failures to report.')
      } else {
        lines.push(
          `No unexpected or flaky test results. Run status: ${runStatus}. ${counts.passed} passed, ${counts.skipped} skipped.`,
        )
      }
      lines.push('')
    } else {
      for (const test of [...failedTests, ...flakyTests]) {
        const relativeFile = path.relative(cwd, test.location.file)
        lines.push(formatFailedTest(test, relativeFile))
        lines.push('')
      }
    }

    const failedByProject = groupFailedFilesByProject(cwd, failedTests)
    if (failedByProject.size > 0) {
      lines.push('## How to reproduce locally')
      lines.push('')
      lines.push('From the repository root:')
      lines.push('')
      for (const [projectName, files] of failedByProject) {
        lines.push(...formatReproCommand(projectName, files))
        lines.push('')
      }
    }

    const reportDir = path.join(cwd, 'playwright-report')
    fs.mkdirSync(reportDir, {recursive: true})
    fs.writeFileSync(path.join(reportDir, 'agent-report.md'), lines.join('\n'))
  }
}

function groupFailedFilesByProject(cwd: string, failedTests: TestCase[]): Map<string, string[]> {
  const byProject = new Map<string, string[]>()
  for (const test of failedTests) {
    const projectName = test.parent.project()?.name ?? ''
    const relativeFile = path.relative(cwd, test.location.file)
    const files = byProject.get(projectName) ?? []
    if (!files.includes(relativeFile)) files.push(relativeFile)
    byProject.set(projectName, files)
  }
  return byProject
}

function datasetForProject(projectName: string): string | undefined {
  if (projectName === 'firefox') {
    return process.env.SANITY_E2E_DATASET_FIREFOX || process.env.SANITY_E2E_DATASET
  }
  if (projectName === 'chromium') {
    return process.env.SANITY_E2E_DATASET_CHROMIUM || process.env.SANITY_E2E_DATASET
  }
  return process.env.SANITY_E2E_DATASET
}

function formatReproCommand(projectName: string, files: string[]): string[] {
  const dataset = datasetForProject(projectName)
  const envLines = [
    process.env.SANITY_E2E_PROJECT_ID
      ? `SANITY_E2E_PROJECT_ID=${process.env.SANITY_E2E_PROJECT_ID} \\`
      : undefined,
    process.env.SANITY_E2E_BASE_URL
      ? `SANITY_E2E_BASE_URL=${process.env.SANITY_E2E_BASE_URL} \\`
      : undefined,
    dataset ? `SANITY_E2E_DATASET=${dataset} \\` : undefined,
    process.env.SANITY_E2E_DATASET_CHROMIUM
      ? `SANITY_E2E_DATASET_CHROMIUM=${process.env.SANITY_E2E_DATASET_CHROMIUM} \\`
      : undefined,
    process.env.SANITY_E2E_DATASET_FIREFOX
      ? `SANITY_E2E_DATASET_FIREFOX=${process.env.SANITY_E2E_DATASET_FIREFOX} \\`
      : undefined,
  ].filter((line) => line !== undefined)

  const projectFlag = projectName ? ` --project ${projectName}` : ''
  return [
    '```sh',
    ...envLines,
    `pnpm test:e2e${projectFlag} \\`,
    `  ${files.join(' \\\n  ')}`,
    '```',
  ]
}
