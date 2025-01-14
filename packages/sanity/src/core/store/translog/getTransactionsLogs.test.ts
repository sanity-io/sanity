import {type SanityClient} from '@sanity/client'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {getJsonStream} from '../_legacy/history/history/getJsonStream'
import {getTransactionsLogs} from './getTransactionsLogs'

vi.mock('../_legacy/history/history/getJsonStream', () => ({
  getJsonStream: vi.fn(),
}))

const getJsonStreamMock = getJsonStream as Mock

describe('getTransactionsLogs', () => {
  const mockClient = {
    config: vi.fn(() => ({
      dataset: 'mockDataset',
      token: 'mockToken',
    })),
    getUrl: vi.fn((path) => `https://mock.sanity.api${path}`),
  } as unknown as SanityClient

  const mockStream = {
    getReader: vi.fn(() => ({
      async read() {
        return {done: true}
      },
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch transaction logs with default parameters', async () => {
    getJsonStreamMock.mockResolvedValueOnce(mockStream)

    const documentId = 'doc1'
    const result = await getTransactionsLogs(mockClient, documentId, {})

    expect(mockClient.getUrl).toHaveBeenCalledWith(
      '/data/history/mockDataset/transactions/doc1?tag=sanity.studio.transactions-log&excludeContent=true&limit=50&includeIdentifiedDocumentsOnly=true',
    )
    expect(getJsonStream).toHaveBeenCalledWith(
      'https://mock.sanity.api/data/history/mockDataset/transactions/doc1?tag=sanity.studio.transactions-log&excludeContent=true&limit=50&includeIdentifiedDocumentsOnly=true',
      'mockToken',
    )
    expect(result).toEqual([])
  })

  it('should handle multiple document IDs', async () => {
    getJsonStreamMock.mockResolvedValueOnce(mockStream)

    const documentIds = ['doc1', 'doc2']
    await getTransactionsLogs(mockClient, documentIds, {})

    expect(mockClient.getUrl).toHaveBeenCalledWith(
      '/data/history/mockDataset/transactions/doc1,doc2?tag=sanity.studio.transactions-log&excludeContent=true&limit=50&includeIdentifiedDocumentsOnly=true',
    )
    expect(getJsonStream).toHaveBeenCalledWith(
      'https://mock.sanity.api/data/history/mockDataset/transactions/doc1,doc2?tag=sanity.studio.transactions-log&excludeContent=true&limit=50&includeIdentifiedDocumentsOnly=true',
      'mockToken',
    )
  })

  it('should override default parameters with user-provided params', async () => {
    getJsonStreamMock.mockResolvedValueOnce(mockStream)

    const documentId = 'doc1'
    await getTransactionsLogs(mockClient, documentId, {
      tag: 'sanity.studio.custom-tag',
      limit: 100,
      fromTransaction: 'tx1',
      toTransaction: 'tx3',
    })

    expect(mockClient.getUrl).toHaveBeenCalledWith(
      '/data/history/mockDataset/transactions/doc1?tag=sanity.studio.custom-tag&excludeContent=true&limit=100&includeIdentifiedDocumentsOnly=true&fromTransaction=tx1&toTransaction=tx3',
    )
  })

  it('should throw an error if the stream contains an error', async () => {
    const mockErrorStream = {
      getReader: vi.fn(() => ({
        async read() {
          return {done: false, value: {error: {description: 'Error occurred'}}}
        },
      })),
    }
    getJsonStreamMock.mockResolvedValueOnce(mockErrorStream)

    const documentId = 'doc1'

    await expect(getTransactionsLogs(mockClient, documentId, {})).rejects.toThrow('Error occurred')
  })

  it('should collect transactions from the stream', async () => {
    const mockDataStream = {
      getReader: vi.fn(() => {
        let callCount = 0
        return {
          async read() {
            if (callCount < 3) {
              callCount++
              return {done: false, value: {id: `txn${callCount}`}}
            }
            return {done: true}
          },
        }
      }),
    }
    getJsonStreamMock.mockResolvedValueOnce(mockDataStream)

    const documentId = 'doc1'
    const result = await getTransactionsLogs(mockClient as any, documentId, {})

    expect(result).toEqual([{id: 'txn1'}, {id: 'txn2'}, {id: 'txn3'}])
  })
})
