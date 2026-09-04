import {strFromU8, unzipSync} from 'fflate'

import {type AttemptCapture, type DiagnosticsReport, type FallbackReport} from './types'

interface BlobAttachment {
  base64?: string
  contentType: string
  name: string
}

interface BlobResult {
  attachments: BlobAttachment[]
  status: string
}

export interface BlobTest {
  results: BlobResult[]
  title: string
}

/** A test with every attempt reduced to its diagnostics capture. */
export interface TestCaptures {
  attempts: AttemptCapture[]
  title: string
}

/** Reads `report.jsonl` out of one Playwright blob report zip (`blob-report/report-*.zip`). */
export function readBlobReportZip(blobZip: Uint8Array): string {
  const files = unzipSync(blobZip, {filter: (file) => file.name === 'report.jsonl'})
  const jsonl = files['report.jsonl']
  if (!jsonl) throw new Error('Blob report zip does not contain report.jsonl')
  return strFromU8(jsonl)
}

/**
 * Reads every Playwright blob report (`blob-report/*.zip`) inside a downloaded
 * `playwright-report-<project>-<shard>` artifact zip and returns their `report.jsonl`
 * contents. Videos and traces in the same artifact are skipped without being inflated.
 */
export function readBlobReportsFromArtifact(artifactZip: Uint8Array): string[] {
  const innerZips = unzipSync(artifactZip, {
    filter: (file) => file.name.includes('blob-report/') && file.name.endsWith('.zip'),
  })
  return Object.values(innerZips).map(readBlobReportZip)
}

interface SuiteEntry {
  entries?: SuiteEntry[]
  testId?: string
  title: string
}

/**
 * Parses a blob report (v2 jsonl) into tests with their ordered attempt results and
 * attachments. Blob reports emit `onTestEnd` per attempt and `onAttach` separately,
 * correlated through `resultId`.
 */
export function parseBlobReport(jsonl: string): BlobTest[] {
  const events = jsonl
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as {method: string; params: Record<string, unknown>})

  const titleByTestId = new Map<string, string>()
  const walk = (entries: SuiteEntry[] | undefined, crumbs: string[]) => {
    for (const entry of entries ?? []) {
      if (entry.testId) {
        titleByTestId.set(entry.testId, [...crumbs, entry.title].filter(Boolean).join(' › '))
      } else {
        walk(entry.entries, [...crumbs, entry.title])
      }
    }
  }

  const resultsByTestId = new Map<string, {id: string; result: BlobResult}[]>()
  const attachmentsByResultId = new Map<string, BlobAttachment[]>()

  for (const event of events) {
    if (event.method === 'onProject') {
      const project = event.params.project as {suites?: SuiteEntry[]}
      walk(project.suites, [])
    }
    if (event.method === 'onTestEnd') {
      const {testId} = event.params.test as {testId: string}
      const result = event.params.result as {id: string; status: string}
      const list = resultsByTestId.get(testId) ?? []
      list.push({id: result.id, result: {attachments: [], status: result.status}})
      resultsByTestId.set(testId, list)
    }
    if (event.method === 'onAttach') {
      const resultId = event.params.resultId as string
      const attachments = event.params.attachments as BlobAttachment[]
      attachmentsByResultId.set(resultId, [
        ...(attachmentsByResultId.get(resultId) ?? []),
        ...attachments,
      ])
    }
  }

  const tests: BlobTest[] = []
  for (const [testId, results] of resultsByTestId) {
    tests.push({
      results: results.map(({id, result}) => ({
        attachments: attachmentsByResultId.get(id) ?? [],
        status: result.status,
      })),
      title: titleByTestId.get(testId) ?? testId,
    })
  }
  return tests
}

/** Every test in a blob report with its attempts reduced to diagnostics captures. */
export function extractTestCaptures(jsonl: string): TestCaptures[] {
  return parseBlobReport(jsonl).map((test) => ({
    attempts: test.results.map((result, index) => toAttemptCapture(result, index + 1)),
    title: test.title,
  }))
}

const FAILED_STATUSES = new Set(['failed', 'timedOut', 'interrupted'])

/** Only the tests that failed at least once — what the compact `e2e-diagnostics-*` artifact carries. */
export function keepTestsWithFailures(tests: TestCaptures[]): TestCaptures[] {
  return tests.filter((test) =>
    test.attempts.some((attempt) => FAILED_STATUSES.has(attempt.status)),
  )
}

/** Converts one attempt's attachments into the diagnostics capture the classifier reads. */
export function toAttemptCapture(result: BlobResult, attempt: number): AttemptCapture {
  const byName = (name: string) => {
    const attachment = result.attachments.find((candidate) => candidate.name === name)
    return attachment?.base64
      ? Buffer.from(attachment.base64, 'base64').toString('utf8')
      : undefined
  }

  const base = {
    attempt,
    requestErrorText: byName('studio-request-error.txt'),
    status: result.status,
  }

  const studioBody = byName('studio-diagnostics.json')
  if (studioBody) {
    return {...base, diagnostics: JSON.parse(studioBody) as DiagnosticsReport, kind: 'studio'}
  }
  const fallbackBody = byName('studio-diagnostics-fallback.json')
  if (fallbackBody) {
    return {...base, fallback: JSON.parse(fallbackBody) as FallbackReport, kind: 'fallback'}
  }
  const errorBody = byName('studio-diagnostics-error.txt')
  if (errorBody) {
    return {...base, errorText: errorBody, kind: 'error'}
  }
  return {...base, kind: 'none'}
}
