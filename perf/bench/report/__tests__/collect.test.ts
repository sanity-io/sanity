// @vitest-environment node
import process from 'node:process'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {type InpSessionResult} from '../../runner/session/inp'
import {type PageLoadSample} from '../../runner/session/pageLoad'
import {summarize} from '../../stats/quantiles'
import {collectInp, collectPageLoad, collectRunMetadata} from '../collect'

const ENV_KEYS = [
  'GITHUB_SHA',
  'GITHUB_REF',
  'GITHUB_HEAD_REF',
  'GITHUB_REF_NAME',
  'GITHUB_RUN_ID',
  'BENCH_MERGE_BASE',
] as const
let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
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
})

function sample(
  condition: PageLoadSample['condition'],
  timeToEditableMs: number,
  auth: Partial<PageLoadSample['auth']> = {},
): PageLoadSample {
  return {
    condition,
    timeToEditableMs,
    ttfbMs: 100,
    fcpMs: 1000,
    lcpMs: 2000,
    cls: 0,
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
      'boot-cold · TTFB (ms)',
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
      'boot-cold · TTFB',
      'boot-cold · FCP',
      'boot-cold · LCP',
      'boot-cold · CLS',
      'boot-cold · main-thread blocking',
      // auth first request is skipped (firstRequestMs is null in this fixture)
      'boot-cold · auth round trips',
      'boot-cold · auth in flight',
    ])
  })
})

function inpSession(
  perLabel: InpSessionResult['perLabel'],
  overrides: Partial<InpSessionResult> = {},
): InpSessionResult {
  return {
    inpMs: 200,
    interactionCount: 60,
    reportable: true,
    latencies: perLabel.flatMap((entry) => entry.latencies),
    perLabel,
    readOnlyInterruptions: {count: 0, totalMs: 0},
    ...overrides,
  }
}

describe('collectInp', () => {
  it('leaves the INP and INP interactions rows first and unchanged', () => {
    const report = collectInp('singleString', [
      inpSession([{label: 'title', latencies: [20, 30]}], {inpMs: 210, interactionCount: 55}),
    ])
    expect(report.metrics[0].label).toBe('INP')
    expect(report.metrics[1].label).toBe('INP interactions')
    expect(report.metrics[0].experiment.summary.median).toBe(210)
    expect(report.metrics[1].experiment.summary.median).toBe(55)
  })

  it('appends one component metric per label, in first-seen order', () => {
    const sessions = [
      inpSession([
        {label: 'title', latencies: [20, 30]},
        {label: 'body', latencies: [40, 50]},
      ]),
      inpSession([
        {label: 'title', latencies: [25, 35]},
        {label: 'body', latencies: [45, 55]},
      ]),
    ]
    const report = collectInp('singleString', sessions)
    const componentMetrics = report.metrics.slice(2)
    expect(componentMetrics.map((metric) => metric.label)).toEqual([
      'component: title',
      'component: body',
    ])

    const titleMetric = componentMetrics[0]
    expect(titleMetric.presentAsEfps).toBe(false)
    expect(titleMetric.unit).toBe('ms')
    expect(titleMetric.experiment.sessions).toEqual([
      [20, 30],
      [25, 35],
    ])
    expect(titleMetric.experiment.summary.median).toBe(summarize([20, 30, 25, 35]).median)

    const bodyMetric = componentMetrics[1]
    expect(bodyMetric.experiment.sessions).toEqual([
      [40, 50],
      [45, 55],
    ])
    expect(bodyMetric.experiment.summary.median).toBe(summarize([40, 50, 45, 55]).median)
  })

  it('reports an empty session array for a label absent from one session', () => {
    const sessions = [
      inpSession([{label: 'title', latencies: [20, 30]}]),
      inpSession([{label: 'body', latencies: [40, 50]}]),
    ]
    const report = collectInp('singleString', sessions)
    const componentMetrics = report.metrics.slice(2)
    expect(componentMetrics.map((metric) => metric.label)).toEqual([
      'component: title',
      'component: body',
    ])

    const titleMetric = componentMetrics[0]
    expect(titleMetric.experiment.sessions).toEqual([[20, 30], []])
    expect(titleMetric.experiment.summary.n).toBe(2)
    expect(titleMetric.experiment.summary.median).toBe(summarize([20, 30]).median)

    const bodyMetric = componentMetrics[1]
    expect(bodyMetric.experiment.sessions).toEqual([[], [40, 50]])
    expect(bodyMetric.experiment.summary.n).toBe(2)
  })
})
