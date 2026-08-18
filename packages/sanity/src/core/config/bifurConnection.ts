import {fromEvent, NEVER, Observable, ReplaySubject, timer} from 'rxjs'
import {share, takeUntil} from 'rxjs/operators'

// TODO(bifur-client): this module is a temporary in-repo copy of the connection fix landing in
// `@sanity/bifur-client` itself (https://github.com/sanity-io/bifur-client/pull/30). Once the
// studio depends on a client version whose `fromUrl` has these connection semantics,
// `getBifurClient` can go back to `fromUrl` and this module (plus its test) can be deleted.

/**
 * How long the WebSocket stays connected after the last subscriber has unsubscribed.
 *
 * Consumers of the bifur streams (presence, connection status) unsubscribe and resubscribe
 * across React's render/effect cycle — most notably `useObservable`'s render-phase warm-up
 * subscription, torn down a microtask later, with the real `useSyncExternalStore` subscription
 * only arriving with the passive effects. Disconnecting the moment the subscriber count hits
 * zero closes the socket mid-handshake (the "WebSocket is closed before the connection is
 * established" browser warning) and immediately opens a replacement.
 *
 * This must be a wall-clock grace period, not a one-task `timer(0)` delay: during studio boot
 * the passive-effect resubscription lands 100–200ms after the warm-up teardown (React's effect
 * flush yields to other main-thread work), so a one-task delay still tears the connection down
 * in between — observed as two to three connection attempts per page load, with abandoned
 * sockets closed right after their handshake completes. Five seconds matches the
 * `LISTENER_RESET_DELAY` convention used for the shared SSE listeners.
 */
const DISCONNECT_GRACE_PERIOD = 5_000

const CLOSE_CODE_NORMAL = 1000
const CLOSE_REASON = 'WebSockets connection closed by client'

/**
 * Mirrors the (unexported) `WebSocketError` that `@sanity/bifur-client`'s own `fromUrl` connection
 * emits, so downstream error handling (e.g. the connection status store's retry loop) sees the
 * same shape now that the studio creates the connection itself.
 *
 * @internal
 */
export class BifurConnectionError extends Error {
  type: 'CONNECTION_ERROR' | 'CONNECTION_CLOSED'
  code: number | undefined
  reason: string | undefined
  constructor(type: 'CONNECTION_ERROR' | 'CONNECTION_CLOSED', code?: number, reason?: string) {
    super('WebSocket connection error')
    this.name = 'BifurConnectionError'
    this.type = type
    this.code = code
    this.reason = reason
  }
}

/**
 * Closes the socket without triggering the "WebSocket is closed before the connection is
 * established" browser warning: calling `close()` on a socket that is still `CONNECTING` aborts
 * the handshake and logs that warning, so instead the close is deferred until the handshake
 * settles. If the handshake fails, the socket never opens and there is nothing to close.
 */
function closeSocket(ws: WebSocket): void {
  if (ws.readyState === ws.CONNECTING) {
    ws.onopen = () => ws.close(CLOSE_CODE_NORMAL, CLOSE_REASON)
  } else if (ws.readyState === ws.OPEN) {
    ws.close(CLOSE_CODE_NORMAL, CLOSE_REASON)
  }
}

/**
 * Bridges one WebSocket connection attempt into the reactive world: emits the socket once its
 * handshake completes, errors if the connection fails or is closed by the other end, and closes
 * the socket (gracefully, see {@link closeSocket}) on teardown.
 */
function connectToWebSocket(
  url: string,
  createWebSocket: (wsUrl: string) => WebSocket,
): Observable<WebSocket> {
  return new Observable<WebSocket>((subscriber) => {
    const ws = createWebSocket(url)
    ws.onopen = () => subscriber.next(ws)
    ws.onerror = () => subscriber.error(new BifurConnectionError('CONNECTION_ERROR'))
    ws.onclose = (event) =>
      subscriber.error(new BifurConnectionError('CONNECTION_CLOSED', event.code, event.reason))
    return () => {
      ws.onopen = null
      ws.onerror = null
      ws.onclose = null
      closeSocket(ws)
    }
  })
}

/**
 * A shared WebSocket connection for `@sanity/bifur-client`'s `createClient`, replacing the
 * connection half of the client's own `fromUrl`. It emits the open socket to every subscriber,
 * connecting lazily on the first subscription and disconnecting only after
 * {@link DISCONNECT_GRACE_PERIOD} with no subscribers, so momentary zero-subscriber gaps neither
 * abort an in-flight handshake nor churn established connections. The socket closes immediately
 * (and gracefully) when the page unloads, and an unexpected disconnect errors current subscribers
 * while later subscribers trigger a fresh connection attempt.
 *
 * @internal
 */
export function createBifurConnection(
  url: string,
  createWebSocket: (wsUrl: string) => WebSocket = (wsUrl) => new WebSocket(wsUrl),
): Observable<WebSocket> {
  return connectToWebSocket(url, createWebSocket).pipe(
    takeUntil(typeof window === 'undefined' ? NEVER : fromEvent(window, 'beforeunload')),
    share({
      connector: () => new ReplaySubject<WebSocket>(1),
      resetOnError: true,
      resetOnComplete: true,
      resetOnRefCountZero: () => timer(DISCONNECT_GRACE_PERIOD),
    }),
  )
}
