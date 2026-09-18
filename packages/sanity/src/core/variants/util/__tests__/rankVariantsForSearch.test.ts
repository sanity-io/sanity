import {describe, expect, it} from 'vitest'

import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {type SystemVariant} from '../../types'
import {rankVariantsForSearch} from '../rankVariantsForSearch'

describe('rankVariantsForSearch', () => {
  it('ranks an exact title match above a prefix match above a substring match', () => {
    const exact: SystemVariant = {
      ...variantAlphaAudience,
      metadata: {title: 'Loyal', description: []},
    }
    const prefix: SystemVariant = {
      ...variantNorwegianMarket,
      metadata: {title: 'Loyalty program', description: []},
    }
    const substring: SystemVariant = {
      ...variantAlphaAudience,
      _id: `${variantAlphaAudience._id}-substring`,
      metadata: {title: 'Very loyal', description: []},
    }

    // Deliberately out of rank order going in, so the result proves the sort rather than an
    // input order that happened to already be right.
    expect(rankVariantsForSearch([substring, prefix, exact], 'loyal')).toEqual([
      exact,
      prefix,
      substring,
    ])
  })

  it('drops variants whose title does not match at all', () => {
    const match: SystemVariant = {
      ...variantAlphaAudience,
      metadata: {title: 'Loyal', description: []},
    }
    const noMatch: SystemVariant = variantNorwegianMarket

    expect(rankVariantsForSearch([match, noMatch], 'loyal')).toEqual([match])
  })

  it('returns the input unchanged for an empty search term', () => {
    expect(rankVariantsForSearch([variantNorwegianMarket, variantAlphaAudience], '')).toEqual([
      variantNorwegianMarket,
      variantAlphaAudience,
    ])
  })

  it('returns the input unchanged for a whitespace-only search term', () => {
    expect(rankVariantsForSearch([variantNorwegianMarket, variantAlphaAudience], '   ')).toEqual([
      variantNorwegianMarket,
      variantAlphaAudience,
    ])
  })

  it('does not match a condition value', () => {
    // variantNorwegianMarket has conditions.market === 'nordics', not a title.
    expect(rankVariantsForSearch([variantNorwegianMarket], 'nordics')).toEqual([])
  })

  it('does not match the variant id', () => {
    // variantAlphaAudience's id contains 'alpha-audience', but its title is 'Alpha audience'.
    expect(rankVariantsForSearch([variantAlphaAudience], 'alpha-audience')).toEqual([])
  })

  it('preserves input order between variants that land in the same tier', () => {
    const first: SystemVariant = {
      ...variantAlphaAudience,
      metadata: {title: 'Loyal A', description: []},
    }
    const second: SystemVariant = {
      ...variantNorwegianMarket,
      metadata: {title: 'Loyal B', description: []},
    }

    expect(rankVariantsForSearch([first, second], 'loyal')).toEqual([first, second])
    expect(rankVariantsForSearch([second, first], 'loyal')).toEqual([second, first])
  })

  it('matches the title case-insensitively', () => {
    const variant: SystemVariant = {
      ...variantAlphaAudience,
      metadata: {title: 'Alpha Audience', description: []},
    }

    expect(rankVariantsForSearch([variant], 'ALPHA')).toEqual([variant])
    expect(rankVariantsForSearch([variant], 'alpha')).toEqual([variant])
  })
})
