import {
  ClientError,
  createClient,
  type ObservableSanityClient,
  type ReleaseDocument,
} from '@sanity/client'
import {defer, finalize, firstValueFrom, map, type Observable, timer} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getPublishedArchivedReleaseDocumentsObservable} from '../getPublishedArchivedReleaseDocumentsObservable'

const RESPONSE_TIME_MS = 50

type HistoryRequest = Parameters<ObservableSanityClient['request']>[0]

function createRelease({
  releaseId,
  documentCount = 1,
  rev = 'rev1',
}: {
  releaseId: string
  documentCount?: number
  rev?: string
}): ReleaseDocument {
  return {
    _id: `_.releases.${releaseId}`,
    _type: 'system.release',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: rev,
    name: releaseId,
    state: 'published',
    metadata: {title: releaseId, releaseType: 'asap'},
    finalDocumentStates: Array.from({length: documentCount}, (_unused, documentIndex) => ({
      id: `versions.${releaseId}.doc${documentIndex}`,
    })),
  } as ReleaseDocument
}

function getRequestedIds(request: HistoryRequest): string[] {
  return String(request.url).split('/documents/')[1].split('?')[0].split(',')
}

function createRateLimitError(): ClientError {
  return new ClientError({
    statusCode: 429,
    headers: {'retry-after': '10'},
    body: {error: 'Too Many Requests', message: 'Rate limit exceeded'},
    url: '/data/history/test-dataset/documents',
    method: 'GET',
  })
}

function createHistoryResponse(request: HistoryRequest) {
  return {
    documents: getRequestedIds(request).map((id) => ({_id: id, _type: 'doc', _rev: 'r'})),
  }
}

function createHistoryClient(
  respond: (request: HistoryRequest) => Observable<unknown> = (request) =>
    timer(RESPONSE_TIME_MS).pipe(map(() => createHistoryResponse(request))),
) {
  const requests: HistoryRequest[] = []
  const inFlight = {current: 0, max: 0}

  const client = createClient({
    projectId: 'test-project',
    dataset: 'test-dataset',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  const request = vi
    .spyOn(client.observable, 'request')
    .mockImplementation((historyRequest: HistoryRequest) =>
      defer(() => {
        requests.push(historyRequest)
        inFlight.current += 1
        inFlight.max = Math.max(inFlight.max, inFlight.current)
        return respond(historyRequest).pipe(
          finalize(() => {
            inFlight.current -= 1
          }),
        )
      }),
    )

  return {getClient: () => client, request, requests, inFlight}
}

describe('getPublishedArchivedReleaseDocumentsObservable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty results when the release has no final document states', async () => {
    const {getClient, request} = createHistoryClient()
    const release = createRelease({releaseId: 'empty', documentCount: 0})

    const result = await firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    expect(result).toEqual({loading: false, results: [], error: null})
    expect(request).not.toHaveBeenCalled()
  })

  it('merges the ids of releases shown at once into sequential requests of at most 10 ids', async () => {
    const {getClient, requests, inFlight} = createHistoryClient()
    const releases = Array.from({length: 25}, (_unused, releaseIndex) =>
      createRelease({releaseId: `merged${releaseIndex}`}),
    )

    const resultPromises = releases.map((release) =>
      firstValueFrom(getPublishedArchivedReleaseDocumentsObservable({getClient, release})),
    )
    await vi.runAllTimersAsync()
    const results = await Promise.all(resultPromises)

    expect(requests).toHaveLength(3)
    expect(requests.map((historyRequest) => getRequestedIds(historyRequest).length)).toEqual([
      10, 10, 5,
    ])
    expect(inFlight.max).toBe(1)
    expect(results.map((result) => result.results.map(({document}) => document._id))).toEqual(
      releases.map((release) => release.finalDocumentStates?.map(({id}) => id)),
    )
  })

  it('spaces the requests for a release with more than 10 documents', async () => {
    const {getClient, requests} = createHistoryClient()
    const release = createRelease({releaseId: 'large', documentCount: 12})

    const resultPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    await vi.advanceTimersByTimeAsync(RESPONSE_TIME_MS + 99)
    expect(requests).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(requests).toHaveLength(2)
    expect(getRequestedIds(requests[1])).toEqual(['versions.large.doc10', 'versions.large.doc11'])

    await vi.runAllTimersAsync()
    const result = await resultPromise
    expect(result.error).toBeNull()
    expect(result.results).toHaveLength(12)
  })

  it('reuses a finished result when the release is subscribed to again', async () => {
    const {getClient, requests} = createHistoryClient()
    const release = createRelease({releaseId: 'remount'})

    const firstPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.runAllTimersAsync()
    const firstResult = await firstPromise

    const secondPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.runAllTimersAsync()
    const secondResult = await secondPromise

    expect(requests).toHaveLength(1)
    expect(secondResult).toBe(firstResult)
  })

  it('fetches again after the release is unarchived and archived again', async () => {
    const {getClient, requests} = createHistoryClient()

    const firstPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease({releaseId: 'rearchived', rev: 'rev1'}),
      }),
    )
    await vi.runAllTimersAsync()
    await firstPromise

    const secondPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease({releaseId: 'rearchived', rev: 'rev2'}),
      }),
    )
    await vi.runAllTimersAsync()
    await secondPromise

    expect(requests).toHaveLength(2)
  })

  it('returns each document once when a new revision loads while the previous one is pending', async () => {
    const {getClient} = createHistoryClient()

    const firstPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease({releaseId: 'overlapping', rev: 'rev1'}),
      }),
    )
    await vi.advanceTimersByTimeAsync(1)
    const secondPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease({releaseId: 'overlapping', rev: 'rev2'}),
      }),
    )
    await vi.runAllTimersAsync()
    const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise])

    expect(firstResult.results.map(({document}) => document._id)).toEqual([
      'versions.overlapping.doc0',
    ])
    expect(secondResult.results.map(({document}) => document._id)).toEqual([
      'versions.overlapping.doc0',
    ])
  })

  it('completes when a release lists the same document twice', async () => {
    const {getClient} = createHistoryClient()
    const release = createRelease({releaseId: 'repeated'})
    const repeatedRelease = {
      ...release,
      finalDocumentStates: [
        ...(release.finalDocumentStates ?? []),
        ...(release.finalDocumentStates ?? []),
      ],
    }

    const resultPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release: repeatedRelease}),
    )
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.results.map(({document}) => document._id)).toEqual(['versions.repeated.doc0'])
  })

  it('reports a failed request only to the releases it was fetching for', async () => {
    const {getClient, requests} = createHistoryClient((request) =>
      timer(RESPONSE_TIME_MS).pipe(
        map(() => {
          if (requests.length === 1) throw new Error('History unavailable')
          return createHistoryResponse(request)
        }),
      ),
    )
    const releases = Array.from({length: 15}, (_unused, releaseIndex) =>
      createRelease({releaseId: `partial${releaseIndex}`}),
    )

    const resultPromises = releases.map((release) =>
      firstValueFrom(getPublishedArchivedReleaseDocumentsObservable({getClient, release})),
    )
    await vi.runAllTimersAsync()
    const results = await Promise.all(resultPromises)

    expect(results.map((result) => result.error === null)).toEqual([
      ...Array.from({length: 10}, () => false),
      ...Array.from({length: 5}, () => true),
    ])
  })

  it('waits for Retry-After before retrying a rate limited request, without client retries', async () => {
    const responses = [
      timer(RESPONSE_TIME_MS).pipe(
        map(() => {
          throw createRateLimitError()
        }),
      ),
      timer(RESPONSE_TIME_MS).pipe(
        map(() => ({documents: [{_id: 'versions.limited.doc0', _type: 'doc', _rev: 'r'}]})),
      ),
    ]
    const {getClient, requests} = createHistoryClient(() => responses[requests.length - 1])
    const release = createRelease({releaseId: 'limited'})

    const resultPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )

    await vi.advanceTimersByTimeAsync(RESPONSE_TIME_MS + 9_999)
    expect(requests).toHaveLength(1)
    expect(requests[0].maxRetries).toBe(0)

    await vi.advanceTimersByTimeAsync(1)
    expect(requests).toHaveLength(2)

    await vi.runAllTimersAsync()
    const result = await resultPromise
    expect(result.error).toBeNull()
    expect(result.results.map(({document}) => document._id)).toEqual(['versions.limited.doc0'])
  })

  it('keeps a failed result for a while before fetching again', async () => {
    const {getClient, requests} = createHistoryClient(() =>
      timer(RESPONSE_TIME_MS).pipe(
        map(() => {
          throw new Error('History unavailable')
        }),
      ),
    )
    const release = createRelease({releaseId: 'failing'})

    const firstPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(RESPONSE_TIME_MS)
    const firstResult = await firstPromise
    expect(firstResult.error).toBeInstanceOf(Error)

    const cachedPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(RESPONSE_TIME_MS)
    expect(await cachedPromise).toBe(firstResult)
    expect(requests).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(30_000)
    const retriedPromise = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(RESPONSE_TIME_MS + 100)
    await retriedPromise
    expect(requests).toHaveLength(2)
  })
})
