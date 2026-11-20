import {describe, expect, test} from 'vitest'

import {type Approval, type Evaluation} from './types'
import {checkPromotion, type PromotionCheckInput} from './verify'

function approval(slots: number[], state: Approval['state'] = 'approved'): Approval {
  return {login: 'reviewer', comment: '', state, slots}
}

function evaluationWith(eligible: string[]): Evaluation {
  return {
    asOf: '2026-11-17T18:00:00.000Z',
    mode: 'live',
    currentStable: '6.15.0',
    currentStableSince: null,
    latest: '6.23.0',
    candidates: [],
    eligible,
    shortlist: eligible.slice(0, 3),
    stableAtRisk: [],
  }
}

function makeInput(overrides: Partial<PromotionCheckInput> = {}): PromotionCheckInput {
  return {
    approvals: [approval([1])],
    currentStable: '6.15.0',
    expectedStable: '6.15.0',
    slot: 1,
    version: '6.23.0',
    evaluation: {status: 'ok', data: evaluationWith(['6.23.0', '6.22.0'])},
    ...overrides,
  }
}

describe('checkPromotion', () => {
  test('clears when only this slot is approved, stable is unchanged and the version is eligible', () => {
    expect(checkPromotion(makeInput())).toBeNull()
  })

  test('refuses when two slots are approved', () => {
    expect(checkPromotion(makeInput({approvals: [approval([1, 2])]}))).toBe(
      'multiple-slots-approved',
    )
    expect(checkPromotion(makeInput({approvals: [approval([1]), approval([2])]}))).toBe(
      'multiple-slots-approved',
    )
  })

  test('refuses when a different slot is approved', () => {
    expect(checkPromotion(makeInput({approvals: [approval([2])]}))).toBe('slot-not-approved')
  })

  test('refuses when nothing is approved, or approvals were rejected', () => {
    expect(checkPromotion(makeInput({approvals: []}))).toBe('slot-not-approved')
    expect(checkPromotion(makeInput({approvals: [approval([1], 'rejected')]}))).toBe(
      'slot-not-approved',
    )
  })

  test('a rejected second slot does not count as approved', () => {
    expect(
      checkPromotion(makeInput({approvals: [approval([1]), approval([2], 'rejected')]})),
    ).toBeNull()
  })

  test('counts the same slot approved twice once', () => {
    expect(checkPromotion(makeInput({approvals: [approval([1]), approval([1])]}))).toBeNull()
  })

  test('skips the approval check when there is no run id', () => {
    expect(checkPromotion(makeInput({approvals: null}))).toBeNull()
    expect(checkPromotion(makeInput({approvals: null, currentStable: '6.16.0'}))).toBe(
      'stable-moved',
    )
  })

  test('refuses when stable moved since the shortlist', () => {
    expect(checkPromotion(makeInput({currentStable: '6.18.0'}))).toBe('stable-moved')
  })

  test('refuses when the version is not eligible any more', () => {
    expect(
      checkPromotion(makeInput({evaluation: {status: 'ok', data: evaluationWith(['6.22.0'])}})),
    ).toBe('not-eligible')
  })

  test('refuses when data could not be fetched', () => {
    expect(
      checkPromotion(makeInput({evaluation: {status: 'unavailable', error: 'radar down'}})),
    ).toBe('data-unavailable')
  })

  test('checks approvals before stable, and stable before eligibility', () => {
    const everythingWrong = makeInput({
      approvals: [approval([1, 2])],
      currentStable: '6.18.0',
      evaluation: {status: 'unavailable', error: 'down'},
    })
    expect(checkPromotion(everythingWrong)).toBe('multiple-slots-approved')
    expect(checkPromotion({...everythingWrong, approvals: [approval([1])]})).toBe('stable-moved')
  })
})
