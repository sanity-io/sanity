import {describe, expect, it} from 'vitest'

import {DOCUMENT_SYSTEM_FIELD} from '../../../../../preview/constants'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../../../../variants/__fixtures__/variants.fixture'
import {getVariantBundleSortKey, getVariantDefinitionRef} from '../getVariantBundleSortKey'
import {type BundleDocumentRow} from '../ReleaseSummary'

const groupRef = {_type: 'reference' as const, _ref: 'article-1', _weak: true as const}

function createRow(document: BundleDocumentRow['document']): BundleDocumentRow {
  return {
    memoKey: document._id,
    document,
    validation: {
      hasError: false,
      isValidating: false,
      validation: [],
    },
  }
}

const variantsById = new Map([
  [variantAlphaAudience._id, variantAlphaAudience],
  [variantNorwegianMarket._id, variantNorwegianMarket],
])

describe('getVariantDefinitionRef', () => {
  it('returns the variant definition ref when present on the document', () => {
    const document = {
      _id: 'versions.rASAP.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        variant: {_ref: variantAlphaAudience._id, _weak: true},
        group: groupRef,
        scopeId: 'scope',
      },
    }

    expect(getVariantDefinitionRef(document)).toBe(variantAlphaAudience._id)
  })

  it('returns undefined when the document has no variant ref', () => {
    const document = {
      _id: 'versions.rASAP.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        group: groupRef,
        scopeId: null,
      },
    }

    expect(getVariantDefinitionRef(document)).toBeUndefined()
  })
})

describe('getVariantBundleSortKey', () => {
  it('returns an empty string for documents without a variant ref', () => {
    const row = createRow({
      _id: 'versions.rASAP.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
    })

    expect(getVariantBundleSortKey(row, variantsById)).toBe('')
  })

  it('returns the lowercase variant title when the definition exists', () => {
    const row = createRow({
      _id: 'versions.rASAP.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        variant: {_ref: variantAlphaAudience._id, _weak: true},
        group: groupRef,
        scopeId: 'scope',
      },
    })

    expect(getVariantBundleSortKey(row, variantsById)).toBe('alpha audience')
  })

  it('falls back to the short variant id when the definition is missing', () => {
    const row = createRow({
      _id: 'versions.rASAP.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        variant: {_ref: '_.variants.missing-variant', _weak: true},
        group: groupRef,
        scopeId: 'scope',
      },
    })

    expect(getVariantBundleSortKey(row, variantsById)).toBe('missing-variant')
  })

  it('sorts rows by variant title in alphabetical order', () => {
    const alphaRow = createRow({
      _id: 'versions.rASAP.scope.article-1',
      _type: 'article',
      _rev: 'rev-1',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        variant: {_ref: variantAlphaAudience._id, _weak: true},
        group: groupRef,
        scopeId: 'scope',
      },
    })
    const norwegianRow = createRow({
      _id: 'versions.rASAP.scope.article-2',
      _type: 'article',
      _rev: 'rev-2',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
      [DOCUMENT_SYSTEM_FIELD]: {
        bundleId: 'rASAP',
        release: {_ref: '_.releases.rASAP', _weak: true},
        variant: {_ref: variantNorwegianMarket._id, _weak: true},
        group: groupRef,
        scopeId: 'scope',
      },
    })
    const defaultRow = createRow({
      _id: 'versions.rASAP.article-3',
      _type: 'article',
      _rev: 'rev-3',
      _createdAt: '2025-01-01T00:00:00Z',
      _updatedAt: '2025-01-01T00:00:00Z',
      publishedDocumentExists: true,
    })

    const sorted = [norwegianRow, defaultRow, alphaRow].toSorted((left, right) =>
      getVariantBundleSortKey(left, variantsById).localeCompare(
        getVariantBundleSortKey(right, variantsById),
      ),
    )

    expect(sorted.map((row) => row.document._id)).toEqual([
      'versions.rASAP.article-3',
      'versions.rASAP.scope.article-1',
      'versions.rASAP.scope.article-2',
    ])
  })
})
