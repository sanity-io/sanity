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
      'boot-cold · auth round trips (count)',
      'boot-cold · auth first request (ms)',
      'boot-cold · auth in flight (ms)',
    ])

    const editable = report.metrics[0]
    expect(editable.comparison).toMatchObject({diff: 150, verdict: 'regression'})
    expect(editable.reference?.summary.median).toBe(4000)

    // Auth rows carry both sides but never a comparison (report-only)
    const trips = report.metrics[1]
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
      'boot-cold · auth round trips',
      'boot-cold · auth in flight',
    ])
  })
})
