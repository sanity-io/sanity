import {type ReleaseDocument} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../../test/mocks/mockSanityClient'
import {
  getPublishedArchivedReleaseDocumentsObservable,
  resetPublishedArchivedReleaseDocumentsCacheForTests,
} from '../getPublishedArchivedReleaseDocumentsObservable'

const HISTORY_URL = '/data/history/mock-data-set/documents/'

function createRelease(
  releaseId: string,
  documentIds: string[],
  rev = 'rev1',
): ReleaseDocument & {_rev: string} {
  return {
    _id: `_.releases.${releaseId}`,
    _type: 'system.release',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: rev,
    name: releaseId,
    state: 'published',
    metadata: {title: 'Test release', releaseType: 'asap'},
    finalDocumentStates: documentIds.map((id) => ({id: `versions.${releaseId}.${id}`})),
  }
}

function createDocument(id: string) {
  return {_id: id, _type: 'article', _rev: `rev-${id}`, _createdAt: '', _updatedAt: ''}
}

function setup(options: {documentIds?: string[]; failFirstRequestWith?: number} = {}) {
  const requestedIds: string[][] = []
  const client = createMockSanityClientAsClient({
    requests: {'*': {documents: (options.documentIds ?? []).map(createDocument)}},
    requestCallback: ({url}) => {
      requestedIds.push(url.slice(HISTORY_URL.length).split('?')[0].split(','))
      return requestedIds.length === 1 && options.failFirstRequestWith
        ? {statusCode: options.failFirstRequestWith, data: 'Rate limited'}
        : undefined
    },
  })
  return {getClient: () => client, requestedIds}
}

/** A client whose history answers with a revision of `versions.rShared.doc1` named after the dataset */
function clientForDataset(dataset: string) {
  return createMockSanityClientAsClient(
    {requests: {'*': {documents: [{...createDocument('versions.rShared.doc1'), _rev: dataset}]}}},
    {dataset},
  )
}

function documentIdsOf(result: {results: {document: {_id: string}}[]}) {
  return result.results.map(({document}) => document._id)
}

describe('getPublishedArchivedReleaseDocumentsObservable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetPublishedArchivedReleaseDocumentsCacheForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty results when the release has no final document states', async () => {
    const {getClient, requestedIds} = setup()

    const result = await firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release: createRelease('r0', [])}),
    )

    expect(result).toEqual({loading: false, results: [], error: null})
    expect(requestedIds).toEqual([])
  })

  it('reads the documents of releases that subscribe at the same time in one request', async () => {
    const {getClient, requestedIds} = setup({
      documentIds: ['versions.rA.doc1', 'versions.rB.doc1', 'versions.rC.doc1'],
    })

    const results = Promise.all(
      ['rA', 'rB', 'rC'].map((releaseId) =>
        firstValueFrom(
          getPublishedArchivedReleaseDocumentsObservable({
            getClient,
            release: createRelease(releaseId, ['doc1']),
          }),
        ),
      ),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds).toEqual([['versions.rA.doc1', 'versions.rB.doc1', 'versions.rC.doc1']])
    expect((await results).map(documentIdsOf)).toEqual([
      ['versions.rA.doc1'],
      ['versions.rB.doc1'],
      ['versions.rC.doc1'],
    ])
  })

  it('reads a release with more than 10 documents in requests of at most 10', async () => {
    const ids = Array.from({length: 12}, (_, index) => `doc${index}`)
    const versionIds = ids.map((id) => `versions.rLarge.${id}`)
    const {getClient, requestedIds} = setup({documentIds: versionIds})

    const result = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease('rLarge', ids),
      }),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect(requestedIds).toEqual([versionIds.slice(0, 10), versionIds.slice(10)])
    expect(documentIdsOf(await result)).toEqual(versionIds)
  })

  it('returns the documents in release order, without those history has no revision of', async () => {
    const {getClient} = setup({documentIds: ['versions.rOrder.doc3', 'versions.rOrder.doc1']})

    const result = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease('rOrder', ['doc1', 'doc2', 'doc3']),
      }),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect(await result).toMatchObject({loading: false, error: null})
    expect(documentIdsOf(await result)).toEqual(['versions.rOrder.doc1', 'versions.rOrder.doc3'])
  })

  it('does not read the documents again for a later subscriber once they have loaded', async () => {
    const {getClient, requestedIds} = setup({documentIds: ['versions.rCached.doc1']})
    const release = createRelease('rCached', ['doc1'])

    const first = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(20)
    expect(documentIdsOf(await first)).toEqual(['versions.rCached.doc1'])

    const second = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release: {...release}}),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect(documentIdsOf(await second)).toEqual(['versions.rCached.doc1'])
    expect(requestedIds).toHaveLength(1)
  })

  it('reads the documents again for a later subscriber when the read failed', async () => {
    const {getClient, requestedIds} = setup({
      documentIds: ['versions.rRetry.doc1'],
      failFirstRequestWith: 429,
    })
    const release = createRelease('rRetry', ['doc1'])

    const first = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(20)
    expect(await first).toMatchObject({
      loading: false,
      results: [],
      error: expect.objectContaining({statusCode: 429}),
    })

    const second = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient, release}),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect(await second).toMatchObject({loading: false, error: null})
    expect(documentIdsOf(await second)).toEqual(['versions.rRetry.doc1'])
    expect(requestedIds).toHaveLength(2)
  })

  it('keeps the documents of the same release apart in each dataset', async () => {
    const production = clientForDataset('production')
    const staging = clientForDataset('staging')
    const release = createRelease('rShared', ['doc1'])

    const fromProduction = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient: () => production, release}),
    )
    const fromStaging = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({getClient: () => staging, release}),
    )
    await vi.advanceTimersByTimeAsync(20)

    expect((await fromProduction).results.map(({document}) => document._rev)).toEqual([
      'production',
    ])
    expect((await fromStaging).results.map(({document}) => document._rev)).toEqual(['staging'])
  })

  it('reads the documents again once the release has a new revision', async () => {
    const {getClient, requestedIds} = setup({documentIds: ['versions.rRev.doc1']})

    const first = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease('rRev', ['doc1'], 'rev1'),
      }),
    )
    await vi.advanceTimersByTimeAsync(20)
    await first

    const second = firstValueFrom(
      getPublishedArchivedReleaseDocumentsObservable({
        getClient,
        release: createRelease('rRev', ['doc1'], 'rev2'),
      }),
    )
    await vi.advanceTimersByTimeAsync(20)
    await second

    expect(requestedIds).toHaveLength(2)
  })
})
