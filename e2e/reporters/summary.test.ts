import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {type FullResult, type TestCase, type TestResult} from '@playwright/test/reporter'
import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import SummaryReporter from './summary'

const ESC = String.fromCharCode(27)

const PASSED: FullResult = {status: 'passed', startTime: new Date(0), duration: 0}
const FAILED: FullResult = {status: 'failed', startTime: new Date(0), duration: 0}

function mockResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    retry: 0,
    errors: [],
    attachments: [],
    status: 'passed',
    parallelIndex: 0,
    workerIndex: 0,
    duration: 0,
    stdout: [],
    stderr: [],
    startTime: new Date(0),
    ...overrides,
  } as TestResult
}

function mockTest(overrides: {
  id: string
  outcome: ReturnType<TestCase['outcome']>
  file?: string
  line?: number
  column?: number
  titlePath?: string[]
  projectName?: string
  results?: TestResult[]
}): TestCase {
  const file = overrides.file ?? path.join(process.cwd(), 'tests', 'example.spec.ts')
  return {
    id: overrides.id,
    outcome: () => overrides.outcome,
    titlePath: () => overrides.titlePath ?? ['chromium', 'example.spec.ts', 'does the thing'],
    location: {file, line: overrides.line ?? 10, column: overrides.column ?? 3},
    results: overrides.results ?? [mockResult()],
    parent: {
      project: () => (overrides.projectName ? {name: overrides.projectName} : undefined),
    },
  } as unknown as TestCase
}

describe('SummaryReporter', () => {
  let tmpDir: string
  let previousCwd: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-summary-'))
    previousCwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterEach(() => {
    process.chdir(previousCwd)
    fs.rmSync(tmpDir, {recursive: true, force: true})
  })

  test('writes an all-passed agent report and hasFailures false', () => {
    const reporter = new SummaryReporter()
    reporter.onTestEnd(
      mockTest({
        id: 'pass-1',
        outcome: 'expected',
        titlePath: ['chromium', 'ok.spec.ts', 'passes'],
      }),
    )
    reporter.onEnd(PASSED)

    const summary = JSON.parse(fs.readFileSync('test-summary.json', 'utf8'))
    expect(summary).toMatchObject({
      passed: 1,
      failed: 0,
      flaky: 0,
      skipped: 0,
      hasFailures: false,
      failedFiles: [],
    })

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    expect(report).toContain('# E2E test report (agent-friendly)')
    expect(report).toContain('Summary: 1 passed, 0 failed, 0 flaky, 0 skipped')
    expect(report).toContain('All tests passed — no failures to report.')
    expect(report).not.toContain('## How to reproduce locally')
  })

  test('inlines error-context, strips ANSI, and embeds a local repro command', () => {
    const failedFile = path.join(tmpDir, 'tests', 'navbar', 'search.spec.ts')
    const reporter = new SummaryReporter()
    const previousEnv = {
      GITHUB_SHA: process.env.GITHUB_SHA,
      GITHUB_SERVER_URL: process.env.GITHUB_SERVER_URL,
      GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
      SANITY_E2E_PROJECT_ID: process.env.SANITY_E2E_PROJECT_ID,
      SANITY_E2E_BASE_URL: process.env.SANITY_E2E_BASE_URL,
      SANITY_E2E_DATASET: process.env.SANITY_E2E_DATASET,
      SANITY_E2E_DATASET_CHROMIUM: process.env.SANITY_E2E_DATASET_CHROMIUM,
      SANITY_E2E_DATASET_FIREFOX: process.env.SANITY_E2E_DATASET_FIREFOX,
    }

    process.env.GITHUB_SHA = 'abc123'
    process.env.GITHUB_SERVER_URL = 'https://github.com'
    process.env.GITHUB_REPOSITORY = 'sanity-io/sanity'
    process.env.GITHUB_RUN_ID = '99'
    process.env.SANITY_E2E_PROJECT_ID = 'ittbm412'
    process.env.SANITY_E2E_BASE_URL = 'https://example.sanity.dev'
    process.env.SANITY_E2E_DATASET = 'pr-1-chromium-99'
    process.env.SANITY_E2E_DATASET_CHROMIUM = 'pr-1-chromium-99'
    process.env.SANITY_E2E_DATASET_FIREFOX = 'pr-1-firefox-99'

    try {
      reporter.onTestEnd(
        mockTest({
          id: 'fail-1',
          outcome: 'unexpected',
          file: failedFile,
          line: 42,
          column: 7,
          projectName: 'chromium',
          titlePath: ['chromium', 'search.spec.ts', 'finds a document'],
          results: [
            mockResult({
              retry: 1,
              status: 'failed',
              errors: [
                {
                  message: `${ESC}[31mTimeout${ESC}[39m waiting for locator`,
                  stack: `${ESC}[31mTimeout${ESC}[39m waiting for locator\n    at search.spec.ts:42:7`,
                  snippet: `${ESC}[2m  40 |${ESC}[22m   await page.goto('/')`,
                },
              ],
              attachments: [
                {
                  name: 'error-context',
                  contentType: 'text/markdown',
                  body: Buffer.from('# Page snapshot\n\n- banner: Sanity Studio\n'),
                },
                {name: 'screenshot', contentType: 'image/png', body: Buffer.from('')},
                {name: '_trace', contentType: 'application/zip', body: Buffer.from('')},
              ],
            }),
          ],
        }),
      )
      reporter.onEnd(FAILED)
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }

    const summary = JSON.parse(fs.readFileSync('test-summary.json', 'utf8'))
    expect(summary.hasFailures).toBe(true)
    expect(summary.failed).toBe(1)
    expect(summary.failedFiles).toEqual([path.join('tests', 'navbar', 'search.spec.ts')])

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    expect(report).toContain('## ❌ chromium › search.spec.ts › finds a document')
    expect(report).toContain(`\`${path.join('tests', 'navbar', 'search.spec.ts')}:42:7\``)
    expect(report).toContain('- Browser (Playwright project): chromium')
    expect(report).toContain('- Status: failed (1 attempt, all failed)')
    expect(report).toContain('Timeout waiting for locator')
    expect(report).not.toContain(ESC)
    expect(report).toContain('### Page snapshot at the moment of failure')
    expect(report).toContain('- banner: Sanity Studio')
    expect(report).toContain('- screenshot (image/png)')
    expect(report).not.toContain('_trace')
    expect(report).toContain('- Commit: abc123')
    expect(report).toContain('- Workflow run: https://github.com/sanity-io/sanity/actions/runs/99')
    expect(report).toContain('SANITY_E2E_PROJECT_ID=ittbm412 \\')
    expect(report).toContain('SANITY_E2E_DATASET=pr-1-chromium-99 \\')
    expect(report).toContain('pnpm test:e2e --project chromium \\')
    expect(report).toContain(path.join('tests', 'navbar', 'search.spec.ts'))
  })

  test('counts flaky tests but omits their details from the digest', () => {
    const reporter = new SummaryReporter()
    reporter.onTestEnd(
      mockTest({
        id: 'flaky-1',
        outcome: 'flaky',
        projectName: 'firefox',
        titlePath: ['firefox', 'publish.spec.ts', 'publishes'],
        results: [
          mockResult({
            retry: 0,
            status: 'failed',
            errors: [{message: 'first attempt failed', stack: 'Error: first attempt failed'}],
          }),
          mockResult({retry: 1, status: 'passed'}),
        ],
      }),
    )
    reporter.onEnd(PASSED)

    const summary = JSON.parse(fs.readFileSync('test-summary.json', 'utf8'))
    expect(summary).toMatchObject({failed: 0, flaky: 1, hasFailures: false, failedFiles: []})

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    expect(report).toContain('Summary: 0 passed, 0 failed, 1 flaky, 0 skipped')
    expect(report).toContain(
      'No tests failed after retries (1 flaky, recovered on retry). Details stay in the HTML report.',
    )
    expect(report).not.toContain('## ⚠️')
    expect(report).not.toContain('first attempt failed')
    expect(report).not.toContain('## How to reproduce locally')
  })

  test('includes only hard failures when the same run also has flakes', () => {
    const failedFile = path.join(tmpDir, 'tests', 'navbar', 'search.spec.ts')
    const reporter = new SummaryReporter()
    reporter.onTestEnd(
      mockTest({
        id: 'fail-1',
        outcome: 'unexpected',
        file: failedFile,
        projectName: 'chromium',
        titlePath: ['chromium', 'search.spec.ts', 'finds a document'],
        results: [mockResult({status: 'failed', errors: [{message: 'still failing'}]})],
      }),
    )
    reporter.onTestEnd(
      mockTest({
        id: 'flaky-1',
        outcome: 'flaky',
        projectName: 'firefox',
        titlePath: ['firefox', 'publish.spec.ts', 'publishes'],
        results: [
          mockResult({status: 'failed', errors: [{message: 'first attempt failed'}]}),
          mockResult({retry: 1, status: 'passed'}),
        ],
      }),
    )
    reporter.onEnd(FAILED)

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    expect(report).toContain('Summary: 0 passed, 1 failed, 1 flaky, 0 skipped')
    expect(report).toContain('## ❌ chromium › search.spec.ts › finds a document')
    expect(report).toContain('still failing')
    expect(report).not.toContain('firefox › publish.spec.ts')
    expect(report).not.toContain('first attempt failed')
  })

  test('does not claim all tests passed when the run failed or tests were skipped', () => {
    const reporter = new SummaryReporter()
    reporter.onTestEnd(
      mockTest({
        id: 'skip-1',
        outcome: 'skipped',
        titlePath: ['chromium', 'search.spec.ts', 'skipped'],
      }),
    )
    reporter.onEnd(FAILED)

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    expect(report).toContain(
      'No tests failed after retries. Run status: failed. 0 passed, 1 skipped.',
    )
    expect(report).not.toContain('All tests passed')
  })

  test('emits a per-project repro command with the matching dataset', () => {
    const chromiumFile = path.join(tmpDir, 'tests', 'navbar', 'search.spec.ts')
    const firefoxFile = path.join(tmpDir, 'tests', 'document-actions', 'publish.spec.ts')
    const reporter = new SummaryReporter()
    const previousEnv = {
      SANITY_E2E_PROJECT_ID: process.env.SANITY_E2E_PROJECT_ID,
      SANITY_E2E_BASE_URL: process.env.SANITY_E2E_BASE_URL,
      SANITY_E2E_DATASET: process.env.SANITY_E2E_DATASET,
      SANITY_E2E_DATASET_CHROMIUM: process.env.SANITY_E2E_DATASET_CHROMIUM,
      SANITY_E2E_DATASET_FIREFOX: process.env.SANITY_E2E_DATASET_FIREFOX,
    }

    process.env.SANITY_E2E_PROJECT_ID = 'ittbm412'
    process.env.SANITY_E2E_BASE_URL = 'https://example.sanity.dev'
    process.env.SANITY_E2E_DATASET = 'pr-1-chromium-99'
    process.env.SANITY_E2E_DATASET_CHROMIUM = 'pr-1-chromium-99'
    process.env.SANITY_E2E_DATASET_FIREFOX = 'pr-1-firefox-99'

    try {
      reporter.onTestEnd(
        mockTest({
          id: 'fail-chromium',
          outcome: 'unexpected',
          file: chromiumFile,
          projectName: 'chromium',
          titlePath: ['chromium', 'search.spec.ts', 'finds a document'],
          results: [mockResult({status: 'failed', errors: [{message: 'chromium failed'}]})],
        }),
      )
      reporter.onTestEnd(
        mockTest({
          id: 'fail-firefox',
          outcome: 'unexpected',
          file: firefoxFile,
          projectName: 'firefox',
          titlePath: ['firefox', 'publish.spec.ts', 'publishes'],
          results: [mockResult({status: 'failed', errors: [{message: 'firefox failed'}]})],
        }),
      )
      reporter.onEnd(FAILED)
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }

    const report = fs.readFileSync(path.join('playwright-report', 'agent-report.md'), 'utf8')
    const blocks = report
      .split('```sh')
      .slice(1)
      .map((block) => block.split('```')[0] ?? '')
    expect(blocks).toHaveLength(2)
    const chromiumBlock = blocks.find((block) => block.includes('--project chromium'))
    const firefoxBlock = blocks.find((block) => block.includes('--project firefox'))
    expect(chromiumBlock).toContain('SANITY_E2E_DATASET=pr-1-chromium-99 \\')
    expect(firefoxBlock).toContain('SANITY_E2E_DATASET=pr-1-firefox-99 \\')
    expect(firefoxBlock).not.toContain('SANITY_E2E_DATASET=pr-1-chromium-99 \\')
  })
})
