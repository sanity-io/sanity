import {describe, expect, it} from 'vitest'

import {
  getDiscardDocumentActionId,
  getDocumentVersionType,
  getVersionContextMenuActionsContext,
} from '../useConfiguredDocumentActionIds'

describe('getDocumentVersionType', () => {
  it('prefers revision over scheduled-draft, version, and published', () => {
    expect(
      getDocumentVersionType({
        isRevision: true,
        isScheduledDraft: true,
        isVersionDocument: true,
        perspectiveName: 'published',
        draftsEnabled: true,
      }),
    ).toEqual('revision')
  })

  it('resolves scheduled-draft when isScheduledDraft and isVersionDocument', () => {
    expect(
      getDocumentVersionType({
        isScheduledDraft: true,
        isVersionDocument: true,
      }),
    ).toEqual('scheduled-draft')
  })

  it('resolves scheduled-draft from isScheduledDraft alone', () => {
    expect(getDocumentVersionType({isScheduledDraft: true})).toEqual('scheduled-draft')
  })

  it('resolves version from isVersionDocument', () => {
    expect(getDocumentVersionType({isVersionDocument: true})).toEqual('version')
  })

  it('resolves published when perspectiveName is published', () => {
    expect(
      getDocumentVersionType({
        perspectiveName: 'published',
        draftsEnabled: true,
      }),
    ).toEqual('published')
  })

  it('resolves draft when perspectiveName is draft and drafts are enabled', () => {
    expect(
      getDocumentVersionType({
        perspectiveName: 'draft',
        draftsEnabled: true,
      }),
    ).toEqual('draft')
  })

  it('resolves draft when perspectiveName is drafts and drafts are enabled', () => {
    expect(
      getDocumentVersionType({
        perspectiveName: 'drafts',
        draftsEnabled: true,
      }),
    ).toEqual('draft')
  })

  it('resolves draft when perspectiveName is undefined and drafts are enabled', () => {
    expect(
      getDocumentVersionType({
        perspectiveName: undefined,
        draftsEnabled: true,
      }),
    ).toEqual('draft')
  })

  it('resolves published when drafts are disabled', () => {
    expect(getDocumentVersionType({draftsEnabled: false})).toEqual('published')
  })

  it('resolves published for an empty options object', () => {
    expect(getDocumentVersionType({})).toEqual('published')
  })
})

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

  it('resolves draft context when fromRelease is drafts', () => {
    expect(
      getVersionContextMenuActionsContext({
        schemaType: 'article',
        documentGroupId: 'doc-1',
        fromRelease: 'drafts',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: 'doc-1',
      versionType: 'draft',
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

  it('maps drafts bundle chips to discardChanges', () => {
    expect(getDiscardDocumentActionId({fromRelease: 'drafts'})).toBe('discardChanges')
  })
})
