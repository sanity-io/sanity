import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../__fixtures__/createMockVariant'
import {
  decodeVariantIdFromRoute,
  filterVariantsForSearch,
  getVariantConditionsText,
  getVariantDescription,
  getVariantId,
  getVariantTitle,
} from '../util'

describe('variants tool utilities', () => {
  it('derives a display id from a variant document id', () => {
    expect(getVariantId('_.variants.audience-a')).toBe('audience-a')
    expect(getVariantId('audience-a')).toBe('audience-a')
  })

  it('uses metadata title before falling back to the id suffix', () => {
    const variant = createMockVariant('audience-a')

    expect(getVariantTitle(variant)).toBe('audience-a')
    expect(getVariantTitle({...variant, metadata: {title: 'Audience A', description: []}})).toBe(
      'Audience A',
    )
  })

  it('formats conditions as quoted key value pairs', () => {
    expect(getVariantConditionsText({audience: 'developer', locale: 'en'})).toBe(
      'audience: "developer", locale: "en"',
    )
    expect(getVariantConditionsText({locale: 'en,nb'})).toBe('locale: "en,nb"')
  })

  it('decodes route slugs back to variant document ids', () => {
    expect(decodeVariantIdFromRoute('alpha-audience')).toBe('_.variants.alpha-audience')
    expect(decodeVariantIdFromRoute(encodeURIComponent('loyal-customers'))).toBe(
      '_.variants.loyal-customers',
    )
    expect(decodeVariantIdFromRoute(encodeURIComponent('_.variants.a'))).toBe('_.variants.a')
    expect(decodeVariantIdFromRoute('%E0%A4%A')).toBe('_.variants.%E0%A4%A')
    expect(decodeVariantIdFromRoute(undefined)).toBeUndefined()
  })

  it('extracts plain text descriptions from portable text', () => {
    const variant = createMockVariant('audience-a')

    expect(
      getVariantDescription({
        ...variant,
        metadata: {
          description: [
            {
              _key: 'block-1',
              _type: 'block',
              children: [{_key: 'span-1', _type: 'span', marks: [], text: 'Developer audience'}],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
      }),
    ).toBe('Developer audience')
  })

  it('filters variants by title and condition keys or values', () => {
    const developerVariant = {
      ...createMockVariant('developer'),
      metadata: {title: 'Developer audience', description: []},
    }
    const localeVariant = {
      ...createMockVariant('norwegian', 1),
      conditions: {locale: 'nb-NO'},
    }

    expect(filterVariantsForSearch([developerVariant, localeVariant], 'developer')).toEqual([
      developerVariant,
    ])
    expect(filterVariantsForSearch([developerVariant, localeVariant], 'locale')).toEqual([
      localeVariant,
    ])
    expect(filterVariantsForSearch([developerVariant, localeVariant], 'nb-no')).toEqual([
      localeVariant,
    ])
  })
})
