import {expect, test} from 'vitest'

import {type TrendPoint, type TrendSeries} from './data'
import {computeDrift, type DriftResult, worstBySeries, worstOf} from './drift'

const DAY = 24 * 60 * 60 * 1000
const START = Date.UTC(2026, 0, 1)

function series(values: number[], overrides: Partial<TrendSeries> = {}): TrendSeries {
  const points: TrendPoint[] = values.map((value, index) => ({
    date: new Date(START + index * DAY),
    value,
    sha: `sha${index}`,
    runId: `run-${index}`,
  }))
  return {
    key: 'test',
    title: 'test metric',
    unit: 'ms',
    description: '',
    goal: 'lower',
    group: 'responsiveness',
    lines: [{branch: 'main', points}],
    ...overrides,
  }
}

test('flat series does not fire', () => {
  const drift = computeDrift([series(Array.from({length: 30}, () => 32))])
  expect(drift).toHaveLength(0)
})

// Trailing regression: prior ~32, last 7 jump to ~40 (25% > 5% and > 3ms)
test('trailing regression fires', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const drift = computeDrift([series(values)])
  expect(drift).toHaveLength(1)
  expect(drift[0].direction).toBe('regression')
  expect(drift[0].fired.some((f) => f.kind === 'trailing')).toBe(true)
})

test('trailing improvement fires as improvement', () => {
  const values = [...Array.from({length: 21}, () => 40), ...Array.from({length: 9}, () => 30)]
  const drift = computeDrift([series(values)])
  expect(drift[0].direction).toBe('improvement')
})

// Below the relative floor: 32 → 33 is ~3% < 5%, should not fire
test('sub-threshold move stays quiet', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 33)]
  const drift = computeDrift([series(values)])
  expect(drift).toHaveLength(0)
})

// Absolute floor: a count metric moving 100→101 is 1% — below 5%, quiet;
// but 100→106 clears both (6 ≥ 1 abs, 6% ≥ 5%)
test('count metric respects both floors', () => {
  const quiet = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(101)], {unit: 'count'}),
  ])
  expect(quiet).toHaveLength(0)
  const loud = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(106)], {unit: 'count'}),
  ])
  expect(loud).toHaveLength(1)
})

// CLS is unitless and small — a whole-unit absolute floor (the default) would
// make CLS drift unfireable. 0.04 → 0.08 must fire; 0.04 → 0.05 stays under
// the 0.02 absolute floor.
test('cls metric fires on small absolute moves', () => {
  const loud = computeDrift([
    series([...Array(21).fill(0.04), ...Array(9).fill(0.08)], {unit: 'cls'}),
  ])
  expect(loud).toHaveLength(1)
  expect(loud[0].direction).toBe('regression')
  const quiet = computeDrift([
    series([...Array(21).fill(0.04), ...Array(9).fill(0.05)], {unit: 'cls'}),
  ])
  expect(quiet).toHaveLength(0)
})

// Context series (calibration) never flags
test('context series is ignored', () => {
  const values = [...Array(21).fill(10), ...Array(9).fill(20)]
  const drift = computeDrift([series(values, {goal: 'context'})])
  expect(drift).toHaveLength(0)
})

// Too little history: no trailing baseline
test('short history does not fire trailing', () => {
  const drift = computeDrift([series([32, 33, 40])])
  // trailing needs ≥10 points; step needs same-weekday history — neither here
  expect(drift).toHaveLength(0)
})

test('regressions sort first', () => {
  const reg = series([...Array(21).fill(32), ...Array(9).fill(42)], {key: 'reg', title: 'reg'})
  const imp = series([...Array(21).fill(42), ...Array(9).fill(30)], {key: 'imp', title: 'imp'})
  const drift = computeDrift([imp, reg])
  expect(drift[0].direction).toBe('regression')
})

function driftResult(overrides: Partial<DriftResult>): DriftResult {
  return {
    seriesKey: 'test',
    title: 'test metric',
    unit: 'ms',
    branch: 'main',
    fired: [
      {
        kind: 'trailing',
        recent: 40,
        baseline: 32,
        delta: 8,
        deltaFraction: 0.25,
        direction: 'regression',
      },
    ],
    direction: 'regression',
    latest: {runId: 'run-1', sha: 'sha1'},
    ...overrides,
  }
}

test('worstOf picks the largest-magnitude fired baseline', () => {
  const entry = driftResult({
    fired: [
      {
        kind: 'trailing',
        recent: 40,
        baseline: 32,
        delta: 8,
        deltaFraction: 0.25,
        direction: 'regression',
      },
      {
        kind: 'step',
        recent: 40,
        baseline: 25,
        delta: 15,
        deltaFraction: 0.6,
        direction: 'regression',
      },
    ],
  })
  expect(worstOf(entry).kind).toBe('step')
})

// The chart card badge must warn, not celebrate: a bigger improvement on one
// branch must not displace a live regression on another.
test('worstBySeries never lets an improvement mask a regression', () => {
  const regression = driftResult({branch: 'main'})
  const bigImprovement = driftResult({
    branch: 'feature',
    direction: 'improvement',
    fired: [
      {
        kind: 'trailing',
        recent: 20,
        baseline: 40,
        delta: -20,
        deltaFraction: -0.5,
        direction: 'improvement',
      },
    ],
  })
  // Same result regardless of encounter order
  expect(worstBySeries([regression, bigImprovement]).get('test')?.direction).toBe('regression')
  expect(worstBySeries([bigImprovement, regression]).get('test')?.direction).toBe('regression')
})

test('worstBySeries keeps the larger move within the same direction', () => {
  const small = driftResult({branch: 'main'})
  const large = driftResult({
    branch: 'feature',
    fired: [
      {
        kind: 'trailing',
        recent: 48,
        baseline: 32,
        delta: 16,
        deltaFraction: 0.5,
        direction: 'regression',
      },
    ],
  })
  expect(worstBySeries([small, large]).get('test')?.branch).toBe('feature')
})
