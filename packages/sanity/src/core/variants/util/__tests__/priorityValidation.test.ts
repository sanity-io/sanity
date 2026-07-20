import {describe, expect, it} from 'vitest'

import {getPriorityValidationError} from '../priorityValidation'

describe('getPriorityValidationError', () => {
  it('accepts any finite number', () => {
    expect(getPriorityValidationError(0)).toBeUndefined()
    expect(getPriorityValidationError(101)).toBeUndefined()
    expect(getPriorityValidationError(-5)).toBeUndefined()
    expect(getPriorityValidationError(1.5)).toBeUndefined()
  })

  it('rejects non-finite values', () => {
    expect(getPriorityValidationError(Number.NaN)).toBe('invalid')
    expect(getPriorityValidationError(Number.POSITIVE_INFINITY)).toBe('invalid')
  })
})
