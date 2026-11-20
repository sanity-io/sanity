import {describe, expect, test} from 'vitest'

import {loadHistoryFixture} from './__fixtures__/load'
import {viewAsOf} from './asOf'
import {evaluate} from './rules'

const history = loadHistoryFixture()

function evaluateAt(instant: string) {
  return evaluate(viewAsOf(history, instant, 'as-of'))
}

function softCodesOf(instant: string, version: string): string[] {
  return (
    evaluateAt(instant)
      .candidates.find((candidate) => candidate.version === version)
      ?.soft.map((verdict) => verdict.code) ?? []
  )
}

describe('recorded history spot checks', () => {
  test.each([
    ['2026-08-25T18:00:00Z', '6.7.0', []],
    ['2026-09-01T18:00:00Z', '6.7.0', []],
    ['2026-09-15T18:00:00Z', '6.7.0', ['6.12.0']],
    ['2026-09-22T18:00:00Z', '6.7.0', []],
    ['2026-09-29T18:00:00Z', '6.15.0', ['6.16.0']],
    ['2026-11-17T18:00:00Z', '6.15.0', ['6.23.0', '6.22.0', '6.21.0']],
  ])('%s has stable %s and shortlist %j', (instant, stable, shortlist) => {
    const evaluation = evaluateAt(instant)
    expect(evaluation.currentStable).toBe(stable)
    expect(evaluation.shortlist).toEqual(shortlist)
  })

  test('2026-09-15 flags an open investigation on 6.12.0', () => {
    expect(softCodesOf('2026-09-15T18:00:00Z', '6.12.0')).toContain('open-investigation')
  })

  test('2026-08-25 holds because 6.9.2 lacks a published package', () => {
    const candidate = evaluateAt('2026-08-25T18:00:00Z').candidates.find(
      (entry) => entry.version === '6.9.2',
    )
    expect(candidate?.hard.map((verdict) => verdict.code)).toEqual(['missing-packages'])
  })

  test('2026-06-14T11:00Z shortlists 6.0.0 on the 3 day new major soak', () => {
    expect(evaluateAt('2026-06-14T11:00:00Z').shortlist).toEqual(['6.0.0'])
    expect(evaluateAt('2026-06-14T09:00:00Z').shortlist).toEqual([])
  })
})
