import {expect, test} from 'vitest'

import {type TrendPoint, type TrendSeries} from './data'
import {
  baselineDetail,
  baselineLabel,
  computeDrift,
  type DriftBaseline,
  type DriftResult,
  worstBySeries,
} from './drift'

/**
 * Flagged results only. `computeDrift` also returns neutral comparisons (so the
 * charts can draw an overlay everywhere), which are not findings.
 */
function flagged(results: ReturnType<typeof computeDrift>) {
  return results.filter((entry) => entry.direction !== 'neutral')
}

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
  expect(flagged(drift)).toHaveLength(0)
  // But a baseline is still computed, so the chart can draw the reference
  expect(drift).toHaveLength(1)
  expect(drift[0].direction).toBe('neutral')
})

// Prior ~32, last 7 jump to ~40 (25% > 5% and > 3ms)
test('regression fires', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const drift = computeDrift([series(values)])
  expect(flagged(drift)).toHaveLength(1)
  expect(drift[0].direction).toBe('regression')
})

test('improvement fires as improvement', () => {
  const values = [...Array.from({length: 21}, () => 40), ...Array.from({length: 9}, () => 30)]
  const drift = computeDrift([series(values)])
  expect(drift[0].direction).toBe('improvement')
})

// Below the relative floor: 32 → 33 is ~3% < 5%
test('sub-threshold move stays quiet', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 33)]
  const drift = computeDrift([series(values)])
  expect(flagged(drift)).toHaveLength(0)
  expect(drift[0].direction).toBe('neutral')
})

// Absolute floor: a count metric moving 100→101 is 1% — below 5%, quiet;
// but 100→106 clears both (6 ≥ 1 abs, 6% ≥ 5%)
test('count metric respects both floors', () => {
  const quiet = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(101)], {unit: 'count'}),
  ])
  expect(flagged(quiet)).toHaveLength(0)
  const loud = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(106)], {unit: 'count'}),
  ])
  expect(flagged(loud)).toHaveLength(1)
})

// CLS is unitless and small — a whole-unit absolute floor (the default) would
// make CLS drift unfireable. 0.04 → 0.08 must fire; 0.04 → 0.05 stays under
// the 0.02 absolute floor.
test('cls metric fires on small absolute moves', () => {
  const loud = computeDrift([
    series([...Array(21).fill(0.04), ...Array(9).fill(0.08)], {unit: 'cls'}),
  ])
  expect(flagged(loud)).toHaveLength(1)
  expect(loud[0].direction).toBe('regression')
  const quiet = computeDrift([
    series([...Array(21).fill(0.04), ...Array(9).fill(0.05)], {unit: 'cls'}),
  ])
  expect(flagged(quiet)).toHaveLength(0)
})

// Context series (calibration) never flags
// Context series (calibration) are skipped outright — no baseline, no overlay
test('context series is ignored', () => {
  const values = [...Array(21).fill(10), ...Array(9).fill(20)]
  expect(computeDrift([series(values, {goal: 'context'})])).toHaveLength(0)
})

// Both windows must exist: a median of 7 vs a median of 21 needs history. This
// is deliberate — the removed "step" baseline fired on thin history and on ~80%
// of runs generally; one trustworthy signal beats two.
// Too little history means no comparison exists at all — distinct from a
// computed-but-quiet one, and the charts get no overlay either
test('short history yields no baseline at all', () => {
  expect(computeDrift([series([32, 33, 40])])).toHaveLength(0)
  expect(computeDrift([series([32, 40])])).toHaveLength(0)
})

// The whole point of neutral entries: a quiet chart still gets its reference
// lines, so the overlay does not blink in and out as metrics cross the threshold.
test('a quiet series still carries drawable windows', () => {
  const drift = computeDrift([series(Array.from({length: 30}, () => 32))])
  expect(drift[0].direction).toBe('neutral')
  expect(drift[0].baseline.recentPointsMs).toHaveLength(7)
  expect(drift[0].baseline.baselinePointsMs).toHaveLength(21)
})

test('regressions sort first', () => {
  const reg = series([...Array(21).fill(32), ...Array(9).fill(42)], {key: 'reg', title: 'reg'})
  const imp = series([...Array(21).fill(42), ...Array(9).fill(30)], {key: 'imp', title: 'imp'})
  const drift = computeDrift([imp, reg])
  expect(drift[0].direction).toBe('regression')
})

// The list mixes three directions, so ordering has to hold for every pair —
// a two-way "is it a regression" comparator answered improvement-vs-neutral
// inconsistently, which makes Array.sort's output unspecified
test('sorts regression, improvement, neutral in every input order', () => {
  const reg = series([...Array(21).fill(32), ...Array(9).fill(42)], {key: 'reg', title: 'reg'})
  const imp = series([...Array(21).fill(42), ...Array(9).fill(30)], {key: 'imp', title: 'imp'})
  const quiet = series(
    Array.from({length: 30}, () => 32),
    {key: 'quiet', title: 'quiet'},
  )
  for (const input of [
    [reg, imp, quiet],
    [quiet, imp, reg],
    [imp, quiet, reg],
  ]) {
    const drift = computeDrift(input)
    expect(drift.map((entry) => entry.direction)).toEqual(['regression', 'improvement', 'neutral'])
  }
})

function baseline(overrides: Partial<DriftBaseline> = {}): DriftBaseline {
  return {
    recent: 40,
    baseline: 32,
    delta: 8,
    deltaFraction: 0.25,
    direction: 'regression',
    recentPointsMs: [START],
    baselinePointsMs: [START - DAY],
    ...overrides,
  }
}

function driftResult(overrides: Partial<DriftResult>): DriftResult {
  return {
    seriesKey: 'test',
    title: 'test metric',
    unit: 'ms',
    branch: 'main',
    baseline: baseline(),
    direction: 'regression',
    latest: {runId: 'run-1', sha: 'sha1'},
    ...overrides,
  }
}

// The chart card badge must warn, not celebrate: a bigger improvement on one
// branch must not displace a live regression on another.
test('worstBySeries never lets an improvement mask a regression', () => {
  const regression = driftResult({branch: 'main'})
  const bigImprovement = driftResult({
    branch: 'feature',
    direction: 'improvement',
    baseline: baseline({
      recent: 20,
      baseline: 40,
      delta: -20,
      deltaFraction: -0.5,
      direction: 'improvement',
    }),
  })
  // Same result regardless of encounter order
  expect(worstBySeries([regression, bigImprovement]).get('test')?.direction).toBe('regression')
  expect(worstBySeries([bigImprovement, regression]).get('test')?.direction).toBe('regression')
})

test('worstBySeries keeps the larger move within the same direction', () => {
  const small = driftResult({branch: 'main'})
  const large = driftResult({
    branch: 'feature',
    baseline: baseline({recent: 48, delta: 16, deltaFraction: 0.5}),
  })
  expect(worstBySeries([small, large]).get('test')?.branch).toBe('feature')
})

// The chart overlay draws these windows, so they must be exactly the windows
// the medians came from — otherwise the picture and the percentage disagree.
test('baseline carries its two window timestamps', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const [entry] = computeDrift([series(values)])
  const {baseline: fired} = entry

  expect(fired.recentPointsMs).toHaveLength(7)
  expect(fired.baselinePointsMs).toHaveLength(21)
  // Windows are contiguous, adjacent, and end at the newest run
  expect(fired.recentPointsMs.at(-1)).toBe(START + 29 * DAY)
  expect(fired.recentPointsMs[0]).toBe(START + 23 * DAY)
  expect(fired.baselinePointsMs.at(-1)).toBe(START + 22 * DAY)
  expect(fired.baselinePointsMs[0]).toBe(START + 2 * DAY)
  // Sorted oldest→newest, and the two windows do not overlap
  expect([...fired.recentPointsMs].sort((a, b) => a - b)).toEqual(fired.recentPointsMs)
  expect(fired.baselinePointsMs.at(-1)!).toBeLessThan(fired.recentPointsMs[0])
})

/** Independent median, so the test doesn't reuse drift.ts's implementation. */
function medianOf(list: number[]): number {
  const sorted = [...list].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// A window that doesn't contain the runs producing its median would draw the
// rule in the wrong place; recomputing the median from the window guards that.
test('window timestamps reproduce the reported medians', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const trend = series(values)
  const points = trend.lines[0].points
  const valueAt = (ms: number) => points.find((point) => point.date.getTime() === ms)!.value

  const {baseline: fired} = computeDrift([trend])[0]
  expect(medianOf(fired.recentPointsMs.map(valueAt))).toBe(fired.recent)
  expect(medianOf(fired.baselinePointsMs.map(valueAt))).toBe(fired.baseline)
})

// The labels describe the windows the math uses, so a change to one must not
// silently leave the other behind. Both are stated in runs (never days) because
// the cron misses days and sometimes runs twice.
test('baseline labels match the windows the math uses', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const {baseline: fired} = computeDrift([series(values)])[0]

  expect(baselineLabel(fired)).toContain(`${fired.baselinePointsMs.length} runs`)
  expect(baselineDetail(fired)).toContain(`${fired.recentPointsMs.length} runs`)
  for (const text of [baselineLabel(fired), baselineDetail(fired)]) {
    // Days/weeks would go stale the moment the cron skips a run
    expect(text).not.toMatch(/week|day/)
  }
})

// With just enough history the prior window holds fewer runs than its target
// size, and the label must count the runs it actually has — "vs prior 21 runs"
// over 5 runs of evidence would overstate it fourfold
test('labels count the actual window on short history', () => {
  const values = [...Array.from({length: 5}, () => 32), ...Array.from({length: 7}, () => 40)]
  const {baseline: fired} = computeDrift([series(values)])[0]

  expect(fired.baselinePointsMs).toHaveLength(5)
  expect(baselineLabel(fired)).toBe('vs prior 5 runs')
  expect(baselineDetail(fired)).toBe('median of the last 7 runs vs the prior 5 runs')
})

// Neutral entries share the list with flagged ones now, so precedence has to be
// explicit: a quiet branch must not win the card over a branch that moved.
test('worstBySeries prefers a flagged result over a neutral one', () => {
  const neutral = driftResult({
    branch: 'main',
    direction: 'neutral',
    baseline: baseline({direction: 'neutral', deltaFraction: 0.01}),
  })
  const improvement = driftResult({
    branch: 'feature',
    direction: 'improvement',
    baseline: baseline({direction: 'improvement', deltaFraction: -0.2}),
  })
  // Either encounter order picks the improvement
  expect(worstBySeries([neutral, improvement]).get('test')?.direction).toBe('improvement')
  expect(worstBySeries([improvement, neutral]).get('test')?.direction).toBe('improvement')
})

// ...and a bigger neutral must not beat a smaller regression
test('worstBySeries prefers a regression over a larger neutral', () => {
  const bigNeutral = driftResult({
    branch: 'main',
    direction: 'neutral',
    baseline: baseline({direction: 'neutral', deltaFraction: 0.04}),
  })
  const smallRegression = driftResult({
    branch: 'feature',
    baseline: baseline({deltaFraction: 0.06}),
  })
  expect(worstBySeries([bigNeutral, smallRegression]).get('test')?.direction).toBe('regression')
  expect(worstBySeries([smallRegression, bigNeutral]).get('test')?.direction).toBe('regression')
})
