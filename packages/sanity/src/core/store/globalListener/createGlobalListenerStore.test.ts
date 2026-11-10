import {
  createClient,
  type MutationEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {Observable, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {type InvalidationChannelEvent} from '../../preview/types'
import {createGlobalListenerStore} from './createGlobalListenerStore'

type ListenerEvent = WelcomeEvent | ReconnectEvent | MutationEvent

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}
const RECONNECT: ReconnectEvent = {type: 'reconnect'}

function mutation(documentId: string): MutationEvent {
  return {
    type: 'mutation',
    documentId,
    eventId: `${documentId}#tx`,
    identity: 'user',
    mutations: [],
    previousRev: 'rev-0',
    resultRev: 'rev-1',
    effects: {apply: [], revert: []},
    timestamp: '2026-01-01T00:00:00.000Z',
    transactionId: 'tx',
    transition: 'update',
    visibility: 'query',
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
  }
}

/**
 * A store on a client whose listener connections are served by `server`. `connections` counts
 * the connections opened so far, and the ones still open.
 */
function setup() {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  const server = new Subject<ListenerEvent>()
  const connections = {opened: 0, open: 0}
  const connection = new Observable<ListenerEvent>((subscriber) => {
    connections.opened += 1
    connections.open += 1
    const subscription = server.subscribe(subscriber)
    return () => {
      connections.open -= 1
      subscription.unsubscribe()
    }
  })
  const withConfig = vi.spyOn(client, 'withConfig').mockReturnValue(client)
  const listen = vi.spyOn(client, 'listen').mockReturnValue(connection)

  return {store: createGlobalListenerStore({client}), server, connections, withConfig, listen}
}

describe('createGlobalListenerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('serves both channels from one listener on every document in the dataset', () => {
    const {store, server, connections, withConfig, listen} = setup()
    const mutations: (WelcomeEvent | MutationEvent)[] = []
    const invalidations: InvalidationChannelEvent[] = []

    const subscriptions = [
      store.mutationChannel.subscribe((event) => mutations.push(event)),
      store.invalidationChannel.subscribe((event) => invalidations.push(event)),
    ]

    expect(connections.opened).toBe(1)
    expect(withConfig).toHaveBeenCalledWith({apiVersion: '2025-02-19'})
    expect(listen).toHaveBeenCalledWith(
      '*',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        includePreviousRevision: false,
        includeMutations: false,
        includeAllVersions: true,
        visibility: 'query',
        effectFormat: 'mendoza',
        tag: 'preview.global',
      },
    )

    const event = mutation('article')
    server.next(WELCOME)
    server.next(event)

    expect(mutations).toEqual([WELCOME, event])
    expect(invalidations).toEqual([{type: 'connected'}, event])

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('tells a subscriber that arrives while the listener is connected right away', () => {
    const {store, server, connections} = setup()
    const first = store.invalidationChannel.subscribe()
    server.next(WELCOME)
    server.next(mutation('article'))

    const mutations: (WelcomeEvent | MutationEvent)[] = []
    const invalidations: InvalidationChannelEvent[] = []
    const subscriptions = [
      first,
      store.mutationChannel.subscribe((event) => mutations.push(event)),
      store.invalidationChannel.subscribe((event) => invalidations.push(event)),
    ]

    expect(mutations).toEqual([WELCOME])
    expect(invalidations).toEqual([{type: 'connected'}])
    expect(connections.opened).toBe(1)

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('leaves reconnects out, and tells every subscriber again once the listener is back', () => {
    const {store, server} = setup()
    const invalidations: InvalidationChannelEvent[] = []
    const first = store.invalidationChannel.subscribe((event) => invalidations.push(event))
    server.next(WELCOME)
    server.next(RECONNECT)

    expect(invalidations).toEqual([{type: 'connected'}])

    // The welcome from before the connection was lost is stale, so a subscriber that arrives
    // while the listener reconnects waits for the next one
    const lateInvalidations: InvalidationChannelEvent[] = []
    const late = store.invalidationChannel.subscribe((event) => lateInvalidations.push(event))
    expect(lateInvalidations).toEqual([])

    server.next(WELCOME)

    expect(invalidations).toEqual([{type: 'connected'}, {type: 'connected'}])
    expect(lateInvalidations).toEqual([{type: 'connected'}])

    first.unsubscribe()
    late.unsubscribe()
  })

  it('keeps the connection open for a while after the last subscriber has left', () => {
    const {store, server, connections} = setup()
    const first = store.invalidationChannel.subscribe()
    server.next(WELCOME)
    first.unsubscribe()

    vi.advanceTimersByTime(LISTENER_RESET_DELAY - 1)
    expect(connections.open).toBe(1)

    const invalidations: InvalidationChannelEvent[] = []
    const returning = store.invalidationChannel.subscribe((event) => invalidations.push(event))
    expect(connections.opened).toBe(1)
    expect(invalidations).toEqual([{type: 'connected'}])
    returning.unsubscribe()

    vi.advanceTimersByTime(LISTENER_RESET_DELAY)
    expect(connections.open).toBe(0)
  })
})
