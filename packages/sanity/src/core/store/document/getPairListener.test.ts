import {ConnectionFailedError, type SanityClient} from '@sanity/client'
import {defer, from, lastValueFrom, NEVER, type Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type StoreRequestErrorHandler} from '../requestErrorHandler'
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

  describe('listener connection failures', () => {
    // The client gives up on a listener whose connection is rejected with a
    // 4xx it does not retry itself (anything but 408/429), erroring the stream
    // with a `ConnectionFailedError` carrying the status.
    function rejectedConnection(status: number) {
      return throwError(() => new ConnectionFailedError('EventSource connection failed', {status}))
    }

    // `client.observable.listen()` is cold: every subscription opens a new
    // EventSource. Mirror that with `defer`, and count connection attempts.
    function createFailingClient(attempts: Array<() => Observable<unknown>>) {
      let attempt = 0
      const connect = vi.fn((): Observable<unknown> => {
        const next = attempts[Math.min(attempt, attempts.length - 1)]
        attempt++
        return next()
      })
      const mockClient = {
        observable: {
          listen: vi.fn(() => defer(connect)),
          getDocuments: vi.fn(() => of([publishedDoc, draftDoc])),
        },
        withConfig: vi.fn(function (this: unknown) {
          return this
        }),
      } as unknown as SanityClient
      return {client: mockClient, connect}
    }

    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    test('a rejected connection signals reconnect and re-establishes the listener after a delay', async () => {
      const attempt2$ = new Subject<ListenerEvent>()
      const {client: mockClient, connect} = createFailingClient([
        () => rejectedConnection(401),
        () => attempt2$,
      ])

      const events: ListenerEvent[] = []
      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({
        next: (e) => events.push(e),
        error: (e) => errors.push(e),
      })
      await vi.advanceTimersByTimeAsync(0)

      // Not an error for the document streams: the pair reports a lost
      // connection (the form goes read-only) and waits to reconnect.
      expect(errors).toEqual([])
      expect(events.some((e) => e.type === 'reconnect')).toBe(true)
      expect(connect).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(999)
      expect(connect).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(connect).toHaveBeenCalledTimes(2)

      // The fresh connection's welcome resyncs the pair from snapshots.
      attempt2$.next({type: 'welcome', listenerName: 'test'})
      await vi.advanceTimersByTimeAsync(0)
      expect(events.filter((e) => e.type === 'snapshot')).toHaveLength(2)
      expect(errors).toEqual([])

      sub.unsubscribe()
      attempt2$.complete()
    })

    test('keeps reconnecting with capped exponential backoff', async () => {
      const {client: mockClient, connect} = createFailingClient([() => rejectedConnection(403)])

      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
      await vi.advanceTimersByTimeAsync(0)
      expect(connect).toHaveBeenCalledTimes(1)

      // 1s, 2s, 4s, ... up to 30s between attempts
      for (const [delay, attempts] of [
        [1_000, 2],
        [2_000, 3],
        [4_000, 4],
        [8_000, 5],
        [16_000, 6],
        [30_000, 7],
        [30_000, 8],
      ] as const) {
        await vi.advanceTimersByTimeAsync(delay - 1)
        expect(connect).toHaveBeenCalledTimes(attempts - 1)
        await vi.advanceTimersByTimeAsync(1)
        expect(connect).toHaveBeenCalledTimes(attempts)
      }
      expect(errors).toEqual([])

      sub.unsubscribe()
    })

    test('a later rejection continues the backoff from where it left off', async () => {
      const attempt3$ = new Subject<ListenerEvent>()
      const {client: mockClient, connect} = createFailingClient([
        () => rejectedConnection(403),
        () => rejectedConnection(403),
        () => attempt3$,
        () => NEVER,
      ])

      const sub = getPairListener(mockClient, idPair).subscribe()
      // two failures: 1s, then 2s
      await vi.advanceTimersByTimeAsync(3_000)
      expect(connect).toHaveBeenCalledTimes(3)

      attempt3$.next({type: 'welcome', listenerName: 'test'})
      await vi.advanceTimersByTimeAsync(0)
      attempt3$.error(new ConnectionFailedError('EventSource connection failed', {status: 403}))

      // third failure: 4s
      await vi.advanceTimersByTimeAsync(3_999)
      expect(connect).toHaveBeenCalledTimes(3)
      await vi.advanceTimersByTimeAsync(1)
      expect(connect).toHaveBeenCalledTimes(4)

      sub.unsubscribe()
    })

    test('other listener errors still propagate', async () => {
      const error = new Error('channel error')
      const {client: mockClient, connect} = createFailingClient([() => throwError(() => error)])

      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
      await vi.advanceTimersByTimeAsync(10_000)

      expect(errors).toEqual([error])
      expect(connect).toHaveBeenCalledTimes(1)

      sub.unsubscribe()
    })
  })

  describe('snapshot fetch error delegation', () => {
    test('delegates snapshot fetch failures to the error handler and recovers when it re-runs the request', async () => {
      const getDocuments = (
        client as unknown as {observable: {getDocuments: ReturnType<typeof vi.fn>}}
      ).observable.getDocuments
      // First attempt fails; the re-run falls back to the default mock and
      // succeeds.
      const serverError = new Error('HTTP 504')
      getDocuments.mockReturnValueOnce(throwError(() => serverError))

      // Ad-hoc handler implementing the recovery contract: re-run a failed
      // retryable request and resolve off the successful attempt.
      const delegated: unknown[] = []
      const errorHandler: StoreRequestErrorHandler = {
        attempt: (thunk, options) =>
          lastValueFrom(from(thunk())).catch((err) => {
            if (!options?.retryable) throw err
            delegated.push(err)
            return lastValueFrom(from(thunk()))
          }),
      }

      const events: ListenerEvent[] = []
      const errors: unknown[] = []
      const sub = getPairListener(client, idPair, {
        snapshotFetchErrorHandler: errorHandler,
      }).subscribe({
        next: (event) => events.push(event),
        error: (err) => errors.push(err),
      })

      listener$.next({type: 'welcome', listenerName: 'test'})

      // The failure is handed to the handler instead of erroring the event
      // streams; the snapshots are emitted off the re-run request.
      await vi.waitFor(() => {
        expect(events.filter((event) => event.type === 'snapshot')).toHaveLength(2)
      })
      expect(errors).toEqual([])
      expect(delegated).toEqual([serverError])
      expect(getDocuments).toHaveBeenCalledTimes(2)

      sub.unsubscribe()
    })
  })
})
