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

  // Documents why `useAllVariants` must stay synchronous rather than be
  // deferred: `getSelectedVariant` pairs the live `selectedVariantName` with
  // the `variantsById` map. A deferred read would let the map lag behind the
  // selected name — resolving the variant identity to `undefined` even for a
  // valid selection until the deferred value catches up.
  it('resolves only when byId is coherent with the selected name (deferral would tear this)', () => {
    // Lagging map (what a deferred useAllVariants yields right after selecting
    // the variant): identity is undefined.
    expect(
      getSelectedVariant({selectedVariantName: 'alpha-audience', variantsById: new Map()}),
    ).toBeUndefined()

    // Coherent (synchronous) map: identity resolves.
    expect(
      getSelectedVariant({
        selectedVariantName: 'alpha-audience',
        variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
      }),
    ).toBe(variantAlphaAudience)
  })
})
