import {ConnectionFailedError, type SanityClient} from '@sanity/client'
import {of, retry, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type InvalidationChannelEvent} from '../../preview/types'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../variants/store/constants'
import {listenQuery, listenQueryOnGlobalListener} from './listenQuery'
import {type MutationEvent, type ReconnectEvent, type WelcomeEvent} from './types'

type ListenerEvent = WelcomeEvent | ReconnectEvent | MutationEvent

function createMutationEvent(overrides: Partial<MutationEvent> = {}): MutationEvent {
  return {
    type: 'mutation',
    documentId: 'doc-1',
    transactionId: 'tx-1',
    mutations: [],
    effects: {apply: [], revert: []},
    previousRev: 'rev-0',
    resultRev: 'rev-1',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    messageReceivedAt: '2024-01-01T00:00:00.000Z',
    visibility: 'query',
    transition: 'update',
    ...overrides,
  }
}

function createMockClient(listenerEvents$: Subject<ListenerEvent>) {
  const fetch = vi.fn(() => of({ok: true}))
  const client = {
    listen: vi.fn(() => listenerEvents$),
    withConfig: vi.fn(function withConfig(this: unknown) {
      return this
    }),
    observable: {fetch},
  }
  return {
    client: client as unknown as SanityClient,
    fetch,
    listen: client.listen,
    withConfig: client.withConfig,
  }
}

async function flushScheduled() {
  // exhaustMapWithTrailing schedules work on RxJS asyncScheduler (setInterval(0)).
  // Fake timers only flush that work once the clock moves.
  await vi.advanceTimersByTimeAsync(1)
}

describe('listenQuery', () => {
  let listener$: Subject<ListenerEvent>
  let client: SanityClient
  let fetch: ReturnType<typeof vi.fn>
  let listen: ReturnType<typeof vi.fn>
  let withConfig: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    listener$ = new Subject<ListenerEvent>()
    ;({client, fetch, listen, withConfig} = createMockClient(listener$))
  })

  afterEach(() => {
    listener$.complete()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('fetches after the welcome event and emits the query result', async () => {
    const values: unknown[] = []
    const sub = listenQuery(client, '*[_type == "movie"]').subscribe((value) => values.push(value))

    expect(listen).toHaveBeenCalledWith(
      '*[_type == "movie"]',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        visibility: 'query',
        includeAllVersions: true,
        tag: undefined,
      },
    )

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "movie"]',
      {},
      {
        tag: undefined,
        filterResponse: true,
        perspective: undefined,
        variant: undefined,
      },
    )
    expect(values).toEqual([{ok: true}])

    sub.unsubscribe()
  })

  test('uses the listen query for the event source and the fetch query for the refetch', async () => {
    const sub = listenQuery(
      client,
      {fetch: '*[_type == "movie"]', listen: '*[_type == "movie"][0]'},
      {docId: 'a'},
    ).subscribe()

    expect(listen).toHaveBeenCalledWith(
      '*[_type == "movie"][0]',
      {docId: 'a'},
      expect.objectContaining({events: ['welcome', 'mutation', 'reconnect']}),
    )

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledWith('*[_type == "movie"]', {docId: 'a'}, expect.any(Object))

    sub.unsubscribe()
  })

  test('keeps waiting for welcome when the listener reconnects before it', async () => {
    const values: unknown[] = []
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({
      next: (value) => values.push(value),
      error: (error) => errors.push(error),
    })

    listener$.next({type: 'reconnect'})
    await flushScheduled()
    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(2000)

    expect(errors).toEqual([])
    expect(values).toEqual([])
    expect(fetch).not.toHaveBeenCalled()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(errors).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(values).toEqual([{ok: true}])

    sub.unsubscribe()
  })

  test('errors when the first event after reconnects is not welcome', async () => {
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    listener$.next({type: 'reconnect'})
    await flushScheduled()
    listener$.next(createMutationEvent())
    await flushScheduled()

    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('Received unexpected type of first event "mutation"')
    expect(fetch).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('errors when no welcome arrives within 30 seconds', async () => {
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    // Reconnects while waiting do not restart the timeout
    await vi.advanceTimersByTimeAsync(10_000)
    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(10_000)
    listener$.next({type: 'reconnect'})
    await vi.advanceTimersByTimeAsync(9_999)
    expect(errors).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).name).toBe('TimeoutError')
    expect((errors[0] as Error).message).toBe(
      'Timed out after 30000ms waiting for the listener to connect',
    )
    expect(fetch).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('does not time out once welcome has arrived', async () => {
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    await vi.advanceTimersByTimeAsync(29_000)
    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(errors).toEqual([])
    expect(fetch).toHaveBeenCalledTimes(1)

    sub.unsubscribe()
  })

  test('leaves no timer behind when unsubscribed before welcome', async () => {
    const sub = listenQuery(client, '*').subscribe()
    listener$.next({type: 'reconnect'})
    await flushScheduled()
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    sub.unsubscribe()

    expect(vi.getTimerCount()).toBe(0)
  })

  test('starts a new timeout when resubscribed after timing out', async () => {
    const errors: unknown[] = []
    const sub = listenQuery(client, '*')
      .pipe(retry(1))
      .subscribe({error: (error) => errors.push(error)})

    await vi.advanceTimersByTimeAsync(30_000)
    expect(listen).toHaveBeenCalledTimes(2)
    expect(errors).toEqual([])

    await vi.advanceTimersByTimeAsync(29_999)
    expect(errors).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).name).toBe('TimeoutError')

    sub.unsubscribe()
  })

  test('errors at once when the connection fails before welcome', async () => {
    const connectionError = new ConnectionFailedError('EventSource connection failed', {
      status: 401,
    })
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    listener$.next({type: 'reconnect'})
    await flushScheduled()
    listener$.error(connectionError)
    await flushScheduled()

    expect(errors).toEqual([connectionError])

    sub.unsubscribe()
  })

  test('errors when the first event is not welcome', async () => {
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    listener$.next(createMutationEvent())
    await flushScheduled()

    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('Received unexpected type of first event "mutation"')
    expect(fetch).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('refetches when a mutation arrives after welcome', async () => {
    fetch.mockReturnValueOnce(of({n: 1})).mockReturnValueOnce(of({n: 2}))
    const values: unknown[] = []
    const sub = listenQuery(client, '*').subscribe((value) => values.push(value))

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    listener$.next(createMutationEvent({visibility: 'query'}))
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(values).toEqual([{n: 1}, {n: 2}])

    sub.unsubscribe()
  })

  test('refetches when a reconnect arrives after welcome', async () => {
    const sub = listenQuery(client, '*').subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    listener$.next({type: 'reconnect'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('delays the refetch when a mutation is not query-visible', async () => {
    const values: unknown[] = []
    const sub = listenQuery(client, '*').subscribe((value) => values.push(value))

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)

    listener$.next(createMutationEvent({visibility: 'transaction'}))
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1200)
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(values).toEqual([{ok: true}, {ok: true}])

    sub.unsubscribe()
  })

  test('does not refetch a delayed mutation after unsubscribe', async () => {
    const sub = listenQuery(client, '*').subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    listener$.next(createMutationEvent({visibility: 'transaction'}))
    await flushScheduled()
    sub.unsubscribe()

    await vi.advanceTimersByTimeAsync(1200)
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('ignores mutations whose transition is not in the allow list', async () => {
    const sub = listenQuery(client, '*', {}, {transitions: ['appear']}).subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    listener$.next(createMutationEvent({transition: 'update'}))
    await flushScheduled()
    listener$.next(createMutationEvent({transition: 'disappear'}))
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(1)

    listener$.next(createMutationEvent({transition: 'appear'}))
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('still refetches reconnects when a transition allow list is set', async () => {
    const sub = listenQuery(client, '*', {}, {transitions: ['appear']}).subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    listener$.next({type: 'reconnect'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('throttles mutation refetches with a leading and trailing fetch', async () => {
    const sub = listenQuery(client, '*', {}, {throttleTime: 1000}).subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)

    listener$.next(createMutationEvent({transactionId: 'a'}))
    await flushScheduled()
    listener$.next(createMutationEvent({transactionId: 'b'}))
    await flushScheduled()
    listener$.next(createMutationEvent({transactionId: 'c'}))
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1000)
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(3)

    sub.unsubscribe()
  })

  test('forwards tag and perspective to listen and fetch', async () => {
    const sub = listenQuery(
      client,
      '*[_type == "movie"]',
      {limit: 10},
      {
        tag: 'movies.listen',
        perspective: 'published',
      },
    ).subscribe()

    expect(listen).toHaveBeenCalledWith(
      '*[_type == "movie"]',
      {limit: 10},
      expect.objectContaining({tag: 'movies.listen'}),
    )

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "movie"]',
      {limit: 10},
      expect.objectContaining({
        tag: 'movies.listen',
        perspective: 'published',
        filterResponse: true,
      }),
    )
    expect(withConfig).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('versions the fetch client when a variant is selected', async () => {
    const sub = listenQuery(client, '*', {}, {variant: 'season'}).subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(withConfig).toHaveBeenCalledWith({apiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion})
    expect(fetch).toHaveBeenCalledWith('*', {}, expect.objectContaining({variant: 'season'}))

    sub.unsubscribe()
  })

  test('does not version the client from apiVersion alone', async () => {
    const sub = listenQuery(client, '*', {}, {apiVersion: '2024-01-01'}).subscribe()

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(withConfig).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('propagates a fetch error after welcome', async () => {
    const fetchError = new Error('GROQ failed')
    fetch.mockReturnValueOnce(throwError(() => fetchError))
    const errors: unknown[] = []
    const sub = listenQuery(client, '*').subscribe({error: (error) => errors.push(error)})

    listener$.next({type: 'welcome', listenerName: 'test'})
    await flushScheduled()

    expect(errors).toEqual([fetchError])

    sub.unsubscribe()
  })
})

describe('listenQueryOnGlobalListener', () => {
  let invalidationChannel: Subject<InvalidationChannelEvent>
  let client: SanityClient
  let fetch: ReturnType<typeof vi.fn>
  let listen: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    invalidationChannel = new Subject<InvalidationChannelEvent>()
    ;({client, fetch, listen} = createMockClient(new Subject<ListenerEvent>()))
  })

  afterEach(() => {
    invalidationChannel.complete()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function subscribe(shouldRefetch: (event: {documentId: string}) => boolean) {
    return listenQueryOnGlobalListener(client, '*[_id in path("_.releases.*")]', {
      invalidationChannel,
      shouldRefetch,
      fetchTag: 'releases.fetch',
    }).subscribe()
  }

  test('fetches every time the global listener connects, without opening a listener', async () => {
    const shouldRefetch = vi.fn(() => true)
    const sub = subscribe(shouldRefetch)
    expect(fetch).not.toHaveBeenCalled()

    invalidationChannel.next({type: 'connected'})
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '*[_id in path("_.releases.*")]',
      {},
      expect.objectContaining({tag: 'releases.fetch', filterResponse: true}),
    )

    // Changes may have been missed while the listener was reconnecting
    invalidationChannel.next({type: 'connected'})
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(shouldRefetch).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('refetches only after the changes that shouldRefetch accepts', async () => {
    const shouldRefetch = vi.fn(({documentId}: {documentId: string}) =>
      documentId.startsWith('_.releases.'),
    )
    const sub = subscribe(shouldRefetch)
    invalidationChannel.next({type: 'connected'})
    await flushScheduled()

    const draftChange = {
      type: 'mutation',
      documentId: 'drafts.article',
      visibility: 'query',
    } as const
    invalidationChannel.next(draftChange)
    invalidationChannel.next({
      type: 'mutation',
      documentId: 'versions.rASAP.article',
      visibility: 'query',
    })
    await vi.advanceTimersByTimeAsync(2000)
    expect(shouldRefetch).toHaveBeenCalledWith(draftChange)
    expect(fetch).toHaveBeenCalledTimes(1)

    invalidationChannel.next({
      type: 'mutation',
      documentId: '_.releases.rASAP',
      visibility: 'query',
    })
    await flushScheduled()
    expect(fetch).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })
})
