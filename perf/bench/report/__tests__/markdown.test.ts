import {describe, expect, it} from 'vitest'

import {renderMarkdownReport} from '../markdown'
import {mergeShards} from '../mergeShards'
import {type BenchRunDocument, type MetricReport} from '../types'

function metric(
  label: string,
  medians: {experiment: number; reference?: number},
  verdict?: 'regression' | 'improvement' | 'neutral' | 'inconclusive',
  presentAsEfps = true,
): MetricReport {
  const side = (median: number) => ({
    sessions: [[median], [median]],
    summary: {
      n: 2,
      median,
      p75: median + 2,
      p90: median + 5,
      p99: median + 9,
      min: median - 2,
      max: median + 10,
    },
  })
  return {
    label,
    unit: 'ms',
    presentAsEfps,
    experiment: side(medians.experiment),
    ...(medians.reference === undefined ? {} : {reference: side(medians.reference)}),
    ...(verdict && medians.reference !== undefined
      ? {
          comparison: {
            diff: medians.experiment - medians.reference,
            lo: medians.experiment - medians.reference - 2,
            hi: medians.experiment - medians.reference + 2,
            verdict,
          },
        }
      : {}),
  }
}

const RUN: BenchRunDocument = {
  _type: 'benchRun',
  schemaVersion: 1,
  mode: 'ab',
  git: {
    sha: 'abcdef1234567890',
    branch: 'perf-bench',
    mergeBaseSha: '1234567890abcdef',
    prNumber: 12345,
  },
  startedAt: '2026-07-06T12:00:00.000Z',
  completedAt: '2026-07-06T12:11:00.000Z',
  runner: {
    os: 'linux',
    arch: 'x64',
    cpus: 8,
    memGb: 32,
    nodeVersion: 'v24.0.0',
    ci: true,
    runId: '123456',
    calibrationMs: 11,
  },
  config: {cpuThrottleRate: 4, seed: 1},
  scenarios: [
    {
      scenario: 'singleString',
      kind: 'interaction',
      metrics: [metric('stringField', {experiment: 40, reference: 32}, 'regression')],
      stoppedBy: 'converged',
      failures: [{side: 'reference', reason: 'console-error'}],
      interruptions: {experiment: {count: 2, totalMs: 2600}, reference: {count: 1, totalMs: 1300}},
      loafAttribution: [
        {
          sourceUrl: 'https://localhost:3411/static/sanity-abc.js',
          functionName: 'commitWork',
          totalMs: 812,
        },
      ],
      resources: {
        experiment: {
          requestCount: 52,
          requestBytes: 210_000,
          byClass: {listen: 3, actions: 8, query: 12},
          cpuTaskMs: 1840,
          cpuScriptMs: 1210,
          heapMb: 88.4,
          domNodes: 4211,
          listeners: 923,
        },
        reference: {
          requestCount: 44,
          requestBytes: 120_000,
          byClass: {listen: 3, actions: 8, query: 6},
          cpuTaskMs: 1712,
          cpuScriptMs: 1150,
          heapMb: 86.1,
          domNodes: 4198,
          listeners: 910,
        },
      },
    },
    {
      scenario: 'article',
      kind: 'interaction',
      metrics: [
        metric('title', {experiment: 32, reference: 32}, 'neutral'),
        metric('body', {experiment: 44, reference: 41}, 'inconclusive'),
      ],
      stoppedBy: 'budget',
      failures: [],
      interruptions: {experiment: {count: 0, totalMs: 0}},
      loafAttribution: [],
    },
    {
      scenario: 'singleString',
      kind: 'pageload',
      metrics: [
        metric(
          'boot-cold · time to editable',
          {experiment: 4100, reference: 4000},
          'neutral',
          false,
        ),
        {
          label: 'boot-cold · auth round trips',
          unit: 'count',
          presentAsEfps: false,
          experiment: {
            sessions: [[2], [2]],
            summary: {n: 2, median: 2, p75: 2, p90: 2, p99: 2, min: 2, max: 2},
          },
          reference: {
            sessions: [[3], [3]],
            summary: {n: 2, median: 3, p75: 3, p90: 3, p99: 3, min: 3, max: 3},
          },
        },
      ],
      failures: [],
      interruptions: {experiment: {count: 0, totalMs: 0}},
      loafAttribution: [],
    },
  ],
  bundle: {
    experiment: {initialJsBytes: 1_452_000, totalJsBytes: 2_170_000, chunkCount: 276},
    reference: {initialJsBytes: 1_440_000, totalJsBytes: 2_160_000, chunkCount: 275},
  },
}

describe('renderMarkdownReport', () => {
  it('renders the full A/B report', () => {
    expect(renderMarkdownReport(RUN)).toMatchSnapshot()
  })

  it('puts regressions before neutral rows', () => {
    const report = renderMarkdownReport(RUN)
    const regressionIndex = report.indexOf('🔴')
    const neutralIndex = report.indexOf('✅')
    expect(regressionIndex).toBeGreaterThan(-1)
    expect(regressionIndex).toBeLessThan(neutralIndex)
  })

  it('summarizes the headline from verdicts', () => {
    expect(renderMarkdownReport(RUN)).toContain('**1 regression(s)** detected')
  })

  it('renders count-unit metrics without a ms suffix', () => {
    const report = renderMarkdownReport(RUN)
    expect(report).toContain('| singleString · boot-cold · auth round trips | 3 | 2 | — |')
  })

  it('calls out scenarios whose shards delivered no results', () => {
    const report = renderMarkdownReport(RUN, {
      missingScenarios: [
        {scenario: 'recipe', kind: 'interaction'},
        {scenario: 'syntheticLarge', kind: 'pageload'},
      ],
    })
    expect(report).toContain('**Missing results:** recipe (interaction), syntheticLarge (pageload)')
  })

  it('renders no missing-results warning when all scenarios reported', () => {
    expect(renderMarkdownReport(RUN, {missingScenarios: []})).not.toContain('Missing results')
    expect(renderMarkdownReport(RUN)).not.toContain('Missing results')
  })

  it('renders absolute mode without comparison columns', () => {
    const absolute: BenchRunDocument = {
      ...RUN,
      mode: 'absolute',
      scenarios: [
        {
          scenario: 'singleString',
          kind: 'interaction',
          metrics: [metric('stringField', {experiment: 32})],
          failures: [],
          interruptions: {experiment: {count: 0, totalMs: 0}},
          loafAttribution: [],
        },
      ],
      bundle: {experiment: RUN.bundle!.experiment},
    }
    const report = renderMarkdownReport(absolute)
    expect(report).toContain('absolute run')
    expect(report).not.toContain('Δ median')
  })
})

describe('mergeShards', () => {
  it('concatenates scenarios and spans the run window', () => {
    const shardTwo: BenchRunDocument = {
      ...RUN,
      startedAt: '2026-07-06T12:05:00.000Z',
      completedAt: '2026-07-06T12:20:00.000Z',
      scenarios: [RUN.scenarios[1]],
      bundle: undefined,
    }
    const merged = mergeShards([RUN, shardTwo])
    expect(merged.scenarios).toHaveLength(RUN.scenarios.length + 1)
    expect(merged.startedAt).toBe('2026-07-06T12:00:00.000Z')
    expect(merged.completedAt).toBe('2026-07-06T12:20:00.000Z')
    expect(merged.bundle).toEqual(RUN.bundle)
  })
})
