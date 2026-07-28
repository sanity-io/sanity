import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  VARIANT_VERSION_DISABLED,
} from './assertNotVariantVersion'

function variantVersionDoc(): SanityDocument {
  return {
    _id: 'versions.varscope.article-1',
    _type: 'article',
    _rev: 'r1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _system: {
      bundleId: 'drafts',
      variant: {_ref: '_.variants.french', _weak: true},
      group: {_ref: 'article-1', _weak: true},
      scopeId: 'varscope',
    },
  }
}

describe('disabledForVariantVersion', () => {
  it('returns VARIANT_VERSION for a variant-scoped version snapshot', () => {
    expect(disabledForVariantVersion(variantVersionDoc())).toBe(VARIANT_VERSION_DISABLED)
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
    expect(() => assertNotVariantVersion(variantVersionDoc(), 'publish')).toThrowError(
      /variant-scoped version/,
    )
  })

  it('does not throw for non-variant versions', () => {
    expect(() => assertNotVariantVersion(null, 'publish')).not.toThrow()
  })
})
