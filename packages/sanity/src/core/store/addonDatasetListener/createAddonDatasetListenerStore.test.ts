import {
  createClient,
  type ListenEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {defer, Observable, of, Subject, throwError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {mutation, task} from './__fixtures__/addonDataset.fixture'
import {
  type AddonDatasetDocument,
  type AddonDatasetListenerEvent,
  type AddonDatasetListenerStore,
  type AddonDatasetQueryEvent,
  createAddonDatasetListenerStore,
  followAddonDatasetQuery,
} from './createAddonDatasetListenerStore'

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}
const RECONNECT: ReconnectEvent = {type: 'reconnect'}

/**
 * A store on a client whose listener connections are served by `server`. `connections` counts
 * the connections opened so far, and the ones still open.
 */
function setup() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production-comments',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  const server = new Subject<ListenEvent<AddonDatasetDocument>>()
  const connections = {opened: 0, open: 0}
  const connection = new Observable<ListenEvent<AddonDatasetDocument>>((subscriber) => {
    connections.opened += 1
    connections.open += 1
    const subscription = server.subscribe(subscriber)
    return () => {
      connections.open -= 1
      subscription.unsubscribe()
    }
  })
  const listen = vi.spyOn(client.observable, 'listen').mockReturnValue(connection)

  return {store: createAddonDatasetListenerStore({client}), server, connections, listen}
}

describe('createAddonDatasetListenerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('serves every subscriber from one connection on the comments and tasks, with their documents', () => {
    const {store, server, connections, listen} = setup()
    const first: AddonDatasetListenerEvent[] = []
    const second: AddonDatasetListenerEvent[] = []

    const subscriptions = [
      store.events.subscribe((event) => first.push(event)),
      store.events.subscribe((event) => second.push(event)),
    ]

    expect(connections.opened).toBe(1)
    expect(listen).toHaveBeenCalledWith(
      '*[_type in ["comment", "tasks.task"]]',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: true,
        includeAllVersions: true,
        visibility: 'query',
        tag: 'addon-dataset.listen',
      },
    )

    server.next({type: 'open'})
    server.next(WELCOME)

    expect(first).toEqual([WELCOME])
    expect(second).toEqual([WELCOME])

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('tells a subscriber that arrives while the listener is connected right away', () => {
    const {store, server, connections} = setup()
    const first = store.events.subscribe()
    server.next(WELCOME)

    const late: AddonDatasetListenerEvent[] = []
    const second = store.events.subscribe((event) => late.push(event))

    expect(late).toEqual([WELCOME])
    expect(connections.opened).toBe(1)

    first.unsubscribe()
    second.unsubscribe()
  })

  it('passes reconnects through, and tells a subscriber that arrives meanwhile', () => {
    const {store, server} = setup()
    const events: AddonDatasetListenerEvent[] = []
    const first = store.events.subscribe((event) => events.push(event))
    server.next(WELCOME)
    server.next(RECONNECT)

    expect(events).toEqual([WELCOME, RECONNECT])

    const late: AddonDatasetListenerEvent[] = []
    const second = store.events.subscribe((event) => late.push(event))
    expect(late).toEqual([RECONNECT])

    server.next(WELCOME)
    expect(events).toEqual([WELCOME, RECONNECT, WELCOME])
    expect(late).toEqual([RECONNECT, WELCOME])

    first.unsubscribe()
    second.unsubscribe()
  })

  it('keeps the connection open for a while after the last subscriber has left', () => {
    const {store, server, connections} = setup()
    const first = store.events.subscribe()
    server.next(WELCOME)
    first.unsubscribe()

    vi.advanceTimersByTime(LISTENER_RESET_DELAY - 1)
    expect(connections.open).toBe(1)

    const events: AddonDatasetListenerEvent[] = []
    const returning = store.events.subscribe((event) => events.push(event))
    expect(connections.opened).toBe(1)
    expect(events).toEqual([WELCOME])
    returning.unsubscribe()

    vi.advanceTimersByTime(LISTENER_RESET_DELAY)
    expect(connections.open).toBe(0)
  })
})

describe('followAddonDatasetQuery', () => {
  const LOADING = {type: 'loading'}

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** A fetch that fails its first `failures` attempts, then returns `documents` */
  function flakyFetch(failures: number, documents: string[]) {
    const attempts = {count: 0}
    const fetch = defer(() => {
      attempts.count += 1
      return attempts.count <= failures
        ? throwError(() => new Error(`attempt ${attempts.count} failed`))
        : of(documents)
    })
    return {fetch, attempts}
  }

  function follow(store: AddonDatasetListenerStore, fetch: Observable<string[]>) {
    const events: AddonDatasetQueryEvent<string>[] = []
    const subscription = store.events
      .pipe(followAddonDatasetQuery(fetch))
      .subscribe((event) => events.push(event))
    return {events, subscription}
  }

  it('fetches on every connection, and cancels a fetch still in flight when the listener reconnects', () => {
    const {store, server} = setup()
    const response = new Subject<string[]>()
    const fetches = {started: 0, open: 0}
    const fetch = new Observable<string[]>((subscriber) => {
      fetches.started += 1
      fetches.open += 1
      const subscription = response.subscribe(subscriber)
      return () => {
        fetches.open -= 1
        subscription.unsubscribe()
      }
    })
    const {events, subscription} = follow(store, fetch)

    server.next(WELCOME)
    expect(events).toEqual([LOADING])
    expect(fetches.open).toBe(1)

    server.next(RECONNECT)
    expect(fetches.open).toBe(0)

    server.next(WELCOME)
    response.next(['a'])
    expect(fetches.started).toBe(2)
    expect(events).toEqual([LOADING, LOADING, LOADING, {type: 'loaded', documents: ['a']}])

    subscription.unsubscribe()
  })

  it('retries a failed fetch, waiting longer before each attempt', () => {
    const {store, server} = setup()
    const {fetch, attempts} = flakyFetch(2, ['a'])
    const {events, subscription} = follow(store, fetch)

    server.next(WELCOME)
    expect(attempts.count).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(attempts.count).toBe(2)
    vi.advanceTimersByTime(1999)
    expect(attempts.count).toBe(2)
    vi.advanceTimersByTime(1)

    expect(attempts.count).toBe(3)
    expect(events).toEqual([LOADING, {type: 'loaded', documents: ['a']}])

    subscription.unsubscribe()
  })

  it('reports a fetch that keeps failing once it runs out of retries, and passes on mutations meanwhile', () => {
    const {store, server} = setup()
    const {fetch, attempts} = flakyFetch(Infinity, [])
    const {events, subscription} = follow(store, fetch)
    const appear = mutation('appear', 't-1', task('t-1'))

    server.next(WELCOME)
    server.next(appear)
    vi.advanceTimersByTime(1000 + 2000 + 3000)

    expect(attempts.count).toBe(4)
    expect(events).toEqual([LOADING, appear, {type: 'error', error: new Error('attempt 4 failed')}])

    subscription.unsubscribe()
  })
})
