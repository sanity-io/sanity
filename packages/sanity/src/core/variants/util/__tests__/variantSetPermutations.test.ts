import {describe, expect, it} from 'vitest'

import {countVariantSetPermutations, parseVariantSetValues} from '../variantSetPermutations'

describe('parseVariantSetValues', () => {
  it('splits on commas and trims surrounding whitespace', () => {
    expect(parseVariantSetValues('uk, us, de')).toEqual(['uk', 'us', 'de'])
  })

  it('drops blank entries', () => {
    expect(parseVariantSetValues('uk, , us,')).toEqual(['uk', 'us'])
  })

  it('de-duplicates while preserving first-seen order', () => {
    expect(parseVariantSetValues('uk, us, uk, de, us')).toEqual(['uk', 'us', 'de'])
  })

  it('returns an empty list for an empty or comma-only string', () => {
    expect(parseVariantSetValues('')).toEqual([])
    expect(parseVariantSetValues('  ,  ,')).toEqual([])
  })
})

describe('countVariantSetPermutations', () => {
  it('returns 0 when there are no dimensions', () => {
    expect(countVariantSetPermutations([])).toBe(0)
  })

  it('returns the value count for a single dimension', () => {
    expect(countVariantSetPermutations([{key: 'market', values: ['uk', 'us', 'de']}])).toBe(3)
  })

  it('multiplies value counts across dimensions', () => {
    expect(
      countVariantSetPermutations([
        {key: 'market', values: ['uk', 'us', 'de']},
        {key: 'segment', values: ['loyal', 'new']},
      ]),
    ).toBe(6)
  })

  it('handles the three-dimension case from the workshop feedback', () => {
    expect(
      countVariantSetPermutations([
        {key: 'brand', values: ['bk', 'th', 'popeyes']},
        {key: 'market', values: ['uk', 'us', 'de']},
        {key: 'segment', values: ['loyal', 'new', 'vip']},
      ]),
    ).toBe(27)
  })

  it('ignores dimensions that are missing a key or values', () => {
    expect(
      countVariantSetPermutations([
        {key: 'market', values: ['uk', 'us', 'de']},
        {key: '', values: ['ignored']},
        {key: 'segment', values: []},
      ]),
    ).toBe(3)
  })
})
