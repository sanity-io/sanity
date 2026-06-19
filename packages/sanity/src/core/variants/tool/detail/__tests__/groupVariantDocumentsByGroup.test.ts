import {describe, expect, it} from 'vitest'

import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {groupVariantDocumentsByGroup} from '../groupVariantDocumentsByGroup'
import {type DocumentInVariant} from '../types'

const GROUP_ID = 'article-1'

const defaultValidation = {
  hasError: false,
  isValidating: false,
  validation: [],
} as const

const createDocumentInVariant = ({
  documentId,
  bundleId,
  updatedAt,
  releaseRef = null,
  validation = defaultValidation,
}: {
  documentId: string
  bundleId: undefined | 'drafts' | 'rASAP'
  updatedAt: string
  releaseRef?: string | null
  validation?: DocumentInVariant['validation']
}): DocumentInVariant => ({
  memoKey: documentId,
  document: {
    _id: documentId,
    _type: 'article',
    _rev: `${documentId}-rev`,
    _createdAt: updatedAt,
    _updatedAt: updatedAt,
    _system: {
      bundleId: bundleId ?? null,
      release: releaseRef ? {_ref: releaseRef, _weak: true} : null,
      variant: {_ref: variantAlphaAudience._id, _weak: true},
      group: {_ref: GROUP_ID, _weak: true},
      scopeId: null,
    },
  },
  version: {
    documentId,
    bundleId,
    releaseRef,
    updatedAt,
  },
  validation,
})

describe('groupVariantDocumentsByGroup', () => {
  it('returns one row per document group', () => {
    const rows = groupVariantDocumentsByGroup([
      createDocumentInVariant({
        documentId: 'drafts.scope.article-1',
        bundleId: 'drafts',
        updatedAt: '2025-06-01T00:00:00Z',
      }),
      createDocumentInVariant({
        documentId: 'versions.rASAP.scope.article-1',
        bundleId: 'rASAP',
        updatedAt: '2025-06-02T00:00:00Z',
        releaseRef: '_.releases.rASAP',
      }),
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.groupId).toBe(GROUP_ID)
    expect(rows[0]?.versions).toHaveLength(2)
  })

  it('uses the latest edited document as the representative row document', () => {
    const rows = groupVariantDocumentsByGroup([
      createDocumentInVariant({
        documentId: 'drafts.scope.article-1',
        bundleId: 'drafts',
        updatedAt: '2025-06-01T00:00:00Z',
      }),
      createDocumentInVariant({
        documentId: 'published.scope.article-1',
        bundleId: undefined,
        updatedAt: '2025-06-03T00:00:00Z',
      }),
    ])

    expect(rows[0]?.document._id).toBe('published.scope.article-1')
  })

  it('sorts bundle chips as published, drafts, then releases by document id', () => {
    const rows = groupVariantDocumentsByGroup([
      createDocumentInVariant({
        documentId: 'versions.rB.scope.article-1',
        bundleId: 'rB',
        updatedAt: '2025-06-04T00:00:00Z',
        releaseRef: '_.releases.rB',
      }),
      createDocumentInVariant({
        documentId: 'drafts.scope.article-1',
        bundleId: 'drafts',
        updatedAt: '2025-06-01T00:00:00Z',
      }),
      createDocumentInVariant({
        documentId: 'published.scope.article-1',
        bundleId: undefined,
        updatedAt: '2025-06-03T00:00:00Z',
      }),
      createDocumentInVariant({
        documentId: 'versions.rA.scope.article-1',
        bundleId: 'rA',
        updatedAt: '2025-06-02T00:00:00Z',
        releaseRef: '_.releases.rA',
      }),
    ])

    expect(rows[0]?.versions.map((version) => version.bundleId)).toEqual([
      undefined,
      'drafts',
      'rA',
      'rB',
    ])
  })

  it('aggregates validation errors across grouped document versions', () => {
    const rows = groupVariantDocumentsByGroup([
      createDocumentInVariant({
        documentId: 'drafts.scope.article-1',
        bundleId: 'drafts',
        updatedAt: '2025-06-01T00:00:00Z',
        validation: {
          hasError: false,
          isValidating: false,
          validation: [],
        },
      }),
      createDocumentInVariant({
        documentId: 'published.scope.article-1',
        bundleId: undefined,
        updatedAt: '2025-06-03T00:00:00Z',
        validation: {
          hasError: true,
          isValidating: false,
          validation: [{level: 'error', message: 'Title is required', path: ['title']}],
        },
      }),
    ])

    expect(rows[0]?.validation.hasError).toBe(true)
    expect(rows[0]?.validation.validation).toHaveLength(1)
  })
})
