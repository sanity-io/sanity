/**
 * Dev-only client wrapper for the error playground. Composes the studio's
 * workspace `_requestHandler` so the full classification pipeline runs,
 * but substitutes a synthetic `defaultRequester` for matching demo URLs.
 *
 * Why not patch XHR / fetch directly? get-it can swap transport adapters
 * (xhr in browsers, fetch in workers, possibly more in the future). A
 * client-layer composition is transport-agnostic — it sees only the
 * rxjs Observable<HttpRequestEvent> contract, which is stable.
 *
 * Why not just override `_requestHandler` with synthesis? Because
 * `_requestHandler` is a single slot — overriding it replaces the
 * workspace handler. The classification + dialog pipeline disappears.
 * Composing means we delegate to the workspace handler, only substituting
 * the underlying HTTP at its `defaultRequester` callback.
 */

import {
  ClientError,
  type HttpRequestEvent,
  type RequestHandler,
  type RequestOptions,
  type SanityClient,
  ServerError,
} from '@sanity/client'
import {defer, Observable, throwError} from 'rxjs'

const DEMO_PATH_PREFIX = '/demo/global-error/'

type DemoKind =
  | 'server-error'
  | 'server-error-recoverable'
  | 'rate-limited'
  | 'network-error'
  | 'network-error-recoverable'
  | 'cors-misconfig'

type CorsDemoMode = false | 'denied' | 'no-credentials'
let corsDemoMode: CorsDemoMode = false

/** @internal */
export function setCorsDemoActive(mode: CorsDemoMode): void {
  corsDemoMode = mode
}

// Demo rate-limit window: the first 429 stamps a reset time `RATE_LIMIT_SECONDS`
// into the future. Requests issued before that point also throw 429; requests
// issued after the window closes succeed (and clear the stamp so the next
// 429 demo starts a fresh window). Lets "Try again" actually work in the
// playground.
const RATE_LIMIT_SECONDS = 12
let rateLimitResetAt: number | null = null

function parseDemoKind(url: string): DemoKind | null {
  const idx = url.indexOf(DEMO_PATH_PREFIX)
  if (idx === -1) return null
  const kind = url.slice(idx + DEMO_PATH_PREFIX.length).split('?')[0]
  if (
    kind === 'server-error' ||
    kind === 'server-error-recoverable' ||
    kind === 'rate-limited' ||
    kind === 'network-error' ||
    kind === 'network-error-recoverable' ||
    kind === 'cors-misconfig'
  ) {
    return kind
  }
  return null
}

// '-recoverable' demo kinds fail on the first attempt and succeed on the
// second, so the dialog's "Try again" demonstrates an actual recovery.
const recoverableAttempts = new Map<DemoKind, number>()

function shouldRecover(kind: DemoKind): boolean {
  const attempt = (recoverableAttempts.get(kind) ?? 0) + 1
  if (attempt >= 2) {
    recoverableAttempts.delete(kind)
    return true
  }
  recoverableAttempts.set(kind, attempt)
  return false
}

function makeNetworkError(url: string, method: string): Error {
  // Shape mirrors what get-it produces from a real network failure —
  // a plain Error with `isNetworkError: true` and a `request` object.
  // Both `is-network-error` and the studio's classifier read these.
  // `method` propagates so the dialog's method-aware messaging can branch
  // between read (idempotent) and write (mutation) variants.
  const err = new Error(`Request error while attempting to reach ${url}`) as Error & {
    isNetworkError: boolean
    request: {url: string; method: string}
  }
  err.isNetworkError = true
  err.request = {url, method}
  return err
}

function makeResponseShape(
  options: RequestOptions & {url: string},
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
) {
  return {
    body,
    url: options.url,
    method: options.method ?? 'GET',
    statusCode: status,
    statusMessage:
      status === 503
        ? 'Service Unavailable'
        : status === 429
          ? 'Too Many Requests'
          : status === 401
            ? 'Unauthorized'
            : 'OK',
    headers: {'content-type': 'application/json', ...extraHeaders},
  }
}

/**
 * Build the synthetic observable for a matched request. Returns `null`
 * if the request should pass through to the real network.
 */
function synthesize(options: RequestOptions & {url: string}): Observable<HttpRequestEvent> | null {
  const url = options.url

  // (The `/check/cors` probe doesn't flow through here anymore — it goes
  // through a bare `fetch()` to avoid a preflight, intercepted by
  // `installCheckCorsFetchInterceptor` below.)

  const kind = parseDemoKind(url)
  if (!kind) return null

  if (kind === 'network-error' || kind === 'cors-misconfig') {
    return throwError(() => makeNetworkError(url, options.method ?? 'GET'))
  }
  if (kind === 'network-error-recoverable') {
    if (shouldRecover(kind)) {
      return responseObservable(options, 200, {result: {ok: true, demo: 'network-recovered'}})
    }
    return throwError(() => makeNetworkError(url, options.method ?? 'GET'))
  }
  if (kind === 'server-error' || kind === 'server-error-recoverable') {
    if (kind === 'server-error-recoverable' && shouldRecover(kind)) {
      return responseObservable(options, 200, {result: {ok: true, demo: 'server-recovered'}})
    }
    // Construct a ServerError directly. ClientError/ServerError are what
    // the classifier checks for via `instanceof`, so synthesizing them
    // avoids having to feed a fake response through get-it's middleware
    // chain (which we've replaced).
    return throwError(
      () =>
        new ServerError(makeResponseShape(options, 503, {error: {description: 'Synthetic 503'}})),
    )
  }
  // rate-limited (429) — windowed so "Try again" can actually succeed once
  // the retry-after has elapsed. The first request stamps a reset time;
  // subsequent requests inside the window throw 429 with the remaining
  // seconds; the first request after the window succeeds and clears the
  // stamp so the next 429 demo starts fresh.
  const now = Date.now()
  if (rateLimitResetAt !== null && rateLimitResetAt <= now) {
    rateLimitResetAt = null
    return responseObservable(options, 200, {result: {ok: true, demo: 'rate-limit-cleared'}})
  }
  if (rateLimitResetAt === null) {
    rateLimitResetAt = now + RATE_LIMIT_SECONDS * 1000
  }
  const secondsLeft = Math.max(1, Math.ceil((rateLimitResetAt - now) / 1000))
  return throwError(() => {
    const response = makeResponseShape(
      options,
      429,
      {error: {description: 'Synthetic 429'}},
      {'retry-after': String(secondsLeft)},
    )
    return new ClientError(response)
  })
}

/**
 * Returns an observable that emits a single `response` event then
 * completes. Used for synthesizing successful responses (e.g. the CORS
 * probe verdict).
 */
function responseObservable(
  options: RequestOptions & {url: string},
  status: number,
  body: unknown,
): Observable<HttpRequestEvent> {
  return new Observable<HttpRequestEvent>((subscriber) => {
    subscriber.next({
      type: 'response',
      body,
      url: options.url,
      method: options.method ?? 'GET',
      statusCode: status,
      statusMessage: 'OK',
      headers: {'content-type': 'application/json'},
    })
    subscriber.complete()
  })
}

/**
 * Wrap a client so requests matching the demo patterns produce synthetic
 * responses. Non-matching requests fall through to the workspace request
 * handler unchanged.
 *
 * `_requestHandler` lives on the underlying `ClientConfig` (it's how
 * `withConfig` propagates handlers) but isn't on the public TypeScript
 * surface for `client.config()` / `withConfig`. The two casts below
 * launder that single internal field.
 *
 * @internal
 */
export function makeDemoClient(baseClient: SanityClient): SanityClient {
  // Capture the workspace handler so we can delegate to it for both demo
  // and non-demo requests. The workspace handler owns the classification +
  // dialog pipeline; we just substitute its inner `defaultRequester`
  // callback for matched URLs.
  const workspaceHandler = (baseClient.config() as unknown as {_requestHandler?: RequestHandler})
    ._requestHandler

  const handler: RequestHandler = (req, defaultRequester, client) => {
    const synthRequester = (opts: RequestOptions & {url: string}) => {
      const synthetic = synthesize(opts)
      return synthetic ?? defer(() => defaultRequester(opts))
    }
    if (workspaceHandler) {
      return workspaceHandler(req, synthRequester, client)
    }
    // No workspace handler attached → just synthesize directly. Used in
    // tests / standalone client setups.
    return synthRequester(req)
  }

  return baseClient.withConfig({
    _requestHandler: handler,
  })
}

/**
 * The studio probes `/check/cors` with a bare `fetch()` to avoid a CORS
 * preflight (custom client headers like `x-sanity-app` push the request
 * out of the simple-request set). That bypasses `makeDemoClient`'s
 * request-handler interception, so we install a thin `window.fetch`
 * patch to synthesize the verdict when the CORS demo is active.
 *
 * This is a global monkeypatch on `window.fetch`, so it MUST be scoped to
 * the lifetime of the error playground view: call this on mount and the
 * returned function on unmount. Leaving it installed would route every
 * studio `fetch()` through this wrapper for the rest of the session.
 *
 * Idempotent and ref-counted — safe to mount in more than one place.
 *
 * @internal
 * @returns a function that uninstalls the patch (restoring the previous
 *   `window.fetch` once the last caller has uninstalled).
 */
function noop() {
  // no-op uninstaller, returned when there's nothing to patch (SSR)
}

let installCount = 0
let originalFetch: typeof window.fetch | undefined
export function installCheckCorsFetchInterceptor(): () => void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return noop
  }

  if (installCount === 0) {
    originalFetch = window.fetch.bind(window)
    const original = originalFetch
    window.fetch = (input, init) => {
      if (corsDemoMode) {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (url.includes('/check/cors')) {
          const allowed = corsDemoMode === 'no-credentials'
          const withCredentials = false
          return Promise.resolve(
            new Response(JSON.stringify({result: {allowed, withCredentials}}), {
              status: 200,
              headers: {'content-type': 'application/json'},
            }),
          )
        }
      }
      return original(input, init)
    }
  }
  installCount += 1

  let uninstalled = false
  return () => {
    if (uninstalled) return
    uninstalled = true
    installCount -= 1
    if (installCount === 0 && originalFetch) {
      window.fetch = originalFetch
      originalFetch = undefined
    }
  }
}
