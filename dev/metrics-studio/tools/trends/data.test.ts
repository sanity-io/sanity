import {expect, test} from 'vitest'

import {buildSeries, calibrationSeries, formatValue, type TrendRun} from './data'

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
