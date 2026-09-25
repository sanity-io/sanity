import {describe, expect, it} from 'vitest'

import {
  encodeVariantLinkParam,
  parseVariantStickyParam,
  serializeVariantStickyParam,
  updateVariantSelection,
} from '../variantSelection'

describe('parseVariantStickyParam', () => {
  it('reads a bare id as the variant type', () => {
    expect(parseVariantStickyParam('alpha-audience')).toEqual([
      {type: 'variant', name: 'alpha-audience'},
    ])
  })

  it('reads a bare id and variant:<id> as the same selection', () => {
    expect(parseVariantStickyParam('alpha-audience')).toEqual(
      parseVariantStickyParam('variant:alpha-audience'),
    )
  })

  it('reads type and id pairs sorted only on write', () => {
    expect(parseVariantStickyParam('language:Fr12,variant:Ab12')).toEqual([
      {type: 'language', name: 'Fr12'},
      {type: 'variant', name: 'Ab12'},
    ])
  })
})

describe('encodeVariantLinkParam', () => {
  it('defaults the type to variant and strips the document id prefix', () => {
    expect(encodeVariantLinkParam('_.variants.alpha-audience')).toBe('variant:alpha-audience')
    expect(encodeVariantLinkParam('alpha-audience')).toBe('variant:alpha-audience')
  })

  it('writes the given type', () => {
    expect(encodeVariantLinkParam('_.variants.Fr12', 'language')).toBe('language:Fr12')
  })
})

describe('serializeVariantStickyParam', () => {
  it('writes pairs sorted by type and returns null when empty', () => {
    expect(
      serializeVariantStickyParam([
        {type: 'language', name: 'Fr12'},
        {type: 'variant', name: 'Ab12'},
      ]),
    ).toBe('language:Fr12,variant:Ab12')
    expect(serializeVariantStickyParam([])).toBeNull()
  })
})

describe('updateVariantSelection', () => {
  it('replaces one type and keeps the other', () => {
    const current = [
      {type: 'variant', name: 'Ab12'},
      {type: 'language', name: 'Fr12'},
    ]

    expect(updateVariantSelection(current, 'language', undefined)).toEqual([
      {type: 'variant', name: 'Ab12'},
    ])
    expect(updateVariantSelection(current, 'variant', '_.variants.Next')).toEqual([
      {type: 'language', name: 'Fr12'},
      {type: 'variant', name: 'Next'},
    ])
  })
})
