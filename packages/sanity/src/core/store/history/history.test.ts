import {type SanityClient} from '@sanity/client'
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
})
