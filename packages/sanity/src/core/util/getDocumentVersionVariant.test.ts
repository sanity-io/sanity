import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getDocumentVersionVariantId} from './getDocumentVersionVariant'

const group = {_ref: 'doc1', _weak: true as const}
const alpha = {_ref: '_.variants.alpha', _weak: true as const}
const beta = {_ref: '_.variants.beta', _weak: true as const}

function documentWithSystem(system?: Partial<DocumentSystem> | null) {
  return {_system: system}
}

describe('getDocumentVersionVariantId', () => {
  it('reads the first entry of `variants`', () => {
    expect(getDocumentVersionVariantId(documentWithSystem({group, variants: [alpha]}))).toBe(
      '_.variants.alpha',
    )
  })

  it('falls back to the legacy `variant` field on unmigrated documents', () => {
    expect(
      getDocumentVersionVariantId(
        // oxlint-disable-next-line typescript/no-deprecated -- fixture for the unmigrated fallback path.
        documentWithSystem({group, variant: alpha}),
      ),
    ).toBe('_.variants.alpha')
  })

  it('prefers `variants` when both fields are present', () => {
    expect(
      getDocumentVersionVariantId(
        // oxlint-disable-next-line typescript/no-deprecated -- fixture covering variants taking precedence.
        documentWithSystem({group, variants: [beta], variant: alpha}),
      ),
    ).toBe('_.variants.beta')
  })

  it('returns undefined for base documents', () => {
    expect(getDocumentVersionVariantId(documentWithSystem({group}))).toBeUndefined()
    expect(getDocumentVersionVariantId(documentWithSystem({group, variants: []}))).toBeUndefined()
    expect(
      getDocumentVersionVariantId(
        // oxlint-disable-next-line typescript/no-deprecated -- empty legacy field should not invent a variant.
        documentWithSystem({group, variants: [], variant: undefined}),
      ),
    ).toBeUndefined()
    // The backend serializes absent references as `null`.
    expect(
      getDocumentVersionVariantId(
        documentWithSystem({group, variants: null, variant: null} as unknown as DocumentSystem),
      ),
    ).toBeUndefined()
  })

  it('returns undefined when there is no document or `_system`', () => {
    expect(getDocumentVersionVariantId(undefined)).toBeUndefined()
    expect(getDocumentVersionVariantId(null)).toBeUndefined()
    expect(getDocumentVersionVariantId({})).toBeUndefined()
  })
})
