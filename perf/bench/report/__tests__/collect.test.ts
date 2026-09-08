// @vitest-environment node
import os from 'node:os'
import process from 'node:process'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {type PageLoadSample} from '../../runner/session/pageLoad'
import {type SettleSessionResult} from '../../runner/session/settle'
import {collectPageLoad, collectRunMetadata, collectSettle} from '../collect'

const ENV_KEYS = [
  'GITHUB_SHA',
  'GITHUB_REF',
  'GITHUB_HEAD_REF',
  'GITHUB_REF_NAME',
  'GITHUB_RUN_ID',
  'BENCH_MERGE_BASE',
  'BENCH_GIT_SHA',
  'BENCH_GIT_COMMITTED_AT',
  'BENCH_TRIGGER',
  'BENCH_RELEASE_TAG',
  'GITHUB_EVENT_NAME',
  'ImageOS',
  'ImageVersion',
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

/** The stored-to-metrics shape: only absolute-mode runs reach the dashboards. */
function absoluteMetadata() {
  return collectRunMetadata({
    mode: 'absolute',
    calibrationMs: 10,
    cpuThrottleRate: 4,
    seed: 1,
    startedAt: '2026-07-10T05:00:00.000Z',
  })
}

describe('collectRunMetadata', () => {
  it('records producer metadata: cpu model, runner image, browser version', () => {
    process.env.ImageOS = 'ubuntu24'
    process.env.ImageVersion = '20260810.1.0'
    const runner = collectRunMetadata({
      mode: 'ab',
      calibrationMs: 10,
      cpuThrottleRate: 4,
      seed: 1,
      startedAt: '2026-07-10T05:00:00.000Z',
      browserVersion: '140.0.7339.16',
    }).runner
    expect(runner).toMatchObject({
      imageOs: 'ubuntu24',
      imageVersion: '20260810.1.0',
      browserVersion: '140.0.7339.16',
    })
    // Machine-dependent — assert against the same source the code reads so
    // the test is exact everywhere Node reports a model at all
    const expectedModel = os.cpus()[0]?.model.trim()
    if (expectedModel) expect(runner.cpuModel).toBe(expectedModel)
    else expect(runner.cpuModel).toBeUndefined()
  })

  it('omits runner image and browser fields when not provided', () => {
    const runner = metadata().runner
    expect(runner.imageOs).toBeUndefined()
    expect(runner.imageVersion).toBeUndefined()
    expect(runner.browserVersion).toBeUndefined()
  })

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

  it('records a release run and the tag it measured', () => {
    process.env.BENCH_TRIGGER = 'release'
    process.env.BENCH_RELEASE_TAG = 'v6.10.1'
    expect(metadata()).toMatchObject({trigger: 'release', releaseTag: 'v6.10.1'})
  })

  // A release run is dispatched at its tag, so GITHUB_REF_NAME is the tag name.
  // The measured commit is a main commit, and the dashboards group runs into
  // per-branch lines defaulting to main — filing it under the tag would drop the
  // run out of the series it belongs to.
  it('files a release run on main, not on its tag ref', () => {
    process.env.BENCH_TRIGGER = 'release'
    process.env.BENCH_RELEASE_TAG = 'v6.10.1'
    process.env.GITHUB_REF_NAME = 'v6.10.1'
    expect(metadata().git.branch).toBe('main')
  })

  // ...but nothing else is rewritten: a PR or cron run keeps the ref it ran on
  it('leaves the branch alone for non-release runs', () => {
    process.env.GITHUB_REF_NAME = 'some-branch'
    expect(metadata().git.branch).toBe('some-branch')
    process.env.GITHUB_HEAD_REF = 'pr-branch'
    expect(metadata().git.branch).toBe('pr-branch')
  })

  // A tag on a non-release run would assert that the run measured that release,
  // which is the false attribution the field exists to remove
  it('keeps the release tag only on release runs', () => {
    process.env.BENCH_TRIGGER = 'cron'
    process.env.BENCH_RELEASE_TAG = 'v6.10.1'
    expect(metadata().releaseTag).toBeUndefined()
  })

  it('infers cron for the daily schedule', () => {
    process.env.GITHUB_EVENT_NAME = 'schedule'
    expect(metadata().trigger).toBe('cron')
  })

  // The daily cron predates this field; documents it wrote have no trigger and
  // consumers read them as cron, so the inference must agree with that
  it('infers pr, backfill and dispatch from the run shape', () => {
    process.env.GITHUB_REF = 'refs/pull/14234/merge'
    expect(metadata().trigger).toBe('pr')
    delete process.env.GITHUB_REF

    // An absolute-mode dispatch measuring a historical commit is a backfill
    process.env.BENCH_GIT_SHA = 'a'.repeat(40)
    expect(absoluteMetadata().trigger).toBe('backfill')
    delete process.env.BENCH_GIT_SHA

    expect(metadata().trigger).toBe('dispatch')
  })

  // An A/B dispatch also sets BENCH_GIT_SHA (to ab_to), but it compares two
  // commits rather than repairing a hole in the series — calling it a backfill
  // would misdescribe it. Harmless today (consumers filter mode == 'absolute'),
  // but the provenance should still be honest.
  it('does not call an A/B dispatch a backfill', () => {
    process.env.BENCH_GIT_SHA = 'a'.repeat(40)
    expect(metadata().trigger).toBe('dispatch')
  })

  // A typo in a workflow edit must not invent a trigger kind that consumers
  // then filter on — fall back to inference instead of storing the garbage
  it('ignores an unrecognized declared trigger', () => {
    process.env.BENCH_TRIGGER = 'relase'
    process.env.GITHUB_EVENT_NAME = 'schedule'
    expect(metadata().trigger).toBe('cron')
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
    jsPaths: ['/static/sanity-abc.js'],
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
      {experiment: new Map([['/static/sanity-abc.js', 140_000]])},
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
      {experiment: new Map([['/static/other.js', 1]])},
    )
    expect(noMatches.metrics.some((metric) => metric.label.includes('boot JS'))).toBe(false)
  })

  // Chunk names are content-hashed, so a side must be valued against its own
  // build's sizes — the experiment map would give the reference side a partial
  // sum that reads as a fake A/B diff
  it('values each side of boot JS against its own chunk sizes', () => {
    const referenceSample = {...sample('boot-cold', 4200), jsPaths: ['/static/sanity-old.js']}
    const bothSides = new Map([
      ['experiment', [sample('boot-cold', 4000)]],
      ['reference', [referenceSample]],
    ])
    const withBoth = collectPageLoad('singleString', bothSides, new Map(), undefined, {
      experiment: new Map([['/static/sanity-abc.js', 140_000]]),
      reference: new Map([['/static/sanity-old.js', 120_000]]),
    })
    const bootJs = withBoth.metrics.find((metric) => metric.label === 'boot-cold · boot JS')
    expect(bootJs?.experiment.summary.median).toBe(140_000)
    expect(bootJs?.reference?.summary.median).toBe(120_000)

    // Without a reference size map the row stays experiment-only
    const withoutReferenceSizes = collectPageLoad('singleString', bothSides, new Map(), undefined, {
      experiment: new Map([['/static/sanity-abc.js', 140_000]]),
    })
    const experimentOnly = withoutReferenceSizes.metrics.find(
      (metric) => metric.label === 'boot-cold · boot JS',
    )
    expect(experimentOnly?.experiment.summary.median).toBe(140_000)
    expect(experimentOnly?.reference).toBeUndefined()
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

describe('collectSettle', () => {
  const scenario = {
    name: 'previewHeavy',
    sourceFile: 'perf/bench/scenarios/customizations.ts',
    documentType: 'previewHeavy',
    documentId: 'doc',
    fixture: () => [],
    interactions: [],
  }

  function settleSession(overrides: Partial<SettleSessionResult> = {}): SettleSessionResult {
    return {
      ready: true,
      settled: true,
      settleTimeMs: 1200,
      reactCommits: 12,
      commitsPerSecond: 2.5,
      hookInstalled: true,
      loafCount: 1,
      loafBlockingMs: 60,
      cpuAfterReadyMs: 400,
      peakCpuUtilization: 0.2,
      renderMarks: {'previewHeavy.row': 24},
      loafAttribution: [{sourceUrl: 'https://x/chunk.js', functionName: 'f', totalMs: 60}],
      timeline: [],
      ...overrides,
    }
  }

  it('reports mode settle with the scenario expectation', () => {
    const report = collectSettle(scenario, [settleSession()])
    expect(report.mode).toBe('settle')
    expect(report.kind).toBe('pageload')
    expect(report.settleExpectation).toEqual({expectedToSettle: true})
  })

  it('carries expectedToSettle: false for red-by-design scenarios', () => {
    const report = collectSettle({...scenario, expectedToSettle: false}, [
      settleSession({settled: false, settleTimeMs: null}),
    ])
    expect(report.settleExpectation).toEqual({expectedToSettle: false})
  })

  it('emits settled/ready as 0-1 per session and per-component render rows', () => {
    const report = collectSettle(scenario, [
      settleSession(),
      settleSession({settled: false, settleTimeMs: null, ready: false, hookInstalled: false}),
    ])
    const byLabel = new Map(report.metrics.map((metric) => [metric.label, metric]))
    // Run-level count: a single pseudo-session, so the trend median IS the count
    expect(byLabel.get('sessions not settled')?.experiment.sessions).toEqual([[1]])
    // Same shape for the detector's own health: sessions whose commit counter never attached
    expect(byLabel.get('sessions without commit counter')?.experiment.sessions).toEqual([[1]])
    expect(byLabel.get('settled sessions')?.experiment.sessions).toEqual([[1], [0]])
    expect(byLabel.get('ready sessions')?.experiment.sessions).toEqual([[1], [0]])
    expect(byLabel.get('time to settle')?.experiment.sessions).toEqual([[1200]])
    expect(byLabel.get('react commits after ready')?.experiment.sessions).toEqual([[12], [12]])
    expect(byLabel.get('renders · previewHeavy.row')?.experiment.sessions).toEqual([[24], [24]])
  })

  it('omits time-to-settle when no session settled', () => {
    const report = collectSettle(scenario, [settleSession({settled: false, settleTimeMs: null})])
    expect(report.metrics.some((metric) => metric.label === 'time to settle')).toBe(false)
  })

  it('folds loaf attribution across sessions', () => {
    const report = collectSettle(scenario, [settleSession(), settleSession()])
    expect(report.loafAttribution).toEqual([
      {sourceUrl: 'https://x/chunk.js', functionName: 'f', totalMs: 120},
    ])
  })
})
