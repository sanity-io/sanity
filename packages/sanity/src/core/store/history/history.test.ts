import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createHistoryStore, removeMissingReferences} from './createHistoryStore'

const testDoc = {
  _id: 'foo',
  _rev: 'foo',
  _createdAt: '',
  _updatedAt: '',
  _type: 'test',
  string: 'value',
  number: 123,
  bool: true,
  subObject: {
    _type: 'sub',
    nested: {
      prop: true,
      array: [
        'contents',
        {_type: 'reference', _ref: 'abc123'},
        {_type: 'nonref', someProp: 'yes-it-exists'},
      ],
    },
  },
  arrayOfStrings: ['a', 'b', 'c'],
  arrayOfObjects: [
    {_type: 'foo', prop: 'yes'},
    {_type: 'reference', _ref: 'random'},
    {_type: 'foo', prop: 'no'},
    {_type: 'reference', _ref: 'd987abc'},
  ],
}

describe('removeMissingReferences', () => {
  test('removes references to missing docs, deeply', () => {
    const existingIds = {abc123: true, d987abc: false}
    const mapped = removeMissingReferences(testDoc, existingIds)
    expect(mapped).toMatchSnapshot()
  })
})

describe('createHistoryStore', () => {
  const mockClient = {
    config: () => ({dataset: 'test-dataset'}),
    request: vi.fn(),
  } as unknown as SanityClient

  beforeEach(() => {
    vi.mocked(mockClient.request).mockClear()
  })

  describe('getDocumentAtRevision with lastRevision', () => {
    test('constructs correct URL for lastRevision', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const historyStore = createHistoryStore({client: mockClient})

      await historyStore.getDocumentAtRevision('test-doc', 'lastRevision')

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/data/history/test-dataset/documents/test-doc,drafts.test-doc?lastRevision=true',
        tag: 'history-revision',
      })
    })

    test('constructs correct URL for specific revision', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const historyStore = createHistoryStore({client: mockClient})

      await historyStore.getDocumentAtRevision('test-doc', 'rev-123')

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/data/history/test-dataset/documents/test-doc,drafts.test-doc?revision=rev-123',
        tag: 'history-revision',
      })
    })

    test('uses different URLs for lastRevision vs specific revisions', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const historyStore = createHistoryStore({client: mockClient})

      await historyStore.getDocumentAtRevision('unique-doc-1', 'lastRevision')
      await historyStore.getDocumentAtRevision('unique-doc-2', 'rev-123')

      expect(mockClient.request).toHaveBeenCalledTimes(2)
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        url: '/data/history/test-dataset/documents/unique-doc-1,drafts.unique-doc-1?lastRevision=true',
        tag: 'history-revision',
      })
      expect(mockClient.request).toHaveBeenNthCalledWith(2, {
        url: '/data/history/test-dataset/documents/unique-doc-2,drafts.unique-doc-2?revision=rev-123',
        tag: 'history-revision',
      })
    })

    test('handles empty document response correctly', async () => {
      const mockResponse = {documents: []}
      vi.mocked(mockClient.request).mockResolvedValue(mockResponse)
      const historyStore = createHistoryStore({client: mockClient})

      const result = await historyStore.getDocumentAtRevision('test-doc', 'lastRevision')

      expect(result).toBeUndefined()
    })
  })

  describe('restore', () => {
    const revisionDoc = {
      _id: 'doc-id',
      _rev: 'rev-1',
      _type: 'testType',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-02T00:00:00Z',
      title: 'Restored',
    }

    const mockAction = vi.fn()
    const mockCreateOrReplace = vi.fn()
    const mockFetch = vi.fn()
    const mockRequest = vi.fn()

    const buildClient = () =>
      ({
        config: () => ({dataset: 'test-dataset'}),
        request: mockRequest,
        withConfig: vi.fn().mockReturnThis(),
        observable: {
          fetch: mockFetch,
          createOrReplace: mockCreateOrReplace,
          action: mockAction,
        },
      }) as unknown as SanityClient

    beforeEach(() => {
      mockAction.mockReset().mockReturnValue(of({transactionId: 'tx'}))
      mockCreateOrReplace.mockReset().mockReturnValue(of({transactionId: 'tx'}))
      mockFetch.mockReset().mockReturnValue(of({}))
      mockRequest.mockReset().mockResolvedValue({documents: [revisionDoc]})
    })

    test('uses replaceDraft action when target id is drafts-prefixed', async () => {
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', 'drafts.doc-id', 'rev-1', {
            fromDeleted: false,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).toHaveBeenCalledTimes(1)
      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      const [actions] = mockAction.mock.calls[0]
      expect(actions).toMatchObject({
        actionType: 'sanity.action.document.replaceDraft',
        publishedId: 'doc-id',
        attributes: expect.objectContaining({_id: 'drafts.doc-id'}),
      })
    })

    test('falls back to createOrReplace when target id is unprefixed', async () => {
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', 'doc-id', 'rev-1', {
            fromDeleted: false,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).not.toHaveBeenCalled()
      expect(mockCreateOrReplace).toHaveBeenCalledTimes(1)
      expect(mockCreateOrReplace).toHaveBeenCalledWith(
        expect.objectContaining({_id: 'doc-id', title: 'Restored'}),
        {visibility: 'async'},
      )
    })

    test('falls back to createOrReplace for a deleted document with unprefixed target id', async () => {
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', 'doc-id', 'rev-1', {
            fromDeleted: true,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).not.toHaveBeenCalled()
      expect(mockCreateOrReplace).toHaveBeenCalledTimes(1)
    })

    test('uses create + replaceDraft actions for a deleted document with a drafts-prefixed target', async () => {
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', 'drafts.doc-id', 'rev-1', {
            fromDeleted: true,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      expect(mockAction).toHaveBeenCalledTimes(1)
      const [actions] = mockAction.mock.calls[0]
      expect(actions).toHaveLength(2)
      expect(actions[0]).toMatchObject({
        actionType: 'sanity.action.document.create',
        publishedId: 'doc-id',
        ifExists: 'fail',
        attributes: expect.objectContaining({_id: 'drafts.doc-id'}),
      })
      expect(actions[1]).toMatchObject({
        actionType: 'sanity.action.document.replaceDraft',
        publishedId: 'doc-id',
        attributes: expect.objectContaining({_id: 'drafts.doc-id'}),
      })
    })

    test('uses version.replace for release version targets', async () => {
      const releaseVersionId = 'versions.rI4gmhsFL.doc-id'
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', releaseVersionId, 'rev-1', {
            fromDeleted: false,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).toHaveBeenCalledTimes(1)
      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      const [actions] = mockAction.mock.calls[0]
      expect(actions).toMatchObject({
        actionType: 'sanity.action.document.version.replace',
        document: expect.objectContaining({_id: releaseVersionId, title: 'Restored'}),
      })
      expect(actions).not.toHaveProperty('publishedId')
      // The versioned actions API client is selected because the pair derives from the target id.
      expect(client.withConfig).toHaveBeenCalledWith({apiVersion: 'v2025-02-19'})
    })

    test('keeps replaceDraft addressed at the version id for variant-scoped targets', async () => {
      // Variant version ids carry an opaque scope hash as the bundle segment and are
      // indistinguishable from release ids by shape. There is no `document.variant.replace`
      // action, so variant documents keep the raw-id draft actions instead of the release-only
      // `document.version.*` family.
      const variantVersionId = 'versions.a1b2c3d4e5.doc-id'
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', variantVersionId, 'rev-1', {
            fromDeleted: false,
            useServerDocumentActions: true,
            variant: {variantId: 'french', bundleId: 'drafts'},
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).toHaveBeenCalledTimes(1)
      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      const [actions] = mockAction.mock.calls[0]
      expect(actions).toMatchObject({
        actionType: 'sanity.action.document.replaceDraft',
        publishedId: 'doc-id',
        attributes: expect.objectContaining({_id: variantVersionId}),
      })
      expect(client.withConfig).toHaveBeenCalledWith({apiVersion: 'v2025-02-19'})
    })

    test('does not send document.create when restoring a version that already exists', async () => {
      // Reproducing the reported 409 documentAlreadyExistsError: the draft write path sent
      // `document.create` with `ifExists: fail` carrying the version id, which trips the
      // one-version-per-published-id guard whenever that version is already in the release.
      const releaseVersionId = 'versions.rI4gmhsFL.doc-id'
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', releaseVersionId, 'rev-1', {
            fromDeleted: false,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      expect(mockAction).toHaveBeenCalledTimes(1)
      const [actions] = mockAction.mock.calls[0]
      expect(Array.isArray(actions) ? actions : [actions]).toEqual([
        expect.objectContaining({
          actionType: 'sanity.action.document.version.replace',
          document: expect.objectContaining({_id: releaseVersionId}),
        }),
      ])
    })

    test('creates the version when restoring a revision into a release that has no version yet', async () => {
      const releaseVersionId = 'versions.rI4gmhsFL.doc-id'
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', releaseVersionId, 'rev-1', {
            fromDeleted: true,
            useServerDocumentActions: true,
          })
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockCreateOrReplace).not.toHaveBeenCalled()
      const [actions] = mockAction.mock.calls[0]
      expect(actions).toMatchObject({
        actionType: 'sanity.action.document.version.create',
        publishedId: 'doc-id',
        document: expect.objectContaining({_id: releaseVersionId, title: 'Restored'}),
      })
    })

    test('falls back to createOrReplace when useServerDocumentActions is not set', async () => {
      const client = buildClient()
      const historyStore = createHistoryStore({client})

      await new Promise<void>((resolve, reject) => {
        historyStore
          .restore('doc-id', 'drafts.doc-id', 'rev-1', {fromDeleted: false})
          .subscribe({complete: resolve, error: reject})
      })

      expect(mockAction).not.toHaveBeenCalled()
      expect(mockCreateOrReplace).toHaveBeenCalledTimes(1)
    })
  })
})
