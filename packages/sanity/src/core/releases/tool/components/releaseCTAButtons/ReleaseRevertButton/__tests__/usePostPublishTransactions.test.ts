import {type TransactionLogEventWithEffects} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useClient} from '../../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../../store/translog/getTransactionLogs'
import {type DocumentInRelease} from '../../../../detail/useBundleDocuments'
import {usePostPublishTransactions} from '../usePostPublishTransactions'

vi.mock('../../../../../../hooks/useClient', () => ({
  useClient: vi.fn(),
}))

vi.mock('../../../../../../store/translog/getTransactionLogs', () => ({
  getTransactionsLogs: vi.fn(),
}))

const processMicroTasks = () =>
  act(async () => {
    await Promise.resolve()
  })

describe('usePostPublishTransactions', () => {
  const mockDocuments = [
    {document: {_id: 'doc1', _rev: 'rev1'}},
    {document: {_id: 'doc2', _rev: 'rev2'}},
  ] as DocumentInRelease[]

  const mockClient = {getUrl: vi.fn(), config: vi.fn()}

  const mockUseClient = useClient as Mock
  const mockGetTransactionsLogs = getTransactionsLogs as Mock<typeof getTransactionsLogs>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseClient.mockReturnValue(mockClient)
  })

  const mockTransactionLogs = [
    {
      id: 'trans1',
      author: 'author1',
      documentIDs: ['doc1'],
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: 'trans2',
      author: 'author1',
      documentIDs: ['doc1'],
      timestamp: '2024-01-01T01:00:00Z',
    },
  ] as TransactionLogEventWithEffects[]

  it('should return null initially', () => {
    mockGetTransactionsLogs.mockResolvedValue(undefined)

    const {result} = renderHook(() => usePostPublishTransactions(mockDocuments))

    expect(result.current).toBeNull()
  })

  it('should return false when no documents provided', async () => {
    const {result} = renderHook(() => usePostPublishTransactions([]))

    expect(result.current).toBe(false)
  })

  it('should call getTransactionsLogs with the correct params', async () => {
    mockGetTransactionsLogs.mockResolvedValue(mockTransactionLogs)

    const {result} = renderHook(() => usePostPublishTransactions(mockDocuments))

    await processMicroTasks()

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(1)
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(mockClient, ['doc1', 'doc2'], {
      fromTransaction: 'rev1',
      limit: 2,
    })
    expect(result.current).toBe(true)
  })

  it('should return true if there are post-publish transactions', async () => {
    mockGetTransactionsLogs.mockResolvedValue(mockTransactionLogs)

    const {result} = renderHook(() => usePostPublishTransactions(mockDocuments))

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false if there are no post-publish transactions', async () => {
    mockGetTransactionsLogs.mockResolvedValue([
      {
        id: 'trans1',
        author: 'author1',
        documentIDs: ['doc1'],
        effects: {},
        timestamp: '2024-01-01T00:00:00Z',
      },
    ])

    const {result} = renderHook(() => usePostPublishTransactions(mockDocuments))

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return null when getTransactionsLogs throws an error', async () => {
    mockGetTransactionsLogs.mockRejectedValue(new Error('Failed to fetch transaction logs'))

    const {result} = renderHook(() => usePostPublishTransactions(mockDocuments))

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })
})
