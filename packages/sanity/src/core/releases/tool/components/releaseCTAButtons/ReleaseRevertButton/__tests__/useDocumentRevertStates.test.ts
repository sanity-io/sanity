import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useClient} from '../../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../../store/translog/getTransactionsLogs'
import {type DocumentInRelease} from '../../../../detail/useBundleDocuments'
import {useDocumentRevertStates} from '../useDocumentRevertStates'

vi.mock('../../../../../../hooks/useClient', () => ({
  useClient: vi.fn(),
}))

vi.mock('../../../../../../store/translog/getTransactionsLogs', () => ({
  getTransactionsLogs: vi.fn(),
}))

describe('useDocumentRevertStates', () => {
  const mockDocuments = [
    {document: {_id: 'versions.r1.doc1', _rev: 'rev1'}},
    {document: {_id: 'versions.r1.doc2', _rev: 'rev2'}},
  ] as DocumentInRelease[]

  /** @todo improve the useClient mock */
  const mockClient = {
    getUrl: vi.fn(),
    config: vi.fn().mockReturnValue({dataset: 'test-dataset'}),
    observable: {
      request: vi.fn(),
    },
  } as unknown as SanityClient & {
    observable: {
      request: Mock<SanityClient['observable']['request']>
    }
  }

  const mockUseClient = useClient as Mock<typeof useClient>
  const mockGetTransactionsLogs = getTransactionsLogs as Mock<typeof getTransactionsLogs>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseClient.mockReturnValue(mockClient)

    mockGetTransactionsLogs.mockResolvedValue([
      {id: 'trans0_doc1', documentIDs: ['doc1'], timestamp: new Date().toISOString()},
      {id: 'trans1_doc1', documentIDs: ['doc1'], timestamp: new Date().toISOString()},
      {id: 'trans0_doc2', documentIDs: ['doc2'], timestamp: new Date().toISOString()},
      {id: 'trans1_doc2', documentIDs: ['doc2'], timestamp: new Date().toISOString()},
    ] as TransactionLogEventWithEffects[])

    mockClient.observable.request.mockImplementation(({url}) => {
      if (url!.includes('doc1')) {
        return of({
          documents: [
            {
              _id: 'doc1',
              _rev: 'observable-rev-1',
              title: 'Reverted Document 1',
            },
          ],
        })
      }
      if (url!.includes('doc2')) {
        return of({
          documents: [
            {
              _id: 'doc2',
              _rev: 'observable-rev-2',
              title: 'Reverted Document 2',
            },
          ],
        })
      }
      return of({documents: []})
    })
  })

  it('should return a function', () => {
    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))
    expect(typeof result.current).toBe('function')
  })

  it('should fetch adjacent transactions and resolve to revert states', async () => {
    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))

    await waitFor(async () => {
      const resolvedResult = await result.current()
      expect(resolvedResult).toEqual([
        {
          _id: 'doc1',
          _rev: 'observable-rev-1',
          title: 'Reverted Document 1',
        },
        {
          _id: 'doc2',
          _rev: 'observable-rev-2',
          title: 'Reverted Document 2',
        },
      ])
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], {
      toTransaction: 'rev1',
      reverse: true,
    })

    expect(mockClient.observable.request).toHaveBeenNthCalledWith(1, {
      url: '/data/history/test-dataset/documents/doc1?revision=trans0_doc1',
    })
    expect(mockClient.observable.request).toHaveBeenNthCalledWith(2, {
      url: '/data/history/test-dataset/documents/doc2?revision=trans0_doc2',
    })
  })

  it('should handle missing revisions and mark for deletion', async () => {
    // Empty transactions array causes all documents to be marked for deletion
    mockGetTransactionsLogs.mockResolvedValue([])

    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))

    await waitFor(async () => {
      const resolvedResult = await result.current()
      expect(resolvedResult).toEqual([
        {
          _id: 'doc1',
          _rev: 'rev1',
          _system: {delete: true},
        },
        {
          _id: 'doc2',
          _rev: 'rev2',
          _system: {delete: true},
        },
      ])
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], {
      toTransaction: 'rev1',
      reverse: true,
    })
  })

  it('should return null if no transactions exist', async () => {
    mockGetTransactionsLogs.mockResolvedValue([])

    const {result} = renderHook(() => useDocumentRevertStates([]))

    await waitFor(async () => {
      const resolvedResult = await result.current()
      expect(resolvedResult).toBeNull()
    })

    expect(mockGetTransactionsLogs).not.toHaveBeenCalled()
    expect(mockClient.observable.request).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully and return undefined', async () => {
    mockGetTransactionsLogs.mockRejectedValue(new Error('Failed to fetch transactions'))

    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))

    await waitFor(async () => {
      const resolvedResult = await result.current()
      expect(resolvedResult).toBeUndefined()
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], {
      toTransaction: 'rev1',
      reverse: true,
    })

    expect(mockClient.observable.request).not.toHaveBeenCalled() // No API calls on failure
  })

  it('should handle a mix of existing and missing revisions', async () => {
    mockGetTransactionsLogs.mockResolvedValue([
      // Only doc1 has a transaction
      {
        id: 'trans0_doc1',
        effects: {},
        author: 'author',
        documentIDs: ['doc1'],
        timestamp: new Date().toISOString(),
      },
    ])

    mockClient.observable.request.mockImplementation(({url}) => {
      if (url!.includes('doc1')) {
        return of({
          documents: [
            {
              _id: 'doc1',
              _rev: 'observable-rev-1',
              title: 'Reverted Document 1',
            },
          ],
        })
      }
      return of({documents: []})
    })

    const {result} = renderHook(() => useDocumentRevertStates(mockDocuments))

    await waitFor(async () => {
      const resolvedResult = await result.current()
      expect(resolvedResult).toEqual([
        {
          _id: 'doc1',
          _rev: 'observable-rev-1',
          title: 'Reverted Document 1',
        },
        {
          _id: 'doc2',
          _rev: 'rev2',
          _system: {delete: true},
        },
      ])
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], {
      toTransaction: 'rev1',
      reverse: true,
    })
  })
})
