import {ChannelError, ConnectionFailedError, DisconnectError} from '@sanity/client'
import {defer, EMPTY, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createListenerOutages} from '../listenerOutages'
import {
  reconnectDelay,
  reconnectListener,
  type ReconnectListenerOptions,
} from '../reconnectListener'

type ListenerEvent = {type: 'welcome' | 'welcomeback' | 'reset' | 'reconnect' | 'mutation'}

/**
 * A listener whose connections can each be driven separately: every subscription opens a new
 * connection, as `client.listen()` does.
 */
function createListener() {
  const connections: Subject<ListenerEvent>[] = []
  const listener$ = defer(() => {
    const connection = new Subject<ListenerEvent>()
    connections.push(connection)
    return connection
  })
  return {connections, listener$, current: () => connections[connections.length - 1]}
}

function internalError() {
  return new ChannelError('Internal error', {error: {description: 'Internal error'}})
}

// No jitter: every delay is its full ceiling. Every test shares outages within itself only.
let noJitter: ReconnectListenerOptions = {random: () => 1}

function subscribe(options: ReconnectListenerOptions = noJitter) {
  const listener = createListener()
  const events: ListenerEvent[] = []
  const errors: unknown[] = []
  const subscription = listener.listener$.pipe(reconnectListener(options)).subscribe({
    next: (event) => events.push(event as ListenerEvent),
    error: (error) => errors.push(error),
  })
  return {...listener, events, errors, subscription}
}

describe('reconnectListener', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    noJitter = {random: () => 1, outages: createListenerOutages()}
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes listener events through', () => {
    const {current, events} = subscribe()
    current().next({type: 'welcome'})
    current().next({type: 'mutation'})
    expect(events).toEqual([{type: 'welcome'}, {type: 'mutation'}])
  })

  it('emits reconnect and opens a new connection after a transient error', async () => {
    const {connections, current, events, errors} = subscribe()
    current().next({type: 'welcome'})
    current().error(internalError())

    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}])
    expect(connections).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(connections).toHaveLength(2)

    current().next({type: 'welcome'})
    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}, {type: 'welcome'}])
    expect(errors).toEqual([])
  })

  it('reconnects a listener that fails before it welcomes', async () => {
    const {connections, current, events} = subscribe()
    current().error(internalError())

    expect(events).toEqual([{type: 'reconnect'}])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(connections).toHaveLength(2)
  })

  it('backs off exponentially and emits a single reconnect for the whole outage', async () => {
    const {connections, current, events} = subscribe()
    current().next({type: 'welcome'})

    async function failAndExpectReconnectAfter(delayMs: number) {
      const connectionCount = connections.length
      current().error(internalError())
      await vi.advanceTimersByTimeAsync(delayMs - 1)
      expect(connections).toHaveLength(connectionCount)
      await vi.advanceTimersByTimeAsync(1)
      expect(connections).toHaveLength(connectionCount + 1)
    }

    await failAndExpectReconnectAfter(1_000)
    await failAndExpectReconnectAfter(2_000)
    await failAndExpectReconnectAfter(4_000)
    await failAndExpectReconnectAfter(8_000)

    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}])
  })

  it('caps the delay', async () => {
    const {connections, current} = subscribe({...noJitter, maxDelayMs: 3_000})
    current().error(internalError())
    await vi.advanceTimersByTimeAsync(1_000)
    current().error(internalError())
    await vi.advanceTimersByTimeAsync(2_000)
    current().error(internalError())
    await vi.advanceTimersByTimeAsync(2_999)
    expect(connections).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(1)
    expect(connections).toHaveLength(4)
  })

  it.each(['welcome', 'welcomeback', 'reset'] as const)(
    'starts the backoff over once a connection opens with %s',
    async (type) => {
      const {connections, current, events} = subscribe()
      current().error(internalError())
      await vi.advanceTimersByTimeAsync(1_000)
      current().error(internalError())
      await vi.advanceTimersByTimeAsync(2_000)
      current().next({type})

      current().error(internalError())
      await vi.advanceTimersByTimeAsync(1_000)

      expect(connections).toHaveLength(4)
      // The second outage is announced too.
      expect(events).toEqual([{type: 'reconnect'}, {type}, {type: 'reconnect'}])
    },
  )

  it('does not announce an outage the listener already announced', async () => {
    const {connections, current, events} = subscribe()
    current().next({type: 'welcome'})
    current().next({type: 'reconnect'})
    current().error(new ConnectionFailedError('EventSource connection failed', {status: 503}))

    expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(connections).toHaveLength(2)
  })

  it.each([
    ['a query parse error', new ChannelError('Bad query', {error: {type: 'queryParseError'}})],
    ['a disconnect', new DisconnectError('Server disconnected client')],
    ['a rejected session', new ConnectionFailedError('Rejected', {status: 401})],
  ])('passes on %s without reconnecting', async (_, error) => {
    const {connections, current, events, errors} = subscribe()
    current().next({type: 'welcome'})
    current().error(error)

    expect(errors).toEqual([error])
    expect(events).toEqual([{type: 'welcome'}])
    await vi.advanceTimersByTimeAsync(60_000)
    expect(connections).toHaveLength(1)
  })

  it('stops reconnecting when unsubscribed', async () => {
    const {connections, current, subscription} = subscribe()
    current().error(internalError())
    subscription.unsubscribe()

    await vi.advanceTimersByTimeAsync(60_000)
    expect(connections).toHaveLength(1)
  })

  describe('when the client keeps failing to reconnect on its own', () => {
    it('leaves a single failed attempt to the client', async () => {
      const {connections, current, events} = subscribe()
      current().next({type: 'welcome'})
      current().next({type: 'reconnect'})
      current().next({type: 'welcome'})
      current().next({type: 'reconnect'})

      await vi.advanceTimersByTimeAsync(60_000)
      expect(connections).toHaveLength(1)
      expect(connections[0].observed).toBe(true)
      expect(events).toEqual([
        {type: 'welcome'},
        {type: 'reconnect'},
        {type: 'welcome'},
        {type: 'reconnect'},
      ])
    })

    it('replaces the connection with one opened with backoff after the second failed attempt', async () => {
      const {connections, current, events} = subscribe()
      current().next({type: 'welcome'})
      current().next({type: 'reconnect'})
      current().next({type: 'reconnect'})

      // The client's own connection is closed, so its fixed-interval retries stop.
      expect(connections[0].observed).toBe(false)
      await vi.advanceTimersByTimeAsync(999)
      expect(connections).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(connections).toHaveLength(2)
      expect(events).toEqual([{type: 'welcome'}, {type: 'reconnect'}])
    })

    it('replaces connections opened with backoff after their first failed attempt', async () => {
      const {connections, current, events} = subscribe()
      current().next({type: 'reconnect'})
      current().next({type: 'reconnect'})
      await vi.advanceTimersByTimeAsync(1_000)

      current().next({type: 'reconnect'})
      await vi.advanceTimersByTimeAsync(1_999)
      expect(connections).toHaveLength(2)
      await vi.advanceTimersByTimeAsync(1)
      expect(connections).toHaveLength(3)

      current().next({type: 'welcome'})
      expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    })

    it('leaves failed attempts to the client again once a connection opens', async () => {
      const {connections, current} = subscribe()
      current().next({type: 'reconnect'})
      current().next({type: 'reconnect'})
      await vi.advanceTimersByTimeAsync(1_000)
      current().next({type: 'welcome'})

      current().next({type: 'reconnect'})
      await vi.advanceTimersByTimeAsync(60_000)
      expect(connections).toHaveLength(2)
      expect(connections[1].observed).toBe(true)
    })

    it('honours maxClientReconnects', async () => {
      const {connections, current} = subscribe({...noJitter, maxClientReconnects: 3})
      current().next({type: 'reconnect'})
      current().next({type: 'reconnect'})
      expect(connections[0].observed).toBe(true)
      current().next({type: 'reconnect'})
      expect(connections[0].observed).toBe(false)
    })
  })

  describe('when a connection does not open', () => {
    it('starts an outage after 10s and keeps the connection', async () => {
      const {connections, current, events} = subscribe()
      await vi.advanceTimersByTimeAsync(9_999)
      expect(events).toEqual([])
      await vi.advanceTimersByTimeAsync(1)
      expect(events).toEqual([{type: 'reconnect'}])
      expect(connections).toHaveLength(1)
      expect(connections[0].observed).toBe(true)

      // Opening late ends the outage.
      current().next({type: 'welcome'})
      current().error(internalError())
      expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}, {type: 'reconnect'}])
    })

    it('does not announce the outage again when the client then fails to reconnect', async () => {
      const {connections, current, events} = subscribe({...noJitter, maxClientReconnects: 3})
      await vi.advanceTimersByTimeAsync(10_000)
      current().next({type: 'reconnect'})
      current().next({type: 'reconnect'})

      expect(events).toEqual([{type: 'reconnect'}])
      expect(connections[0].observed).toBe(true)

      current().next({type: 'welcome'})
      expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    })

    it.each(['welcome', 'welcomeback', 'reset'] as const)(
      'does not start an outage when the connection opens with %s in time',
      async (type) => {
        const {current, events} = subscribe()
        await vi.advanceTimersByTimeAsync(9_999)
        current().next({type})
        await vi.advanceTimersByTimeAsync(60_000)
        expect(events).toEqual([{type}])
      },
    )

    it('honours welcomeTimeoutMs', async () => {
      const {events} = subscribe({...noJitter, welcomeTimeoutMs: 2_000})
      await vi.advanceTimersByTimeAsync(2_000)
      expect(events).toEqual([{type: 'reconnect'}])
    })

    it.each([
      ['after it welcomes', of<ListenerEvent>({type: 'welcome'})],
      ['before it welcomes', EMPTY],
    ])('completes as soon as the listener completes %s', (_, listener$) => {
      const events: unknown[] = []
      let completed = false
      listener$.pipe(reconnectListener(noJitter)).subscribe({
        next: (event) => events.push(event),
        complete: () => {
          completed = true
        },
      })
      expect(completed).toBe(true)
      expect(events).toEqual(listener$ === EMPTY ? [] : [{type: 'welcome'}])
    })

    it('times each connection separately', async () => {
      const {current, events} = subscribe()
      await vi.advanceTimersByTimeAsync(5_000)
      current().error(internalError())
      await vi.advanceTimersByTimeAsync(1_000)
      current().next({type: 'welcome'})

      // The closed connection's timeout would have ended now.
      await vi.advanceTimersByTimeAsync(60_000)
      expect(events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    })
  })

  describe('when another listener is down', () => {
    it('starts the outage of a new connection right away, and keeps the connection', async () => {
      const down = subscribe()
      down.current().error(internalError())

      const late = subscribe()
      expect(late.events).toEqual([])
      await vi.advanceTimersByTimeAsync(0)
      expect(late.events).toEqual([{type: 'reconnect'}])
      expect(late.connections[0].observed).toBe(true)

      late.current().next({type: 'welcome'})
      expect(late.events).toEqual([{type: 'reconnect'}, {type: 'welcome'}])
    })

    it('starts the outage of a connection that is waiting to open', async () => {
      const waiting = subscribe()
      await vi.advanceTimersByTimeAsync(1_000)

      subscribe().current().next({type: 'reconnect'})
      await vi.advanceTimersByTimeAsync(0)
      expect(waiting.events).toEqual([{type: 'reconnect'}])
    })

    it('leaves connections that are open alone', async () => {
      const open = subscribe()
      open.current().next({type: 'welcome'})

      subscribe().current().error(internalError())
      await vi.advanceTimersByTimeAsync(0)
      expect(open.events).toEqual([{type: 'welcome'}])
    })

    it('waits out the timeout again once a listener connects', async () => {
      const down = subscribe()
      down.current().error(internalError())
      await vi.advanceTimersByTimeAsync(1_000)
      down.current().next({type: 'welcome'})

      const late = subscribe()
      await vi.advanceTimersByTimeAsync(9_999)
      expect(late.events).toEqual([])
      await vi.advanceTimersByTimeAsync(1)
      expect(late.events).toEqual([{type: 'reconnect'}])
    })

    it('waits out the timeout again once every listener that is down has gone', async () => {
      const down = subscribe()
      down.current().error(internalError())
      down.subscription.unsubscribe()

      const late = subscribe()
      await vi.advanceTimersByTimeAsync(9_999)
      expect(late.events).toEqual([])
    })

    it('is down again when a listener fails after another one connected', async () => {
      const down = subscribe()
      down.current().error(internalError())
      subscribe().current().next({type: 'welcome'})

      // The listener that was down is still down, and its next attempt fails too.
      await vi.advanceTimersByTimeAsync(1_000)
      down.current().error(internalError())

      const late = subscribe()
      await vi.advanceTimersByTimeAsync(0)
      expect(late.events).toEqual([{type: 'reconnect'}])
    })
  })

  describe('sharing outages by project', () => {
    let projectCounter = 0
    // Each test gets projects of its own: the registry of a project outlives a test.
    const uniqueProject = () => `project-${(projectCounter += 1)}`

    it('starts the outage of a new connection right away while a listener of its project is down', async () => {
      const projectId = uniqueProject()
      subscribe({random: () => 1, projectId})
        .current()
        .error(internalError())

      const late = subscribe({random: () => 1, projectId})
      await vi.advanceTimersByTimeAsync(0)
      expect(late.events).toEqual([{type: 'reconnect'}])
    })

    it('waits out the timeout while only a listener of another project is down', async () => {
      subscribe({random: () => 1, projectId: uniqueProject()})
        .current()
        .error(internalError())

      const other = subscribe({random: () => 1, projectId: uniqueProject()})
      await vi.advanceTimersByTimeAsync(9_999)
      expect(other.events).toEqual([])
      await vi.advanceTimersByTimeAsync(1)
      expect(other.events).toEqual([{type: 'reconnect'}])
    })

    it('shares nothing without a project', async () => {
      subscribe({random: () => 1})
        .current()
        .error(internalError())

      const late = subscribe({random: () => 1})
      await vi.advanceTimersByTimeAsync(9_999)
      expect(late.events).toEqual([])
    })
  })

  it('keeps the backoff of each subscription separate', async () => {
    const listener = createListener()
    const recovered$ = listener.listener$.pipe(reconnectListener(noJitter))
    recovered$.subscribe()
    listener.current().error(internalError())
    await vi.advanceTimersByTimeAsync(1_000)
    listener.current().error(internalError())

    // A new subscriber starts at the first delay, not the first subscriber's third.
    recovered$.subscribe()
    listener.current().error(internalError())
    await vi.advanceTimersByTimeAsync(1_000)
    expect(listener.connections).toHaveLength(4)
  })
})

describe('reconnectDelay', () => {
  it('doubles the ceiling for every attempt, up to the maximum', () => {
    const delays = [0, 1, 2, 3, 4, 5, 6].map((attempt) => reconnectDelay(attempt, noJitter))
    expect(delays).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000])
  })

  it('picks a delay in the upper half of the ceiling', () => {
    expect(reconnectDelay(2, {random: () => 0})).toBe(2_000)
    expect(reconnectDelay(2, {random: () => 0.5})).toBe(3_000)
    expect(reconnectDelay(2, {random: () => 1})).toBe(4_000)
  })
})
