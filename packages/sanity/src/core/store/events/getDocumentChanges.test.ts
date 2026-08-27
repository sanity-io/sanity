import {type SanityDocument} from '@sanity/types'
import {BehaviorSubject, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {createDocumentVersionEvent, DRAFT_ID, minutesAfterBase} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {createTransaction, editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentChanges, MissingSinceDocumentError} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {type EventsStoreRevision} from './types'

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

const noEvents = of({events: [], nextCursor: '', loading: false, error: null})
const revision = (revisionId: string, document: SanityDocument | null): EventsStoreRevision => ({
  revisionId,
  loading: false,
  document,
})

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
      eventsObservable$: of({events: [createEvent], nextCursor: '', loading: false, error: null}),
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
})
