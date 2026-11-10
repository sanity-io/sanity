import {ChannelError, ConnectionFailedError, type SanityClient} from '@sanity/client'
import {
  concat,
  defer,
  from,
  lastValueFrom,
  mergeMap,
  type Observable,
  of,
  Subject,
  throwError,
  timer,
} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type StoreRequestErrorHandler} from '../requestErrorHandler'
import {type ListenerEvent, getPairListener} from './getPairListener'
import {type IdPair, type MutationEvent} from './types'
import {DeadlineExceededError, OutOfSyncError} from './utils/sequentializeListenerEvents'

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

function mutationsOf(events: ListenerEvent[], documentId: string) {
  return events.flatMap((event) =>
    event.type === 'mutation' && event.documentId === documentId
      ? [`${event.previousRev ?? 'create'} -> ${event.resultRev}`]
      : [],
  )
}

function snapshotsOf(events: ListenerEvent[], documentId: string) {
  return events.flatMap((event) =>
    event.type === 'snapshot' && event.documentId === documentId
      ? [event.document?._rev ?? null]
      : [],
  )
}

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

    test('passes the welcome on before its snapshots', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      expect(events.map((e) => e.type)).toEqual([
        // once per stream: draft, published and version
        'welcome',
        'welcome',
        'welcome',
        'snapshot',
        'snapshot',
      ])

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

  describe('listener down before it welcomes', () => {
    function getDocumentsOf(mockClient: SanityClient) {
      return (mockClient as unknown as {observable: {getDocuments: ReturnType<typeof vi.fn>}})
        .observable.getDocuments
    }

    test('fetches the snapshots after a reconnect that comes before any welcome', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'reconnect'})
      await nextTick()

      expect(getDocumentsOf(client)).toHaveBeenCalledTimes(1)
      // The reconnect goes first, so the snapshots are not mistaken for a live connection.
      expect(events.map((e) => e.type)).toEqual([
        'reconnect',
        'reconnect',
        'reconnect',
        'snapshot',
        'snapshot',
      ])

      sub.unsubscribe()
    })

    test('fetches the snapshots again once the listener welcomes', async () => {
      const sub = getPairListener(client, idPair).subscribe()

      listener$.next({type: 'reconnect'})
      await nextTick()
      expect(getDocumentsOf(client)).toHaveBeenCalledTimes(1)

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()
      expect(getDocumentsOf(client)).toHaveBeenCalledTimes(2)

      sub.unsubscribe()
    })

    test('does not fetch the snapshots again when a live listener goes down', async () => {
      const sub = getPairListener(client, idPair).subscribe()

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()
      listener$.next({type: 'reconnect'})
      await nextTick()

      expect(getDocumentsOf(client)).toHaveBeenCalledTimes(1)

      sub.unsubscribe()
    })
  })

  describe('listener connection failures', () => {
    // A listener connection the client gives up on errors the stream with a
    // `ConnectionFailedError` carrying the HTTP status.
    function rejectedConnection(status: number) {
      return throwError(() => new ConnectionFailedError('EventSource connection failed', {status}))
    }

    function createFailingClient(connectImpl: () => Observable<unknown>) {
      const connect = vi.fn(connectImpl)
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

    // A 401 on the listener means the credential it was opened with was refused. That can be a
    // token that a rotation has just replaced (the reconnect went out before the new pair
    // landed), or a token the store still believes valid (revoked, clock skew). Either way the
    // stream must not die quietly: the last event the form saw was `reconnect`, so a completed
    // stream leaves the editor read-only for good. Instead, one ordinary request through the
    // client lets the auth store sort the credential out (it renews once, or ends the session),
    // and the listener reconnects with whatever credential the client holds afterwards.
    function createReconnectingClient(
      connectImpl: () => Observable<unknown>,
      requestImpl: () => Observable<unknown>,
    ) {
      const connect = vi.fn(connectImpl)
      const request = vi.fn(requestImpl)
      const mockClient = {
        observable: {
          listen: vi.fn(() => defer(connect)),
          getDocuments: vi.fn(() => of([publishedDoc, draftDoc])),
          request,
        },
        withConfig: vi.fn(function (this: unknown) {
          return this
        }),
      } as unknown as SanityClient
      return {client: mockClient, connect, request}
    }

    test('a 401 reconnects once a request through the client has restored the credential', async () => {
      const second$ = new Subject<ListenerEvent>()
      let attempt = 0
      const {
        client: mockClient,
        connect,
        request,
      } = createReconnectingClient(
        () => (++attempt === 1 ? rejectedConnection(401) : second$),
        () => of({}),
      )

      const events: {type: string}[] = []
      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({
        next: (e) => events.push(e),
        error: (e) => errors.push(e),
      })
      await nextTick()
      await nextTick()

      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith(expect.objectContaining({url: '/users/me'}))
      expect(connect).toHaveBeenCalledTimes(2)
      // The form learns the connection is being re-established while the credential is checked.
      expect(events.map((e) => e.type)).toContain('reconnect')

      second$.next({type: 'welcome'} as ListenerEvent)
      await nextTick()
      await nextTick()
      expect(events.some((e) => e.type === 'snapshot')).toBe(true)
      expect(errors).toEqual([])
      second$.complete()
      sub.unsubscribe()
    })

    test('a 401 completes the stream when the credential cannot be restored', async () => {
      const {client: mockClient, connect} = createReconnectingClient(
        () => rejectedConnection(401),
        () => throwError(() => new ConnectionFailedError('still rejected', {status: 401})),
      )

      const errors: unknown[] = []
      let completed = false
      const sub = getPairListener(mockClient, idPair).subscribe({
        error: (e) => errors.push(e),
        complete: () => {
          completed = true
        },
      })
      await nextTick()
      await nextTick()

      // Completes rather than errors: an errored stream is rethrown by `useSyncObservable` and
      // crashes the tool. The session ending is handled by the auth store, not here.
      expect(errors).toEqual([])
      expect(completed).toBe(true)
      expect(connect).toHaveBeenCalledTimes(1)
      sub.unsubscribe()
    })

    test('a 401 reconnects when the credential check fails for another reason', async () => {
      // A network error, a timeout or a 5xx says nothing about the credential. Completing here
      // would leave the editor read-only while the user is still signed in.
      const second$ = new Subject<ListenerEvent>()
      let attempt = 0
      const {client: mockClient, connect} = createReconnectingClient(
        () => (++attempt === 1 ? rejectedConnection(401) : second$),
        () => throwError(() => new Error('network error')),
      )

      const errors: unknown[] = []
      let completed = false
      const sub = getPairListener(mockClient, idPair).subscribe({
        error: (e) => errors.push(e),
        complete: () => {
          completed = true
        },
      })
      await nextTick()
      await nextTick()

      expect(connect).toHaveBeenCalledTimes(2)
      expect(completed).toBe(false)
      expect(errors).toEqual([])
      second$.complete()
      sub.unsubscribe()
    })

    test('gives up after repeated 401s even when the credential check keeps passing', async () => {
      const {client: mockClient, connect} = createReconnectingClient(
        () => rejectedConnection(401),
        () => of({}),
      )

      let completed = false
      const sub = getPairListener(mockClient, idPair).subscribe({
        complete: () => {
          completed = true
        },
      })
      for (let i = 0; i < 12; i++) await nextTick()

      expect(completed).toBe(true)
      expect(connect.mock.calls.length).toBeLessThanOrEqual(4)
      sub.unsubscribe()
    })

    test('keeps recovering from 401s as long as each reconnect is welcomed', async () => {
      // A long session rotates its token many times. Only 401s in a row count towards the limit.
      const open$ = new Subject<ListenerEvent>()
      const {client: mockClient, connect} = createReconnectingClient(
        () =>
          connect.mock.calls.length <= 4
            ? concat(of({type: 'welcome'} as ListenerEvent), rejectedConnection(401))
            : open$,
        () => of({}),
      )

      let completed = false
      const sub = getPairListener(mockClient, idPair).subscribe({
        complete: () => {
          completed = true
        },
      })
      for (let i = 0; i < 12; i++) await nextTick()

      expect(connect).toHaveBeenCalledTimes(5)
      expect(completed).toBe(false)
      open$.complete()
      sub.unsubscribe()
    })

    test('other listener errors still propagate', async () => {
      const error = new Error('channel error')
      const {client: mockClient} = createFailingClient(() => throwError(() => error))
      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
      await nextTick()
      // Non-session errors are not swallowed and still surface to the caller.
      expect(errors).toEqual([error])
      sub.unsubscribe()
    })

    test('other listener errors still propagate after recovering from a 401', async () => {
      const error = new Error('channel error')
      let attempt = 0
      const {client: mockClient} = createReconnectingClient(
        () => (++attempt === 1 ? rejectedConnection(401) : throwError(() => error)),
        () => of({}),
      )
      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
      await nextTick()
      await nextTick()

      expect(errors).toEqual([error])
      sub.unsubscribe()
    })

    test('a connection rejected with another 4xx also propagates', async () => {
      const {client: mockClient} = createFailingClient(() => rejectedConnection(403))
      const errors: unknown[] = []
      const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
      await nextTick()
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBeInstanceOf(ConnectionFailedError)
      sub.unsubscribe()
    })

    test('a connection rejected with a 5xx is reopened with backoff, and loads the snapshots meanwhile', async () => {
      vi.useFakeTimers()
      try {
        // The EventSource reports a rejected connection asynchronously.
        const {client: mockClient, connect} = createFailingClient(() =>
          timer(0).pipe(mergeMap(() => rejectedConnection(500))),
        )
        const events: ListenerEvent[] = []
        const errors: unknown[] = []
        const sub = getPairListener(mockClient, idPair).subscribe({
          next: (e) => events.push(e),
          error: (e) => errors.push(e),
        })
        await vi.advanceTimersByTimeAsync(0)

        expect(errors).toEqual([])
        expect(events.filter((e) => e.type === 'snapshot')).toHaveLength(2)
        await vi.advanceTimersByTimeAsync(1_000)
        expect(connect).toHaveBeenCalledTimes(2)

        sub.unsubscribe()
      } finally {
        vi.useRealTimers()
      }
    })

    test('a channel error is reopened with backoff instead of failing the document', async () => {
      vi.useFakeTimers()
      try {
        const {client: mockClient, connect} = createFailingClient(() =>
          throwError(
            () => new ChannelError('Internal error', {error: {description: 'Internal error'}}),
          ),
        )
        const errors: unknown[] = []
        const sub = getPairListener(mockClient, idPair).subscribe({error: (e) => errors.push(e)})
        await vi.advanceTimersByTimeAsync(1_000)

        expect(errors).toEqual([])
        expect(connect).toHaveBeenCalledTimes(2)

        sub.unsubscribe()
      } finally {
        vi.useRealTimers()
      }
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

  describe('putting the events of each document in sequence', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // `messageReceivedAt` is stamped with whole seconds, the deadline counts from it
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    test('emits the mutations of a document that arrive out of order in the order of their revisions', async () => {
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-3',
          previousRev: 'draft-rev-2',
          resultRev: 'draft-rev-3',
        }),
      )
      listener$.next(
        createMutationEvent({
          documentId: PUBLISHED_ID,
          transactionId: 'tx-pub',
          previousRev: 'pub-rev',
          resultRev: 'pub-rev-2',
        }),
      )
      expect(mutationsOf(events, DRAFT_ID)).toEqual([])

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-2',
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )

      expect(mutationsOf(events, DRAFT_ID)).toEqual([
        'draft-rev -> draft-rev-2',
        'draft-rev-2 -> draft-rev-3',
      ])
      // the mutations held back for the draft don't hold back those of the published document
      expect(mutationsOf(events, PUBLISHED_ID)).toEqual(['pub-rev -> pub-rev-2'])

      sub.unsubscribe()
    })

    test('drops a mutation that the fetched snapshot already includes', async () => {
      const onSyncErrorRecovery = vi.fn()
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair, {onSyncErrorRecovery}).subscribe((e) =>
        events.push(e),
      )

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-1',
          previousRev: 'draft-rev-0',
          resultRev: 'draft-rev',
        }),
      )
      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-2',
          previousRev: 'draft-rev',
          resultRev: 'draft-rev-2',
        }),
      )
      await vi.advanceTimersByTimeAsync(60_000)

      expect(mutationsOf(events, DRAFT_ID)).toEqual(['draft-rev -> draft-rev-2'])
      expect(onSyncErrorRecovery).not.toHaveBeenCalled()

      sub.unsubscribe()
    })

    test('continues from a snapshot of a missing document with the mutation that creates it', async () => {
      vi.spyOn(client.observable, 'getDocuments').mockReturnValueOnce(of([publishedDoc, null]))
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair).subscribe((e) => events.push(e))

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-create',
          // the listener sends no `previousRev` for the mutation that creates a document
          previousRev: undefined,
          resultRev: 'draft-rev-1',
          transition: 'appear',
        }),
      )
      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-2',
          previousRev: 'draft-rev-1',
          resultRev: 'draft-rev-2',
        }),
      )

      expect(snapshotsOf(events, DRAFT_ID)).toEqual([null])
      expect(mutationsOf(events, DRAFT_ID)).toEqual([
        'create -> draft-rev-1',
        'draft-rev-1 -> draft-rev-2',
      ])

      sub.unsubscribe()
    })

    test('fetches the snapshots again when a missing mutation does not arrive within 30 seconds', async () => {
      const onSyncErrorRecovery = vi.fn()
      const listen = vi.spyOn(client.observable, 'listen')
      const getDocuments = vi.spyOn(client.observable, 'getDocuments')
      const events: ListenerEvent[] = []
      const sub = getPairListener(client, idPair, {onSyncErrorRecovery}).subscribe((e) =>
        events.push(e),
      )

      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()

      // draft-rev -> draft-rev-2 never arrives
      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-3',
          previousRev: 'draft-rev-2',
          resultRev: 'draft-rev-3',
        }),
      )
      await vi.advanceTimersByTimeAsync(29_999)
      expect(onSyncErrorRecovery).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(onSyncErrorRecovery).toHaveBeenCalledExactlyOnceWith(expect.any(DeadlineExceededError))
      expect(listen).toHaveBeenCalledTimes(2)

      // the welcome of the new listener connection fetches the snapshots again
      getDocuments.mockReturnValueOnce(of([publishedDoc, {...draftDoc, _rev: 'draft-rev-3'}]))
      listener$.next({type: 'welcome', listenerName: 'test'})
      await nextTick()
      listener$.next(
        createMutationEvent({
          documentId: DRAFT_ID,
          transactionId: 'tx-4',
          previousRev: 'draft-rev-3',
          resultRev: 'draft-rev-4',
        }),
      )

      expect(getDocuments).toHaveBeenCalledTimes(2)
      expect(snapshotsOf(events, DRAFT_ID)).toEqual(['draft-rev', 'draft-rev-3'])
      expect(mutationsOf(events, DRAFT_ID)).toEqual(['draft-rev-3 -> draft-rev-4'])

      sub.unsubscribe()
    })
  })
})
