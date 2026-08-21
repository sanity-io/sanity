import {describe, expect, it} from 'vitest'

import {
  getDiscardDocumentActionId,
  getVersionContextMenuActionsContext,
} from '../useConfiguredDocumentActionIds'

describe('getVersionContextMenuActionsContext', () => {
  it('resolves scheduled-draft context from a cardinality-one release chip', () => {
    expect(
      getVersionContextMenuActionsContext({
        schemaType: 'article',
        documentGroupId: 'doc-1',
        fromRelease: 'r1',
        isScheduledDraft: true,
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: 'doc-1',
      versionType: 'scheduled-draft',
      releaseId: 'r1',
    })
  })

  it('resolves version context for a regular release chip', () => {
    expect(
      getVersionContextMenuActionsContext({
        schemaType: 'article',
        documentGroupId: 'doc-1',
        fromRelease: 'r1',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: 'doc-1',
      versionType: 'version',
      releaseId: 'r1',
    })
  })

  it('resolves draft and published system perspectives without a releaseId', () => {
    expect(
      getVersionContextMenuActionsContext({
        schemaType: 'article',
        documentGroupId: 'doc-1',
        fromRelease: 'draft',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: 'doc-1',
      versionType: 'draft',
      releaseId: undefined,
    })

    expect(
      getVersionContextMenuActionsContext({
        schemaType: 'article',
        documentGroupId: 'doc-1',
        fromRelease: 'published',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: 'doc-1',
      versionType: 'published',
      releaseId: undefined,
    })
  })
})

describe('getDiscardDocumentActionId', () => {
  it('maps draft chips to discardChanges and release chips to discardVersion', () => {
    expect(getDiscardDocumentActionId({fromRelease: 'draft'})).toBe('discardChanges')
    expect(getDiscardDocumentActionId({fromRelease: 'r1'})).toBe('discardVersion')
    expect(getDiscardDocumentActionId({fromRelease: 'r1', isScheduledDraft: true})).toBe(
      'discardVersion',
    )
  })

  it('returns null for published chips', () => {
    expect(getDiscardDocumentActionId({fromRelease: 'published'})).toBeNull()
  })
})
