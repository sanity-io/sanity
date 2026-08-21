import {describe, expect, it} from 'vitest'

import {getReleaseOrVariantMembership} from './getReleaseOrVariantMembership'

describe('getReleaseOrVariantMembership', () => {
  it('returns an empty filter when neither a release nor a variant is selected', () => {
    expect(getReleaseOrVariantMembership({perspectiveStack: ['drafts']})).toEqual({
      filter: 'false',
      params: {},
      title: 'Select a release or variant',
    })
  })

  it('filters to the selected release only', () => {
    expect(getReleaseOrVariantMembership({perspectiveStack: ['rSummer', 'drafts']})).toEqual({
      filter: 'sanity::partOfRelease($releaseId)',
      params: {releaseId: 'rSummer'},
      title: 'Release: rSummer',
    })
  })

  it('filters to the selected variant only', () => {
    expect(
      getReleaseOrVariantMembership({
        perspectiveStack: ['published'],
        selectedVariantName: 'alpha-audience',
      }),
    ).toEqual({
      filter: 'sanity::partOfVariant($variantId)',
      params: {variantId: 'alpha-audience'},
      title: 'Variant: alpha-audience',
    })
  })

  it('intersects release and variant membership when both are selected', () => {
    expect(
      getReleaseOrVariantMembership({
        perspectiveStack: ['rSummer', 'drafts'],
        selectedVariantName: 'alpha-audience',
      }),
    ).toEqual({
      filter: 'sanity::partOfRelease($releaseId) && sanity::partOfVariant($variantId)',
      params: {releaseId: 'rSummer', variantId: 'alpha-audience'},
      title: 'Release: rSummer and variant: alpha-audience',
    })
  })
})
