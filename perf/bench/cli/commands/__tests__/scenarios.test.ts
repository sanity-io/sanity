import {describe, expect, it} from 'vitest'

import {type BenchScenario} from '../../../scenarios/types'
import {participatesInMode} from '../scenarios'

function scenario(modes?: BenchScenario['modes']): BenchScenario {
  return {
    name: 'fixtureScenario',
    sourceFile: 'perf/bench/scenarios/fixtureScenario.ts',
    documentType: 'article',
    documentId: 'fixture-doc',
    fixture: () => [],
    interactions: [],
    modes,
  }
}

describe('participatesInMode', () => {
  it('selects a scenario for --mode inp only via the requested schedule', () => {
    const perPrOnly = scenario({inp: {perPr: true}})
    expect(participatesInMode(perPrOnly, 'inp', 'perPr')).toBe(true)
    expect(participatesInMode(perPrOnly, 'inp', 'daily')).toBe(false)

    const dailyOnly = scenario({inp: {daily: true}})
    expect(participatesInMode(dailyOnly, 'inp', 'daily')).toBe(true)
    expect(participatesInMode(dailyOnly, 'inp', 'perPr')).toBe(false)
  })

  it('selects a scenario for --mode pageload regardless of schedule', () => {
    const pageloadOnly = scenario({pageload: {sessions: 3}})
    expect(participatesInMode(pageloadOnly, 'pageload', 'perPr')).toBe(true)
    expect(participatesInMode(pageloadOnly, 'pageload', 'daily')).toBe(true)
    expect(participatesInMode(pageloadOnly, 'inp', 'perPr')).toBe(false)
  })

  it('excludes a scenario with no modes declared from either mode', () => {
    const undeclared = scenario()
    expect(participatesInMode(undeclared, 'inp', 'perPr')).toBe(false)
    expect(participatesInMode(undeclared, 'inp', 'daily')).toBe(false)
    expect(participatesInMode(undeclared, 'pageload', 'perPr')).toBe(false)
  })

  it('selects every scenario when no --mode filter is given', () => {
    expect(participatesInMode(scenario(), undefined, 'perPr')).toBe(true)
    expect(participatesInMode(scenario({inp: {perPr: true}}), undefined, 'perPr')).toBe(true)
  })
})
