import {describe, expect, it} from 'vitest'

import {getPriorityInputValidationError, getPriorityValidationError} from '../priorityValidation'

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

  it('rejects empty priority input', () => {
    expect(getPriorityInputValidationError('')).toBe('invalid')
    expect(getPriorityInputValidationError('   ')).toBe('invalid')
  })

  it('validates parsed priority input', () => {
    expect(getPriorityInputValidationError('42.5')).toBeUndefined()
    expect(getPriorityInputValidationError('not-a-number')).toBe('invalid')
  })
})
