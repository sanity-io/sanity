import {describe, expect, it} from 'vitest'

import {
  getPriorityValidationError,
  MAX_VARIANT_PRIORITY,
  MIN_VARIANT_PRIORITY,
} from '../priorityValidation'

describe('getPriorityValidationError', () => {
  it('accepts integers from 0 to 100', () => {
    expect(getPriorityValidationError(MIN_VARIANT_PRIORITY)).toBeUndefined()
    expect(getPriorityValidationError(MAX_VARIANT_PRIORITY)).toBeUndefined()
    expect(getPriorityValidationError(42)).toBeUndefined()
  })

  it('rejects non-integers', () => {
    expect(getPriorityValidationError(1.5)).toBe('invalid')
    expect(getPriorityValidationError(Number.NaN)).toBe('invalid')
    expect(getPriorityValidationError(Number.POSITIVE_INFINITY)).toBe('invalid')
  })

  it('rejects values outside the allowed range', () => {
    expect(getPriorityValidationError(-1)).toBe('out-of-range')
    expect(getPriorityValidationError(101)).toBe('out-of-range')
  })
})
