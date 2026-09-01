import {type SanityClient} from '@sanity/client'
import {
  type SanityDocument,
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
} from '@sanity/types'
import {BehaviorSubject, filter, firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {createDocumentVersionEvent, DRAFT_ID, minutesAfterBase} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {createTransaction, editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentChanges, MissingSinceDocumentError} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type EditDocumentVersionEvent,
  type EventsStoreRevision,
  type PublishDocumentVersionEvent,
} from './types'
import {type EventsObservableValue} from './useEventsStore'

vi.mock('./getDocumentTransactions', () => ({
  getDocumentTransactions: vi.fn(),
}))

const mockGetDocumentTransactions = vi.mocked(getDocumentTransactions)

const sinceDoc: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'author',
  _rev: 'rev-since',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  name: 'foo',
}
const toDoc: SanityDocument = {...sinceDoc, _rev: 'rev-to', name: 'bar'}

function eventsValue(events: EventsObservableValue['events']): EventsObservableValue {
  return {events, nextCursor: '', loading: false, error: null}
}

const noEvents = of(eventsValue([]))
const revision = (revisionId: string, document: SanityDocument | null): EventsStoreRevision => ({
  revisionId,
  loading: false,
  document,
})

const publishedDoc = {
  _createdAt: '2025-12-04T15:21:51Z',
  _id: 'doc-1',
  _rev: 'publish-revision-id',
  _type: 'author',
  _updatedAt: '2025-12-04T15:21:51Z',
  name: 'foo',
} satisfies SanityDocument

const staleDraftTx: TransactionLogEventWithEffects & TransactionLogEventWithMutations = {
  id: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
  timestamp: '2025-12-04T15:22:07.930920Z',
  author: 'p8xDvUMxC',
  documentIDs: ['drafts.doc-1'],
  mutations: [],
  effects: {
    'drafts.doc-1': {
      apply: [11, 3, 23, 0, 15, 22, '2:07', 23, 19, 20, 15, 17, 'foo bar', 'name'],
      revert: [10, 0, 14, '_updatedAt', 17, 'foo', 'name'],
    },
  },
}

const publishEvent: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish-event-id',
  timestamp: '2026-01-01T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  revisionId: 'publish-revision-id',
  versionId: 'drafts.doc-1',
  publishCause: 'document.publish',
}

const editEvent: EditDocumentVersionEvent = {
  type: 'editDocumentVersion',
  id: 'edit-event-id',
  timestamp: '2026-01-02T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'drafts.doc-1',
  contributors: ['author-1'],
  revisionId: 'edit-revision-id',
  transactions: [],
}

const discardVersionEvent: DeleteDocumentVersionEvent = {
  type: 'deleteDocumentVersion',
  id: 'discard-event-id',
  timestamp: '2026-01-03T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  versionId: 'drafts.doc-1',
  versionRevisionId: 'discard-version-revision-id',
}

const discardGroupEvent: DeleteDocumentGroupEvent = {
  type: 'deleteDocumentGroup',
  id: 'deleted-2026-01-03T00:00:00.000Z',
  timestamp: '2026-01-03T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
}

async function collectDiff(events: EventsObservableValue['events']) {
  return firstValueFrom(
    getDocumentChanges({
      eventsObservable$: of(eventsValue(events)),
      to$: of(null),
      since$: of({
        document: publishedDoc,
        loading: false,
        revisionId: publishedDoc._rev,
      }),
      remoteTransactions$: of([staleDraftTx]),
      documentId: 'drafts.doc-1',
      client: {} as SanityClient,
    }).pipe(filter((value) => !value.loading)),
  )
}

describe('getDocumentChanges', () => {
  beforeEach(() => {
    mockGetDocumentTransactions.mockReset()
    mockGetDocumentTransactions.mockResolvedValue([])
  })

  it('emits an annotation-less preview diff, then the annotated diff from the translog', async () => {
    const {client} = createMockClient()
    const {_rev: sinceRev, ...sinceContent} = sinceDoc
    const {_rev: toRev, ...toContent} = toDoc
    mockGetDocumentTransactions.mockResolvedValue([
      editTransaction({id: 'tx-1', author: 'author-1', before: sinceContent, after: toContent}),
    ])

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: noEvents,
      to$: of(revision('rev-to', toDoc)),
      since$: of(revision('rev-since', sinceDoc)),
      remoteTransactions$: new BehaviorSubject([]),
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    // Preview: computed synchronously from the two documents, no annotations.
    expect(values[0].loading).toBe(true)
    expect(values[0].diff).toMatchObject({
      action: 'changed',
      fields: {name: {action: 'changed', annotation: null}},
    })

    // Final: transactions fetched for the since→to range, annotations attached.
    expect(mockGetDocumentTransactions).toHaveBeenCalledWith({
      documentId: DRAFT_ID,
      client,
      toTransaction: 'rev-to',
      fromTransaction: 'rev-since',
    })
    expect(values.at(-1)).toMatchObject({
      error: null,
      diff: {fields: {name: {action: 'changed', annotation: {author: 'author-1'}}}},
    })
  })

  it('synthesizes an empty since document when the selected revision is a creation event', async () => {
    const {client} = createMockClient()
    const createEvent = createDocumentVersionEvent({id: 'rev-to'})
    const {_rev, ...toContent} = toDoc
    // from === to returns the creation transaction itself, replaying the full creation.
    mockGetDocumentTransactions.mockResolvedValue([
      createTransaction({id: 'rev-to', after: toContent}),
    ])

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: of(eventsValue([createEvent])),
      to$: of(revision('rev-to', toDoc)),
      since$: of(null),
      remoteTransactions$: new BehaviorSubject([]),
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(mockGetDocumentTransactions).toHaveBeenCalledWith(
      expect.objectContaining({fromTransaction: 'rev-to', toTransaction: 'rev-to'}),
    )
    expect(values.at(-1)).toMatchObject({
      error: null,
      diff: {fields: {name: {action: 'added', toValue: 'bar'}}},
    })
  })

  it('emits MissingSinceDocumentError when the since revision cannot be fetched', async () => {
    const {client} = createMockClient()

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: noEvents,
      to$: of(revision('rev-to', toDoc)),
      since$: of(revision('rev-gone', null)),
      remoteTransactions$: new BehaviorSubject([]),
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values).toHaveLength(1))
    subscription.unsubscribe()

    const result = values[0]
    expect(result.diff).toBeNull()
    expect(result.error).toBeInstanceOf(MissingSinceDocumentError)
    expect((result.error as MissingSinceDocumentError).revisionId).toBe('rev-gone')
    expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
  })

  it('emits no error while the since revision is still loading', async () => {
    const {client} = createMockClient()

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: noEvents,
      to$: of(revision('rev-to', toDoc)),
      since$: of({revisionId: 'rev-since', loading: true, document: null}),
      remoteTransactions$: new BehaviorSubject([]),
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values).toHaveLength(1))
    subscription.unsubscribe()

    expect(values[0]).toEqual({loading: false, diff: null, error: null})
  })

  it('skips transaction fetching for the synthetic history-cleared since revision', async () => {
    const {client} = createMockClient()
    const clearedSince = {...sinceDoc, _rev: HISTORY_CLEARED_EVENT_ID}

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: noEvents,
      to$: of(revision('rev-to', toDoc)),
      since$: of(revision(HISTORY_CLEARED_EVENT_ID, clearedSince)),
      remoteTransactions$: new BehaviorSubject([]),
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
    expect(values.at(-1)?.error).toBeNull()
  })

  it('viewing latest: reuses fetched transactions and appends remote ones without refetching', async () => {
    const {client} = createMockClient()
    const {_rev: sinceRev, ...sinceContent} = sinceDoc
    const intermediate = {...sinceContent, name: 'bar'}
    mockGetDocumentTransactions.mockResolvedValue([
      editTransaction({id: 'tx-1', author: 'author-1', before: sinceContent, after: intermediate}),
    ])
    const remoteTransactions$ = new BehaviorSubject([
      // Present from the start; deduplication and concat behavior kick in on the next emission.
    ] as ReturnType<typeof editTransaction>[])

    const changes$ = getDocumentChanges({
      client,
      documentId: DRAFT_ID,
      eventsObservable$: noEvents,
      // No revision selected: the user is viewing the latest version.
      to$: of(null),
      since$: of(revision('rev-since', sinceDoc)),
      remoteTransactions$,
    })
    const {values, subscription} = collectEmissions(changes$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    expect(mockGetDocumentTransactions).toHaveBeenCalledTimes(1)

    // A remote edit arrives: the diff recomputes from cached + remote transactions, no refetch.
    remoteTransactions$.next([
      editTransaction({
        id: 'tx-remote',
        author: 'author-remote',
        timestamp: minutesAfterBase(1),
        before: intermediate,
        after: {...intermediate, name: 'baz'},
      }),
    ])
    await vi.waitFor(() =>
      expect(values.at(-1)?.diff).toMatchObject({
        fields: {name: {action: 'changed', toValue: 'baz', annotation: {author: 'author-remote'}}},
      }),
    )
    expect(mockGetDocumentTransactions).toHaveBeenCalledTimes(1)
    subscription.unsubscribe()
  })

  describe('when the newest event is a discard', () => {
    beforeEach(() => {
      mockGetDocumentTransactions.mockResolvedValue([staleDraftTx])
    })

    it('does not replay a stale draft translog after discarding a published document draft', async () => {
      const result = await collectDiff([discardVersionEvent, editEvent, publishEvent])

      expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
      expect(result.error).toBeNull()
      expect(result.diff?.isChanged).toBe(false)
    })

    it('does not replay a stale draft translog after a deleteDocumentGroup event', async () => {
      const result = await collectDiff([discardGroupEvent, editEvent])

      expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
      expect(result.error).toBeNull()
      expect(result.diff?.isChanged).toBe(false)
    })
  })
})
