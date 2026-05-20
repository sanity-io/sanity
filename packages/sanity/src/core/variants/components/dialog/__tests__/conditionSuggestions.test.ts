import {describe, expect, it} from 'vitest'

import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {
  filterConditionOption,
  getConditionKeyOptions,
  getConditionValueOptions,
} from '../conditionSuggestions'

describe('conditionSuggestions', () => {
  const variants = [variantAlphaAudience, variantNorwegianMarket]

  describe('getConditionKeyOptions', () => {
    it('returns unique sorted condition keys from existing variants', () => {
      expect(getConditionKeyOptions(variants, [{key: ''}], 0)).toEqual([
        {value: 'audience'},
        {value: 'locale'},
        {value: 'market'},
      ])
    })

    it('excludes keys used by other rows while keeping the current row key selectable', () => {
      const rows = [{key: 'audience'}, {key: 'locale'}]

      expect(getConditionKeyOptions(variants, rows, 0)).toEqual([
        {value: 'audience'},
        {value: 'market'},
      ])
    })
  })

  describe('getConditionValueOptions', () => {
    it('returns unique sorted values for the selected condition key', () => {
      expect(getConditionValueOptions(variants, 'locale')).toEqual([
        {value: 'en-US'},
        {value: 'nb-NO'},
      ])
    })

    it('returns no values when the condition key is empty', () => {
      expect(getConditionValueOptions(variants, '   ')).toEqual([])
    })
  })

  describe('filterConditionOption', () => {
    it('matches options case-insensitively after trimming the query', () => {
      expect(filterConditionOption('  EN', {value: 'en-US'})).toBe(true)
      expect(filterConditionOption('fr', {value: 'en-US'})).toBe(false)
    })
  })
})
