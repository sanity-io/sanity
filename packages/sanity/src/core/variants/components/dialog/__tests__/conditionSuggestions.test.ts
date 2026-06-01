import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../../__fixtures__/createMockVariant'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {type SystemVariant} from '../../../types'
import {
  buildConditionSuggestionIndex,
  filterConditionOption,
  getConditionKeyOptions,
  getConditionValueOptions,
} from '../conditionSuggestions'

function variantWithConditions(id: string, conditions: Record<string, string>): SystemVariant {
  return {...createMockVariant(id), conditions}
}

describe('conditionSuggestions', () => {
  const variants = [variantAlphaAudience, variantNorwegianMarket]

  describe('buildConditionSuggestionIndex', () => {
    it('collects unique sorted keys and per-key values from existing variants', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(index.keys).toEqual(['audience', 'locale', 'market'])
      expect(index.valuesByKey.get('audience')).toEqual(['alpha'])
      expect(index.valuesByKey.get('locale')).toEqual(['en-US', 'nb-NO'])
      expect(index.valuesByKey.get('market')).toEqual(['nordics'])
    })

    it('produces the full key and per-key value index', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(index.keys).toEqual(['audience', 'locale', 'market'])
      expect(Object.fromEntries(index.valuesByKey)).toEqual({
        audience: ['alpha'],
        locale: ['en-US', 'nb-NO'],
        market: ['nordics'],
      })
    })

    it('returns an empty index for no variants', () => {
      const emptyIndex = buildConditionSuggestionIndex([])

      expect(emptyIndex.keys).toEqual([])
      expect(emptyIndex.valuesByKey.size).toBe(0)
    })

    it('deduplicates keys and values shared across variants', () => {
      const result = buildConditionSuggestionIndex([
        variantWithConditions('a', {audience: 'loyal'}),
        variantWithConditions('b', {audience: 'loyal'}),
        variantWithConditions('c', {audience: 'new'}),
      ])

      expect(result.keys).toEqual(['audience'])
      expect(result.valuesByKey.get('audience')).toEqual(['loyal', 'new'])
    })

    it('sorts keys and values alphabetically', () => {
      const result = buildConditionSuggestionIndex([
        variantWithConditions('a', {zone: 'west', audience: 'returning'}),
        variantWithConditions('b', {audience: 'new', market: 'eu'}),
      ])

      expect(result.keys).toEqual(['audience', 'market', 'zone'])
      expect(result.valuesByKey.get('audience')).toEqual(['new', 'returning'])
    })

    it('trims surrounding whitespace from keys and values', () => {
      const result = buildConditionSuggestionIndex([
        variantWithConditions('a', {'  audience  ': '  loyal  '}),
      ])

      expect(result.keys).toEqual(['audience'])
      expect(result.valuesByKey.get('audience')).toEqual(['loyal'])
    })

    it('ignores blank keys and does not index blank values', () => {
      const result = buildConditionSuggestionIndex([
        variantWithConditions('a', {'   ': 'orphan', 'audience': '   '}),
      ])

      expect(result.keys).toEqual(['audience'])
      expect(result.valuesByKey.has('audience')).toBe(false)
      expect(result.valuesByKey.size).toBe(0)
    })
  })

  describe('getConditionKeyOptions', () => {
    it('returns unique sorted condition keys from existing variants', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionKeyOptions(index, [{key: ''}], 0)).toEqual([
        {value: 'audience'},
        {value: 'locale'},
        {value: 'market'},
      ])
    })

    it('excludes keys used by other rows while keeping the current row key selectable', () => {
      const index = buildConditionSuggestionIndex(variants)
      const rows = [{key: 'audience'}, {key: 'locale'}]

      expect(getConditionKeyOptions(index, rows, 0)).toEqual([
        {value: 'audience'},
        {value: 'market'},
      ])
    })
  })

  describe('getConditionValueOptions', () => {
    it('returns unique sorted values for the selected condition key', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionValueOptions(index, 'locale')).toEqual([
        {value: 'en-US'},
        {value: 'nb-NO'},
      ])
    })

    it('returns no values when the condition key is empty', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionValueOptions(index, '   ')).toEqual([])
    })

    it('returns no values for an unknown condition key', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionValueOptions(index, 'unknown')).toEqual([])
    })
  })

  describe('filterConditionOption', () => {
    it('matches options case-insensitively after trimming the query', () => {
      expect(filterConditionOption('  EN', {value: 'en-US'})).toBe(true)
      expect(filterConditionOption('fr', {value: 'en-US'})).toBe(false)
    })
  })
})
