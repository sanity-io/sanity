import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getSystemVariantId, getSystemVariantRef} from './getSystemVariantRef'

const group = {_ref: 'doc1', _weak: true as const}
const alpha = {_ref: '_.variants.alpha', _weak: true as const}
const beta = {_ref: '_.variants.beta', _weak: true as const}

describe('getSystemVariantRef', () => {
  it('reads the first entry of `variants`', () => {
    expect(getSystemVariantRef({group, variants: [alpha]})).toEqual(alpha)
    expect(getSystemVariantId({group, variants: [alpha]})).toBe('_.variants.alpha')
  })

  it('falls back to the legacy `variant` field on unmigrated documents', () => {
    expect(getSystemVariantRef({group, variant: alpha})).toEqual(alpha)
    expect(getSystemVariantId({group, variant: alpha})).toBe('_.variants.alpha')
  })

  it('prefers `variants` when both fields are present', () => {
    expect(getSystemVariantRef({group, variants: [beta], variant: alpha})).toEqual(beta)
  })

  it('returns undefined for base documents', () => {
    expect(getSystemVariantRef({group})).toBeUndefined()
    expect(getSystemVariantRef({group, variants: []})).toBeUndefined()
    expect(getSystemVariantRef({group, variants: [], variant: undefined})).toBeUndefined()
    // The backend serializes absent references as `null`.
    expect(
      getSystemVariantRef({group, variants: null, variant: null} as unknown as DocumentSystem),
    ).toBeUndefined()
    expect(getSystemVariantId({group, variants: []})).toBeUndefined()
  })

  it('returns undefined when there is no `_system`', () => {
    expect(getSystemVariantRef(undefined)).toBeUndefined()
    expect(getSystemVariantRef(null)).toBeUndefined()
    expect(getSystemVariantId(undefined)).toBeUndefined()
  })
})
