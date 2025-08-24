import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {lastValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, test, vi} from 'vitest'

// Mock the actionsApiClient at module level
vi.mock('../document/document-pair/utils/actionsApiClient', () => ({
  actionsApiClient: vi.fn(),
}))

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

const testDocument: SanityDocument = {
  _id: 'test-doc',
  _type: 'testType',
  _createdAt: '2023-01-01T00:00:00Z',
  _updatedAt: '2023-01-02T00:00:00Z',
  _rev: 'rev-123',
  title: 'Test Document',
  description: 'Test description',
}

describe('removeMissingReferences', () => {
  test('removes references to missing docs, deeply', async () => {
    const {removeMissingReferences} = await import('./createHistoryStore')
    const existingIds = {abc123: true, d987abc: false}
    const mapped = removeMissingReferences(testDoc, existingIds)
    expect(mapped).toMatchSnapshot()
  })
})

describe('createHistoryStore', () => {
  const mockActionsClient = {
    observable: {
      action: vi.fn(),
    },
  }

  const mockClient = {
    config: () => ({dataset: 'test-dataset'}),
    request: vi.fn(),
    observable: {
      createOrReplace: vi.fn(),
      fetch: vi.fn(),
    },
  } as unknown as SanityClient

  beforeEach(async () => {
    vi.mocked(mockClient.request).mockClear()
    vi.mocked(mockClient.observable.createOrReplace).mockClear()
    vi.mocked(mockClient.observable.fetch).mockClear()
    vi.mocked(mockActionsClient.observable.action).mockClear()

    // Reset modules to clear the document revision cache
    vi.resetModules()

    const {actionsApiClient} = await import('../document/document-pair/utils/actionsApiClient')
    vi.mocked(actionsApiClient).mockReturnValue(mockActionsClient as any)
  })

  describe('getDocumentAtRevision with lastRevision', () => {
    test('constructs correct URL for lastRevision', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await historyStore.getDocumentAtRevision('test-doc', 'lastRevision')

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/data/history/test-dataset/documents/test-doc,drafts.test-doc?lastRevision=true',
        tag: 'history-revision',
      })
    })

    test('constructs correct URL for specific revision', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await historyStore.getDocumentAtRevision('test-doc', 'rev-123')

      expect(mockClient.request).toHaveBeenCalledWith({
        url: '/data/history/test-dataset/documents/test-doc,drafts.test-doc?revision=rev-123',
        tag: 'history-revision',
      })
    })

    test('uses different URLs for lastRevision vs specific revisions', async () => {
      vi.mocked(mockClient.request).mockResolvedValue({documents: []})
      const {createHistoryStore} = await import('./createHistoryStore')
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
      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      const result = await historyStore.getDocumentAtRevision('test-doc', 'lastRevision')

      expect(result).toBeUndefined()
    })
  })

  describe('restoreRevision', () => {
    test('fetches document at revision and performs restore action', async () => {
      const mockRevisionDocument = {...testDocument, _id: 'source-doc'}
      vi.mocked(mockClient.request).mockResolvedValueOnce({documents: [mockRevisionDocument]}) // getDocumentAtRevision
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockClient.observable.createOrReplace).mockReturnValue(of({} as any))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      const result = await lastValueFrom(
        historyStore.restoreRevision('source-doc', 'target-doc', 'rev-123'),
      )

      expect(mockClient.request).toHaveBeenCalledTimes(1)
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        url: '/data/history/test-dataset/documents/source-doc,drafts.source-doc?revision=rev-123',
        tag: 'history-revision',
      })
      expect(mockClient.observable.createOrReplace).toHaveBeenCalledWith(
        {
          _id: 'target-doc',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _rev: 'rev-123',
          title: 'Test Document',
          description: 'Test description',
        },
        {visibility: 'async'},
      )
      expect(result).toBeUndefined()
    })

    test('handles lastRevision parameter correctly', async () => {
      const mockLastDocument = {...testDocument, _id: 'source-doc'}
      vi.mocked(mockClient.request).mockResolvedValueOnce({documents: [mockLastDocument]})
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockClient.observable.createOrReplace).mockReturnValue(of({} as any))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await lastValueFrom(historyStore.restoreRevision('source-doc', 'target-doc', 'lastRevision'))

      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        url: '/data/history/test-dataset/documents/source-doc,drafts.source-doc?lastRevision=true',
        tag: 'history-revision',
      })
    })

    test('throws error when document at revision is not found', async () => {
      vi.mocked(mockClient.request).mockResolvedValueOnce({documents: []})

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await expect(() =>
        lastValueFrom(historyStore.restoreRevision('missing-doc', 'target-doc', 'rev-123')),
      ).rejects.toThrow('Unable to find document with ID missing-doc at revision rev-123')
    })

    test('passes options to restore action when provided', async () => {
      const mockRevisionDocument = {...testDocument, _id: 'source-doc'}

      vi.mocked(mockClient.request).mockResolvedValueOnce({documents: [mockRevisionDocument]})
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockActionsClient.observable.action).mockReturnValue(of(undefined))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await lastValueFrom(
        historyStore.restoreRevision('source-doc', 'target-doc', 'rev-123', {
          fromDeleted: true,
          useServerDocumentActions: true,
        }),
      )

      expect(mockClient.request).toHaveBeenCalledTimes(1)
      expect(mockClient.request).toHaveBeenNthCalledWith(1, {
        url: '/data/history/test-dataset/documents/source-doc,drafts.source-doc?revision=rev-123',
        tag: 'history-revision',
      })
      expect(mockActionsClient.observable.action).toHaveBeenCalled()
    })
  })

  describe('restoreDocument', () => {
    test('performs restore action with provided document', async () => {
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockClient.observable.createOrReplace).mockReturnValue(of({} as any))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      const result = await lastValueFrom(historyStore.restoreDocument('target-doc', testDocument))

      expect(mockClient.observable.createOrReplace).toHaveBeenCalledTimes(1)
      expect(mockClient.observable.createOrReplace).toHaveBeenCalledWith(
        {
          _id: 'target-doc',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _rev: 'rev-123',
          title: 'Test Document',
          description: 'Test description',
        },
        {visibility: 'async'},
      )
      expect(result).toBeUndefined()
    })

    test('uses server document actions when specified in options', async () => {
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockActionsClient.observable.action).mockReturnValue(of(undefined))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await lastValueFrom(
        historyStore.restoreDocument('target-doc', testDocument, {
          useServerDocumentActions: true,
          fromDeleted: false,
        }),
      )

      expect(mockActionsClient.observable.action).toHaveBeenCalled()
      // Client.request should not be called directly for server actions in this flow
      expect(mockClient.request).not.toHaveBeenCalled()
    })

    test('handles fromDeleted option correctly', async () => {
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockActionsClient.observable.action).mockReturnValue(of(undefined))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await lastValueFrom(
        historyStore.restoreDocument('target-doc', testDocument, {
          useServerDocumentActions: true,
          fromDeleted: true,
        }),
      )

      expect(mockActionsClient.observable.action).toHaveBeenCalled()
      // Should call action with create first, then replace for fromDeleted
      const calls = vi.mocked(mockActionsClient.observable.action).mock.calls
      expect(calls.length).toBeGreaterThan(0)
    })

    test('correctly updates document ID for target', async () => {
      const sourceDocument = {...testDocument, _id: 'original-id'}
      vi.mocked(mockClient.observable.fetch).mockReturnValue(of({ms: 0, result: {}}))
      vi.mocked(mockClient.observable.createOrReplace).mockReturnValue(of({} as any))

      const {createHistoryStore} = await import('./createHistoryStore')
      const historyStore = createHistoryStore({client: mockClient})

      await lastValueFrom(historyStore.restoreDocument('new-target-id', sourceDocument))

      expect(mockClient.observable.createOrReplace).toHaveBeenCalledWith(
        {
          _id: 'new-target-id',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _rev: 'rev-123',
          title: 'Test Document',
          description: 'Test description',
        },
        {visibility: 'async'},
      )
    })
  })
})
