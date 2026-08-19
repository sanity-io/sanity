// @vitest-environment node
import process from 'node:process'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {type PageLoadSample} from '../../runner/session/pageLoad'
import {collectPageLoad, collectRunMetadata} from '../collect'

const ENV_KEYS = [
  'GITHUB_SHA',
  'GITHUB_REF',
  'GITHUB_HEAD_REF',
  'GITHUB_REF_NAME',
  'GITHUB_RUN_ID',
  'BENCH_MERGE_BASE',
  'BENCH_GIT_SHA',
  'BENCH_GIT_COMMITTED_AT',
] as const
let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
  // Tests assert exact metadata — ambient CI values must not leak in
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

function metadata() {
  return collectRunMetadata({
    mode: 'ab',
    calibrationMs: 10,
    cpuThrottleRate: 4,
    seed: 1,
    startedAt: '2026-07-10T05:00:00.000Z',
  })
}

describe('collectRunMetadata', () => {
  it('extracts the PR number from GITHUB_REF', () => {
    process.env.GITHUB_SHA = 'abc'
    process.env.GITHUB_REF = 'refs/pull/13442/merge'
    process.env.GITHUB_HEAD_REF = 'perf-bench'
    expect(metadata().git).toMatchObject({sha: 'abc', branch: 'perf-bench', prNumber: 13442})
  })

  it('falls back to GITHUB_REF_NAME when GITHUB_HEAD_REF is empty (schedule runs)', () => {
    process.env.GITHUB_SHA = 'abc'
    process.env.GITHUB_REF = 'refs/heads/main'
    // Actions sets GITHUB_HEAD_REF to the empty string outside pull_request
    process.env.GITHUB_HEAD_REF = ''
    process.env.GITHUB_REF_NAME = 'main'
    expect(metadata().git.branch).toBe('main')
    expect(metadata().git.prNumber).toBeUndefined()
  })

  it('records the reference sha when the workflow passes BENCH_MERGE_BASE', () => {
    process.env.GITHUB_SHA = 'abc'
    process.env.GITHUB_HEAD_REF = 'perf-bench'
    process.env.BENCH_MERGE_BASE = 'ref456'
    expect(metadata().git.mergeBaseSha).toBe('ref456')
    delete process.env.BENCH_MERGE_BASE
    expect(metadata().git.mergeBaseSha).toBeUndefined()
  })

  it('prefers BENCH_GIT_SHA over GITHUB_SHA (backfill runs measure a different commit)', () => {
    process.env.GITHUB_SHA = 'abc'
    process.env.GITHUB_HEAD_REF = 'perf-bench'
    process.env.BENCH_GIT_SHA = 'historical456'
    expect(metadata().git.sha).toBe('historical456')
    // The workflow sets it unconditionally, so on non-backfill events it
    // arrives as the empty string and must fall through
    process.env.BENCH_GIT_SHA = ''
    expect(metadata().git.sha).toBe('abc')
  })

  it('stamps the measured commit date, preferring BENCH_GIT_COMMITTED_AT', () => {
    process.env.GITHUB_SHA = 'abc'
    process.env.GITHUB_HEAD_REF = 'perf-bench'
    process.env.BENCH_GIT_COMMITTED_AT = '2026-08-02T14:30:00+02:00'
    expect(metadata().git.committedAt).toBe('2026-08-02T14:30:00+02:00')
    // Empty (non-backfill) falls through to HEAD's committer date — the test
    // process runs inside the repo, so a real ISO date comes back
    process.env.BENCH_GIT_COMMITTED_AT = ''
    expect(metadata().git.committedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    // A malformed override is dropped, not stored — an unparseable date would
    // poison the trend axis ordering/filtering built on this field
    process.env.BENCH_GIT_COMMITTED_AT = 'not-a-date'
    expect(metadata().git.committedAt).toBeUndefined()
  })
})

function sample(
  condition: PageLoadSample['condition'],
  timeToEditableMs: number,
  auth: Partial<PageLoadSample['auth']> = {},
): PageLoadSample {
  return {
    condition,
    timeToEditableMs,
    fcpMs: 1000,
    lcpMs: 2000,
    cls: 0,
    clsAttribution: [{source: '[data-testid="pane-content"]', totalValue: 0.01}],
    jsUrls: ['/static/sanity-abc.js'],
    blockingMs: 50,
    loafAttribution: [
      {
        sourceUrl: 'https://localhost/static/sanity-abc.js',
        functionName: 'commitWork',
        totalMs: 30,
      },
    ],
    auth: {trips: 1, firstRequestMs: 2000, inFlightMs: 40, ...auth},
  }
}

describe('collectPageLoad', () => {
  it('emits the gated time-to-editable row plus report-only auth rows per condition', () => {
    const report = collectPageLoad(
      'singleString',
      new Map([
        ['experiment', [sample('boot-cold', 4100), sample('boot-cold', 4200)]],
        ['reference', [sample('boot-cold', 4000, {trips: 2})]],
      ]),
      new Map([
        [
          'boot-cold',
          {
            interval: {diff: 150, lo: 50, hi: 250, level: 0.95, iterations: 2000},
            verdict: 'regression',
          },
        ],
      ]),
    )
    const labels = report.metrics.map((metric) => `${metric.label} (${metric.unit})`)
    expect(labels).toEqual([
      'boot-cold · time to editable (ms)',
      'boot-cold · FCP (ms)',
      'boot-cold · LCP (ms)',
      'boot-cold · CLS (cls)',
      'boot-cold · main-thread blocking (ms)',
      'boot-cold · auth round trips (count)',
      'boot-cold · auth first request (ms)',
      'boot-cold · auth in flight (ms)',
    ])

    // Attribution aggregates across experiment samples into the shared slot
    expect(report.loafAttribution).toEqual([
      {
        sourceUrl: 'https://localhost/static/sanity-abc.js',
        functionName: 'commitWork',
        totalMs: 60,
      },
    ])

    const editable = report.metrics[0]
    expect(editable.comparison).toMatchObject({diff: 150, verdict: 'regression'})
    expect(editable.reference?.summary.median).toBe(4000)

    // Auth rows carry both sides but never a comparison (report-only)
    const trips = report.metrics.find((m) => m.label === 'boot-cold · auth round trips')!
    expect(trips.comparison).toBeUndefined()
    expect(trips.experiment.summary.median).toBe(1)
    expect(trips.reference?.summary.median).toBe(2)
  })

  it('skips rows for conditions without samples and null first-request values', () => {
    const report = collectPageLoad(
      'singleString',
      new Map([['experiment', [sample('boot-cold', 4100, {trips: 0, firstRequestMs: null})]]]),
      new Map(),
    )
    expect(report.metrics.map((metric) => metric.label)).toEqual([
      'boot-cold · time to editable',
      'boot-cold · FCP',
      'boot-cold · LCP',
      'boot-cold · CLS',
      'boot-cold · main-thread blocking',
      // auth first request is skipped (firstRequestMs is null in this fixture)
      'boot-cold · auth round trips',
      'boot-cold · auth in flight',
    ])
  })

  it('emits a boot-cold boot JS row when chunk gzip sizes are provided', () => {
    const report = collectPageLoad(
      'singleString',
      new Map([
        [
          'experiment',
          [sample('boot-cold', 4000), sample('boot-cold', 4100), sample('open-doc-warm', 3900)],
        ],
      ]),
      new Map(),
      undefined,
      new Map([['/static/sanity-abc.js', 140_000]]),
    )
    const bootJs = report.metrics.find((metric) => metric.label === 'boot-cold · boot JS')
    expect(bootJs?.unit).toBe('bytes')
    expect(bootJs?.experiment.summary.median).toBe(140_000)
    // Warm pages replay the same chunk set from cache — no row for them
    expect(report.metrics.some((metric) => metric.label.includes('open-doc-warm · boot JS'))).toBe(
      false,
    )
  })

  it('omits the boot JS row without chunk sizes and when no fetched path matches', () => {
    const withoutSizes = collectPageLoad(
      'singleString',
      new Map([['experiment', [sample('boot-cold', 4000)]]]),
      new Map(),
    )
    expect(withoutSizes.metrics.some((metric) => metric.label.includes('boot JS'))).toBe(false)

    const noMatches = collectPageLoad(
      'singleString',
      new Map([['experiment', [sample('boot-cold', 4000)]]]),
      new Map(),
      undefined,
      new Map([['/static/other.js', 1]]),
    )
    expect(noMatches.metrics.some((metric) => metric.label.includes('boot JS'))).toBe(false)
  })

  it('aggregates cls attribution across experiment samples, largest first', () => {
    const shifted = {
      ...sample('boot-cold', 4000),
      clsAttribution: [
        {source: 'div.banner', totalValue: 0.02},
        {source: '[data-testid="pane-content"]', totalValue: 0.005},
      ],
    }
    const report = collectPageLoad(
      'singleString',
      new Map([['experiment', [shifted, sample('boot-cold', 4100)]]]),
      new Map(),
    )
    expect(report.clsAttribution).toEqual([
      {source: 'div.banner', totalValue: 0.02},
      {source: '[data-testid="pane-content"]', totalValue: 0.005 + 0.01},
    ])
  })
})
