import {fromUrl, WebSocketError} from '@sanity/bifur-client'
import {type Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

/**
 * Guards the WebSocket connection semantics of `@sanity/bifur-client`'s `fromUrl`, which the
 * studio currently gets from a pnpm patch (`patches/@sanity__bifur-client@1.0.0.patch`) applying
 * https://github.com/sanity-io/bifur-client/pull/30 ahead of its release:
 *
 * - a socket that is still `CONNECTING` is never closed mid-handshake (which browsers punish
 *   with the "WebSocket is closed before the connection is established" console warning) — a
 *   teardown-time close is deferred until the handshake settles, and
 * - the shared connection survives momentary zero-subscriber gaps (React render/effect cycles,
 *   e.g. react-rx `useObservable`'s render-phase warm-up subscription) instead of disconnecting
 *   the moment the subscriber count blips to zero.
 *
 * The suite runs against whatever `@sanity/bifur-client` resolves to, so once the patch is
 * replaced by a version bump it verifies the released client preserves these semantics.
 */

class FakeWebSocket {
  static instances: FakeWebSocket[] = []

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

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  // `createClient` listens for 'message' events via rxjs `fromEvent`
  addEventListener(): void {}
  removeEventListener(): void {}

  close(code?: number, reason?: string): void {
    this.closeCalls.push({code, reason, readyStateAtCall: this.readyState})
    this.readyState = this.CLOSING
  }

  // -- test controls --
  finishHandshake(): void {
    this.readyState = this.OPEN
    this.onopen?.()
  }

  remoteClose(code: number, reason: string): void {
    this.readyState = this.CLOSED
    this.onclose?.({code, reason})
  }
}

const GRACEFUL_CLOSE = {
  code: 1000,
  reason: 'WebSockets connection closed by client',
}

describe('the patched @sanity/bifur-client connection (fromUrl)', () => {
  let subscriptions: Subscription[]

  const createHeartbeats = () =>
    fromUrl('wss://example.api.sanity.io/v2022-06-30/socket/test').heartbeats

  const subscribe = (
    heartbeats$: ReturnType<typeof createHeartbeats>,
    observer?: {next?: (date: Date) => void; error?: (err: unknown) => void; complete?: () => void},
  ) => {
    const subscription = heartbeats$.subscribe({
      next: observer?.next,
      error: observer?.error ?? (() => {}),
      complete: observer?.complete,
    })
    subscriptions.push(subscription)
    return subscription
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    FakeWebSocket.instances = []
    subscriptions = []
  })

  afterEach(() => {
    for (const subscription of subscriptions) subscription.unsubscribe()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens a single connection shared between concurrent subscribers', () => {
    const heartbeats$ = createHeartbeats()
    const beats: Date[] = []
    subscribe(heartbeats$, {next: (date) => beats.push(date)})
    subscribe(heartbeats$, {next: (date) => beats.push(date)})

    expect(FakeWebSocket.instances).toHaveLength(1)

    FakeWebSocket.instances[0].finishHandshake()

    // Each subscriber gets a heartbeat for the connection itself
    expect(beats).toHaveLength(2)
  })

  it('keeps an in-flight handshake alive across a momentary zero-subscriber gap', () => {
    const heartbeats$ = createHeartbeats()
    // The shape of react-rx `useObservable`'s render-phase warm-up: subscribe, unsubscribe a
    // beat later, resubscribe from the effect phase. This used to close the CONNECTING socket
    // immediately, making browsers warn "WebSocket is closed before the connection is
    // established" and forcing a second connection.
    subscribe(heartbeats$).unsubscribe()

    const [socket] = FakeWebSocket.instances
    expect(socket.closeCalls).toHaveLength(0)

    const beats: Date[] = []
    subscribe(heartbeats$, {next: (date) => beats.push(date)})
    socket.finishHandshake()

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(beats).toHaveLength(1)
    expect(socket.closeCalls).toHaveLength(0)
  })

  it('never closes a socket mid-handshake: teardown while connecting defers close until open', () => {
    const heartbeats$ = createHeartbeats()
    subscribe(heartbeats$).unsubscribe()

    // The disconnect delay elapses while the socket is still CONNECTING: no close yet
    vi.runAllTimers()
    const [socket] = FakeWebSocket.instances
    expect(socket.closeCalls).toHaveLength(0)

    // Once the handshake settles, the deferred close runs against the OPEN socket
    socket.finishHandshake()
    expect(socket.closeCalls).toEqual([{...GRACEFUL_CLOSE, readyStateAtCall: socket.OPEN}])
  })

  it('closes an open socket gracefully once the disconnect delay elapses without subscribers', () => {
    const heartbeats$ = createHeartbeats()
    subscribe(heartbeats$)
    const [socket] = FakeWebSocket.instances
    socket.finishHandshake()
    subscriptions.pop()!.unsubscribe()

    // Not synchronously on unsubscribe...
    expect(socket.closeCalls).toHaveLength(0)

    // ...but once the disconnect delay has elapsed
    vi.runAllTimers()
    expect(socket.closeCalls).toEqual([{...GRACEFUL_CLOSE, readyStateAtCall: socket.OPEN}])

    // A subscriber arriving after the disconnect starts a fresh connection
    subscribe(heartbeats$)
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('reuses the connection for subscribers arriving before the disconnect delay elapses', () => {
    const heartbeats$ = createHeartbeats()
    subscribe(heartbeats$)
    const [socket] = FakeWebSocket.instances
    socket.finishHandshake()
    subscriptions.pop()!.unsubscribe()

    const beats: Date[] = []
    subscribe(heartbeats$, {next: (date) => beats.push(date)})

    // The replayed connection emits synchronously; the pending disconnect is cancelled
    expect(beats).toHaveLength(1)
    vi.runAllTimers()
    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(socket.closeCalls).toHaveLength(0)
  })

  it('errors subscribers when the connection closes unexpectedly, and reconnects on resubscribe', () => {
    const heartbeats$ = createHeartbeats()
    const errors: unknown[] = []
    subscribe(heartbeats$, {error: (err) => errors.push(err)})
    const [socket] = FakeWebSocket.instances
    socket.finishHandshake()

    socket.remoteClose(4001, 'unauthorized')

    expect(errors).toHaveLength(1)
    const error = errors[0] as WebSocketError
    expect(error).toBeInstanceOf(WebSocketError)
    expect(error.type).toBe('CONNECTION_CLOSED')
    expect(error.code).toBe(4001)
    expect(error.reason).toBe('unauthorized')

    // The share resets on error, so the next subscriber triggers a new connection
    subscribe(heartbeats$)
    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('closes the socket immediately when the page unloads', () => {
    const heartbeats$ = createHeartbeats()
    subscribe(heartbeats$)
    const [socket] = FakeWebSocket.instances
    socket.finishHandshake()

    // The connection completes through the `takeUntil` sitting before the share. `heartbeats`
    // itself cannot be asserted on for completion — it merges in the socket's message streams,
    // which never complete — so the graceful close is the observable effect. It must happen
    // immediately (no timer advance): unloading is not subject to the disconnect delay.
    window.dispatchEvent(new Event('beforeunload'))

    expect(socket.closeCalls).toEqual([{...GRACEFUL_CLOSE, readyStateAtCall: socket.OPEN}])
  })
})
