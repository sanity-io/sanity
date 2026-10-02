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
import {
  isAuthFetchEndpoint,
  isLogoutEndpoint,
  isOAuthEndpoint,
  isOAuthTokenEndpoint,
  isPublicEndpoint,
} from './routes'

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

/**
 * The bodies the API returns for its two invalid-session 401 variants,
 * byte-for-byte (verified against the live API):
 *  - `SIO-401-AEX` — the session has expired
 *  - `SIO-401-ANF` — the session was not found (revoked on another device,
 *    purged after expiry, or a stale/bogus stored token)
 *
 * The third variant is a hypothesis, not a recording: the RFC 6750 bearer token
 * error a resource server answers an expired OAuth access token with, without
 * any Sanity error code. The studio's OAuth store only renews on the two codes
 * above, so this variant shows what happens when the API does not send them.
 */
const INVALID_SESSION_BODIES = {
  'invalid_token': JSON.stringify({
    error: 'invalid_token',
    error_description: 'The access token expired',
  }),
  'SIO-401-AEX': JSON.stringify({
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Session is expired, please re-authenticate',
    errorCode: 'SIO-401-AEX',
  }),
  'SIO-401-ANF': JSON.stringify({
    error: 'Unauthorized',
    statusCode: 401,
    message: 'Session not found',
    errorCode: 'SIO-401-ANF',
  }),
}

/** One of the API's invalid-session 401 error codes. */
export type InvalidSessionCode = keyof typeof INVALID_SESSION_BODIES

/**
 * Wrap a handler so that, once the session is considered invalid, every request
 * is answered with one of the API's invalid-session 401s instead of being
 * forwarded upstream — the real token is still valid, so there is no upstream
 * response to rewrite. `errorCode` picks the variant: `SIO-401-AEX` simulates a
 * token that expires mid-session, `SIO-401-ANF` a session that stops resolving
 * (revoked on another device, purged, or a stale stored token — "Session not
 * found"). Either way the studio keeps working until `isInvalid()` flips, then
 * sees its session lapse and should enter its forced-logout /
 * re-authentication flow.
 *
 * `isInvalid` is evaluated per request, so a time-based deadline invalidates
 * the session live without restarting the proxy (pass `() => true` to start
 * invalid). CORS preflights (OPTIONS) always pass through so the browser can
 * actually read the 401 once it fires. Logout (`/auth/logout`) is always
 * answered with a synthetic 204 and never forwarded upstream — the studio can
 * still tear the session down, but the developer's real credentials are never
 * invalidated (regardless of whether the simulated session is invalid yet).
 * Public endpoints that don't require auth (e.g. `/auth/providers`, which the
 * login screen needs) are forwarded upstream — the real API only 401s
 * endpoints that require a session.
 *
 * Re-login is supported even while invalid: the token-exchange endpoint
 * (`/auth/fetch`, which the studio hits with a fresh session ID right after a
 * login callback) is forwarded upstream rather than 401'd, and `onReauthenticated`
 * is invoked so the caller can re-arm the deadline — letting you log back in
 * and have the simulated session lapse again later, all without restarting
 * the proxy.
 */
export function invalidSession(
  handler: ProxyHandler,
  isInvalid: () => boolean = () => true,
  {
    errorCode = 'SIO-401-AEX',
    onReauthenticated,
  }: {errorCode?: InvalidSessionCode; onReauthenticated?: () => void} = {},
): ProxyHandler {
  const isLogout = isLogoutEndpoint()
  const isPublic = isPublicEndpoint()
  const isAuthFetch = isAuthFetchEndpoint()
  const isOAuth = isOAuthEndpoint()
  const isOAuthToken = isOAuthTokenEndpoint()
  return (req, res, target) => {
    const corsHeaders = {
      'access-control-allow-origin': req.headers.origin ?? '*',
      'access-control-allow-credentials': 'true',
    }
    // Always stub logout with a synthetic 204 (never forward it upstream): the
    // studio needs to complete logout to escape the expired state, but actually
    // forwarding it would invalidate the developer's real credentials. The
    // OPTIONS preflight still passes through below so the browser can issue the
    // logout request in the first place.
    if (req.method !== 'OPTIONS' && isLogout(req)) {
      writeResponseHead(res, 204, 'No Content', corsHeaders)
      res.end()
      return new Subscription()
    }
    // A token exchange means the user just logged in again — forward it upstream
    // (even while expired, so the fresh session ID can be swapped for a token)
    // and re-arm the expiry deadline so the new session lives on.
    if (req.method !== 'OPTIONS' && isAuthFetch(req)) {
      onReauthenticated?.()
      return handler(req, res, target)
    }
    // An OAuth studio never sends its session to the OAuth endpoints: the code
    // exchange and every refresh go to the token endpoint with a code or a
    // refresh token, and revocation carries the token being revoked. All of
    // them are forwarded, and a token endpoint request re-arms the deadline
    // like `/auth/fetch` does — the studio holds a new access token afterwards.
    if (req.method !== 'OPTIONS' && isOAuth(req)) {
      if (isOAuthToken(req)) onReauthenticated?.()
      return handler(req, res, target)
    }
    if (req.method === 'OPTIONS' || isPublic(req) || !isInvalid()) {
      return handler(req, res, target)
    }
    writeResponseHead(res, 401, 'Unauthorized', {
      'content-type': 'application/json',
      ...corsHeaders,
      // RFC 6750 section 3: a bearer challenge names the error in the header.
      ...(errorCode === 'invalid_token'
        ? {'www-authenticate': 'Bearer error="invalid_token"'}
        : {}),
    })
    res.end(INVALID_SESSION_BODIES[errorCode])
    return new Subscription()
  }
}

/**
 * Wrap a handler so that, once `isRefused()` returns true, every `POST` to the
 * OAuth token endpoint is answered with the RFC 6749 `invalid_grant` error
 * instead of being forwarded — what the authorization server answers when the
 * refresh token expired, was already redeemed, or its session was revoked in
 * Manage. Everything else, including the API requests the current access token
 * still authenticates, passes through. This is the one failure the studio's
 * OAuth store treats as the end of the session, so it exercises the forced
 * sign-out path; a code exchange after a fresh sign-in is refused too while
 * `isRefused()` holds, so pair it with a deadline, or restart the proxy to sign
 * in again. CORS preflights always pass through so the browser can read the 400.
 */
export function refusedRefreshToken(
  handler: ProxyHandler,
  isRefused: () => boolean = () => true,
): ProxyHandler {
  const isOAuthToken = isOAuthTokenEndpoint()
  return (req, res, target) => {
    if (req.method !== 'POST' || !isOAuthToken(req) || !isRefused()) {
      return handler(req, res, target)
    }
    writeResponseHead(res, 400, 'Bad Request', {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': req.headers.origin ?? '*',
    })
    res.end(
      JSON.stringify({
        error: 'invalid_grant',
        error_description: 'The refresh token is invalid, expired or revoked',
      }),
    )
    return new Subscription()
  }
}

/**
 * {@link invalidSession} preconfigured for the expired-session variant
 * (`SIO-401-AEX`) — kept as the named scenario for the common case.
 */
export function expiredToken(
  handler: ProxyHandler,
  isExpired: () => boolean = () => true,
  {onReauthenticated}: {onReauthenticated?: () => void} = {},
): ProxyHandler {
  return invalidSession(handler, isExpired, {errorCode: 'SIO-401-AEX', onReauthenticated})
}
