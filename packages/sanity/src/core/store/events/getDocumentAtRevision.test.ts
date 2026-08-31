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

  describe('includeGroupDocuments', () => {
    it('resolves a published revision while viewing the draft (group query)', async () => {
      // Regression: history entries on the drafts perspective can point at revisions of the
      // published document; querying only `drafts.<id>` returned no documents and the studio
      // showed the revision-not-found banner (issue #14346).
      const publishedDoc = document('doc-group', 'rev-published')
      const {client, requests} = createMockClient({respond: () => ({documents: [publishedDoc]})})

      const emissions = await firstValueFrom(
        getDocumentAtRevision({
          client,
          documentId: 'drafts.doc-group',
          revisionId: 'rev-published',
          includeGroupDocuments: true,
        }).pipe(toArray()),
      )

      expect(requests).toEqual([
        {
          url: '/data/history/test-dataset/documents/doc-group,drafts.doc-group?revision=rev-published',
          tag: 'get-document-revision',
        },
      ])
      expect(emissions.at(-1)).toEqual({
        document: publishedDoc,
        loading: false,
        revisionId: 'rev-published',
      })
    })

    it('prefers the requested document when several group documents share the revision', async () => {
      const publishedDoc = document('doc-preferred', 'rev-shared')
      const draftDoc = document('drafts.doc-preferred', 'rev-shared')
      const {client} = createMockClient({respond: () => ({documents: [publishedDoc, draftDoc]})})

      const emissions = await firstValueFrom(
        getDocumentAtRevision({
          client,
          documentId: 'drafts.doc-preferred',
          revisionId: 'rev-shared',
          includeGroupDocuments: true,
        }).pipe(toArray()),
      )

      expect(emissions.at(-1)).toEqual({
        document: draftDoc,
        loading: false,
        revisionId: 'rev-shared',
      })
    })

    it('ignores group documents returned at a different revision', async () => {
      // The history API returns each queried document's state as of the requested transaction,
      // so a group member untouched by that transaction comes back with an older `_rev`.
      const olderPublishedDoc = document('doc-stale', 'rev-older')
      const {client} = createMockClient({respond: () => ({documents: [olderPublishedDoc]})})

      const emissions = await firstValueFrom(
        getDocumentAtRevision({
          client,
          documentId: 'drafts.doc-stale',
          revisionId: 'rev-requested',
          includeGroupDocuments: true,
        }).pipe(toArray()),
      )

      expect(emissions.at(-1)).toEqual({document: undefined, loading: false, revisionId: undefined})
    })

    it('queries published, draft and version ids for a version document', async () => {
      const versionId = 'versions.release-a.doc-versioned'
      const versionDoc = document(versionId, 'rev-version')
      const {client, requests} = createMockClient({respond: () => ({documents: [versionDoc]})})

      const emissions = await firstValueFrom(
        getDocumentAtRevision({
          client,
          documentId: versionId,
          revisionId: 'rev-version',
          includeGroupDocuments: true,
        }).pipe(toArray()),
      )

      expect(requests[0].url).toBe(
        `/data/history/test-dataset/documents/doc-versioned,drafts.doc-versioned,${versionId}?revision=rev-version`,
      )
      expect(emissions.at(-1)).toEqual({
        document: versionDoc,
        loading: false,
        revisionId: 'rev-version',
      })
    })

    it('picks the requested document when fetching the group by time', async () => {
      const publishedDoc = document('doc-group-time', 'rev-pub')
      const draftDoc = document('drafts.doc-group-time', 'rev-draft')
      const {client} = createMockClient({respond: () => ({documents: [publishedDoc, draftDoc]})})

      const emissions = await firstValueFrom(
        getDocumentAtRevision({
          client,
          documentId: 'drafts.doc-group-time',
          time: '2024-01-01T00:00:00Z',
          includeGroupDocuments: true,
        }).pipe(toArray()),
      )

      expect(emissions.at(-1)).toEqual({
        document: draftDoc,
        loading: false,
        revisionId: 'rev-draft',
      })
    })
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
