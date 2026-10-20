import {describe, expect, it} from 'vitest'

import {article} from '../../scenarios/article'
import {singleString} from '../../scenarios/singleString'
import {defineScenario} from '../../scenarios/types'
import {soakExcursionSchedule, soakSettleMinuteFor, soakTypingTarget} from '../soakPlan'

const twoFields = defineScenario({
  name: 'twoFields',
  sourceFile: 'perf/bench/scenarios/twoFields.ts',
  documentType: 'doc',
  documentId: 'doc',
  interactions: [
    {fieldPath: 'title', kind: 'string'},
    {fieldPath: 'body', kind: 'pte'},
  ],
})

describe('soakTypingTarget', () => {
  it('types into the first interaction without a soak plan', () => {
    expect(soakTypingTarget(singleString)).toBe(singleString.interactions[0])
    expect(soakTypingTarget(twoFields).fieldPath).toBe('title')
  })

  it('types into the Portable Text body on the article soak', () => {
    expect(soakTypingTarget(article)).toMatchObject({fieldPath: 'body', kind: 'pte'})
  })

  it('rejects a target that is not one of the interactions', () => {
    const scenario = {...twoFields, soak: {target: 'missing', excursions: [], seed: 1}}
    expect(() => soakTypingTarget(scenario)).toThrow(/soak target "missing"/)
  })

  it('rejects a scenario with nothing to type into', () => {
    expect(() => soakTypingTarget({...twoFields, interactions: []})).toThrow(
      /no interaction target/,
    )
  })
})

describe('soakSettleMinuteFor', () => {
  it('starts steady state at minute 2 on a 10-minute soak', () => {
    expect(soakSettleMinuteFor(singleString, 10)).toBe(2)
    expect(soakSettleMinuteFor(article, 10)).toBe(2)
  })

  it('honours a plan settle minute', () => {
    const scenario = {...twoFields, soak: {excursions: [], seed: 1, settleMinute: 3}}
    expect(soakSettleMinuteFor(scenario, 10)).toBe(3)
  })

  it('leaves room for a slope on a short smoke run', () => {
    expect(soakSettleMinuteFor(article, 2)).toBe(1)
    expect(soakSettleMinuteFor(article, 1)).toBe(0)
  })
})

describe('soakExcursionSchedule', () => {
  it('replays the same order for the same seed', () => {
    expect(soakExcursionSchedule(6, 20261015, 30)).toEqual(soakExcursionSchedule(6, 20261015, 30))
  })

  it('runs every excursion once per round', () => {
    const schedule = soakExcursionSchedule(6, 20261015, 18)
    const rounds = [0, 1, 2].map((round) => schedule.slice(round * 6, round * 6 + 6))
    rounds.forEach((round) => {
      expect(round.toSorted((first, second) => first - second)).toEqual([0, 1, 2, 3, 4, 5])
    })
  })

  it('shuffles: a different seed gives a different order', () => {
    expect(soakExcursionSchedule(6, 1, 12)).not.toEqual(soakExcursionSchedule(6, 2, 12))
  })

  it('a longer schedule extends a shorter one', () => {
    expect(soakExcursionSchedule(6, 7, 40).slice(0, 13)).toEqual(soakExcursionSchedule(6, 7, 13))
  })

  it('is empty without excursions', () => {
    expect(soakExcursionSchedule(0, 7, 10)).toEqual([])
  })

  it('covers every article excursion', () => {
    const excursionCount = article.soak?.excursions.length ?? 0
    expect(excursionCount).toBeGreaterThanOrEqual(5)
    expect(new Set(soakExcursionSchedule(excursionCount, article.soak?.seed ?? 0, 60)).size).toBe(
      excursionCount,
    )
  })
})
