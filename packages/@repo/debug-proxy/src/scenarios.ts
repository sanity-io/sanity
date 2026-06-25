import {partition, shuffle} from 'es-toolkit'
import {
  bufferTime,
  concatMap,
  delay,
  filter,
  mergeMap,
  type MonoTypeOperatorFunction,
  of,
  pipe,
  Subscription,
} from 'rxjs'

import {type ProxyHandler} from './createDebugProxy'
import {type SSEEvent, writeResponseHead} from './proxy'

/**
 * Delay each event by a random duration in [min, max] ms. Uses `mergeMap` so
 * delays apply per-event (jitter) rather than accumulating in a queue — this
 * reorders events, which is consistent with {@link shuffleEventDelivery} and
 * fine for a fault-injection tool.
 */
export function randomLatency<T>(min: number, max: number) {
  return mergeMap((event: T) =>
    of(event).pipe(delay(Math.round(min + Math.random() * (max - min)))),
  )
}

export function sendReset<T extends SSEEvent>(probability: number) {
  return pipe(
    mergeMap((event: T) => {
      return event.type !== 'message' ||
        event.message.event !== 'mutation' ||
        Math.random() >= probability
        ? [event]
        : [
            {
              ...event,
              message: {
                id: event.message.id,
                event: 'reset',
                data: '{"listenerName": "debug!!"}',
              },
            },
          ]
    }),
  )
}

export function duplicateMutations<T extends SSEEvent>(probability: number) {
  return mergeMap((event: T) => {
    return event.type !== 'message' ||
      event.message.event !== 'mutation' ||
      Math.random() >= probability
      ? [event]
      : [event, event]
  })
}

export function dropMutations<T extends SSEEvent>(probability: number) {
  return filter(
    (event: T) =>
      event.type !== 'message' ||
      event.message.event !== 'mutation' ||
      Math.random() >= probability,
  )
}

export function shuffleEventDelivery<T extends SSEEvent>(
  bufferInterval: number,
): MonoTypeOperatorFunction<T> {
  return pipe(
    bufferTime(bufferInterval),
    concatMap((events) => {
      // welcome should always come first
      const [welcome, rest] = partition(
        events,
        (e) => e.type === 'message' && e.message.event === 'welcome',
      )
      return [...welcome, ...shuffle(rest)]
    }),
  )
}

/** The body the API returns when a session token has expired. */
const EXPIRED_SESSION_BODY = JSON.stringify({
  error: 'Unauthorized',
  statusCode: 401,
  message: 'Session is expired, please re-authenticate',
  errorCode: 'SIO-401-AEX',
})

/**
 * Wrap a handler so that, once the session is considered expired, every request
 * is answered with the API's expired-session 401 instead of being forwarded
 * upstream — the real token is still valid, so there is no upstream response to
 * rewrite. This simulates a token that expires mid-session: the studio keeps
 * working until `isExpired()` flips, then sees its session lapse and should
 * enter its re-authentication flow.
 *
 * `isExpired` is evaluated per request, so a time-based deadline expires the
 * session live without restarting the proxy (pass `() => true` to start
 * expired). CORS preflights (OPTIONS) always pass through so the browser can
 * actually read the 401 once it fires.
 */
export function expiredToken(
  handler: ProxyHandler,
  isExpired: () => boolean = () => true,
): ProxyHandler {
  return (req, res, target) => {
    if (req.method === 'OPTIONS' || !isExpired()) {
      return handler(req, res, target)
    }
    writeResponseHead(res, 401, 'Unauthorized', {
      'content-type': 'application/json',
      'access-control-allow-origin': req.headers.origin ?? '*',
      'access-control-allow-credentials': 'true',
    })
    res.end(EXPIRED_SESSION_BODY)
    return new Subscription()
  }
}
