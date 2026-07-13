/**
 * Standalone assertions for the drift math (dev/metrics-studio has no vitest
 * project). Run: `pnpm --filter metrics-studio exec tsx tools/trends/drift.test.ts`
 */
import assert from 'node:assert/strict'

import {type TrendPoint, type TrendSeries} from './data'
import {computeDrift} from './drift'

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

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`)
}

// Steady series: no drift
check('flat series does not fire', () => {
  const drift = computeDrift([series(Array.from({length: 30}, () => 32))])
  assert.equal(drift.length, 0)
})

// Trailing regression: prior ~32, last 7 jump to ~40 (25% > 5% and > 3ms)
check('trailing regression fires', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 40)]
  const drift = computeDrift([series(values)])
  assert.equal(drift.length, 1)
  assert.equal(drift[0].direction, 'regression')
  assert.ok(drift[0].fired.some((f) => f.kind === 'trailing'))
})

// Trailing improvement: values drop
check('trailing improvement fires as improvement', () => {
  const values = [...Array.from({length: 21}, () => 40), ...Array.from({length: 9}, () => 30)]
  const drift = computeDrift([series(values)])
  assert.equal(drift[0].direction, 'improvement')
})

// Below the relative floor: 32 → 33 is ~3% < 5%, should not fire
check('sub-threshold move stays quiet', () => {
  const values = [...Array.from({length: 21}, () => 32), ...Array.from({length: 9}, () => 33)]
  const drift = computeDrift([series(values)])
  assert.equal(drift.length, 0)
})

// Absolute floor: a count metric moving 100→101 is 1% — below 5%, quiet;
// but 100→106 clears both (6 ≥ 1 abs, 6% ≥ 5%)
check('count metric respects both floors', () => {
  const quiet = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(101)], {unit: 'count'}),
  ])
  assert.equal(quiet.length, 0)
  const loud = computeDrift([
    series([...Array(21).fill(100), ...Array(9).fill(106)], {unit: 'count'}),
  ])
  assert.equal(loud.length, 1)
})

// Context series (calibration) never flags
check('context series is ignored', () => {
  const values = [...Array(21).fill(10), ...Array(9).fill(20)]
  const drift = computeDrift([series(values, {goal: 'context'})])
  assert.equal(drift.length, 0)
})

// Too little history: no trailing baseline
check('short history does not fire trailing', () => {
  const drift = computeDrift([series([32, 33, 40])])
  // trailing needs ≥10 points; step needs same-weekday history — neither here
  assert.equal(drift.length, 0)
})

// Regressions sort before improvements
check('regressions sort first', () => {
  const reg = series([...Array(21).fill(32), ...Array(9).fill(42)], {key: 'reg', title: 'reg'})
  const imp = series([...Array(21).fill(42), ...Array(9).fill(30)], {key: 'imp', title: 'imp'})
  const drift = computeDrift([imp, reg])
  assert.equal(drift[0].direction, 'regression')
})

// eslint-disable-next-line no-console
console.log(`\n${passed} drift checks passed`)
