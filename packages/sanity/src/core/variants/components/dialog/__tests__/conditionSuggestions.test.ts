import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../../__fixtures__/createMockVariant'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {type SystemVariant} from '../../../types'
import {type VariantDimensionMap} from '../../../util/variantDimensionMap'
import {
  buildConditionSuggestionIndex,
  type ConditionSuggestionOption,
  filterConditionOption,
  getConditionKeyOptions,
  getConditionKeyProvenance,
  getConditionValueOptions,
  getConditionValueProvenance,
} from '../conditionSuggestions'

function variantWithConditions(id: string, conditions: Record<string, string>): SystemVariant {
  return {...createMockVariant(id), conditions}
}

// Provenance shown for keys/values known only from already-authored variants.
const authored = {provenance: 'variant', source: 'Existing variants'} as const

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

    it('tags keys and values from existing variants with variant provenance', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionKeyProvenance(index, 'audience')).toEqual(authored)
      expect(getConditionValueProvenance(index, 'locale', 'en-US')).toEqual(authored)
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

    describe('with an external dimension map', () => {
      const externalMap: VariantDimensionMap = [
        {
          key: 'experiment',
          provenance: 'experiment',
          source: 'Amplitude',
          values: ['treatment', 'control'],
        },
        {key: 'audience', provenance: 'cdp-audience', source: 'Segment', values: ['vip', 'alpha']},
      ]

      it('unions external keys and values with existing variants, sorted', () => {
        const index = buildConditionSuggestionIndex(variants, externalMap)

        expect(index.keys).toEqual(['audience', 'experiment', 'locale', 'market'])
        expect(index.valuesByKey.get('experiment')).toEqual(['control', 'treatment'])
        // 'alpha' from the variant + 'vip' from Segment, merged and sorted.
        expect(index.valuesByKey.get('audience')).toEqual(['alpha', 'vip'])
      })

      it('lets the external map override provenance for a key it also owns', () => {
        const index = buildConditionSuggestionIndex(variants, externalMap)

        // 'audience' existed as an authored variant, but Segment is the authoritative source.
        expect(getConditionKeyProvenance(index, 'audience')).toEqual({
          provenance: 'cdp-audience',
          source: 'Segment',
        })
        // The shared value 'alpha' is likewise re-attributed to Segment.
        expect(getConditionValueProvenance(index, 'audience', 'alpha')).toEqual({
          provenance: 'cdp-audience',
          source: 'Segment',
        })
        // A value only the variant had keeps variant provenance.
        expect(getConditionValueProvenance(index, 'locale', 'nb-NO')).toEqual(authored)
      })
    })
  })

  describe('getConditionKeyOptions', () => {
    it('returns unique sorted condition keys with provenance from existing variants', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionKeyOptions(index, [{key: ''}], 0)).toEqual([
        {value: 'audience', ...authored},
        {value: 'locale', ...authored},
        {value: 'market', ...authored},
      ])
    })

    it('carries external provenance through to key options', () => {
      const index = buildConditionSuggestionIndex(variants, [
        {key: 'experiment', provenance: 'experiment', source: 'Amplitude', values: ['control']},
      ])

      expect(getConditionKeyOptions(index, [{key: ''}], 0)).toContainEqual({
        value: 'experiment',
        provenance: 'experiment',
        source: 'Amplitude',
      })
    })

    it('excludes keys used by other rows while keeping the current row key selectable', () => {
      const index = buildConditionSuggestionIndex(variants)
      const rows = [{key: 'audience'}, {key: 'locale'}]

      expect(getConditionKeyOptions(index, rows, 0)).toEqual([
        {value: 'audience', ...authored},
        {value: 'market', ...authored},
      ])
    })
  })

  describe('getConditionValueOptions', () => {
    it('returns unique sorted values with provenance for the selected condition key', () => {
      const index = buildConditionSuggestionIndex(variants)

      expect(getConditionValueOptions(index, 'locale')).toEqual([
        {value: 'en-US', ...authored},
        {value: 'nb-NO', ...authored},
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
      const option: ConditionSuggestionOption = {value: 'en-US', ...authored}
      expect(filterConditionOption('  EN', option)).toBe(true)
      expect(filterConditionOption('fr', option)).toBe(false)
    })
  })
})
