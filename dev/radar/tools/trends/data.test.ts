import {expect, test} from 'vitest'

import {
  aggregateStyleSeries,
  buildSeries,
  calibrationSeries,
  soakLatestValueSeries,
  formatTick,
  formatValue,
  lineName,
  primaryLines,
  settleViews,
  styleLabel,
  styleScenario,
  styleViews,
  type TrendRun,
  type TrendSeries,
  UI_OVERVIEW_KEY,
  vitalSections,
} from './data'
import {generateDebugRuns} from './debugData'

const START = Date.UTC(2026, 0, 1)
const DAY = 24 * 60 * 60 * 1000

/** A minimal absolute-mode run carrying one interaction metric. */
function run(options: {
  id: string
  sha: string
  day: number
  value: number
  /** Extra copies of the same metric, as the pageload scenario does for INP. */
  repeats?: number
  calibrationMs?: number
  /** Per-scenario shard calibration, as mergeShards stamps on multi-shard CI runs. */
  shardCalibrationMs?: number
  trigger?: TrendRun['trigger']
  releaseTag?: string
  /** Hour within `day`, to order same-commit runs (cron at 05:00, release later). */
  hour?: number
}): TrendRun {
  const {
    id,
    sha,
    day,
    value,
    repeats = 1,
    calibrationMs = 8,
    shardCalibrationMs,
    trigger,
    releaseTag,
    hour = 0,
  } = options
  return {
    _id: id,
    startedAt: new Date(START + day * DAY + hour * 60 * 60 * 1000).toISOString(),
    mode: 'absolute',
    ...(trigger ? {trigger} : {}),
    ...(releaseTag ? {releaseTag} : {}),
    git: {sha, branch: 'main', committedAt: new Date(START + day * DAY).toISOString()},
    runner: {calibrationMs, runId: id, runAttempt: 1},
    bundle: null,
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'interaction',
        ...(shardCalibrationMs !== undefined ? {runner: {calibrationMs: shardCalibrationMs}} : {}),
        metrics: Array.from({length: repeats}, () => ({
          label: 'stringField',
          unit: 'ms' as const,
          experiment: {summary: {median: value, p75: value * 1.1, p90: value * 1.2}},
        })),
      },
    ],
  }
}

function pointsOf(runs: TrendRun[]) {
  const [series] = buildSeries(runs)
  return series.lines[0].points
}

test('one run per commit is left alone', () => {
  const points = pointsOf([
    run({id: 'a', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'b', sha: 'sha-2', day: 1, value: 120}),
  ])
  expect(points.map((p) => p.value)).toEqual([100, 120])
})

// CI re-runs the suite on a commit fairly often. Without merging, that commit
// gets several dots on one x-position and several votes in every median.
test('re-runs of one commit merge to their median', () => {
  const points = pointsOf([
    run({id: 'a1', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'a2', sha: 'sha-1', day: 0, value: 140}),
    run({id: 'a3', sha: 'sha-1', day: 0, value: 120}),
  ])
  expect(points).toHaveLength(1)
  expect(points[0].value).toBe(120)
})

// Median, not mean: a single failed or throttled re-run must not drag the point.
test('an outlier re-run does not drag the merged value', () => {
  const points = pointsOf([
    run({id: 'a1', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'a2', sha: 'sha-1', day: 0, value: 104}),
    run({id: 'a3', sha: 'sha-1', day: 0, value: 900}),
  ])
  // Mean would be ~368
  expect(points[0].value).toBe(104)
})

// Defensive: no run document is known to carry the same metric twice, but if
// one ever does, it must collapse to one point rather than double-voting its
// commit.
test('repeated metrics within one run collapse to one point', () => {
  const points = pointsOf([run({id: 'a', sha: 'sha-1', day: 0, value: 100, repeats: 2})])
  expect(points).toHaveLength(1)
  expect(points[0].value).toBe(100)
})

test('p75 and p90 merge alongside the value', () => {
  const points = pointsOf([
    run({id: 'a1', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'a2', sha: 'sha-1', day: 0, value: 200}),
  ])
  expect(points[0].value).toBe(150)
  expect(points[0].p75).toBeCloseTo(165, 5)
  expect(points[0].p90).toBeCloseTo(180, 5)
})

// The click-through has to open a real document, so the merged point keeps one
// run's identity rather than inventing a synthetic id.
test('a merged point keeps a real run identity', () => {
  const points = pointsOf([
    run({id: 'first', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'second', sha: 'sha-1', day: 0, value: 120}),
  ])
  expect(['first', 'second']).toContain(points[0].runId)
  expect(points[0].sha).toBe('sha-1')
})

// Runs with no sha can't be grouped by commit; keying them by run keeps them
// distinct instead of collapsing unrelated measurements into one point.
test('runs without a sha stay separate', () => {
  const a = run({id: 'a', sha: 'x', day: 0, value: 100})
  const b = run({id: 'b', sha: 'y', day: 1, value: 120})
  const points = pointsOf([
    {...a, git: null},
    {...b, git: null},
  ])
  expect(points).toHaveLength(2)
})

test('merged points stay in chronological order', () => {
  const points = pointsOf([
    run({id: 'c', sha: 'sha-3', day: 2, value: 130}),
    run({id: 'a', sha: 'sha-1', day: 0, value: 100}),
    run({id: 'b', sha: 'sha-2', day: 1, value: 120}),
  ])
  expect(points.map((p) => p.value)).toEqual([100, 120, 130])
})

/** An INP-session run: the INP value plus its interaction-count companion. */
function inpRun(options: {
  id: string
  sha: string
  day: number
  inp: number
  count: number
}): TrendRun {
  const base = run({id: options.id, sha: options.sha, day: options.day, value: 0})
  return {
    ...base,
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'pageload',
        metrics: [
          {
            label: 'INP',
            unit: 'ms' as const,
            experiment: {summary: {median: options.inp, p75: options.inp, p90: options.inp}},
          },
          {
            label: 'INP interactions',
            unit: 'count' as const,
            experiment: {summary: {median: options.count, p75: options.count, p90: options.count}},
          },
        ],
      },
    ],
  }
}

// Vitals with a published web.dev recommendation carry it so the chart can
// draw the "good" bar; metrics without one must NOT get an invented bar.
test('web vitals carry their good threshold, other metrics do not', () => {
  const [inp] = buildSeries([inpRun({id: 'a', sha: 'sha-1', day: 0, inp: 88, count: 62})])
  expect(inp.goodThreshold).toBe(200)
  const [keystroke] = buildSeries([run({id: 'b', sha: 'sha-2', day: 0, value: 40})])
  expect(keystroke.goodThreshold).toBeUndefined()
})

// The interaction count is confidence context for INP, not a metric: it rides
// on the INP point (for the tooltip/popover) instead of getting its own chart.
test('INP interactions become point context, not a series', () => {
  const series = buildSeries([inpRun({id: 'a', sha: 'sha-1', day: 0, inp: 88, count: 62})])
  expect(series).toHaveLength(1)
  expect(series[0].title).toBe('singleString · INP')
  expect(series[0].lines[0].points[0].interactions).toBe(62)
})

test('merged INP points keep the median interaction count', () => {
  const series = buildSeries([
    inpRun({id: 'a1', sha: 'sha-1', day: 0, inp: 88, count: 40}),
    inpRun({id: 'a2', sha: 'sha-1', day: 0, inp: 96, count: 62}),
    inpRun({id: 'a3', sha: 'sha-1', day: 0, inp: 90, count: 55}),
  ])
  const [point] = series[0].lines[0].points
  expect(point.value).toBe(90)
  expect(point.interactions).toBe(55)
})

// The run popover's Host section reads the machine description off the point;
// a shard-stamped cpuModel overrides the run-level one, since multi-shard runs
// land each scenario on its own machine.
test('points carry the host description, shard cpuModel winning', () => {
  const base = run({id: 'a', sha: 'sha-1', day: 0, value: 100})
  const withHost: TrendRun = {
    ...base,
    runner: {
      ...base.runner!,
      os: 'linux',
      arch: 'x64',
      cpus: 8,
      memGb: 31,
      nodeVersion: 'v24.19.0',
      cpuModel: 'AMD EPYC 7763',
    },
    scenarios: [{...base.scenarios![0], runner: {calibrationMs: 9, cpuModel: 'Intel Xeon 8370C'}}],
  }
  const [point] = pointsOf([withHost])
  expect(point.host?.os).toBe('linux')
  expect(point.host?.cpus).toBe(8)
  expect(point.host?.cpuModel).toBe('Intel Xeon 8370C')
})

// Old documents recorded nothing beyond run identity — no empty Host section.
test('points omit host when the run recorded no host details', () => {
  const [point] = pointsOf([run({id: 'a', sha: 'sha-1', day: 0, value: 100})])
  expect(point.host).toBeUndefined()
})

// The in-chart calibration overlay draws the host that measured *this* point:
// the scenario's own shard score when present (multi-shard CI runs execute each
// scenario on a separate machine), else the run-level score.
test('points carry the calibration of the shard that measured them', () => {
  const points = pointsOf([
    run({id: 'a', sha: 'sha-1', day: 0, value: 100, calibrationMs: 8, shardCalibrationMs: 11}),
  ])
  expect(points[0].calibrationMs).toBe(11)
})

test('points fall back to the run-level calibration', () => {
  const points = pointsOf([run({id: 'a', sha: 'sha-1', day: 0, value: 100, calibrationMs: 8})])
  expect(points[0].calibrationMs).toBe(8)
})

test('merged points keep the median calibration', () => {
  const points = pointsOf([
    run({id: 'a1', sha: 'sha-1', day: 0, value: 100, calibrationMs: 7}),
    run({id: 'a2', sha: 'sha-1', day: 0, value: 120, calibrationMs: 20}),
    run({id: 'a3', sha: 'sha-1', day: 0, value: 110, calibrationMs: 9}),
  ])
  expect(points).toHaveLength(1)
  expect(points[0].calibrationMs).toBe(9)
})

const vitalStub = (title: string) => ({title}) as TrendSeries

// The vitals tab reads by vital ("how is LCP doing, everywhere?"): one section
// per vital, Core Web Vitals first, scenarios alphabetical within each.
test('vitals group into per-vital sections', () => {
  const sections = vitalSections([
    vitalStub('recipe · boot-cold · CLS'),
    vitalStub('singleString · INP'),
    vitalStub('recipe · boot-cold · LCP'),
    vitalStub('article · boot-cold · LCP'),
    vitalStub('article · boot-cold · FCP'),
  ])
  expect(
    sections.map((section) => [section.vital, section.series.map((entry) => entry.title)]),
  ).toEqual([
    ['INP', ['singleString · INP']],
    ['LCP', ['article · boot-cold · LCP', 'recipe · boot-cold · LCP']],
    ['CLS', ['recipe · boot-cold · CLS']],
    ['FCP', ['article · boot-cold · FCP']],
  ])
})

// Older documents carry a TTFB metric (a constant of the local mock, not a
// studio signal) — it must not chart
test('TTFB metrics in stored documents are skipped', () => {
  const base = run({id: 'a', sha: 'sha-1', day: 0, value: 100})
  const withTtfb: TrendRun = {
    ...base,
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'pageload',
        metrics: [
          {
            label: 'boot-cold · TTFB',
            unit: 'ms' as const,
            experiment: {summary: {median: 3.5, p75: 3.6, p90: 5.2}},
          },
        ],
      },
    ],
  }
  expect(buildSeries([withTtfb])).toHaveLength(0)
})

// A metric in the vitals group that isn't a known vital must still render —
// never silently vanish from the dashboard
test('unknown vitals fall into a catch-all section', () => {
  const sections = vitalSections([vitalStub('singleString · somethingNew')])
  expect(sections).toEqual([
    {vital: 'Other', series: [expect.objectContaining({title: 'singleString · somethingNew'})]},
  ])
})

// The calibration strip's job is showing host-speed spread, including between
// re-runs of one commit — merging it would hide exactly what it exists to show.
test('the calibration series is not merged', () => {
  const series = calibrationSeries([
    run({id: 'a1', sha: 'sha-1', day: 0, value: 100, calibrationMs: 7.6}),
    run({id: 'a2', sha: 'sha-1', day: 0, value: 100, calibrationMs: 6}),
  ])
  expect(series.lines[0].points.map((p) => p.value).sort((x, y) => x - y)).toEqual([6, 7.6])
})

// A "60000ms" tick does not fit the 44px axis gutter and silently renders as
// "0000ms", which reads as wrong data rather than a clipped label.
test('long durations abbreviate to seconds', () => {
  expect(formatValue(60_000, 'ms')).toBe('60.0s')
  expect(formatValue(33_863, 'ms')).toBe('33.9s')
  expect(formatValue(120_000, 'ms')).toBe('120s')
})

// A merged point's calibration is a median across machines — attributing it
// to the last re-run's host would pair a synthetic score with one specific
// machine. Host survives the merge only when every merged run agrees.
test('a mixed-host merge drops the host, an agreeing merge keeps it', () => {
  const withModel = (id: string, cpuModel: string): TrendRun => {
    const base = run({id, sha: 'sha-1', day: 0, value: 100})
    return {...base, runner: {...base.runner!, os: 'linux', cpuModel}}
  }
  const [mixed] = pointsOf([withModel('a1', 'AMD EPYC 7763'), withModel('a2', 'Intel Xeon 8370C')])
  expect(mixed.host).toBeUndefined()
  const [agreeing] = pointsOf([withModel('b1', 'AMD EPYC 7763'), withModel('b2', 'AMD EPYC 7763')])
  expect(agreeing.host?.cpuModel).toBe('AMD EPYC 7763')
})

// Each Calibration-tab point names its own shard's machine: the run-level
// runner block is the first shard's, and multi-shard runs land on different
// hardware.
test('calibration points carry their own shard host, not the first shard', () => {
  const base = run({id: 'a', sha: 'sha-1', day: 0, value: 100})
  const multiShard: TrendRun = {
    ...base,
    runner: {...base.runner!, cpuModel: 'AMD EPYC 7763'},
    scenarios: [
      {...base.scenarios![0], runner: {calibrationMs: 6, cpuModel: 'AMD EPYC 7763'}},
      {
        ...base.scenarios![0],
        scenario: 'article',
        runner: {calibrationMs: 9, cpuModel: 'Intel Xeon 8370C'},
      },
    ],
  }
  const points = calibrationSeries([multiShard]).lines[0].points
  expect(points.map((p) => [p.value, p.host?.cpuModel])).toEqual([
    [6, 'AMD EPYC 7763'],
    [9, 'Intel Xeon 8370C'],
  ])
})

// Soak charts are produced by their own shard too — its calibration enables
// the in-chart context line, and its cpuModel keeps the popover honest.
test('soak history points carry the soak shard calibration and host', () => {
  const soakRun = (id: string, sha: string, day: number, latency: number): TrendRun => ({
    ...run({id, sha, day, value: 0}),
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'interaction',
        runner: {calibrationMs: 9, cpuModel: 'Intel Xeon 8370C'},
        metrics: [],
        soak: {
          minutes: 2,
          samples: [1, 2].map((minute) => ({
            minute,
            heapMb: 100,
            domNodes: 1000,
            listeners: 50,
            latencyP50Ms: latency,
            cpuTaskMs: 200,
            connections: 2,
            requests: 10,
          })),
        },
      },
    ],
  })
  const series = soakLatestValueSeries([soakRun('a', 'sha-1', 0, 40), soakRun('b', 'sha-2', 1, 44)])
  const latencySeries = series.find((entry) => entry.key === 'soak:latest:latencyP50Ms')
  const [point] = latencySeries!.lines[0].points
  expect(point.calibrationMs).toBe(9)
  expect(point.host?.cpuModel).toBe('Intel Xeon 8370C')
})

// Host calibration lives at 5–9ms — whole-ms rounding would collapse its whole
// dynamic range into four buckets. One decimal matches the 0.1ms granularity
// Chromium's coarsened performance.now() actually measures at; exact integers
// stay whole so zero ticks don't grow a pointless ".0".
test('small fractional ms keep one decimal, integers stay whole', () => {
  expect(formatValue(7.699999999953434, 'ms')).toBe('7.7ms')
  expect(formatValue(8, 'ms')).toBe('8ms')
  expect(formatValue(0, 'ms')).toBe('0ms')
  expect(formatValue(64, 'ms')).toBe('64ms')
})

// Keystroke latency lives at 30–200ms; "0.09s" would throw away the precision
// the whole suite exists to measure.
test('short durations stay in exact milliseconds', () => {
  expect(formatValue(88, 'ms')).toBe('88ms')
  expect(formatValue(532, 'ms')).toBe('532ms')
  expect(formatValue(9_999, 'ms')).toBe('9999ms')
})

test('the abbreviation boundary is 10s', () => {
  expect(formatValue(9_999, 'ms')).toMatch(/ms$/)
  expect(formatValue(10_000, 'ms')).toBe('10.0s')
})

// Other units are untouched by the ms abbreviation
test('non-ms units are unaffected', () => {
  expect(formatValue(60_000, 'count')).toBe('60000')
  expect(formatValue(0.026, 'cls')).toBe('0.026')
  expect(formatValue(150_981, 'bytes')).toBe('147.4 KB')
})

// Slope-unit axis ticks are the number alone: the full "+1.08 MB/min" clips at
// the 44px gutter leaving only "MB/min", which reads as a broken axis. The unit
// stays in the title/header/tooltip.
test('slope-unit ticks drop the unit, the sign and trailing zeros', () => {
  expect(formatTick(1.5, 'mb-per-min')).toBe('1.5')
  expect(formatTick(-0.5, 'mb-per-min')).toBe('-0.5')
  expect(formatTick(0, 'ms-per-min')).toBe('0')
  expect(formatTick(2307.48, 'ms-per-min')).toBe('2307.48')
  expect(formatTick(1.0, 'count-per-min')).toBe('1')
})

// "40.0 MB" and "147.4 KB" are 7–8 characters — wider than the gutter, so the
// leading digit clips ("0.0 MB"), which reads as wrong data
test('byte-unit ticks compact to fit the gutter', () => {
  expect(formatTick(40, 'megabytes')).toBe('40MB')
  expect(formatTick(41.8, 'megabytes')).toBe('41.8MB')
  expect(formatTick(150_000, 'bytes')).toBe('146KB')
  expect(formatTick(0, 'bytes')).toBe('0KB')
  expect(formatTick(2_424_945, 'bytes')).toBe('2.3MB')
})

// The total-JS series is in the megabytes; a KB rendering buries the magnitude
test('byte values past 1 MiB render in MB', () => {
  expect(formatValue(2_424_945, 'bytes')).toBe('2.31 MB')
  expect(formatValue(150_981, 'bytes')).toBe('147.4 KB')
})

// One unit per axis: formatValue's per-value 10s cutoff put "10.0s" above
// "5000ms" on the same scale. The axis passes its domain top so every tick
// speaks the unit the scale ends in — seconds already from 1s, because a
// four-digit ms tick barely overflows the gutter and shaves its leading
// glyph into a different number ("8000ms" reads "3000ms")
test('ms ticks share one unit across the axis', () => {
  expect(formatTick(10_000, 'ms', 10_450)).toBe('10s')
  expect(formatTick(5_000, 'ms', 10_450)).toBe('5s')
  expect(formatTick(0, 'ms', 10_450)).toBe('0s')
  expect(formatTick(8_000, 'ms', 8_000)).toBe('8s')
  expect(formatTick(2_500, 'ms', 2_750)).toBe('2.5s')
  // Sub-second scales (keystroke latency) stay in exact milliseconds
  expect(formatTick(88, 'ms', 200)).toBe('88ms')
  expect(formatTick(800, 'ms', 900)).toBe('800ms')
})

test('other ticks keep the full formatValue rendering', () => {
  expect(formatTick(88, 'ms')).toBe('88ms')
  expect(formatTick(60_000, 'count')).toBe('60000')
})

// The release tag rides on the point so a marker can anchor to the run that
// measured it, and the popover can say "released as" rather than bracketing.
// Gated on the trigger, not just the tag's presence: a tag on a non-release run
// would claim that run measured the release, which is the attribution error
// release runs exist to remove.
test('carries the release tag only for release runs', () => {
  const [series] = buildSeries([
    run({id: 'r1', sha: 'a1', day: 0, value: 30, trigger: 'release', releaseTag: 'v6.10.1'}),
    run({id: 'r2', sha: 'a2', day: 1, value: 31, trigger: 'cron', releaseTag: 'v6.10.1'}),
    run({id: 'r3', sha: 'a3', day: 2, value: 32}),
  ])
  expect(series.lines[0].points.map((point) => point.releaseTag)).toEqual([
    'v6.10.1',
    undefined,
    undefined,
  ])
})

// A cron run and a release run of the same commit merge into one point (the
// cron measures main at 05:00; the release run measures the tag hours later).
// The tag describes the commit, so the merged point keeps it regardless of
// which run sorts last — otherwise the marker, tooltip and popover fall back to
// weaker by-date claims for exactly the commits that can be attributed.
test('the release tag survives a same-commit merge, whichever run sorts last', () => {
  const release = {sha: 'a1', day: 0, value: 30, trigger: 'release' as const, releaseTag: 'v6.10.1'}
  const cron = {sha: 'a1', day: 0, value: 32, trigger: 'cron' as const}

  const releaseFirst = buildSeries([
    run({id: 'rel', hour: 1, ...release}),
    run({id: 'cron', hour: 9, ...cron}),
  ])
  const releaseLast = buildSeries([
    run({id: 'cron', hour: 1, ...cron}),
    run({id: 'rel', hour: 9, ...release}),
  ])

  for (const [name, series] of [
    ['release first', releaseFirst],
    ['release last', releaseLast],
  ] as const) {
    const points = series[0].lines[0].points
    expect(points, name).toHaveLength(1)
    expect(points[0].releaseTag, name).toBe('v6.10.1')
  }
})

/** A minimal absolute-mode run carrying one settle scenario. */
function settleRun(options: {
  id: string
  sha: string
  day: number
  notSettled: number
  expectedToSettle?: boolean
}): TrendRun {
  const {id, sha, day, notSettled, expectedToSettle = true} = options
  const summary = (value: number) => ({summary: {median: value, p75: value, p90: value}})
  return {
    _id: id,
    startedAt: new Date(START + day * DAY).toISOString(),
    mode: 'absolute',
    git: {sha, branch: 'main', committedAt: new Date(START + day * DAY).toISOString()},
    runner: {calibrationMs: 8, runId: id, runAttempt: 1},
    bundle: null,
    scenarios: [
      {
        scenario: 'documentActions',
        kind: 'pageload',
        mode: 'settle',
        settleExpectation: {expectedToSettle},
        metrics: [
          {label: 'sessions not settled', unit: 'count', experiment: summary(notSettled)},
          {label: 'settled sessions', unit: 'count', experiment: summary(notSettled > 0 ? 0 : 1)},
          {label: 'ready sessions', unit: 'count', experiment: summary(1)},
          {label: 'react commits after ready', unit: 'count', experiment: summary(60_000)},
        ],
      },
    ],
  }
}

test('settle metrics chart under the settle group with mode-scoped keys', () => {
  const series = buildSeries([settleRun({id: 'a', sha: 'sha-1', day: 0, notSettled: 4})])
  const keys = series.map((entry) => entry.key)
  expect(keys).toContain('settle:documentActions:sessions not settled')
  expect(keys).toContain('settle:documentActions:react commits after ready')
  for (const entry of series) {
    expect(entry.group).toBe('settle')
    expect(entry.goal).toBe('lower')
  }
})

test('per-session settled/ready records stay out of the charts', () => {
  const series = buildSeries([settleRun({id: 'a', sha: 'sha-1', day: 0, notSettled: 0})])
  const keys = series.map((entry) => entry.key)
  expect(keys.some((key) => key.includes('settled sessions'))).toBe(false)
  expect(keys.some((key) => key.includes('ready sessions'))).toBe(false)
})

test('red-by-design settle scenarios carry the evidence note in their description', () => {
  const series = buildSeries([
    settleRun({id: 'a', sha: 'sha-1', day: 0, notSettled: 4, expectedToSettle: false}),
  ])
  const notSettled = series.find((entry) => entry.key.endsWith('sessions not settled'))
  expect(notSettled?.description).toContain('RED BY DESIGN')
  const green = buildSeries([settleRun({id: 'b', sha: 'sha-2', day: 0, notSettled: 0})])
  const greenSeries = green.find((entry) => entry.key.endsWith('sessions not settled'))
  expect(greenSeries?.description).not.toContain('RED BY DESIGN')
})

test('demo data exercises the settle group: controls, a red-by-design row and a re-regression', () => {
  const settle = buildSeries(generateDebugRuns('demo')).filter((entry) => entry.group === 'settle')
  expect(settle.length).toBeGreaterThan(0)
  expect(settle.every((entry) => entry.key.startsWith('settle:'))).toBe(true)

  const tripwire = (scenario: string) =>
    settle.find((entry) => entry.key === `settle:${scenario}:sessions not settled`)
  expect(tripwire('documentActions')?.description).toContain('RED BY DESIGN')
  expect(tripwire('singleString')?.description).not.toContain('RED BY DESIGN')

  // previewHeavy loops from day 75 on: the tripwire steps from 0 to 4 and
  // 'time to settle' (settled sessions only) stops being reported.
  const previewTripwire = tripwire('previewHeavy')
  const values = previewTripwire?.lines.flatMap((line) => line.points.map((point) => point.value))
  expect(values).toContain(0)
  expect(values).toContain(4)
  const previewSettleTime = settle.find(
    (entry) => entry.key === 'settle:previewHeavy:time to settle',
  )
  expect(previewSettleTime?.lines.flatMap((line) => line.points).length).toBeLessThan(
    previewTripwire?.lines.flatMap((line) => line.points).length ?? 0,
  )
})

test('settle views split the group by question and drop empty views', () => {
  const settle = buildSeries(generateDebugRuns('demo')).filter((entry) => entry.group === 'settle')
  const views = settleViews(settle)
  expect(views.map((view) => view.id)).toEqual(['tripwire', 'time', 'activity', 'renders'])

  const labelsOf = (id: string) =>
    new Set(views.find((view) => view.id === id)?.series.map((entry) => entry.key.split(':')[2]))
  expect(labelsOf('tripwire')).toEqual(
    new Set(['sessions not settled', 'sessions without commit counter']),
  )
  expect(labelsOf('time')).toEqual(new Set(['time to settle']))
  expect(labelsOf('activity')).toEqual(
    new Set(['react commits after ready', 'LoAF blocking after ready', 'cpu after ready']),
  )
  expect(labelsOf('renders')).toEqual(new Set(['renders · previewHeavy.preview']))

  // Every settle series lands in exactly one view; none are lost
  expect(views.flatMap((view) => view.series).length).toBe(settle.length)
  expect(settleViews([])).toEqual([])
})

/**
 * A run whose scenario reports carry the style-migration rows — as the
 * interaction shard and the pageload shard of one scenario both do, plus a
 * settle report of another scenario.
 */
function styleRun(options: {
  id: string
  sha: string
  day: number
  /** Omit the UI v5 rows, as a build without @sanity/ui v5 records them. */
  ui5Available?: boolean
  share?: number
  styled?: number
  /** Second report of the same scenario (a pageload shard), with its own styled count. */
  pageloadStyled?: number
}): TrendRun {
  const {id, sha, day, ui5Available = true, share = 35, styled = 378, pageloadStyled} = options
  const summary = (value: number) => ({summary: {median: value, p75: value, p90: value}})
  const rows = (styledInstances: number) => [
    ...(ui5Available
      ? [
          {label: 'UI v5 share', unit: 'percent' as const, experiment: summary(share)},
          {label: 'UI v5 instances', unit: 'count' as const, experiment: summary(1081)},
        ]
      : []),
    {label: 'UI v4 instances', unit: 'count' as const, experiment: summary(2023)},
    {
      label: 'styled-components instances',
      unit: 'count' as const,
      experiment: summary(styledInstances),
    },
    {label: 'styled-components CSS bytes', unit: 'bytes' as const, experiment: summary(794_690)},
  ]
  const styles = {experiment: {ui5Available, styledComponentsVersion: '6.5.3'}}
  return {
    _id: id,
    startedAt: new Date(START + day * DAY).toISOString(),
    mode: 'absolute',
    git: {sha, branch: 'main', committedAt: new Date(START + day * DAY).toISOString()},
    runner: {calibrationMs: 8, runId: id, runAttempt: 1},
    bundle: null,
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'interaction',
        metrics: [{label: 'stringField', unit: 'ms', experiment: summary(32)}, ...rows(styled)],
        styles,
      },
      ...(pageloadStyled === undefined
        ? []
        : [
            {
              scenario: 'singleString',
              kind: 'pageload' as const,
              metrics: [
                {label: 'boot-cold · LCP', unit: 'ms' as const, experiment: summary(1800)},
                ...rows(pageloadStyled),
              ],
              styles,
            },
          ]),
      {
        scenario: 'previewHeavy',
        kind: 'pageload',
        mode: 'settle',
        settleExpectation: {expectedToSettle: false},
        metrics: [
          {label: 'sessions not settled', unit: 'count', experiment: summary(4)},
          ...rows(900),
        ],
        styles,
      },
    ],
  }
}

test('style rows chart under the styles group, keyed per scenario regardless of mode', () => {
  const series = buildSeries([styleRun({id: 'a', sha: 'sha-1', day: 0})])
  const styles = series.filter((entry) => entry.group === 'styles')
  const keys = styles.map((entry) => entry.key)
  expect(keys).toContain('styles:singleString:UI share')
  expect(keys).toContain('styles:singleString:UI instances')
  expect(keys).toContain('styles:singleString:styled-components instances')
  // The settle report's rows are style rows too — not settle series
  expect(keys).toContain('styles:previewHeavy:styled-components instances')
  expect(keys.some((key) => key.startsWith('settle:') && key.includes('styled'))).toBe(false)
  // …and the settle scenario's own tripwire is untouched
  expect(series.map((entry) => entry.key)).toContain('settle:previewHeavy:sessions not settled')
  // The evidence note belongs to settle series, never to a style row
  for (const entry of styles) expect(entry.description).not.toContain('RED BY DESIGN')
})

test('the three UI rows become two paired charts, v5 and v4 on one chart', () => {
  const series = buildSeries([styleRun({id: 'a', sha: 'sha-1', day: 0, share: 35})])
  const keys = series.map((entry) => entry.key)
  // No single-line UI series survive
  expect(keys.some((key) => /UI v[45] (share|instances)$/.test(key))).toBe(false)

  const share = series.find((entry) => entry.key === 'styles:singleString:UI share')!
  expect(share.unit).toBe('percent')
  expect(share.goal).toBe('higher')
  expect(share.lines.map((line) => line.label)).toEqual(['@sanity/ui v5', '@sanity/ui v4'])
  // The v4 share is the complement of the stored v5 share, so the two sum to 100
  expect(share.lines.map((line) => line.points[0].value)).toEqual([35, 65])
  // Only the headline (v5) line is judged; v4 is drawn for the crossing
  expect(share.lines.map((line) => Boolean(line.secondary))).toEqual([false, true])
  expect(primaryLines(share).map((line) => line.label)).toEqual(['@sanity/ui v5'])
  // Pair lines carry no percentiles — a complement of a percentile is not one
  expect(share.lines[1].points[0].p75).toBeUndefined()
  // Colors are the style systems' own
  expect(share.lines.map((line) => line.color)).toEqual(['#3fb950', '#e2604f'])

  // The instances pair is built (the aggregate sums it) but never shown: it
  // is the share pair before the division, so charting it repeats the share
  const instances = series.find((entry) => entry.key === 'styles:singleString:UI instances')!
  expect(instances.hidden).toBe(true)
  expect(share.hidden).toBeUndefined()
  expect(instances.unit).toBe('count')
  expect(instances.lines.map((line) => [line.label, line.points[0].value])).toEqual([
    ['@sanity/ui v5', 1081],
    ['@sanity/ui v4', 2023],
  ])
})

test('uncharted style rows stay on the document and out of every series', () => {
  const run = styleRun({id: 'a', sha: 'sha-1', day: 0})
  run.scenarios![0].metrics!.push({
    label: 'styled-components style tags',
    unit: 'count',
    experiment: {summary: {median: 1, p75: 1, p90: 1}},
  })
  const series = buildSeries([run])
  expect(series.some((entry) => entry.key.includes('style tags'))).toBe(false)
  // …and so out of the sections and the aggregate too
  const styles = series.filter((entry) => entry.group === 'styles')
  expect(
    styleViews(styles).flatMap((view) => view.sections.map((section) => section.id)),
  ).not.toContain('styled-components style tags')
  expect(aggregateStyleSeries(styles).map((entry) => entry.key)).not.toContain(
    'styles:all:styled-components style tags',
  )
})

test('style rows read the registry: adoption climbs, the escape hatch sinks', () => {
  const series = buildSeries([styleRun({id: 'a', sha: 'sha-1', day: 0})])
  const goalOf = (key: string) => series.find((entry) => entry.key === key)?.goal
  expect(goalOf('styles:singleString:UI share')).toBe('higher')
  expect(goalOf('styles:singleString:UI instances')).toBe('higher')
  expect(goalOf('styles:singleString:styled-components instances')).toBe('lower')
  expect(goalOf('styles:singleString:styled-components CSS bytes')).toBe('lower')
  const share = series.find((entry) => entry.key === 'styles:singleString:UI share')
  expect(share?.description).toContain('not applicable, not 0%')
})

test('the interaction and pageload shards of one scenario merge into one style point', () => {
  const series = buildSeries([
    styleRun({id: 'a', sha: 'sha-1', day: 0, styled: 378, pageloadStyled: 380}),
  ])
  const styled = series.find(
    (entry) => entry.key === 'styles:singleString:styled-components instances',
  )
  expect(styled?.lines[0].points).toHaveLength(1)
  // Median of the two shards' counts
  expect(styled?.lines[0].points[0].value).toBe(379)
  // Pair lines merge per commit too
  const share = series.find((entry) => entry.key === 'styles:singleString:UI share')
  expect(share?.lines.map((line) => line.points.length)).toEqual([1, 1])
  // The LCP row keeps its own pageload key, as before
  expect(series.map((entry) => entry.key)).toContain('pageload:singleString:boot-cold · LCP')
})

test('a build without @sanity/ui v5 leaves a gap in the v5 lines, never a 0% point', () => {
  const series = buildSeries([
    styleRun({id: 'a', sha: 'sha-1', day: 0, ui5Available: false}),
    styleRun({id: 'b', sha: 'sha-2', day: 1, ui5Available: false}),
    styleRun({id: 'c', sha: 'sha-3', day: 2, share: 3}),
    styleRun({id: 'd', sha: 'sha-4', day: 3, share: 5}),
  ])
  const share = series.find((entry) => entry.key === 'styles:singleString:UI share')!
  // Both share lines start where v5 did: a v4 line at 100% would imply v5 at 0%
  expect(share.lines[0].points.map((point) => point.value)).toEqual([3, 5])
  expect(share.lines[1].points.map((point) => point.value)).toEqual([97, 95])
  // The instances chart's v4 line reaches back before v5 existed; v5 starts with it
  const instances = series.find((entry) => entry.key === 'styles:singleString:UI instances')!
  expect(instances.lines.find((line) => line.label === '@sanity/ui v5')?.points).toHaveLength(2)
  expect(instances.lines.find((line) => line.label === '@sanity/ui v4')?.points).toHaveLength(4)
  // The styled-components rows cover every run
  const styled = series.find(
    (entry) => entry.key === 'styles:singleString:styled-components instances',
  )
  expect(styled?.lines[0].points).toHaveLength(4)
})

test('style points carry the styled-components version, other points do not', () => {
  const series = buildSeries([styleRun({id: 'a', sha: 'sha-1', day: 0})])
  const styled = series.find(
    (entry) => entry.key === 'styles:singleString:styled-components instances',
  )
  expect(styled?.lines[0].points[0].styledComponentsVersion).toBe('6.5.3')
  const keystroke = series.find((entry) => entry.key === 'interaction:singleString:stringField')
  expect(keystroke?.lines[0].points[0].styledComponentsVersion).toBeUndefined()
})

test('paired lines are named by label, and by branch too when branches are compared', () => {
  const series = buildSeries([styleRun({id: 'a', sha: 'sha-1', day: 0})])
  const share = series.find((entry) => entry.key === 'styles:singleString:UI share')!
  expect(share.lines.map((line) => lineName(share, line))).toEqual([
    '@sanity/ui v5',
    '@sanity/ui v4',
  ])
  const twoBranches: TrendSeries = {
    ...share,
    lines: [...share.lines, ...share.lines.map((line) => ({...line, branch: 'perf-bench'}))],
  }
  expect(twoBranches.lines.map((line) => lineName(twoBranches, line))).toEqual([
    'main · @sanity/ui v5',
    'main · @sanity/ui v4',
    'perf-bench · @sanity/ui v5',
    'perf-bench · @sanity/ui v4',
  ])
  // A plain series is named by branch
  const keystroke = series.find((entry) => entry.key === 'interaction:singleString:stringField')!
  expect(lineName(keystroke, keystroke.lines[0])).toBe('main')
})

test('style views: two paired UI sections, one styled-components section per metric', () => {
  const styles = buildSeries(generateDebugRuns('demo')).filter((entry) => entry.group === 'styles')
  const views = styleViews(styles)
  expect(views.map((view) => view.id)).toEqual(['ui5', 'styled'])
  const sectionsOf = (id: string) =>
    views.find((view) => view.id === id)?.sections.map((section) => [section.id, section.goal])
  // One section: the hidden instances pair gets none (the panel puts the
  // all-scenarios adoption score above it instead)
  expect(sectionsOf('ui5')).toEqual([['UI share', 'higher']])
  // Style tags are recorded but not charted — no section, see the registry
  expect(sectionsOf('styled')).toEqual([
    ['styled-components instances', 'lower'],
    ['styled-components components', 'lower'],
    ['styled-components CSS rules', 'lower'],
    ['styled-components CSS bytes', 'lower'],
    ['styled-components CSS rule share', 'lower'],
  ])
  // Every visible style series lands in exactly one section; none are lost
  expect(views.flatMap((view) => view.sections.flatMap((section) => section.series)).length).toBe(
    styles.filter((entry) => !entry.hidden).length,
  )
  // A section holds one card per scenario, titled by scenario
  const shareSection = views[0].sections[0]
  expect(shareSection.series.map(styleScenario)).toEqual([
    'article',
    'recipe',
    'singleString',
    'synthetic',
  ])
  expect(shareSection.series.every((entry) => styleLabel(entry) === 'UI share')).toBe(true)
  expect(styleViews([])).toEqual([])
})

test('the aggregate sums every scenario per commit and recomputes the shares', () => {
  // Two scenarios with different page sizes on the same commit
  const run: TrendRun = {
    ...styleRun({id: 'a', sha: 'sha-1', day: 0, share: 25, styled: 100}),
  }
  const scenarios = run.scenarios!
  const single = scenarios[0]
  const big = {
    ...single,
    scenario: 'article',
    metrics: single.metrics!.map((metric) => {
      const value =
        metric.label === 'UI v5 share'
          ? 75
          : metric.label === 'UI v5 instances'
            ? 300
            : metric.label === 'UI v4 instances'
              ? 100
              : metric.label === 'styled-components instances'
                ? 50
                : metric.experiment!.summary!.median
      return {...metric, experiment: {summary: {median: value, p75: value, p90: value}}}
    }),
  }
  const styles = buildSeries([{...run, scenarios: [single, big]}]).filter(
    (entry) => entry.group === 'styles',
  )
  const aggregate = aggregateStyleSeries(styles)
  const byKey = new Map(aggregate.map((entry) => [entry.key, entry]))
  expect([...byKey.keys()]).toEqual([
    'styles:all:UI share',
    'styles:all:UI instances',
    'styles:all:styled-components instances',
    'styles:all:styled-components CSS bytes',
  ])
  // Counts sum: 1081 + 300 v5 over (1081 + 300) + (2023 + 100)
  const instances = byKey.get('styles:all:UI instances')!
  expect(instances.lines.map((line) => [line.label, line.points[0].value])).toEqual([
    ['@sanity/ui v5', 1381],
    ['@sanity/ui v4', 2123],
  ])
  // The share is recomputed from the summed counts, not averaged (mean would be 50)
  const share = byKey.get('styles:all:UI share')!
  expect(share.lines[0].points[0].value).toBeCloseTo((1381 / (1381 + 2123)) * 100, 6)
  expect(share.lines[1].points[0].value).toBeCloseTo((2123 / (1381 + 2123)) * 100, 6)
  expect(share.lines.map((line) => Boolean(line.secondary))).toEqual([false, true])
  // The score is the one shown; the summed counts behind it stay hidden
  expect(share.key).toBe(UI_OVERVIEW_KEY)
  expect(share.hidden).toBeUndefined()
  expect(instances.hidden).toBe(true)
  expect(byKey.get('styles:all:styled-components instances')!.lines[0].points[0].value).toBe(150)
  // The point keeps a real run's identity, so a bar still opens a document
  expect(share.lines[0].points[0].runId).toBe('a')
  expect(aggregateStyleSeries([])).toEqual([])
})

test('the aggregate follows the demo story and stays out of the metric views', () => {
  const styles = buildSeries(generateDebugRuns('demo')).filter((entry) => entry.group === 'styles')
  const aggregate = aggregateStyleSeries(styles)
  expect(aggregate.every((entry) => styleScenario(entry) === 'all')).toBe(true)
  expect(styleViews([...styles, ...aggregate])).toEqual(styleViews(styles))
  const share = aggregate.find((entry) => entry.key === 'styles:all:UI share')!
  const main = share.lines.find((line) => line.branch === 'main' && !line.secondary)!
  const values = main.points.map((point) => point.value)
  expect(values[0]).toBeLessThan(10)
  expect(values.at(-1)).toBeGreaterThan(55)
  // Rule share aggregate exists in the demo (rules and share rows are both present)
  expect(aggregate.map((entry) => entry.key)).toContain(
    'styles:all:styled-components CSS rule share',
  )
})

test('demo data tells the migration story: no v5 rows before it ships, adoption climbing after', () => {
  const styles = buildSeries(generateDebugRuns('demo')).filter((entry) => entry.group === 'styles')
  const share = styles.find((entry) => entry.key === 'styles:singleString:UI share')!
  const instances = styles.find((entry) => entry.key === 'styles:singleString:UI instances')!
  const main = (entry: TrendSeries, label: string) =>
    entry.lines.find((line) => line.branch === 'main' && line.label === label)?.points ?? []
  // Ten days without v5 rows — the v4 count is recorded for every run
  expect(main(share, '@sanity/ui v5').length).toBe(main(instances, '@sanity/ui v4').length - 10)
  const values = main(share, '@sanity/ui v5').map((point) => point.value)
  expect(values[0]).toBeGreaterThan(0)
  expect(values[0]).toBeLessThan(10)
  expect(values.at(-1)).toBeGreaterThan(55)
  // and the escape hatch shrinks
  const styled = styles.find(
    (entry) => entry.key === 'styles:singleString:styled-components instances',
  )!.lines[0].points
  expect(styled.at(-1)!.value).toBeLessThan(styled[0].value)
})

test('percent values render as whole percents', () => {
  expect(formatValue(34.826, 'percent')).toBe('35%')
  expect(formatValue(0, 'percent')).toBe('0%')
  expect(formatTick(66.6, 'percent')).toBe('67%')
})
