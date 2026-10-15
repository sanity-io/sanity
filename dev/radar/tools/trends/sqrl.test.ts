import {expect, test} from 'vitest'

import {
  filterSqrlByRange,
  formatSignedPoints,
  hostNote,
  nearestPointIndex,
  orderedPillars,
  pointAtOrBefore,
  quarterLabel,
  quarterStartMs,
  regressedInputs,
  shapeSqrlSeries,
  sqrlChanges,
  type SqrlInput,
  type SqrlPoint,
} from './sqrl'
import {generateSqrlDebug, sqrlVariantForSource} from './sqrlDebugData'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 15, 12)

function point(daysAgo: number, score: number): SqrlPoint {
  return {score, scoreCommit: score, sha: `sha-${daysAgo}`, ms: NOW - daysAgo * DAY}
}

function input(key: string, trend: SqrlInput['trend'], contributionPoints: number): SqrlInput {
  return {
    key,
    label: key,
    pillar: 'inp',
    weight: 0.1,
    unit: 'ms',
    value: 1,
    referenceValue: 1,
    ratio: 1,
    contributionPoints,
    trend,
  }
}

test('quarterStartMs is the first instant of the calendar quarter in UTC', () => {
  expect(quarterStartMs(NOW)).toBe(Date.UTC(2026, 9, 1))
  expect(quarterStartMs(Date.UTC(2026, 11, 31, 23, 59))).toBe(Date.UTC(2026, 9, 1))
  expect(quarterStartMs(Date.UTC(2026, 0, 1))).toBe(Date.UTC(2026, 0, 1))
  expect(quarterStartMs(Date.UTC(2026, 5, 30, 23, 59))).toBe(Date.UTC(2026, 3, 1))
})

test('quarterLabel names the quarter and year', () => {
  expect(quarterLabel(NOW)).toBe('Q4 2026')
  expect(quarterLabel(Date.UTC(2026, 6, 1))).toBe('Q3 2026')
})

test('shapeSqrlSeries sorts by commit date and drops unusable documents', () => {
  const shaped = shapeSqrlSeries([
    {score: 103, scoreCommit: 104, git: {sha: 'b', committedAt: '2026-10-02T00:00:00Z'}},
    {score: 101, scoreCommit: 100, git: {sha: 'a', committedAt: '2026-10-01T00:00:00Z'}},
    {score: 99, scoreCommit: 99, git: {sha: 'bad-date', committedAt: 'not a date'}},
    {
      score: Number.NaN,
      scoreCommit: 99,
      git: {sha: 'bad-score', committedAt: '2026-10-03T00:00:00Z'},
    },
  ])
  expect(shaped.map((entry) => entry.sha)).toEqual(['a', 'b'])
  expect(shaped[1]).toMatchObject({score: 103, scoreCommit: 104})
})

test('shapeSqrlSeries tolerates a missing result', () => {
  expect(shapeSqrlSeries(null)).toEqual([])
  expect(shapeSqrlSeries(undefined)).toEqual([])
})

test('filterSqrlByRange keeps the window and passes everything through for all time', () => {
  const points = [point(100, 100), point(40, 101), point(10, 102), point(0, 103)]
  expect(filterSqrlByRange(points, 30, NOW).map((entry) => entry.score)).toEqual([102, 103])
  expect(filterSqrlByRange(points, 90, NOW)).toHaveLength(3)
  expect(filterSqrlByRange(points, null, NOW)).toBe(points)
})

test('pointAtOrBefore returns the closest earlier point, inclusive', () => {
  const points = [point(50, 100), point(30, 101), point(10, 102)]
  expect(pointAtOrBefore(points, NOW - 30 * DAY)?.score).toBe(101)
  expect(pointAtOrBefore(points, NOW - 31 * DAY)?.score).toBe(100)
  expect(pointAtOrBefore(points, NOW - 51 * DAY)).toBeNull()
})

test('sqrlChanges measures against the last score at or before each anchor', () => {
  const points = [point(60, 100), point(31, 104), point(29, 105), point(14, 106), point(0, 108)]
  const changes = sqrlChanges(points, 108, NOW)
  expect(changes.sinceThirtyDays?.points).toBe(4)
  expect(changes.sinceThirtyDays?.fromMs).toBe(NOW - 31 * DAY)
  expect(changes.sinceQuarterStart?.points).toBe(3)
  expect(changes.sinceQuarterStart?.fromMs).toBe(NOW - 29 * DAY)
})

test('sqrlChanges takes the quarter anchor from the last score before the quarter began', () => {
  const quarterEarly = Date.UTC(2026, 9, 5, 12)
  const points: SqrlPoint[] = [
    {score: 100, scoreCommit: 100, sha: 'q3', ms: Date.UTC(2026, 8, 30, 12)},
    {score: 110, scoreCommit: 110, sha: 'q4', ms: quarterEarly},
  ]
  const changes = sqrlChanges(points, 112, quarterEarly + 3 * DAY)
  expect(changes.sinceQuarterStart?.points).toBe(12)
  expect(changes.sinceThirtyDays).toBeNull()
})

test('sqrlChanges has no change where the series does not reach back', () => {
  const changes = sqrlChanges([point(5, 100), point(0, 102)], 102, NOW)
  expect(changes.sinceThirtyDays).toBeNull()
  expect(changes.sinceQuarterStart).toBeNull()
  expect(sqrlChanges([], 100, NOW)).toEqual({sinceThirtyDays: null, sinceQuarterStart: null})
})

test('formatSignedPoints uses a real minus and hides the sign on zero', () => {
  expect(formatSignedPoints(4.26)).toBe('+4.3')
  expect(formatSignedPoints(-3.1)).toBe('−3.1')
  expect(formatSignedPoints(0)).toBe('0.0')
  expect(formatSignedPoints(-0.04)).toBe('0.0')
})

test('nearestPointIndex snaps to the closest commit', () => {
  const points = [point(30, 100), point(20, 101), point(0, 102)]
  expect(nearestPointIndex(points, NOW - 24 * DAY)).toBe(1)
  expect(nearestPointIndex(points, NOW - 2 * DAY)).toBe(2)
  expect(nearestPointIndex(points, NOW - 99 * DAY)).toBe(0)
})

test('regressedInputs keeps only regressions, biggest loss first', () => {
  const regressed = regressedInputs([
    input('neutral', 'neutral', -9),
    input('small', 'regression', -0.5),
    input('big', 'regression', -4),
    input('better', 'improvement', 3),
  ])
  expect(regressed.map((entry) => entry.key)).toEqual(['big', 'small'])
  expect(regressedInputs(null)).toEqual([])
})

test('orderedPillars follows the canonical order and keeps unknown pillars last', () => {
  const pillars = ['reliability', 'mystery', 'inp', 'load'].map((key) => ({
    key,
    label: key,
    weight: 0.1,
    score: 100,
  }))
  expect(orderedPillars(pillars).map((pillar) => pillar.key)).toEqual([
    'inp',
    'load',
    'reliability',
    'mystery',
  ])
})

test('hostNote states the reference calibration and the commit host when known', () => {
  expect(hostNote(null)).toBe('Host-adjusted to a 7.0 ms reference calibration.')
  const latest = generateSqrlDebug('dip', NOW).latest
  expect(hostNote(latest)).toMatch(/this commit measured 7\.4 ms on AMD EPYC/)
  expect(hostNote(latest)).toMatch(/unadjusted score \d+\.\d\.$/)
})

test('debug sources map to a banner variant', () => {
  expect(sqrlVariantForSource('sqrl')).toBe('dip')
  expect(sqrlVariantForSource('sqrl-climb')).toBe('climb')
  expect(sqrlVariantForSource('sqrl-regressed')).toBe('regressed')
  expect(sqrlVariantForSource('sqrl-empty')).toBe('empty')
  expect(sqrlVariantForSource('empty')).toBe('empty')
  expect(sqrlVariantForSource('demo')).toBe('dip')
})

test('the empty debug variant has no scores at all', () => {
  expect(generateSqrlDebug('empty', NOW)).toEqual({series: [], latest: null})
})

test('the climb variant rises with no regressed inputs', () => {
  const {series, latest} = generateSqrlDebug('climb', NOW)
  expect(series.at(-1)!.score).toBeGreaterThan(series[10].score + 5)
  expect(regressedInputs(latest?.inputs)).toEqual([])
  expect(latest?.pillars).toHaveLength(6)
})

test('the dip variant falls and then recovers', () => {
  const {series} = generateSqrlDebug('dip', NOW)
  const scores = series.map((entry) => entry.score)
  const trough = Math.min(...scores.slice(50, 90))
  expect(trough).toBeLessThan(scores[50] - 4)
  expect(scores.at(-1)!).toBeGreaterThan(trough + 6)
})

test('the regressed variant lists regressed inputs, and is deterministic', () => {
  const first = generateSqrlDebug('regressed', NOW)
  expect(regressedInputs(first.latest?.inputs).length).toBeGreaterThan(0)
  expect(generateSqrlDebug('regressed', NOW)).toEqual(first)
})

test('shaped debug series reaches back past the start of the quarter', () => {
  const points = shapeSqrlSeries(generateSqrlDebug('dip', NOW).series)
  const changes = sqrlChanges(points, points.at(-1)!.score, NOW)
  expect(changes.sinceThirtyDays).not.toBeNull()
  expect(changes.sinceQuarterStart).not.toBeNull()
})
