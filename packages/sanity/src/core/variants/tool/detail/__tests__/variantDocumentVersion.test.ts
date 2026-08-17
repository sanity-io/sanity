import {describe, expect, it} from 'vitest'

import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {toVariantDocumentVersion} from '../variantDocumentVersion'

describe('toVariantDocumentVersion', () => {
  it('keeps published variant documents with null bundleId as undefined', () => {
    expect(
      toVariantDocumentVersion({
        _id: 'published.scope.article-1',
        _type: 'article',
        _rev: 'rev-1',
        _createdAt: '2025-06-01T00:00:00Z',
        _updatedAt: '2025-06-03T00:00:00Z',
        _system: {
          bundleId: null,
          release: null,
          variant: {_ref: variantAlphaAudience._id, _weak: true},
          group: {_ref: 'article-1', _weak: true},
          scopeId: 'scope',
        },
      }),
    ).toEqual({
      documentId: 'published.scope.article-1',
      bundleId: undefined,
      releaseRef: null,
      updatedAt: '2025-06-03T00:00:00Z',
    })
  })

  it('passes through drafts bundle ids unchanged', () => {
    expect(
      toVariantDocumentVersion({
        _id: 'drafts.scope.article-1',
        _type: 'article',
        _rev: 'rev-1',
        _createdAt: '2025-06-01T00:00:00Z',
        _updatedAt: '2025-06-01T00:00:00Z',
        _system: {
          bundleId: 'drafts',
          release: null,
          variant: {_ref: variantAlphaAudience._id, _weak: true},
          group: {_ref: 'article-1', _weak: true},
          scopeId: null,
        },
      }),
    ).toEqual({
      documentId: 'drafts.scope.article-1',
      bundleId: 'drafts',
      releaseRef: null,
      updatedAt: '2025-06-01T00:00:00Z',
    })
  })
})
