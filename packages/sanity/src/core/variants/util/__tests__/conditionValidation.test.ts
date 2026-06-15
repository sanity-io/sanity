import {describe, expect, it} from 'vitest'

import {
  getConditionKeyValidationError,
  getConditionValueValidationError,
} from '../conditionValidation'

describe('conditionValidation', () => {
  describe('getConditionKeyValidationError', () => {
    it('accepts valid lowercase keys', () => {
      expect(getConditionKeyValidationError('audience')).toBeUndefined()
      expect(getConditionKeyValidationError('locale_code')).toBeUndefined()
      expect(getConditionKeyValidationError('tier-1')).toBeUndefined()
    })

    it('rejects reserved prefixes', () => {
      expect(getConditionKeyValidationError('_system')).toBe('reserved')
      expect(getConditionKeyValidationError('$param')).toBe('reserved')
    })

    it('rejects invalid key formats', () => {
      expect(getConditionKeyValidationError('Audience')).toBe('invalid')
      expect(getConditionKeyValidationError('1audience')).toBe('invalid')
      expect(getConditionKeyValidationError('audience:segment')).toBe('invalid')
      expect(getConditionKeyValidationError('a'.repeat(65))).toBe('invalid')
    })

    it('ignores empty keys while editing', () => {
      expect(getConditionKeyValidationError('')).toBeUndefined()
      expect(getConditionKeyValidationError('   ')).toBeUndefined()
    })
  })

  describe('getConditionValueValidationError', () => {
    it('accepts non-empty values', () => {
      expect(getConditionValueValidationError('loyal')).toBeUndefined()
    })

    it('rejects empty values', () => {
      expect(getConditionValueValidationError('')).toBe('empty')
      expect(getConditionValueValidationError('   ')).toBe('empty')
    })

    it('rejects values with colons', () => {
      expect(getConditionValueValidationError('loyal:customers')).toBe('invalid')
    })
  })
})
