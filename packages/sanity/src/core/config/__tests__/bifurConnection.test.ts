import {type Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {BifurConnectionError, createBifurConnection} from '../bifurConnection'

const GRACE_PERIOD = 5_000

class FakeWebSocket {
  CONNECTING = 0 as const
  OPEN = 1 as const
  CLOSING = 2 as const
  CLOSED = 3 as const

  readyState: number = this.CONNECTING
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  onclose: ((event: {code: number; reason: string}) => void) | null = null

  closeCalls: {code: number | undefined; reason: string | undefined; readyStateAtCall: number}[] =
    []

  constructor(public url: string) {}

  close(code?: number, reason?: string): void {
    this.closeCalls.push({code, reason, readyStateAtCall: this.readyState})
    this.readyState = this.CLOSING
  }

  // -- test controls --
  finishHandshake(): void {
    this.readyState = this.OPEN
    this.onopen?.()
  }

  disconnect(code: number, reason: string): void {
    this.readyState = this.CLOSED
    this.onclose?.({code, reason})
  }

  emitError(): void {
    this.onerror?.()
  }
}

describe('createBifurConnection', () => {
  let sockets: FakeWebSocket[]
  let subscriptions: Subscription[]

  const createConnection = () =>
    createBifurConnection('wss://example.api.sanity.io/v2022-06-30/socket/test', (url) => {
      const socket = new FakeWebSocket(url)
      sockets.push(socket)
      return socket as unknown as WebSocket
    })

  const subscribe = (
    connection$: ReturnType<typeof createConnection>,
    observer?: {
      next?: (ws: WebSocket) => void
      error?: (err: unknown) => void
      complete?: () => void
    },
  ) => {
    const subscription = connection$.subscribe({
      next: observer?.next,
      error: observer?.error ?? (() => {}),
      complete: observer?.complete,
    })
    subscriptions.push(subscription)
    return subscription
  }

  beforeEach(() => {
    vi.useFakeTimers()
    sockets = []
    subscriptions = []
  })

  afterEach(() => {
    for (const subscription of subscriptions) subscription.unsubscribe()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('emits the socket to every subscriber once the handshake completes, using one connection', () => {
    const connection$ = createConnection()
    const received: WebSocket[] = []
    subscribe(connection$, {next: (ws) => received.push(ws)})
    subscribe(connection$, {next: (ws) => received.push(ws)})

    expect(sockets).toHaveLength(1)
    expect(received).toHaveLength(0)

    sockets[0].finishHandshake()

    expect(received).toHaveLength(2)
    expect(received[0]).toBe(sockets[0] as unknown as WebSocket)
    expect(received[1]).toBe(sockets[0] as unknown as WebSocket)
  })

  it('keeps an in-flight handshake alive across a momentary zero-subscriber gap', () => {
    const connection$ = createConnection()
    subscribe(connection$).unsubscribe()

    // The regression under test: this used to close the CONNECTING socket immediately,
    // making browsers warn "WebSocket is closed before the connection is established".
    expect(sockets[0].closeCalls).toHaveLength(0)

    const received: WebSocket[] = []
    subscribe(connection$, {next: (ws) => received.push(ws)})
    sockets[0].finishHandshake()

    expect(sockets).toHaveLength(1)
    expect(received).toEqual([sockets[0]])
    expect(sockets[0].closeCalls).toHaveLength(0)
  })

  it('reuses the open socket for subscribers arriving within the grace period', () => {
    const connection$ = createConnection()
    subscribe(connection$)
    sockets[0].finishHandshake()
    subscriptions.pop()!.unsubscribe()

    vi.advanceTimersByTime(GRACE_PERIOD - 1)

    const received: WebSocket[] = []
    subscribe(connection$, {next: (ws) => received.push(ws)})

    expect(received).toEqual([sockets[0]])
    expect(sockets).toHaveLength(1)

    // The resubscription cancelled the pending disconnect
    vi.advanceTimersByTime(GRACE_PERIOD)
    expect(sockets[0].closeCalls).toHaveLength(0)
  })

  it('closes an open socket gracefully once the grace period elapses without subscribers', () => {
    const connection$ = createConnection()
    subscribe(connection$)
    sockets[0].finishHandshake()
    subscriptions.pop()!.unsubscribe()

    // Not before the grace period has elapsed...
    vi.advanceTimersByTime(GRACE_PERIOD - 1)
    expect(sockets[0].closeCalls).toHaveLength(0)

    // ...but as soon as it has
    vi.advanceTimersByTime(1)
    expect(sockets[0].closeCalls).toEqual([
      {
        code: 1000,
        reason: 'WebSockets connection closed by client',
        readyStateAtCall: sockets[0].OPEN,
      },
    ])

    // A subscriber arriving after the disconnect starts a fresh connection
    subscribe(connection$)
    expect(sockets).toHaveLength(2)
  })

  it('never closes a socket mid-handshake: teardown while connecting defers close until open', () => {
    const connection$ = createConnection()
    subscribe(connection$).unsubscribe()

    // Socket is still CONNECTING when the grace period elapses and teardown runs
    vi.advanceTimersByTime(GRACE_PERIOD)
    expect(sockets[0].closeCalls).toHaveLength(0)

    // Once the handshake settles, the deferred close runs against the OPEN socket
    sockets[0].finishHandshake()
    expect(sockets[0].closeCalls).toEqual([
      {
        code: 1000,
        reason: 'WebSockets connection closed by client',
        readyStateAtCall: sockets[0].OPEN,
      },
    ])
  })

  it('errors subscribers when the connection closes unexpectedly, and reconnects on resubscribe', () => {
    const connection$ = createConnection()
    const errors: unknown[] = []
    subscribe(connection$, {error: (err) => errors.push(err)})
    sockets[0].finishHandshake()

    sockets[0].disconnect(4001, 'unauthorized')

    expect(errors).toHaveLength(1)
    const error = errors[0] as BifurConnectionError
    expect(error).toBeInstanceOf(BifurConnectionError)
    expect(error.type).toBe('CONNECTION_CLOSED')
    expect(error.code).toBe(4001)
    expect(error.reason).toBe('unauthorized')

    // The share resets on error, so the next subscriber triggers a new connection
    subscribe(connection$)
    expect(sockets).toHaveLength(2)
  })

  it('errors subscribers when the socket errors', () => {
    const connection$ = createConnection()
    const errors: unknown[] = []
    subscribe(connection$, {error: (err) => errors.push(err)})

    sockets[0].emitError()

    expect(errors).toHaveLength(1)
    expect((errors[0] as BifurConnectionError).type).toBe('CONNECTION_ERROR')
  })

  it('completes subscribers and closes the socket immediately when the page unloads', () => {
    const connection$ = createConnection()
    let completed = false
    subscribe(connection$, {complete: () => (completed = true)})
    sockets[0].finishHandshake()

    window.dispatchEvent(new Event('beforeunload'))

    expect(completed).toBe(true)
    expect(sockets[0].closeCalls).toEqual([
      {
        code: 1000,
        reason: 'WebSockets connection closed by client',
        readyStateAtCall: sockets[0].OPEN,
      },
    ])
  })
})
