import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  VARIANT_VERSION_DISABLED,
} from './assertNotVariantVersion'

const variantRef = {_ref: '_.variants.french', _weak: true as const}

function variantVersionDoc(system: SanityDocument['_system'] = {variants: [variantRef]}) {
  return {
    _id: 'versions.varscope.article-1',
    _type: 'article',
    _rev: 'r1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _system: {
      bundleId: 'drafts',
      group: {_ref: 'article-1', _weak: true},
      scopeId: 'varscope',
      ...system,
    },
  } satisfies SanityDocument
}

/** An unmigrated document still carrying the legacy single `_system.variant` reference. */
const legacyVariantVersionDoc = () => variantVersionDoc({variant: variantRef})

describe('disabledForVariantVersion', () => {
  it('returns VARIANT_VERSION for a variant-scoped version snapshot', () => {
    expect(disabledForVariantVersion(variantVersionDoc())).toBe(VARIANT_VERSION_DISABLED)
  })

  it('returns VARIANT_VERSION for an unmigrated variant-scoped version snapshot', () => {
    expect(disabledForVariantVersion(legacyVariantVersionDoc())).toBe(VARIANT_VERSION_DISABLED)
  })

  it('returns false for non-variant versions', () => {
    expect(disabledForVariantVersion(null)).toBe(false)
    expect(
      disabledForVariantVersion({
        ...variantVersionDoc(),
        _system: {bundleId: 'drafts', group: {_ref: 'article-1', _weak: true}},
      }),
    ).toBe(false)
  })
})

describe('assertNotVariantVersion', () => {
  it('throws for a variant-scoped version snapshot', () => {
    expect(() => assertNotVariantVersion(variantVersionDoc(), 'publish')).toThrow(
      /variant-scoped version/,
    )
  })

  it('throws for an unmigrated variant-scoped version snapshot', () => {
    expect(() => assertNotVariantVersion(legacyVariantVersionDoc(), 'publish')).toThrow(
      /variant-scoped version/,
    )
  })

  it('does not throw for non-variant versions', () => {
    expect(() => assertNotVariantVersion(null, 'publish')).not.toThrow()
  })
})
