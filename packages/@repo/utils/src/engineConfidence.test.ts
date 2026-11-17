import {describe, expect, test} from 'vitest'

import {
  countMutantStatuses,
  coveredMutationScoreOf,
  emptyMutantCounts,
  isEntryCaught,
  isoWeekOf,
  isoWeekStart,
  type MutantCounts,
  mutationScoreOf,
} from './engineConfidence'
import {engineConfidenceRunId} from './radarIds'

function counts(overrides: Partial<MutantCounts>): MutantCounts {
  return {...emptyMutantCounts(), ...overrides}
}

describe('mutation scores', () => {
  test('match Stryker: detected over detected, survived and uncovered; errors, ignored and excluded left out', () => {
    const tier1 = counts({
      killed: 3038,
      timeout: 39,
      survived: 835,
      noCoverage: 414,
      runtimeError: 2,
      compileError: 1,
      ignored: 40,
    })
    expect(mutationScoreOf(tier1)).toBeCloseTo(0.7113, 4)
    expect(coveredMutationScoreOf(tier1)).toBeCloseTo(0.7866, 4)
    expect(mutationScoreOf({...tier1, excluded: 500})).toBe(mutationScoreOf(tier1))
    expect(coveredMutationScoreOf({...tier1, excluded: 500})).toBe(coveredMutationScoreOf(tier1))
  })

  test('are undefined when nothing was scored', () => {
    expect(mutationScoreOf(counts({ignored: 4, excluded: 2}))).toBeUndefined()
    expect(coveredMutationScoreOf(counts({noCoverage: 4}))).toBeUndefined()
  })

  test('counts statuses from a Stryker report and refuses a pending mutant', () => {
    expect(
      countMutantStatuses(['Killed', 'Killed', 'Timeout', 'NoCoverage', 'Ignored', 'Excluded']),
    ).toEqual(counts({killed: 2, timeout: 1, noCoverage: 1, ignored: 1, excluded: 1}))
    expect(() => countMutantStatuses(['Pending'])).toThrow(/pending/)
  })
})

describe('known bugs', () => {
  function entry(statuses: ('caught' | 'missed' | 'not-applicable' | 'not-run')[]) {
    return {
      results: statuses.map((status, index) => ({
        _key: `suite-${index}`,
        suite: 'unit:engine' as const,
        status,
      })),
    }
  }

  test('an entry is caught when any suite caught it; not-run and not-applicable never count as caught', () => {
    expect(isEntryCaught(entry(['caught', 'caught']))).toBe(true)
    expect(isEntryCaught(entry(['missed', 'caught']))).toBe(true)
    expect(isEntryCaught(entry(['missed', 'not-applicable', 'not-run']))).toBe(false)
    expect(isEntryCaught(entry(['missed']))).toBe(false)
  })
})

describe('ISO weeks', () => {
  test.each([
    ['2026-10-16T05:00:00Z', '2026-W42'],
    ['2026-10-12T00:00:00Z', '2026-W42'],
    ['2026-10-18T23:59:59Z', '2026-W42'],
    ['2026-01-01T00:00:00Z', '2026-W01'],
    ['2025-12-29T00:00:00Z', '2026-W01'],
    ['2027-01-01T00:00:00Z', '2026-W53'],
    ['2024-12-30T00:00:00Z', '2025-W01'],
  ])('%s is in %s', (instant, isoWeek) => {
    expect(isoWeekOf(new Date(instant))).toBe(isoWeek)
  })

  test('a week starts on its Monday in UTC', () => {
    expect(isoWeekStart('2026-W42').toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(isoWeekStart('2026-W01').toISOString()).toBe('2025-12-29T00:00:00.000Z')
    expect(isoWeekStart('2026-W53').toISOString()).toBe('2026-12-28T00:00:00.000Z')
    expect(() => isoWeekStart('2026-42')).toThrow(/ISO week/)
  })

  test('one Radar document id per week', () => {
    expect(engineConfidenceRunId(isoWeekOf(new Date('2026-10-15T04:00:00Z')))).toBe(
      'engine-confidence-run-2026-w42',
    )
  })
})
