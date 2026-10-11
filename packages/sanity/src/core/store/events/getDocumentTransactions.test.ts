import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getTransactionsLogs} from '../translog/getTransactionsLogs'
import {createMockClient} from './__fixtures__/mockClient'
import {editTransaction, type TranslogEntry} from './__fixtures__/transactions.fixture'
import {clearDocumentTransactionsCache, getDocumentTransactions} from './getDocumentTransactions'

vi.mock('../translog/getTransactionsLogs', () => ({
  getTransactionsLogs: vi.fn(),
}))

const mockGetTransactionsLogs = vi.mocked(getTransactionsLogs)

describe('getDocumentTransactions', () => {
  beforeEach(() => {
    mockGetTransactionsLogs.mockReset()
    clearDocumentTransactionsCache()
  })

  it('fetches the range and filters out the fromTransaction entry', async () => {
    const {client} = createMockClient()
    mockGetTransactionsLogs.mockResolvedValueOnce([
      editTransaction({id: 'from-tx'}),
      editTransaction({id: 'tx-1'}),
      editTransaction({id: 'to-tx'}),
    ])

    const result = await getDocumentTransactions({
      documentId: 'doc-filter',
      client,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })

    expect(result.map((tx) => tx.id)).toEqual(['tx-1', 'to-tx'])
    expect(mockGetTransactionsLogs).toHaveBeenCalledWith(client, 'doc-filter', {
      tag: 'sanity.studio.documents.history',
      effectFormat: 'mendoza',
      excludeContent: true,
      includeIdentifiedDocumentsOnly: true,
      limit: 50,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })
  })

  it('does not filter the entry when fromTransaction equals toTransaction', async () => {
    const {client} = createMockClient()
    mockGetTransactionsLogs.mockResolvedValueOnce([editTransaction({id: 'same-tx'})])

    const result = await getDocumentTransactions({
      documentId: 'doc-same',
      client,
      fromTransaction: 'same-tx',
      toTransaction: 'same-tx',
    })

    expect(result.map((tx) => tx.id)).toEqual(['same-tx'])
  })

  it('paginates past the 50-entry limit, continuing from the last received id', async () => {
    const {client} = createMockClient()
    // First page: the `from` entry plus 49 more — a full page after filtering, so pagination kicks in.
    const firstPage: TranslogEntry[] = [
      editTransaction({id: 'from-tx'}),
      ...Array.from({length: 49}, (_, i) => editTransaction({id: `tx-${i + 1}`})),
    ]
    const secondPage: TranslogEntry[] = [
      editTransaction({id: 'tx-49'}),
      editTransaction({id: 'tx-50'}),
      editTransaction({id: 'to-tx'}),
    ]
    mockGetTransactionsLogs.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage)

    const result = await getDocumentTransactions({
      documentId: 'doc-paginate',
      client,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(2)
    expect(mockGetTransactionsLogs.mock.calls[1][2]).toMatchObject({
      fromTransaction: 'tx-49',
      toTransaction: 'to-tx',
    })
    expect(result).toHaveLength(49 + 2)
    expect(result.at(-1)?.id).toBe('to-tx')
  })

  it('stops paginating when the toTransaction is already in the page', async () => {
    const {client} = createMockClient()
    const fullPage: TranslogEntry[] = [
      editTransaction({id: 'from-tx'}),
      ...Array.from({length: 48}, (_, i) => editTransaction({id: `tx-${i + 1}`})),
      editTransaction({id: 'to-tx'}),
    ]
    mockGetTransactionsLogs.mockResolvedValueOnce(fullPage)

    const result = await getDocumentTransactions({
      documentId: 'doc-stop',
      client,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(49)
  })

  it('serves closed ranges from the cache on repeated calls', async () => {
    const {client} = createMockClient()
    mockGetTransactionsLogs.mockResolvedValueOnce([editTransaction({id: 'tx-1'})])

    const first = await getDocumentTransactions({
      documentId: 'doc-cache',
      client,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })
    const second = await getDocumentTransactions({
      documentId: 'doc-cache',
      client,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('never reads the cache for open ranges — they are written but refetched (known quirk)', async () => {
    const {client} = createMockClient()
    mockGetTransactionsLogs
      .mockResolvedValueOnce([editTransaction({id: 'tx-1'})])
      .mockResolvedValueOnce([editTransaction({id: 'tx-1'}), editTransaction({id: 'tx-2'})])

    await getDocumentTransactions({
      documentId: 'doc-open',
      client,
      fromTransaction: 'from-tx',
      toTransaction: undefined,
    })
    const second = await getDocumentTransactions({
      documentId: 'doc-open',
      client,
      fromTransaction: 'from-tx',
      toTransaction: undefined,
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(2)
    expect(second.map((tx) => tx.id)).toEqual(['tx-1', 'tx-2'])
  })

  it('caches per project/dataset: a client for a different dataset refetches', async () => {
    const {client: clientA} = createMockClient({projectId: 'project-a', dataset: 'dataset-a'})
    const {client: clientB} = createMockClient({projectId: 'project-b', dataset: 'dataset-b'})
    mockGetTransactionsLogs
      .mockResolvedValueOnce([editTransaction({id: 'tx-a'})])
      .mockResolvedValueOnce([editTransaction({id: 'tx-b'})])

    const first = await getDocumentTransactions({
      documentId: 'doc-workspace',
      client: clientA,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })
    const second = await getDocumentTransactions({
      documentId: 'doc-workspace',
      client: clientB,
      fromTransaction: 'from-tx',
      toTransaction: 'to-tx',
    })

    expect(mockGetTransactionsLogs).toHaveBeenCalledTimes(2)
    expect(first.map((tx) => tx.id)).toEqual(['tx-a'])
    expect(second.map((tx) => tx.id)).toEqual(['tx-b'])
  })
})
