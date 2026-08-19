import {expect, test} from 'vitest'

import {
  buildSeries,
  calibrationSeries,
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
}): TrendRun {
  const {id, sha, day, value, repeats = 1, calibrationMs = 8} = options
  return {
    _id: id,
    startedAt: new Date(START + day * DAY).toISOString(),
    mode: 'absolute',
    git: {sha, branch: 'main', committedAt: new Date(START + day * DAY).toISOString()},
    runner: {calibrationMs, runId: id, runAttempt: 1},
    bundle: null,
    scenarios: [
      {
        scenario: 'singleString',
        kind: 'interaction',
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

// The pageload scenario stores the INP metric twice per run document.
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

const vitalStub = (title: string) => ({title}) as TrendSeries

// The vitals tab reads by vital ("how is LCP doing, everywhere?"): one section
// per vital, Core Web Vitals first, scenarios alphabetical within each.
test('vitals group into per-vital sections', () => {
  const sections = vitalSections([
    vitalStub('recipe · boot-cold · CLS'),
    vitalStub('singleString · INP'),
    vitalStub('recipe · boot-cold · LCP'),
    vitalStub('article · boot-cold · LCP'),
    vitalStub('article · boot-cold · TTFB'),
  ])
  expect(
    sections.map((section) => [section.vital, section.series.map((entry) => entry.title)]),
  ).toEqual([
    ['INP', ['singleString · INP']],
    ['LCP', ['article · boot-cold · LCP', 'recipe · boot-cold · LCP']],
    ['CLS', ['recipe · boot-cold · CLS']],
    ['TTFB', ['article · boot-cold · TTFB']],
  ])
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
