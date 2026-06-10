import {type SanityClient} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type ListenerEvent, getPairListener} from './getPairListener'
import {type IdPair, type MutationEvent} from './types'
import {OutOfSyncError} from './utils/sequentializeListenerEvents'

function createMutationEvent(
  overrides: Partial<MutationEvent> & Pick<MutationEvent, 'documentId'>,
): MutationEvent {
  return {
    type: 'mutation',
    transactionId: 'tx-1',
    mutations: [],
    effects: {apply: [], revert: []},
    previousRev: 'rev-0',
    resultRev: 'rev-1',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    messageReceivedAt: new Date().toString(),
    visibility: 'transaction',
    transition: 'update',
    ...overrides,
  }
}

function createMultiTxMutationEvent(
  documentId: string,
  opts: {
    transactionId: string
    transactionTotalEvents: number
    transactionCurrentEvent: number
    previousRev?: string
    resultRev?: string
  },
): MutationEvent {
  return createMutationEvent({
    documentId,
    transactionId: opts.transactionId,
    transactionTotalEvents: opts.transactionTotalEvents,
    transactionCurrentEvent: opts.transactionCurrentEvent,
    previousRev: opts.previousRev ?? `prev-${opts.transactionCurrentEvent}`,
    resultRev: opts.resultRev ?? `res-${opts.transactionCurrentEvent}`,
  })
}

const PUBLISHED_ID = 'my-doc'
const DRAFT_ID = 'drafts.my-doc'

const idPair: IdPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

const publishedDoc = {
  _id: PUBLISHED_ID,
  _type: 'test',
  _rev: 'pub-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}
const draftDoc = {
  _id: DRAFT_ID,
  _type: 'test',
  _rev: 'draft-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}

function createMockClient(listenerEvents$: Subject<ListenerEvent>) {
  const client = {
    observable: {
      listen: vi.fn(() => listenerEvents$),
      getDocuments: vi.fn(() => of([publishedDoc, draftDoc])),
    },
    withConfig: vi.fn(() => client),
  }
  return client as unknown as SanityClient
}

const nextTick = () => Promise.resolve()

describe('getPairListener', () => {
  let listener$: Subject<ListenerEvent>
  let client: SanityClient

  beforeEach(() => {
    listener$ = new Subject<ListenerEvent>()
    client = createMockClient(listener$)
  })
  afterEach(() => {
    listener$.complete()
  })

  describe('multi-transaction buffering', () => {
    test('single-event transactions pass through immediately', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )

      const mutationEvents = events.filter((e) => e.type === 'mutation')
      expect(mutationEvents).toHaveLength(1)

      const pendingEvents = events.filter((e) => e.type === 'pending')
      expect(pendingEvents).toHaveLength(0)

      sub.unsubscribe()
    })

    test('multi-event transactions emit PENDING_START, buffer, then emit all + PENDING_END', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      // First part of a 2-part transaction
      listener$.next(
        createMultiTxMutationEvent(DRAFT_ID, {
          transactionId: 'multi-tx',
          transactionTotalEvents: 2,
          transactionCurrentEvent: 1,
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )

      const pendingBegin = events.filter((e) => e.type === 'pending' && e.phase === 'begin')
      // pending events pass through all 3 streams (draft, published, version)
      expect(pendingBegin).toHaveLength(3)

      // No mutations flushed yet
      expect(events.filter((e) => e.type === 'mutation')).toHaveLength(0)

      // Second part completes the transaction
      listener$.next(
        createMultiTxMutationEvent(PUBLISHED_ID, {
          transactionId: 'multi-tx',
          transactionTotalEvents: 2,
          transactionCurrentEvent: 2,
          previousRev: 'pub-rev',
          resultRev: 'pub-rev-2',
        }),
      )

      const pendingEnd = events.filter((e) => e.type === 'pending' && e.phase === 'end')
      // pending end also passes through all 3 streams
      expect(pendingEnd).toHaveLength(3)

      // Both mutations flushed (one per document stream that matches)
      expect(events.filter((e) => e.type === 'mutation')).toHaveLength(2)

      sub.unsubscribe()
    })

    test('non-mutation events pass through without buffering', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next({type: 'reconnect'})

      const reconnects = events.filter((e) => e.type === 'reconnect')
      expect(reconnects.length).toBeGreaterThanOrEqual(1)

      sub.unsubscribe()
    })
  })

  // ————————————————————————————
  // #4 Event filtering per document stream
  // ————————————————————————————
  describe('event filtering per document stream', () => {
    test('draft mutations only appear once, published mutations only appear once', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )

      listener$.next(
        createMutationEvent({
          documentId: PUBLISHED_ID,
          transactionId: 'tx-2',
          previousRev: 'pub-rev',
          resultRev: 'pub-rev-2',
        }),
      )

      const mutations = events.filter((e) => e.type === 'mutation')
      // Each mutation appears exactly once (filtered to its own stream, not duplicated)
      expect(mutations).toHaveLength(2)

      const draftMutations = mutations.filter(
        (e) => e.type === 'mutation' && e.documentId === DRAFT_ID,
      )
      const pubMutations = mutations.filter(
        (e) => e.type === 'mutation' && e.documentId === PUBLISHED_ID,
      )
      expect(draftMutations).toHaveLength(1)
      expect(pubMutations).toHaveLength(1)

      sub.unsubscribe()
    })

    test('non-mutation events are forwarded to all streams (draft + published)', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next({type: 'reconnect'})

      // reconnect passes the filter on all 3 streams (draft, published, version)
      const reconnects = events.filter((e) => e.type === 'reconnect')
      expect(reconnects).toHaveLength(3)

      sub.unsubscribe()
    })
  })

  describe('OutOfSyncError recovery', () => {
    test('calls onSyncErrorRecovery and retries on OutOfSyncError', async () => {
      const onSyncErrorRecovery = vi.fn()

      // Use a fresh subject for each subscription attempt so we can control events per attempt
      let attemptCount = 0
      const attempt1$ = new Subject<ListenerEvent>()
      const attempt2$ = new Subject<ListenerEvent>()

      const mockClient = {
        observable: {
          listen: vi.fn(() => {
            attemptCount++
            return attemptCount === 1 ? attempt1$ : attempt2$
          }),
          getDocuments: vi.fn(() => of([publishedDoc, draftDoc])),
        },
        withConfig: vi.fn(function (this: unknown) {
          return this
        }),
      } as unknown as SanityClient

      const events: ListenerEvent[] = []
      const sub = getPairListener(mockClient, idPair, {
        onSyncErrorRecovery,
      }).subscribe((e) => events.push(e))

      attempt1$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      // Flood with orphan mutations to exceed the default maxBufferSize (20)
      // Each has unique previousRev/resultRev that don't chain from the snapshot rev
      for (let i = 0; i < 25; i++) {
        attempt1$.next(
          createMutationEvent({
            documentId: DRAFT_ID,
            transactionId: `orphan-tx-${i}`,
            previousRev: `orphan-prev-${i}`,
            resultRev: `orphan-res-${i}`,
          }),
        )
      }

      await nextTick()

      expect(onSyncErrorRecovery).toHaveBeenCalled()
      expect(onSyncErrorRecovery.mock.calls[0][0]).toBeInstanceOf(OutOfSyncError)

      // After recovery, the stream should have re-subscribed (attempt2$)
      expect(attemptCount).toBeGreaterThanOrEqual(2)

      sub.unsubscribe()
      attempt1$.complete()
      attempt2$.complete()
    })

    test('non-OutOfSyncError errors propagate to subscriber', async () => {
      const error = new Error('some other error')
      const errorListener$ = new Subject<ListenerEvent>()
      const mockClient = {
        observable: {
          listen: vi.fn(() => errorListener$),
          getDocuments: vi.fn(() => {
            throw error
          }),
        },
        withConfig: vi.fn(function (this: unknown) {
          return this
        }),
      } as unknown as SanityClient

      const errors: Error[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({
        error: (e) => errors.push(e),
      })

      errorListener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      expect(errors).toHaveLength(1)
      expect(errors[0]).toBe(error)

      sub.unsubscribe()
    })
  })

  describe('welcome/reset triggers snapshot fetch', () => {
    test('welcome event fetches snapshots and emits InitialSnapshotEvents', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      const snapshots = events.filter((e) => e.type === 'snapshot')
      expect(snapshots).toHaveLength(2)

      const snapshotIds = snapshots.map((e) => (e.type === 'snapshot' ? e.documentId : null))
      expect(snapshotIds).toContain(PUBLISHED_ID)
      expect(snapshotIds).toContain(DRAFT_ID)

      sub.unsubscribe()
    })

    test('reset event fetches snapshots', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      const snapshotsBefore = events.filter((e) => e.type === 'snapshot').length

      listener$.next({type: 'reset'})
      await nextTick()

      const snapshotsAfter = events.filter((e) => e.type === 'snapshot').length
      // 2 more snapshots (draft + published)
      expect(snapshotsAfter).toBe(snapshotsBefore + 2)

      sub.unsubscribe()
    })

    test('mutation events do not trigger snapshot fetch', async () => {
      const getDocuments = (
        client as unknown as {observable: {getDocuments: ReturnType<typeof vi.fn>}}
      ).observable.getDocuments

      const sub = getPairListener(client, idPair).subscribe({next: vi.fn()})

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      const fetchCountAfterWelcome = getDocuments.mock.calls.length

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )
      await nextTick()

      expect(getDocuments.mock.calls.length).toBe(fetchCountAfterWelcome)

      sub.unsubscribe()
    })

    test('welcomeback event does NOT trigger snapshot fetch', async () => {
      const getDocuments = (
        client as unknown as {observable: {getDocuments: ReturnType<typeof vi.fn>}}
      ).observable.getDocuments

      const sub = getPairListener(client, idPair).subscribe({next: vi.fn()})

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      const fetchCountAfterWelcome = getDocuments.mock.calls.length

      listener$.next({type: 'welcomeback', listenerName: 'test'})
      await nextTick()

      // welcomeback means resume succeeded — no snapshot fetch needed
      expect(getDocuments.mock.calls.length).toBe(fetchCountAfterWelcome)

      sub.unsubscribe()
    })
  })
})
