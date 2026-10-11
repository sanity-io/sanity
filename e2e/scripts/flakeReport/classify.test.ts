import {describe, expect, it} from 'vitest'

import {analyzeTests, classifyAttempt, classifyJobLog, classifyRun, findClusters} from './classify'
import {
  type AttemptCapture,
  type DiagnosticsReport,
  type FallbackReport,
  type HistoryEntry,
  type RunAnalysis,
  type TestAnalysis,
  type WorkflowRun,
} from './types'

function historyEntry(durationMs: number, overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    apiVersion: 'v2025-02-19',
    bucket: 'query',
    dataset: 'pr-1-chromium-1',
    durationMs,
    projectId: 'ittbm412',
    startedAt: '2026-08-31T15:05:00.000Z',
    status: 'success',
    ...overrides,
  }
}

function diagnostics(overrides: Partial<DiagnosticsReport['network']> = {}): DiagnosticsReport {
  const entries = [180, 210, 195, 240, 260, 175, 300].map((duration) => historyEntry(duration))
  return {
    diagnosticVersion: 1,
    durationMs: 1200,
    generatedAt: '2026-08-31T15:05:12.000Z',
    network: {
      geoIpCountry: 'US',
      listen: {
        first: {durationMs: 120, openMs: 118, status: 'success', welcomeMs: 120},
        secondWhileFirstOpen: {durationMs: 110, openMs: 108, status: 'success', welcomeMs: 110},
      },
      protocol: {durationMs: 90, protocol: 'h3', status: 'success', timedOut: false},
      requestHistory: {
        entries,
        sessionSummary: {
          buckets: [
            {bucket: 'query', count: entries.length, maxMs: 300, medianMs: 210, p95Ms: 300},
          ],
          startedAt: '2026-08-31T15:04:50.000Z',
          totalRequests: entries.length,
        },
        totalRequests: entries.length,
      },
      requests: [
        {durationMs: 40, path: '/ping', status: 'success'},
        {durationMs: 200, path: '/geoip/country', status: 'success'},
        {durationMs: 90, path: '/query?query=1', shard: 'gcp-us-e4-stag-10006', status: 'success'},
        {durationMs: 95, path: '/query?query=*[0]._id', status: 'success'},
        {durationMs: 110, path: '/doc/<random-nonexistent-id>', status: 'success'},
      ],
      shard: 'gcp-us-e4-stag-10006',
      ...overrides,
    },
    startedAt: '2026-08-31T15:05:10.000Z',
    studio: {dataset: 'pr-1-chromium-1', projectId: 'ittbm412', version: '6.11.0'},
  }
}

function studioCapture(report: DiagnosticsReport, attempt = 1): AttemptCapture {
  return {attempt, diagnostics: report, kind: 'studio', status: 'failed'}
}

function fallbackCapture(probes: FallbackReport['probes']): AttemptCapture {
  return {
    attempt: 1,
    fallback: {
      fallbackVersion: 1,
      generatedAt: '2026-08-31T15:05:10.000Z',
      location: 'https://e2e-studio.sanity.dev/chromium/content',
      probes,
      reason: 'The studio diagnostics bridge did not appear within 3000ms',
    },
    kind: 'fallback',
    status: 'failed',
  }
}

describe('classifyAttempt', () => {
  it('calls a fast, error-free capture healthy and summarizes the latency', () => {
    const analysis = classifyAttempt(studioCapture(diagnostics()))
    expect(analysis.verdict).toBe('healthy')
    expect(analysis.evidence[0]).toMatch(
      /^API healthy: query median 210 ms, p95 300 ms over 7 requests; probes 40 ms–200 ms$/,
    )
  })

  it('flags a slow session median', () => {
    const report = diagnostics()
    report.network.requestHistory.sessionSummary.buckets = [
      {bucket: 'query', count: 15, maxMs: 2891, medianMs: 1110, p95Ms: 2891},
    ]
    const analysis = classifyAttempt(studioCapture(report))
    expect(analysis.verdict).toBe('degraded')
    expect(analysis.evidence).toContain('query median 1110 ms over 15 requests')
  })

  it('flags a single multi-second request even when the median looks fine', () => {
    const report = diagnostics()
    report.network.requestHistory.entries.push(historyEntry(3744))
    const analysis = classifyAttempt(studioCapture(report))
    expect(analysis.verdict).toBe('degraded')
    expect(analysis.evidence).toContain('query request took 3744 ms')
  })

  it('ignores percentiles of tiny buckets', () => {
    const report = diagnostics()
    report.network.requestHistory.sessionSummary.buckets.push({
      bucket: 'history',
      count: 1,
      maxMs: 1874,
      medianMs: 1874,
      p95Ms: 1874,
    })
    expect(classifyAttempt(studioCapture(report)).verdict).toBe('healthy')
  })

  it('flags probe timeouts and slow probes', () => {
    const timedOut = diagnostics({
      requests: [{durationMs: 4000, error: undefined, path: '/ping', status: 'timeout'}],
    })
    expect(classifyAttempt(studioCapture(timedOut)).evidence).toContain('probe /ping timeout')

    const slow = diagnostics({
      requests: [{durationMs: 1854, path: '/doc/<random-nonexistent-id>', status: 'success'}],
    })
    const analysis = classifyAttempt(studioCapture(slow))
    expect(analysis.verdict).toBe('degraded')
    expect(analysis.evidence).toContain('probe /doc/<random-nonexistent-id> took 1854 ms')
  })

  it('flags a failed listen connection', () => {
    const report = diagnostics()
    report.network.listen.first = {durationMs: 4000, status: 'timeout'}
    expect(classifyAttempt(studioCapture(report)).evidence).toContain('listen timeout')
  })

  it('treats a couple of failed requests as a note, and many as degradation', () => {
    const couple = diagnostics()
    couple.network.requestHistory.entries.push(historyEntry(50, {status: 'error'}))
    const noted = classifyAttempt(studioCapture(couple))
    expect(noted.verdict).toBe('healthy')
    expect(noted.evidence).toContain('1 API request failed during the test')

    const many = diagnostics()
    many.network.requestHistory.entries.push(
      ...[1, 2, 3].map(() => historyEntry(50, {status: 'error'})),
    )
    const degraded = classifyAttempt(studioCapture(many))
    expect(degraded.verdict).toBe('degraded')
    expect(degraded.evidence).toContain('3 API requests failed during the test')
  })

  it('reads 429s and timeouts out of fallback probes', () => {
    const analysis = classifyAttempt(
      fallbackCapture([
        {authenticated: false, durationMs: 108, path: '/v2025-02-19/ping', status: 200},
        {authenticated: true, durationMs: 6, path: '/v2025-02-19/users/me', status: 429},
        {
          authenticated: true,
          durationMs: 5000,
          error: 'Timed out after 5000ms',
          path: '/v2025-02-19/data/query/ds?query=1',
        },
      ]),
    )
    expect(analysis.verdict).toBe('degraded')
    expect(analysis.evidence).toEqual([
      'fallback probe /v2025-02-19/users/me → HTTP 429',
      'fallback probe /v2025-02-19/data/query/ds?query=1: Timed out after 5000ms',
      'The studio diagnostics bridge did not appear within 3000ms',
    ])
  })

  it('keeps a reachable API healthy even when the studio never mounted', () => {
    const analysis = classifyAttempt(
      fallbackCapture([
        {authenticated: false, durationMs: 108, path: '/v2025-02-19/ping', status: 200},
        {authenticated: true, durationMs: 90, path: '/v2025-02-19/users/me', status: 401},
      ]),
    )
    expect(analysis.verdict).toBe('healthy')
    expect(analysis.evidence[0]).toMatch(/^studio shell never mounted, but the API answered/)
  })

  it('treats a visible request error dialog as degraded even when the history looks healthy', () => {
    const dialog =
      'Too many requests Too many requests at once. You can try again shortly. Reload Studio Try again'
    const withStudioReport = classifyAttempt({
      ...studioCapture(diagnostics()),
      requestErrorText: dialog,
    })
    expect(withStudioReport.verdict).toBe('degraded')
    expect(withStudioReport.evidence[0]).toBe(`studio showed its request error dialog: "${dialog}"`)
    expect(withStudioReport.evidence[1]).toMatch(/^API healthy/)

    const withoutCapture = classifyAttempt({
      attempt: 1,
      kind: 'none',
      requestErrorText: "Network error Couldn't reach the Sanity servers.",
      status: 'failed',
    })
    expect(withoutCapture.verdict).toBe('degraded')
  })

  it('is unknown without an attachment', () => {
    expect(classifyAttempt({attempt: 1, kind: 'none', status: 'failed'})).toMatchObject({
      evidence: ['no diagnostics attachment'],
      verdict: 'unknown',
    })
    expect(
      classifyAttempt({
        attempt: 1,
        errorText: 'Page was already closed',
        kind: 'error',
        status: 'failed',
      }),
    ).toMatchObject({evidence: ['Page was already closed'], verdict: 'unknown'})
  })
})

describe('analyzeTests', () => {
  it('keeps only tests that failed at least once and derives their outcome', () => {
    const analyses = analyzeTests('chromium-1', [
      {attempts: [{attempt: 1, kind: 'none', status: 'passed'}], title: 'green'},
      {
        attempts: [studioCapture(diagnostics(), 1), {attempt: 2, kind: 'none', status: 'passed'}],
        title: 'flaky',
      },
      {
        attempts: [
          studioCapture(diagnostics(), 1),
          studioCapture(diagnostics(), 2),
          {attempt: 3, kind: 'none', status: 'timedOut'},
        ],
        title: 'hard failure',
      },
    ])

    expect(analyses.map((test) => [test.title, test.outcome, test.attempts.length])).toEqual([
      ['flaky', 'flaky', 1],
      ['hard failure', 'failed', 3],
    ])
    expect(analyses[1].attempts[2]).toMatchObject({status: 'timedOut', verdict: 'unknown'})
  })
})

describe('classifyJobLog', () => {
  it('recognizes rate limiting, network errors, and everything else', () => {
    expect(
      classifyJobLog(
        'dataset-setup\t2026-08-31T15:15:03.1234567Z ✖ Creating dataset (1.15s)\n' +
          'dataset-setup\t2026-08-31T15:15:03.1234567Z Error: API rate limit exceeded (429)',
      ),
    ).toEqual({excerpt: 'Error: API rate limit exceeded (429)', signature: 'rate-limit'})

    expect(
      classifyJobLog('deploy\tError: request to https://x failed, reason: ECONNRESET'),
    ).toMatchObject({
      signature: 'network',
    })

    expect(classifyJobLog('build\t##[error]Process completed with exit code 1.')).toEqual({
      excerpt: 'Process completed with exit code 1.',
      signature: 'other',
    })
  })

  it('does not mistake bare numbers for HTTP status codes', () => {
    expect(
      classifyJobLog(
        'install\tProgress: resolved 2191, reused 2177, downloaded 12, added 429\n' +
          'install\t##[end-action id=changes.filter;outcome=success;duration_ms=502]\n' +
          'install\t##[error]Process completed with exit code 1.',
      ).signature,
    ).toBe('other')

    expect(classifyJobLog('setup\tClientError: request failed with status 429').signature).toBe(
      'rate-limit',
    )
    expect(classifyJobLog('deploy\tHTTP/1.1 503 Service Unavailable').signature).toBe('network')
    expect(classifyJobLog("setup\t'ratelimit-limit': '120',").signature).toBe('rate-limit')
  })
})

function run(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
    attempt: 1,
    branch: 'feature/x',
    conclusion: 'failure',
    createdAt: '2026-08-31T12:40:00Z',
    event: 'pull_request',
    id: 1,
    status: 'completed',
    title: 'chore: something',
    url: 'https://github.com/sanity-io/sanity/actions/runs/1',
    ...overrides,
  }
}

const playwrightJobs = [
  {conclusion: 'failure', id: 10, name: 'playwright-test (chromium, 1, 4)', url: 'u'},
  {conclusion: 'success', id: 11, name: 'playwright-test (firefox, 1, 4)', url: 'u'},
  {conclusion: 'failure', id: 12, name: 'E2E Status', url: 'u'},
]

function hardFailedTest(
  verdicts: ('degraded' | 'healthy' | 'unknown')[],
  title = 'spec.ts › case',
): TestAnalysis {
  const evidenceFor = (verdict: string) =>
    verdict === 'degraded'
      ? ['query median 1110 ms over 15 requests']
      : verdict === 'healthy'
        ? ['API healthy: query median 210 ms']
        : ['no diagnostics attachment']
  return {
    attempts: verdicts.map((verdict, index) => ({
      attempt: index + 1,
      evidence: evidenceFor(verdict),
      kind: verdict === 'unknown' ? 'none' : 'studio',
      status: 'failed',
      verdict,
    })),
    outcome: 'failed',
    shard: 'chromium-1',
    title,
  }
}

describe('classifyRun', () => {
  it('attributes to the platform when every hard failure ends on a degraded API', () => {
    const analysis = classifyRun(
      run(),
      playwrightJobs,
      [hardFailedTest(['degraded', 'degraded'])],
      [],
    )
    expect(analysis).toMatchObject({
      coverage: 'captured',
      failedJobs: ['playwright-test (chromium, 1, 4)', 'E2E Status'],
      verdict: 'platform',
    })
  })

  it('attributes to the tests when the API was healthy on the final attempt', () => {
    const analysis = classifyRun(
      run(),
      playwrightJobs,
      [hardFailedTest(['degraded', 'healthy', 'healthy'])],
      [],
    )
    expect(analysis.verdict).toBe('test-side')
    expect(analysis.reasons[1]).toMatch(/first attempt ran during API degradation/)
  })

  it('reports mixed and partial coverage', () => {
    const analysis = classifyRun(
      run(),
      playwrightJobs,
      [
        hardFailedTest(['degraded'], 'a'),
        hardFailedTest(['healthy'], 'b'),
        hardFailedTest(['unknown'], 'c'),
      ],
      [],
    )
    expect(analysis).toMatchObject({coverage: 'partial', verdict: 'mixed'})
  })

  it('is unknown without captures or readable shards', () => {
    expect(classifyRun(run(), playwrightJobs, [hardFailedTest(['unknown'])], [])).toMatchObject({
      coverage: 'none',
      verdict: 'unknown',
    })
    expect(classifyRun(run(), playwrightJobs, [], [])).toMatchObject({
      coverage: 'none',
      verdict: 'unknown',
    })
  })

  it('attributes setup-job rate limits to the platform', () => {
    const analysis = classifyRun(
      run(),
      [{conclusion: 'failure', id: 5, name: 'dataset-setup', url: 'u'}],
      [],
      [
        {
          excerpt: 'API rate limit exceeded',
          job: 'dataset-setup',
          signature: 'rate-limit',
          url: 'u',
        },
      ],
    )
    expect(analysis).toMatchObject({coverage: 'not-applicable', verdict: 'platform'})
    expect(analysis.reasons).toEqual(['dataset-setup: rate-limit — API rate limit exceeded'])
  })
})

describe('findClusters', () => {
  const analysis = (id: number, createdAt: string, branch: string): RunAnalysis => ({
    coverage: 'none',
    failedJobs: [],
    reasons: [],
    run: run({branch, createdAt, id}),
    setupFailures: [],
    tests: [],
    verdict: 'unknown',
  })

  it('groups failures on unrelated branches that land within the gap', () => {
    const clusters = findClusters([
      analysis(3, '2026-08-31T12:42:00Z', 'renovate/c'),
      analysis(1, '2026-08-31T12:38:00Z', 'renovate/a'),
      analysis(2, '2026-08-31T12:40:00Z', 'renovate/b'),
      analysis(4, '2026-08-31T15:00:00Z', 'feature/lonely'),
    ])
    expect(clusters).toHaveLength(1)
    expect(clusters[0]).toMatchObject({
      branches: ['renovate/a', 'renovate/b', 'renovate/c'],
      end: '2026-08-31T12:42:00Z',
      start: '2026-08-31T12:38:00Z',
    })
  })

  it('ignores repeated failures of a single branch', () => {
    expect(
      findClusters([
        analysis(1, '2026-08-31T12:38:00Z', 'same'),
        analysis(2, '2026-08-31T12:40:00Z', 'same'),
        analysis(3, '2026-08-31T12:42:00Z', 'same'),
      ]),
    ).toEqual([])
  })
})
