import {type SanityDocument} from '@sanity/types'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentRemoteMutationEvent} from '../document/buffered-doc/types'
import {type WithVersion} from '../document/document-pair/checkoutPair'
import {remoteSnapshots} from '../document/document-pair/remoteSnapshots'
import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  BASE_TIME,
  createDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
} from './__fixtures__/events.fixture'
import {
  createMockClient,
  createTranslogFetchStub,
  type RecordedRequest,
} from './__fixtures__/mockClient'
import {editTransaction, remoteMutationEvent} from './__fixtures__/transactions.fixture'
import {createEventsStore} from './createEventsStore'
import {clearDocumentRevisionCache} from './getDocumentAtRevision'
import {clearDocumentTransactionsCache} from './getDocumentTransactions'
import {
  type DocumentGroupEvent,
  type EventsStoreRevision,
  isPublishDocumentVersionEvent,
} from './types'

vi.mock('../document/document-pair/remoteSnapshots', () => ({
  remoteSnapshots: vi.fn(),
}))

const mockRemoteSnapshots = vi.mocked(remoteSnapshots)

/**
 * Integration tests: the full store (`createEventsStore`) with every internal module real —
 * `getInitialFetchEvents`, `getDocumentTransactions` (+ `getJsonStream`), `getEditEvents`,
 * `createEventsObservable`, `getExpandEvents`, `getDocumentChanges`. Only the network is stubbed
 * (events/history endpoints on the client, translog over `fetch`) plus the `remoteSnapshots`
 * listener machinery.
 *
 * Note: `getDocumentTransactions`/`getDocumentAtRevision` keep module-level caches (keyed by
 * project, dataset and document id); they are cleared before each test.
 */

/** Serves the events API, one entry of `pages` per call (last page repeats). */
function eventsApi(
  documentId: string,
  pages: {events: DocumentGroupEvent[]; nextCursor?: string}[],
) {
  let call = 0
  return (request: RecordedRequest) => {
    if (!request.url.includes('/events/documents/')) {
      throw new Error(`Unexpected request: ${request.url}`)
    }
    const page = pages[Math.min(call, pages.length - 1)]
    call += 1
    return {events: {[documentId]: page.events}, nextCursor: page.nextCursor ?? ''}
  }
}

/** Stubs the global fetch used by the translog: first matching route wins, default empty. */
function stubTranslog(routes: {match: string; entries: unknown[]}[] = []) {
  const stub = createTranslogFetchStub(
    (url) => routes.find((route) => url.includes(route.match))?.entries ?? [],
  )
  vi.stubGlobal('fetch', stub.fetch)
  return stub
}

function setupStore({
  documentId,
  pages,
  isLiveEdit = false,
}: {
  documentId: string
  pages: {events: DocumentGroupEvent[]; nextCursor?: string}[]
  isLiveEdit?: boolean
}) {
  const {client, requests} = createMockClient({respond: eventsApi(documentId, pages)})
  const store = createEventsStore({client, documentId, documentType: 'author', isLiveEdit})
  const {values, subscription} = collectEmissions(store.eventsObservable$)
  return {store, client, requests, values, subscription}
}

function liveMutation(
  documentId: string,
  transactionId: string,
  timestamp: string,
): WithVersion<DocumentRemoteMutationEvent> {
  return remoteMutationEvent({
    version: 'published',
    transactionId,
    timestamp: new Date(timestamp),
    head: {
      _id: documentId,
      _type: 'author',
      _createdAt: BASE_TIME,
      _updatedAt: timestamp,
      _rev: transactionId,
    },
  })
}

const revision = (revisionId: string, document: SanityDocument): EventsStoreRevision => ({
  revisionId,
  loading: false,
  document,
})

describe('createEventsStore (integration)', () => {
  let snapshots$: Subject<WithVersion<DocumentRemoteMutationEvent>>

  beforeEach(() => {
    snapshots$ = new Subject()
    mockRemoteSnapshots.mockReset()
    mockRemoteSnapshots.mockReturnValue(snapshots$ as never)
    clearDocumentTransactionsCache()
    clearDocumentRevisionCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('draft: merges API events with edit events synthesized from the translog, parented for the UI', async () => {
    const draftId = 'drafts.int-draft'
    const apiPublish = publishDocumentVersionEvent({
      documentId: 'int-draft',
      versionId: draftId,
      versionRevisionId: 'tx-edit-2',
      revisionId: 'tx-publish',
      timestamp: minutesAfterBase(20),
    })
    const apiCreate = createDocumentVersionEvent({
      documentId: 'int-draft',
      versionId: draftId,
      versionRevisionId: 'tx-create',
    })
    // One edit after the publish, served by the (real) translog pipeline.
    const translog = stubTranslog([
      {
        match: 'fromTransaction=tx-edit-2',
        entries: [
          editTransaction({id: 'tx-edit-3', documentId: draftId, timestamp: minutesAfterBase(30)}),
        ],
      },
    ])

    const {values, subscription} = setupStore({
      documentId: draftId,
      pages: [{events: [apiPublish, apiCreate]}],
    })
    await vi.waitFor(() => {
      expect(values.at(-1)?.loading).toBe(false)
      expect(values.at(-1)?.events).toHaveLength(3)
    })
    subscription.unsubscribe()

    // Transactions are fetched from the newest revision-bearing event (the publish) onwards.
    expect(translog.calls[0]).toContain('fromTransaction=tx-edit-2')

    const [edit, publish, create] = values.at(-1)!.events
    expect(edit).toMatchObject({
      type: 'editDocumentVersion',
      id: 'tx-edit-3',
      documentVariantType: 'draft',
    })
    // addParentToEvents: the publish points at the draft id and owns the creation event.
    expect(publish).toMatchObject({
      type: 'publishDocumentVersion',
      id: 'tx-edit-2',
      documentId: draftId,
      documentVariantType: 'draft',
      creationEvent: expect.objectContaining({type: 'createDocumentVersion'}),
    })
    expect(create).toMatchObject({
      type: 'createDocumentVersion',
      id: 'tx-create',
      parentId: 'tx-edit-2',
      documentVariantType: 'draft',
    })
  })

  it('version: synthesizes edits from the creation event and re-points publish events at the version id', async () => {
    const versionId = 'versions.rInt.int-version'
    const apiCreate = createDocumentVersionEvent({
      documentId: 'int-version',
      versionId,
      versionRevisionId: 'tx-create-v',
      documentVariantType: 'version',
    })
    const apiPublish = publishDocumentVersionEvent({
      documentId: 'int-version',
      versionId,
      versionRevisionId: 'tx-pub-v',
      revisionId: 'tx-publish-v',
      timestamp: minutesAfterBase(20),
    })
    const translog = stubTranslog([
      {
        match: 'fromTransaction=tx-create-v',
        entries: [
          editTransaction({id: 'tx-edit-v', documentId: versionId, timestamp: minutesAfterBase(5)}),
        ],
      },
    ])

    const {values, subscription} = setupStore({
      documentId: versionId,
      pages: [{events: [apiPublish, apiCreate]}],
    })
    await vi.waitFor(() => {
      expect(values.at(-1)?.loading).toBe(false)
      expect(values.at(-1)?.events).toHaveLength(3)
    })
    subscription.unsubscribe()

    // For versions the baseline is the creation event, not the newest revision-bearing event.
    expect(translog.calls[0]).toContain('fromTransaction=tx-create-v')

    const [publish, edit, create] = values.at(-1)!.events
    // updateVersionEvents re-points the publish at the version document being viewed.
    expect(publish).toMatchObject({
      type: 'publishDocumentVersion',
      documentId: versionId,
      documentVariantType: 'version',
    })
    // Synthesized edits do not populate releaseId: variant ids use an opaque scope hash,
    // not a release id (see getEditEvents).
    expect(edit).toMatchObject({
      type: 'editDocumentVersion',
      id: 'tx-edit-v',
      documentVariantType: 'version',
    })
    expect(edit).not.toHaveProperty('releaseId')
    expect(create).toMatchObject({type: 'createDocumentVersion', documentVariantType: 'version'})
  })

  it('published: passes events through without edit synthesis, and a remote publish mutation triggers a reload', async () => {
    const documentId = 'int-published'
    const apiPublish = publishDocumentVersionEvent({
      documentId,
      versionId: `drafts.${documentId}`,
      versionRevisionId: 'tx-before-pub',
      revisionId: 'tx-pub-p',
    })
    const translog = stubTranslog()

    const {store, requests, values, subscription} = setupStore({
      documentId,
      pages: [{events: [apiPublish]}],
    })
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))

    // No edit synthesis for the published variant: the translog is never hit.
    expect(translog.calls).toHaveLength(0)
    expect(values.at(-1)?.events).toEqual([
      expect.objectContaining({
        type: 'publishDocumentVersion',
        id: 'tx-pub-p',
        documentVariantType: 'published',
      }),
    ])
    // The store no longer resolves release metadata: the UI does that from releaseId.
    expect(values.at(-1)?.events[0]).not.toHaveProperty('release')

    // A remote mutation on the published document is a lifecycle change: refetch (reload, limit 10).
    const listener = store.remoteTransactionsListener()
    snapshots$.next(liveMutation(documentId, 'tx-remote-pub', minutesAfterBase(30)))
    await vi.waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1].url).toContain('limit=10')
    // The reload response merges via removeDupes: still a single publish event.
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    expect(values.at(-1)?.events).toHaveLength(1)

    listener.unsubscribe()
    subscription.unsubscribe()
  })

  it('liveEdit: modified remote mutations become updateLiveDocument events without refetching', async () => {
    const documentId = 'int-live'
    stubTranslog()

    const {store, requests, values, subscription} = setupStore({
      documentId,
      pages: [{events: []}],
      isLiveEdit: true,
    })
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))

    const listener = store.remoteTransactionsListener()
    snapshots$.next(liveMutation(documentId, 'tx-live-1', minutesAfterBase(0)))
    await vi.waitFor(() =>
      expect(values.at(-1)?.events).toEqual([
        expect.objectContaining({
          type: 'updateLiveDocument',
          id: 'tx-live-1',
          documentVariantType: 'published',
        }),
      ]),
    )

    // A second in-window mutation replaces the event (merge window), instead of refetching.
    snapshots$.next(liveMutation(documentId, 'tx-live-2', minutesAfterBase(1)))
    await vi.waitFor(() =>
      expect(values.at(-1)?.events).toEqual([
        expect.objectContaining({type: 'updateLiveDocument', id: 'tx-live-2'}),
      ]),
    )
    // No events-API refetch happened for either mutation.
    expect(requests).toHaveLength(1)

    listener.unsubscribe()
    subscription.unsubscribe()
  })

  it('loadMoreEvents pages with the cursor and merges the batches', async () => {
    const documentId = 'int-loadmore'
    const newest = publishDocumentVersionEvent({
      documentId,
      versionId: `drafts.${documentId}`,
      revisionId: 'tx-pub-1',
      timestamp: minutesAfterBase(20),
    })
    const oldest = publishDocumentVersionEvent({
      documentId,
      versionId: `drafts.${documentId}`,
      revisionId: 'tx-pub-2',
      timestamp: minutesAfterBase(10),
    })
    stubTranslog()

    const {store, requests, values, subscription} = setupStore({
      documentId,
      pages: [
        {events: [newest], nextCursor: 'cursor-1'},
        {events: [oldest], nextCursor: ''},
      ],
    })
    await vi.waitFor(() => expect(values.at(-1)?.nextCursor).toBe('cursor-1'))

    store.loadMoreEvents()
    await vi.waitFor(() => expect(values.at(-1)?.events).toHaveLength(2))
    expect(requests[1].url).toContain('nextCursor=cursor-1')
    expect(values.at(-1)?.events.map((event) => event.id)).toEqual(['tx-pub-1', 'tx-pub-2'])

    subscription.unsubscribe()
  })

  it('getDocumentChanges computes an annotated diff from the (real) translog', async () => {
    const documentId = 'drafts.int-changes'
    const sinceDoc: SanityDocument = {
      _id: documentId,
      _type: 'author',
      _rev: 'rev-since',
      _createdAt: BASE_TIME,
      _updatedAt: BASE_TIME,
      name: 'foo',
    }
    const toDoc: SanityDocument = {...sinceDoc, _rev: 'rev-to', name: 'bar'}
    const {_rev: _sinceRev, ...sinceContent} = sinceDoc
    const {_rev: _toRev, ...toContent} = toDoc
    stubTranslog([
      {
        match: 'toTransaction=rev-to',
        entries: [
          editTransaction({
            id: 'tx-changes',
            documentId,
            author: 'author-1',
            before: sinceContent,
            after: toContent,
          }),
        ],
      },
    ])

    const {store, values, subscription} = setupStore({documentId, pages: [{events: []}]})
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))

    const changes$ = store.getDocumentChanges(
      of(revision('rev-to', toDoc)),
      of(revision('rev-since', sinceDoc)),
    )
    const changes = collectEmissions(changes$)
    await vi.waitFor(() => {
      expect(changes.values.at(-1)?.loading).toBe(false)
      expect(changes.values.at(-1)?.diff).not.toBeNull()
    })
    changes.subscription.unsubscribe()
    subscription.unsubscribe()

    expect(changes.values.at(-1)).toMatchObject({
      error: null,
      diff: {fields: {name: {action: 'changed', annotation: {author: 'author-1'}}}},
    })
  })

  it('expandEvent fetches the transactions behind a publish and nests them under it', async () => {
    const draftId = 'drafts.int-expand'
    const apiPublish = publishDocumentVersionEvent({
      documentId: 'int-expand',
      versionId: draftId,
      versionRevisionId: 'tx-pub-rev',
      revisionId: 'tx-publish-e',
      timestamp: minutesAfterBase(20),
    })
    const apiCreate = createDocumentVersionEvent({
      documentId: 'int-expand',
      versionId: draftId,
      versionRevisionId: 'tx-create-e',
    })
    stubTranslog([
      {
        match: 'toTransaction=tx-pub-rev',
        entries: [
          editTransaction({id: 'tx-mid', documentId: draftId, timestamp: minutesAfterBase(10)}),
        ],
      },
    ])

    const {store, values, subscription} = setupStore({
      documentId: draftId,
      pages: [{events: [apiPublish, apiCreate]}],
    })
    await vi.waitFor(() => {
      expect(values.at(-1)?.loading).toBe(false)
      expect(values.at(-1)?.events).toHaveLength(2)
    })

    // Expand the publish event as emitted by the store (it carries the creationEvent).
    const publish = values.at(-1)!.events.find(isPublishDocumentVersionEvent)!
    await store.handleExpandEvent(publish)

    await vi.waitFor(() => expect(values.at(-1)?.events).toHaveLength(3))
    subscription.unsubscribe()

    expect(values.at(-1)?.events.map((event) => event.type)).toEqual([
      'publishDocumentVersion',
      'editDocumentVersion',
      'createDocumentVersion',
    ])
    expect(values.at(-1)?.events[1]).toMatchObject({id: 'tx-mid', parentId: publish.id})
  })
})
