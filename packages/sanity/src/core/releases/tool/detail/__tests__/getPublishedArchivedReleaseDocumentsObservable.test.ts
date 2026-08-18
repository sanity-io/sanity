import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getPublishedArchivedReleaseDocumentsObservable} from '../getPublishedArchivedReleaseDocumentsObservable'

function createRelease(documentCount: number, releaseId = 'release-1'): ReleaseDocument {
  return {
    _id: `_.releases.${releaseId}`,
    _type: 'system.release',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: 'rev1',
    name: 'Test release',
    state: 'published',
    metadata: {title: 'Test release', releaseType: 'asap'},
    finalDocumentStates: Array.from({length: documentCount}, (_, i) => ({
      id: `versions.${releaseId}.doc${i}`,
    })),
  } as ReleaseDocument
}

describe('getPublishedArchivedReleaseDocumentsObservable', () => {
  const mockRequest = vi.fn()
  const mockConfig = vi.fn().mockReturnValue({dataset: 'test-dataset'})
  const mockClient = {
    config: mockConfig,
    observable: {
      request: mockRequest,
    },
  } as unknown as SanityClient

  const getClient = vi.fn().mockReturnValue(mockClient)

  beforeEach(() => {
    vi.clearAllMocks()
    getClient.mockReturnValue(mockClient)
    mockConfig.mockReturnValue({dataset: 'test-dataset'})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty results when the release has no final document states', async () => {
    const release = createRelease(0)

    const result = await firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    expect(result).toEqual({loading: false, results: [], error: null})
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('fetches a single batch immediately when there are at most 10 documents', async () => {
    const release = createRelease(3)
    mockRequest.mockReturnValue(
      of({
        documents: [
          {_id: 'versions.release-1.doc0', _type: 'doc', _rev: 'r0'},
          {_id: 'versions.release-1.doc1', _type: 'doc', _rev: 'r1'},
          {_id: 'versions.release-1.doc2', _type: 'doc', _rev: 'r2'},
        ],
      }),
    )

    const result = await firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest).toHaveBeenCalledWith({
      url: '/data/history/test-dataset/documents/versions.release-1.doc0,versions.release-1.doc1,versions.release-1.doc2?lastRevision=true',
    })
    expect(result.loading).toBe(false)
    expect(result.error).toBeNull()
    expect(result.results).toHaveLength(3)
  })

  it('waits 100ms before requesting each subsequent history batch', async () => {
    vi.useFakeTimers()

    const release = createRelease(12, 'release-throttle')
    const firstBatch$ = new Subject<{documents: {_id: string; _type: string; _rev: string}[]}>()
    const secondBatch$ = new Subject<{documents: {_id: string; _type: string; _rev: string}[]}>()

    mockRequest.mockReturnValueOnce(firstBatch$).mockReturnValueOnce(secondBatch$)

    const resultPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    expect(mockRequest).toHaveBeenCalledTimes(1)

    firstBatch$.next({
      documents: Array.from({length: 10}, (_, i) => ({
        _id: `versions.release-throttle.doc${i}`,
        _type: 'doc',
        _rev: `r${i}`,
      })),
    })
    firstBatch$.complete()

    // Next batch must not start until the inter-batch delay elapses
    expect(mockRequest).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(99)
    expect(mockRequest).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(mockRequest).toHaveBeenCalledTimes(2)
    expect(mockRequest).toHaveBeenLastCalledWith({
      url: '/data/history/test-dataset/documents/versions.release-throttle.doc10,versions.release-throttle.doc11?lastRevision=true',
    })

    secondBatch$.next({
      documents: [
        {_id: 'versions.release-throttle.doc10', _type: 'doc', _rev: 'r10'},
        {_id: 'versions.release-throttle.doc11', _type: 'doc', _rev: 'r11'},
      ],
    })
    secondBatch$.complete()

    const result = await resultPromise

    expect(result).toMatchObject({
      loading: false,
      error: null,
    })
    expect(result.results).toHaveLength(12)
  })
})
