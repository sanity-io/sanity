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

  it('summarizes the headline from verdicts', () => {
    expect(renderMarkdownReport(RUN)).toContain('**1 regression(s)** detected')
  })

  it('lists only the regressed metrics, with their delta', () => {
    const report = renderMarkdownReport(RUN)
    // The one regression is named...
    expect(report).toContain('`singleString · stringField` +8.0ms')
    // ...and the neutral/inconclusive/improvement metrics are NOT listed
    expect(report).not.toContain('article · title')
    expect(report).not.toContain('article · body')
  })

  it('includes a mermaid chart of the regression deltas', () => {
    const report = renderMarkdownReport(RUN)
    expect(report).toContain('```mermaid')
    expect(report).toContain('xychart-beta')
    expect(report).toContain('bar [8.0]')
  })

  it('omits the regression list and chart when nothing regressed', () => {
    const clean: BenchRunDocument = {
      ...RUN,
      scenarios: [
        {
          ...RUN.scenarios[0],
          metrics: [metric('stringField', {experiment: 32, reference: 32}, 'neutral')],
        },
      ],
    }
    const report = renderMarkdownReport(clean)
    expect(report).toContain('✅ no regressions')
    expect(report).not.toContain('inconclusive')
    expect(report).not.toContain('```mermaid')
  })

  it('counts inconclusive verdicts in the headline instead of reading as a clean pass', () => {
    const allInconclusive: BenchRunDocument = {
      ...RUN,
      scenarios: [
        {
          ...RUN.scenarios[0],
          metrics: [
            metric('stringField', {experiment: 40, reference: 32}, 'inconclusive'),
            metric('body', {experiment: 44, reference: 41}, 'inconclusive'),
          ],
        },
      ],
    }
    const report = renderMarkdownReport(allInconclusive)
    expect(report).toContain('✅ no regressions (2 inconclusive — CI too wide to decide)')
    // Inconclusive is not a regression: no per-metric list or chart
    expect(report).not.toContain('```mermaid')
  })

  it('keeps the inconclusive count visible alongside regressions', () => {
    // RUN has one regression and one inconclusive metric
    expect(renderMarkdownReport(RUN)).toContain(
      '🔴 **1 regression(s)** detected (1 inconclusive — CI too wide to decide)',
    )
  })

  it('deep-links to the dashboard with the PR branch and main preselected', () => {
    expect(renderMarkdownReport(RUN)).toContain(
      'https://studio-metrics.sanity.dev/trends?branches=main%2Cperf-bench',
    )
  })

  it('omits the dashboard link for main-branch runs (nothing to compare)', () => {
    const onMain: BenchRunDocument = {...RUN, git: {...RUN.git, branch: 'main'}}
    expect(renderMarkdownReport(onMain)).not.toContain('studio-metrics.sanity.dev')
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

  it('renders a report-only INP comparison as informational, never as a blocking regression', () => {
    const withInp: BenchRunDocument = {
      ...RUN,
      scenarios: [
        {
          ...RUN.scenarios[0],
          metrics: [metric('stringField', {experiment: 32, reference: 32}, 'neutral')],
        },
        {
          scenario: 'commentsField',
          kind: 'pageload',
          mode: 'inp',
          metrics: [metric('INP', {experiment: 420, reference: 260}, 'regression', false)],
          failures: [],
          interruptions: {experiment: {count: 0, totalMs: 0}},
          loafAttribution: [],
        },
      ],
    }
    const report = renderMarkdownReport(withInp)
    // The headline stays clean — a report-only INP swing must never flip it
    expect(report).toContain('✅ no regressions')
    expect(report).not.toContain('🔴')
    expect(report).not.toContain('regression(s)')
    // ...but the delta still surfaces, decoupled, as informational context
    expect(report).toContain('ℹ️ **Per-PR INP** (report-only, not gated):')
    expect(report).toContain('`commentsField · INP` +160.0ms')
    expect(report).toContain('(regression)')
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
  const shardTwo: BenchRunDocument = {
    ...RUN,
    startedAt: '2026-07-06T12:05:00.000Z',
    completedAt: '2026-07-06T12:20:00.000Z',
    runner: {...RUN.runner, calibrationMs: 19},
    scenarios: [{...RUN.scenarios[1], scenario: 'recipe'}],
    bundle: undefined,
  }

  it('concatenates scenarios and spans the run window', () => {
    const merged = mergeShards([RUN, shardTwo])
    expect(merged.scenarios).toHaveLength(RUN.scenarios.length + 1)
    expect(merged.startedAt).toBe('2026-07-06T12:00:00.000Z')
    expect(merged.completedAt).toBe('2026-07-06T12:20:00.000Z')
    expect(merged.bundle).toEqual(RUN.bundle)
  })

  it('stamps every scenario with its own shard runner calibration', () => {
    // CI runs one shard per scenario on separate machines — keeping only the
    // first shard's runner would store scenarios under another host's
    // calibration score
    const merged = mergeShards([RUN, shardTwo])
    for (const scenario of merged.scenarios.slice(0, RUN.scenarios.length)) {
      expect(scenario.runner).toEqual({calibrationMs: RUN.runner.calibrationMs})
    }
    expect(merged.scenarios.at(-1)?.runner).toEqual({calibrationMs: 19})
    // The document-level runner block stays (first shard's) for compatibility
    expect(merged.runner).toEqual(RUN.runner)
  })

  it('fails loudly on duplicate scenario reports (they would collide as stored _keys)', () => {
    expect(() => mergeShards([RUN, {...shardTwo, scenarios: [RUN.scenarios[1]]}])).toThrow(
      /duplicate scenario report\(s\): interaction-article/,
    )
    // The same shard artifact provided twice is the realistic trigger
    expect(() => mergeShards([RUN, RUN])).toThrow(/duplicate scenario report/)
  })
})
