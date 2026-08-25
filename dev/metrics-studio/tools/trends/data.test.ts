import {expect, test} from 'vitest'

import {
  buildSeries,
  calibrationSeries,
  soakLatestValueSeries,
  formatTick,
  formatValue,
  type TrendRun,
  type TrendSeries,
  vitalSections,
} from './data'

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
