import {
  createClient,
  type ListenEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {Observable, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {
  type AddonDatasetDocument,
  type AddonDatasetListenerEvent,
  createAddonDatasetListenerStore,
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
