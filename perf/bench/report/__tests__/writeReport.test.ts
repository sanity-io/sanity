import {describe, expect, it} from 'vitest'

import {mergeShards} from '../mergeShards'
import {documentIdForRun} from '../storeToSanity'
import {type BenchRunDocument, type MetricReport, type ScenarioReport} from '../types'
import {computeMissingScenarios, toAbsolute} from '../writeReport'

const AB_METRIC: MetricReport = {
  label: 'stringField',
  unit: 'ms',
  presentAsEfps: true,
  experiment: {
    sessions: [[30, 32]],
    summary: {n: 2, median: 31, p75: 32, p90: 32, p99: 32, min: 30, max: 32},
  },
  reference: {
    sessions: [[28, 29]],
    summary: {n: 2, median: 28.5, p75: 29, p90: 29, p99: 29, min: 28, max: 29},
  },
  comparison: {diff: 2.5, lo: 1, hi: 4, verdict: 'neutral'},
}

const AB_RUN: BenchRunDocument = {
  _type: 'benchRun',
  schemaVersion: 1,
  mode: 'ab',
  git: {sha: 'abcdef1234567890', branch: 'my-feature', mergeBaseSha: '1234', prNumber: 777},
  startedAt: '2026-07-06T12:00:00.000Z',
  completedAt: '2026-07-06T12:11:00.000Z',
  runner: {
    os: 'linux',
    arch: 'x64',
    cpus: 8,
    memGb: 32,
    nodeVersion: 'v24.0.0',
    ci: true,
    runId: '424242',
    calibrationMs: 11,
  },
  config: {cpuThrottleRate: 4, seed: 1},
  scenarios: [
    {
      scenario: 'singleString',
      kind: 'interaction',
      metrics: [AB_METRIC],
      stoppedBy: 'converged',
      failures: [],
      interruptions: {
        experiment: {count: 1, totalMs: 200},
        reference: {count: 2, totalMs: 400},
      },
      loafAttribution: [],
      resources: {
        experiment: {requestCount: 10, requestBytes: 1000, byClass: {listen: 3}},
        reference: {requestCount: 12, requestBytes: 1200, byClass: {listen: 4}},
      },
    },
  ],
  bundle: {
    experiment: {initialJsBytes: 100, totalJsBytes: 200, chunkCount: 3},
    reference: {initialJsBytes: 90, totalJsBytes: 180, chunkCount: 3},
  },
}

describe('toAbsolute', () => {
  // The absolute variant is what gets stored in the main-comparable trend
  // series for a labeled PR — any reference-side data leaking through would
  // pollute the series with numbers from a different build

  it('flips the mode to absolute', () => {
    expect(toAbsolute(AB_RUN).mode).toBe('absolute')
  })

  it('strips every reference and comparison key from metrics', () => {
    const absolute = toAbsolute(AB_RUN)
    for (const scenario of absolute.scenarios) {
      for (const metric of scenario.metrics) {
        expect(metric).not.toHaveProperty('reference')
        expect(metric).not.toHaveProperty('comparison')
      }
    }
    // ...while the experiment side survives untouched
    expect(absolute.scenarios[0].metrics[0].experiment).toEqual(AB_METRIC.experiment)
  })

  it('keeps only the experiment side of interruptions and resources', () => {
    const absolute = toAbsolute(AB_RUN)
    expect(absolute.scenarios[0].interruptions).toEqual({experiment: {count: 1, totalMs: 200}})
    expect(absolute.scenarios[0].resources).toEqual({
      experiment: {requestCount: 10, requestBytes: 1000, byClass: {listen: 3}},
    })
  })

  it('keeps only the experiment bundle', () => {
    expect(toAbsolute(AB_RUN).bundle).toEqual({
      experiment: {initialJsBytes: 100, totalJsBytes: 200, chunkCount: 3},
    })
  })

  it('omits resources when the scenario has none', () => {
    const withoutResources: BenchRunDocument = {
      ...AB_RUN,
      scenarios: [{...AB_RUN.scenarios[0], resources: undefined}],
    }
    expect(toAbsolute(withoutResources).scenarios[0].resources).toBeUndefined()
  })

  it('preserves run identity (git, runner, timestamps)', () => {
    const absolute = toAbsolute(AB_RUN)
    expect(absolute.git).toEqual(AB_RUN.git)
    expect(absolute.runner).toEqual(AB_RUN.runner)
    expect(absolute.startedAt).toBe(AB_RUN.startedAt)
    expect(absolute.completedAt).toBe(AB_RUN.completedAt)
  })

  it('is a safe no-op on an already-absolute run', () => {
    // writeReport now always emits merged-absolute.json (a reference-skipped PR
    // produces absolute shards); toAbsolute must pass those through cleanly so
    // the PR series still gets stored.
    const absoluteRun: BenchRunDocument = {
      ...AB_RUN,
      mode: 'absolute',
      scenarios: [
        {
          ...AB_RUN.scenarios[0],
          metrics: [{...AB_METRIC, reference: undefined, comparison: undefined}],
          interruptions: {experiment: {count: 1, totalMs: 200}},
          resources: {experiment: {requestCount: 10, requestBytes: 1000, byClass: {listen: 3}}},
        },
      ],
      bundle: {experiment: {initialJsBytes: 100, totalJsBytes: 200, chunkCount: 3}},
    }
    expect(toAbsolute(absoluteRun)).toEqual(absoluteRun)
  })
})

const scenarioReport = (
  scenarioName: string,
  kind: ScenarioReport['kind'],
  mode?: ScenarioReport['mode'],
): ScenarioReport => ({
  scenario: scenarioName,
  kind,
  ...(mode ? {mode} : {}),
  metrics: [],
  failures: [],
  interruptions: {experiment: {count: 0, totalMs: 0}},
  loafAttribution: [],
})

describe('mergeShards', () => {
  const shard = (scenario: ScenarioReport): BenchRunDocument => ({
    ...AB_RUN,
    mode: 'absolute',
    scenarios: [scenario],
  })
  it('merges a track-main set without colliding soak/inp against interaction/pageload', () => {
    // The daily cron produces all four for the same scenario: interaction,
    // pageload, soak (kind interaction), inp (kind pageload). Before `mode`
    // disambiguated the key, soak collided with interaction and inp with
    // pageload, and the merge threw — storing nothing.
    const merged = mergeShards([
      shard(scenarioReport('singleString', 'interaction')),
      shard(scenarioReport('singleString', 'pageload')),
      shard(scenarioReport('singleString', 'interaction', 'soak')),
      shard(scenarioReport('singleString', 'pageload', 'inp')),
    ])
    expect(merged.scenarios).toHaveLength(4)
  })

  it('still rejects a genuinely duplicated shard (same mode + scenario)', () => {
    expect(() =>
      mergeShards([
        shard(scenarioReport('singleString', 'interaction')),
        shard(scenarioReport('singleString', 'interaction')),
      ]),
    ).toThrow(/duplicate/)
  })
})

describe('documentIdForRun', () => {
  // The id decides overwrite-vs-append in the metrics dataset: PR runs
  // overwrite one doc per PR (latest push wins), main/cron runs append one
  // doc per run so the time series accumulates

  it('gives a PR run a per-PR id (latest push overwrites)', () => {
    expect(documentIdForRun(AB_RUN)).toBe('benchRun-pr-777')
  })

  it('gives a main run a per-run id (sha + CI run id) so the series accumulates', () => {
    const mainRun: BenchRunDocument = {
      ...AB_RUN,
      git: {sha: 'abcdef1234567890', branch: 'main'},
    }
    expect(documentIdForRun(mainRun)).toBe('benchRun-abcdef1234567890-424242')
  })

  it('falls back to a local suffix without a CI run id', () => {
    const localRun: BenchRunDocument = {
      ...AB_RUN,
      git: {sha: 'abcdef1234567890', branch: 'main'},
      runner: {...AB_RUN.runner, runId: undefined},
    }
    expect(documentIdForRun(localRun)).toBe('benchRun-abcdef1234567890-local')
  })
})

describe('computeMissingScenarios', () => {
  // INP reports share `kind: 'pageload'` with plain pageload reports (see
  // ScenarioReport.mode) — the guard must key off `mode` too, or a dead INP
  // shard passes silently and a dead pageload shard could false-match an INP
  // expectation.

  it('reports nothing missing when the expected inp scenario is present', () => {
    const missing = computeMissingScenarios([scenarioReport('commentsField', 'pageload', 'inp')], {
      inp: 'commentsField',
    })
    expect(missing).toEqual([])
  })

  it('fails loud when an expected inp scenario is absent', () => {
    const missing = computeMissingScenarios([], {inp: 'commentsField'})
    expect(missing).toEqual([{scenario: 'commentsField', kind: 'pageload'}])
  })

  it('does not let a plain pageload report satisfy an inp expectation', () => {
    const missing = computeMissingScenarios([scenarioReport('commentsField', 'pageload')], {
      inp: 'commentsField',
    })
    expect(missing).toEqual([{scenario: 'commentsField', kind: 'pageload'}])
  })

  it('does not let an inp report satisfy a plain pageload expectation', () => {
    const missing = computeMissingScenarios([scenarioReport('commentsField', 'pageload', 'inp')], {
      pageload: 'commentsField',
    })
    expect(missing).toEqual([{scenario: 'commentsField', kind: 'pageload'}])
  })

  it('still guards interaction and pageload scenarios unchanged', () => {
    const missing = computeMissingScenarios(
      [scenarioReport('singleString', 'interaction'), scenarioReport('article', 'pageload')],
      {interaction: 'singleString', pageload: 'article'},
    )
    expect(missing).toEqual([])
  })
})
