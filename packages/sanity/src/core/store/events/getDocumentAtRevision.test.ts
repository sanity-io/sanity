import {type SanityDocument} from '@sanity/types'
import {firstValueFrom, toArray} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createMockClient} from './__fixtures__/mockClient'
import {getDocumentAtRevision} from './getDocumentAtRevision'
import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'

// The module keeps a cache keyed by `${documentId}@<revision|time>` that survives between tests,
// so every test uses its own document id.

const document = (id: string, rev = 'rev-1'): SanityDocument => ({
  _id: id,
  _type: 'author',
  _rev: rev,
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
})

describe('getDocumentAtRevision', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits loading first, then the fetched document', async () => {
    const doc = document('doc-loading')
    const {client, requests} = createMockClient({respond: () => ({documents: [doc]})})

    const emissions = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-loading', revisionId: 'rev-1'}).pipe(
        toArray(),
      ),
    )

    expect(emissions).toEqual([
      {document: null, loading: true, revisionId: 'rev-1'},
      {document: doc, loading: false, revisionId: 'rev-1'},
    ])
    expect(requests).toEqual([
      {
        url: '/data/history/test-dataset/documents/doc-loading?revision=rev-1',
        tag: 'get-document-revision',
      },
    ])
  })

  it('fetches by time when no revisionId is given', async () => {
    const doc = document('doc-time')
    const {client, requests} = createMockClient({respond: () => ({documents: [doc]})})

    const emissions = await firstValueFrom(
      getDocumentAtRevision({
        client,
        documentId: 'doc-time',
        time: '2024-01-01T00:00:00Z',
      }).pipe(toArray()),
    )

    expect(requests[0].url).toBe(
      `/data/history/test-dataset/documents/doc-time?time=${encodeURIComponent('2024-01-01T00:00:00Z')}`,
    )
    // When fetching by time the revisionId is only known after the fetch.
    expect(emissions.at(-1)).toEqual({document: doc, loading: false, revisionId: doc._rev})
  })

  it('shares one request between subscribers via the module cache', async () => {
    const doc = document('doc-shared')
    const {client, requests} = createMockClient({respond: () => ({documents: [doc]})})

    const first = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-shared', revisionId: 'rev-1'}).pipe(
        toArray(),
      ),
    )
    const second = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-shared', revisionId: 'rev-1'}).pipe(
        toArray(),
      ),
    )

    expect(requests).toHaveLength(1)
    expect(first.at(-1)).toEqual({document: doc, loading: false, revisionId: 'rev-1'})
    // Late subscribers replay only the settled value.
    expect(second).toEqual([{document: doc, loading: false, revisionId: 'rev-1'}])
  })

  it('short-circuits the synthetic history-cleared revision without a request', async () => {
    const {client, requests} = createMockClient()

    const emissions = await firstValueFrom(
      getDocumentAtRevision({
        client,
        documentId: 'doc-cleared',
        revisionId: HISTORY_CLEARED_EVENT_ID,
      }).pipe(toArray()),
    )

    expect(emissions).toEqual([
      {document: null, loading: false, revisionId: HISTORY_CLEARED_EVENT_ID},
    ])
    expect(requests).toHaveLength(0)
  })

  it('emits an undefined document when the revision no longer exists (history retention)', async () => {
    const {client} = createMockClient({respond: () => ({documents: []})})

    const emissions = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-missing', revisionId: 'rev-gone'}).pipe(
        toArray(),
      ),
    )

    expect(emissions.at(-1)).toEqual({document: undefined, loading: false, revisionId: undefined})
  })

  it('logs and emits null on errors — and caches the failure forever (known quirk)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const {client, requests} = createMockClient({
      respond: () => {
        throw new Error('request failed')
      },
    })

    const emissions = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-error', revisionId: 'rev-1'}).pipe(toArray()),
    )
    expect(emissions.at(-1)).toEqual({document: null, loading: false, revisionId: 'rev-1'})
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching document at revision',
      expect.any(Error),
    )

    // A new subscriber gets the cached error result; no retry happens.
    const retry = await firstValueFrom(
      getDocumentAtRevision({client, documentId: 'doc-error', revisionId: 'rev-1'}).pipe(toArray()),
    )
    expect(retry).toEqual([{document: null, loading: false, revisionId: 'rev-1'}])
    expect(requests).toHaveLength(1)
  })
})
