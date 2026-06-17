import {describe, expect, it} from 'vitest'

import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {getSelectedVariant} from '../getSelectedVariant'

describe('getSelectedVariant', () => {
  it('returns undefined when no sticky variant is set', () => {
    expect(
      getSelectedVariant({
        selectedVariantName: undefined,
        variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
      }),
    ).toBeUndefined()
  })

  it('returns undefined when byId is still empty', () => {
    expect(
      getSelectedVariant({
        selectedVariantName: 'alpha-audience',
        variantsById: new Map(),
      }),
    ).toBeUndefined()
  })

  it('resolves sticky short id to variant definition', () => {
    expect(
      getSelectedVariant({
        selectedVariantName: 'alpha-audience',
        variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
      }),
    ).toBe(variantAlphaAudience)
  })

  it('returns undefined when sticky variant does not exist in byId', () => {
    expect(
      getSelectedVariant({
        selectedVariantName: 'missing-variant',
        variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
      }),
    ).toBeUndefined()
  })
})
