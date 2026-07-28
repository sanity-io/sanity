import {describe, expect, it} from 'vitest'

import {getDocumentPreviewTitle} from '../variantDocumentTable/getDocumentPreviewTitle'

describe('getDocumentPreviewTitle', () => {
  it('falls back to document id for whitespace-only titles', () => {
    expect(
      getDocumentPreviewTitle({
        _id: 'drafts.scope.article-1',
        _type: 'article',
        _rev: 'rev-1',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        title: '   ',
      }),
    ).toBe('drafts.scope.article-1')
  })
})
