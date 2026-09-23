import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type RequestHandler,
  type RequestHandlerOptions,
  type SanityClient,
} from '@sanity/client'
import memoize from 'lodash-es/memoize.js'
import {
  BehaviorSubject,
  EMPTY,
  firstValueFrom,
  from,
  merge,
  type Observable,
  of,
  race,
  ReplaySubject,
  timer,
} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  share,
  switchMap,
} from 'rxjs/operators'

import {type OAuthConfig} from '../../config/auth/types'
import {isStaging} from '../../environment/isStaging'
import {type StudioErrorHandler} from '../../studio/requestErrors/types'
import {isInvalidSessionError} from '../../util/apiErrors'
import {canonicalHash} from '../../util/canonicalHash'
import {supportsLocalStorage} from '../../util/supportsLocalStorage'
import {
  AUTH_CLIENT_OPTIONS,
  AUTH_STATE_SETTLE_TIMEOUT_MS,
  getOAuthFlowStorageKey,
  getOAuthTokensStorageKey,
} from './constants'
import {getCurrentUser, type RequestFailureDiagnostics} from './createAuthStore'
import {
  type BroadcastedState,
  createBroadcastState,
  createLocalStorageStorage,
} from './createBroadcastState'
import {createOAuthLoginComponent} from './createOAuthLoginComponent'
import {
  createOAuthEndpoints,
  type OAuthEndpoints,
  OAuthRequestError,
  OAuthRequestTimeoutError,
  type OAuthTokenResponse,
} from './oauth/oauthEndpoints'
import {createCodeChallenge, createCodeVerifier, createState} from './oauth/pkce'
import {type AuthState, type AuthStore, type HandleCallbackResult} from './types'

/** Parameters of an authorization response (RFC 6749 section 4.1.2, RFC 9207 `iss`). */
const OAUTH_RESPONSE_PARAMS = ['code', 'state', 'error', 'error_description', 'error_uri', 'iss']

/** Renew the access token once this fraction of its lifetime has passed. */
const REFRESH_AT_LIFETIME_FRACTION = 0.8

/** Never renew sooner than this after a token was issued, so a very short lifetime can't spin. */
const MIN_REFRESH_DELAY_MS = 5_000

/** The shape of an RFC 6749 error code. Anything else from a server is free text. */
const OAUTH_ERROR_CODE = /^[a-z_]{1,64}$/

/**
 * The token pair a signed-in Studio holds, persisted per project and client.
 *
 * @internal
 */
export interface OAuthTokens {
  accessToken: string
  /** Single-use: every refresh returns a new one and invalidates this one. */
  refreshToken?: string
  /** Epoch milliseconds when the access token expires. */
  expiresAt: number
  /** Epoch milliseconds when the Studio renews the access token, ahead of `expiresAt`. */
  refreshAt: number
}

/** The authorization request in flight between leaving for the authorization server and returning. */
interface OAuthFlow {
  codeVerifier: string
  state: string
  redirectUri: string
  redirectPath?: string
}

/** @internal */
export interface OAuthAuthStoreOptions extends OAuthConfig {
  projectId: string
  dataset: string
  apiHost?: string
  /**
   * Base path of the workspace. The default redirect URL is the Studio origin followed by it, so
   * the authorization response lands on this workspace and its `handleCallbackUrl`.
   */
  basePath?: string
  clientFactory?: (options: SanityClientConfig) => SanityClient
  /** See `AuthStoreOptions.getRequestErrorHandler`. */
  getRequestErrorHandler?: () => StudioErrorHandler | undefined
  /** See `AuthStoreOptions.getRequestFailureDiagnostics`. */
  getRequestFailureDiagnostics?: () => RequestFailureDiagnostics | undefined
}

/**
 * Browser dependencies of the OAuth auth store, injected so tests can drive the flow.
 *
 * @internal
 */
export interface OAuthAuthStoreEnvironment {
  endpoints?: OAuthEndpoints
  /** The current URL. Read for the Studio origin and the authorization response. */
  getLocation: () => Pick<Location, 'origin' | 'pathname' | 'search'>
  /** Leaves the Studio for the authorization server. */
  navigate: (url: string) => void
  /** Replaces the current history entry, e.g. to drop the authorization response from the URL. */
  replaceUrl: (path: string) => void
  /**
   * Runs `task` while holding the lock called `name`, exclusively across the tabs of this origin.
   * Refresh tokens are single-use, so two tabs redeeming the same one would sign one of them out.
   */
  withLock: <T>(name: string, task: () => Promise<T>) => Promise<T>
}

function toTokens(response: OAuthTokenResponse, previousRefreshToken?: string): OAuthTokens {
  const issuedAt = Date.now()
  const lifetimeMs = response.expires_in * 1000
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? previousRefreshToken,
    expiresAt: issuedAt + lifetimeMs,
    refreshAt: issuedAt + Math.max(lifetimeMs * REFRESH_AT_LIFETIME_FRACTION, MIN_REFRESH_DELAY_MS),
  }
}

/**
 * The telemetry `failureReason` of a failed code exchange: the RFC 6749 error code, or a fixed
 * category. Never the error message, which carries the server's free-text description and URLs.
 */
function exchangeFailureReason(err: unknown): string {
  if (err instanceof OAuthRequestError) {
    return err.error && OAUTH_ERROR_CODE.test(err.error)
      ? err.error
      : `token endpoint error (${err.statusCode})`
  }
  if (err instanceof OAuthRequestTimeoutError) return 'token endpoint timeout'
  return 'code exchange failed'
}

/** State kept in this tab only, with the shape of a broadcast state. */
function createTabState<T>(): Pick<BroadcastedState<T>, 'value' | 'get' | 'update'> {
  const subject = new BehaviorSubject<T | undefined>(undefined)
  return {
    value: subject.asObservable(),
    get: () => subject.getValue(),
    update: (value) => subject.next(value),
  }
}

/**
 * Refuses a redirect URI the authorization server would reject, before the flow is stored: it has
 * to be absolute and without a fragment (RFC 6749 section 3.1.2). It also has to be on the Studio
 * origin, because the verifier and `state` live in this origin's sessionStorage and the response
 * has to come back here to be exchanged.
 */
function assertRedirectUri(redirectUri: string, origin: string): void {
  let url: URL
  try {
    url = new URL(redirectUri)
  } catch {
    throw new Error(`auth.unstable_oauth.redirectUri must be an absolute URL, got ${redirectUri}`)
  }
  if (redirectUri.includes('#')) {
    throw new Error(`auth.unstable_oauth.redirectUri must not have a fragment, got ${redirectUri}`)
  }
  if (url.origin !== origin) {
    throw new Error(
      `auth.unstable_oauth.redirectUri must be on the Studio origin (${origin}), got ${redirectUri}`,
    )
  }
}

function bearerTokenOf(request: RequestHandlerOptions): string | undefined {
  const header = Object.entries(request.headers ?? {}).find(
    ([name]) => name.toLowerCase() === 'authorization',
  )?.[1]
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

function withBearerToken(request: RequestHandlerOptions, token: string): RequestHandlerOptions {
  const headers = Object.fromEntries(
    Object.entries(request.headers ?? {}).filter(
      ([name]) => name.toLowerCase() !== 'authorization',
    ),
  )
  return {...request, headers: {...headers, Authorization: `Bearer ${token}`}}
}

function readFlow(key: string): OAuthFlow | undefined {
  try {
    const value = sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as OAuthFlow) : undefined
  } catch {
    return undefined
  }
}

/**
 * Throws when the flow can't be stored: the verifier and `state` must survive the redirect, so a
 * login that goes ahead without them is bound to fail on return.
 */
function writeFlow(key: string, flow: OAuthFlow): void {
  sessionStorage.setItem(key, JSON.stringify(flow))
}

/** Best-effort: a flow left behind is harmless, it only matches its own `state`. */
function clearFlow(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Storage unavailable, so there is nothing to clear either.
  }
}

/**
 * An auth store that signs users in with OAuth 2.1: the authorization code flow with PKCE, as a
 * public client of an OAuth application registered for the Studio in Manage.
 *
 * - The token pair lives in localStorage and is broadcast to other tabs, so a rotation or a
 *   sign-out in one tab reaches the others.
 * - The access token is renewed ahead of expiry, and again whenever a request is rejected with an
 *   invalid session. Renewals are serialised across tabs, because each refresh token works once.
 * - Only a refresh that the server refuses ends the session. The 401 that follows reaches the
 *   Studio's request handler, which logs the user out as it does for any other auth store.
 *
 * @internal
 */
export function _createOAuthAuthStore({
  clientId,
  redirectUri: redirectUriOption,
  projectId,
  dataset,
  apiHost,
  basePath = '',
  clientFactory: clientFactoryOption,
  getRequestErrorHandler,
  getRequestFailureDiagnostics,
  endpoints: endpointsOption,
  getLocation,
  navigate,
  replaceUrl,
  withLock,
}: OAuthAuthStoreOptions & OAuthAuthStoreEnvironment): AuthStore {
  const hostOptions: {apiHost?: string} = {}
  if (apiHost) {
    hostOptions.apiHost = apiHost
  } else if (isStaging) {
    hostOptions.apiHost = 'https://api.sanity.work'
  }

  // The authorization server's issuer identifier is the API origin it is served from, without a
  // trailing slash. Canonicalized once here, so the callback can compare `iss` exactly.
  const issuer = (hostOptions.apiHost ?? 'https://api.sanity.io').replace(/\/+$/, '')
  const endpoints = endpointsOption ?? createOAuthEndpoints(issuer)
  const clientFactory = clientFactoryOption ?? createSanityClient
  const flowStorageKey = getOAuthFlowStorageKey(projectId)

  // With localStorage, the pair is shared by the tabs of this origin, and the storage is kept
  // alongside the broadcast state so a refresh can read what another tab wrote before that tab's
  // broadcast has arrived here. See `latestTokens`.
  //
  // Without it, the pair stays private to this tab. A broadcast is delivered asynchronously and
  // is not ordered with the refresh lock, so a tab waiting for the lock could still hold a pair
  // another tab already rotated, redeem its used refresh token, and sign both tabs out.
  const tokensStorageKey = getOAuthTokensStorageKey(projectId, clientId)
  const persistedTokens = createLocalStorageStorage<OAuthTokens>(tokensStorageKey)
  const tokenStorage: Pick<
    BroadcastedState<OAuthTokens>,
    'value' | 'get' | 'update'
  > = supportsLocalStorage
    ? createBroadcastState<OAuthTokens>(
        `${tokensStorageKey}_broadcast`,
        (current) => current,
        persistedTokens,
      )
    : createTabState<OAuthTokens>()

  /**
   * The latest pair any tab wrote. localStorage is shared, so it can be ahead of this tab's
   * broadcast state. Without it, this tab's own state is all there is.
   */
  const latestTokens = (): OAuthTokens | undefined =>
    supportsLocalStorage ? persistedTokens.load() : tokenStorage.get()

  let inflightRefresh: Promise<OAuthTokens | undefined> | undefined

  // Changed by every `logout`. A refresh or code exchange that started before a logout must not
  // write its result back, or it would sign the user in again. The local counter covers this tab,
  // also when Web Locks are unavailable and the lock is not exclusive. The stored epoch covers a
  // logout in another tab, which the lock alone does not: that tab can take the lock, clear the
  // pair, and release it while a request here is still out.
  let sessionGeneration = 0
  const logoutEpochKey = `${tokensStorageKey}_logout`
  const sessionEpoch = (): string => {
    let shared: string | null = null
    try {
      shared = supportsLocalStorage ? localStorage.getItem(logoutEpochKey) : null
    } catch {
      // Unreadable storage: only this tab's logouts are seen.
    }
    return `${sessionGeneration}:${shared ?? ''}`
  }
  const refreshLockName = `${tokensStorageKey}_refresh`

  /**
   * Redeems the refresh token of `rejected`, the pair that just failed or is due for renewal, and
   * returns the pair to use from now on. Resolves `undefined` when the session is over.
   *
   * Runs under a cross-tab lock. The tab that waited for the lock reads the stored pair first: if
   * another tab rotated it in the meantime, that pair is adopted instead of redeeming a refresh
   * token that no longer works.
   */
  function refresh(rejected: OAuthTokens): Promise<OAuthTokens | undefined> {
    const epoch = sessionEpoch()
    inflightRefresh ??= withLock(refreshLockName, async () => {
      const stored = latestTokens()
      if (!stored) {
        tokenStorage.update(undefined)
        return undefined
      }
      if (stored.refreshToken !== rejected.refreshToken) {
        if (stored.accessToken !== tokenStorage.get()?.accessToken) tokenStorage.update(stored)
        return stored
      }
      if (!stored.refreshToken) {
        tokenStorage.update(undefined)
        return undefined
      }
      try {
        const response = await endpoints.refresh({clientId, refreshToken: stored.refreshToken})
        // The session this renewed ended while the request was out: the user logged out, or a
        // sign-in replaced the pair (a code exchange does not wait for this lock). The pair it
        // obtained is valid on the server and known only here, so revoke it rather than drop it
        // or publish it over the current one. The check and the write below are synchronous, so
        // nothing in this tab can slip in between.
        if (epoch !== sessionEpoch() || latestTokens()?.refreshToken !== stored.refreshToken) {
          await revokeTokens(toTokens(response))
          return epoch === sessionEpoch() ? latestTokens() : undefined
        }
        const next = toTokens(response, stored.refreshToken)
        tokenStorage.update(next)
        return next
      } catch (err) {
        // `invalid_grant`: the refresh token expired, was used already, or its session was
        // revoked in Manage. Anything else (a request or client error, network, 5xx) says
        // nothing about the session, so keep the tokens and let the caller see the failure.
        if (err instanceof OAuthRequestError && err.error === 'invalid_grant') {
          tokenStorage.update(undefined)
          return undefined
        }
        throw err
      }
    }).finally(() => {
      inflightRefresh = undefined
    })
    return inflightRefresh
  }

  /**
   * Renews the access token when a request is rejected with an invalid session, and retries the
   * request once. Installed inside the Studio's request handler (see `getAuthStore` in
   * `prepareConfig`), so a 401 that survives the retry still reaches it and ends the session.
   */
  const refreshOnInvalidSession: RequestHandler = async (request, next) => {
    try {
      return await next(request)
    } catch (err) {
      if (!isInvalidSessionError(err)) throw err
      const current = tokenStorage.get()
      if (!current) throw err
      // A request that went out before a renewal only needs the pair that replaced its token.
      const tokens =
        bearerTokenOf(request) === current.accessToken ? await refresh(current) : current
      if (!tokens) throw err
      return next(withBearerToken(request, tokens.accessToken))
    }
  }

  function createClient(tokens: OAuthTokens | undefined): SanityClient {
    return clientFactory({
      ...AUTH_CLIENT_OPTIONS,
      ...hostOptions,
      projectId,
      dataset,
      ...(tokens
        ? {
            token: tokens.accessToken,
            ignoreBrowserTokenWarning: true,
            requestHandler: refreshOnInvalidSession,
          }
        : {}),
    })
  }

  const unauthenticated: AuthState = {
    client: createClient(undefined),
    authenticated: false,
    currentUser: null,
  }

  async function probeAuthState(tokens: OAuthTokens): Promise<AuthState> {
    const client = createClient(tokens)
    const currentUser = await getCurrentUser(
      client,
      'oauth',
      getRequestErrorHandler,
      getRequestFailureDiagnostics?.(),
    )
    return {client, authenticated: Boolean(currentUser?.id), currentUser: currentUser || null}
  }

  // The state changes with the access token only. A renewal can rotate the refresh token and the
  // expiry while keeping the access token, and the schedule has to follow that too.
  const accessTokens$ = tokenStorage.value.pipe(
    distinctUntilChanged((a, b) => a?.accessToken === b?.accessToken),
  )
  const renewals$ = tokenStorage.value.pipe(
    distinctUntilChanged(
      (a, b) => a?.refreshToken === b?.refreshToken && a?.refreshAt === b?.refreshAt,
    ),
  )

  const authState$ = accessTokens$.pipe(
    switchMap((tokens): Observable<AuthState> => {
      if (!tokens) return of(unauthenticated)
      return from(probeAuthState(tokens)).pipe(
        switchMap((state) => {
          if (state.authenticated || !tokens.refreshToken) return of(state)
          // The access token was rejected, most often because it expired while the Studio was
          // closed. The renewed pair re-enters through `tokenStorage` and replaces this stream.
          return from(refresh(tokens)).pipe(
            switchMap((renewed) => (renewed ? EMPTY : of(unauthenticated))),
          )
        }),
      )
    }),
  )

  // Renews ahead of expiry while anything is subscribed to the state. Failures are left to the
  // invalid-session handler above, which retries on the next rejected request.
  const scheduledRefresh$ = renewals$.pipe(
    switchMap((tokens) =>
      tokens?.refreshToken
        ? timer(Math.max(tokens.refreshAt - Date.now(), 0)).pipe(
            switchMap(() => from(refresh(tokens)).pipe(catchError(() => EMPTY))),
          )
        : EMPTY,
    ),
    ignoreElements(),
  )

  const state = merge(authState$, scheduledRefresh$).pipe(
    share({connector: () => new ReplaySubject(1), resetOnRefCountZero: () => timer(1000)}),
  )

  async function login(redirectPath: string): Promise<void> {
    const codeVerifier = createCodeVerifier()
    const oauthState = createState()
    const {origin} = getLocation()
    const redirectUri = redirectUriOption ?? `${origin}${basePath.replace(/\/+$/, '')}`
    assertRedirectUri(redirectUri, origin)
    writeFlow(flowStorageKey, {codeVerifier, state: oauthState, redirectUri, redirectPath})
    navigate(
      endpoints.authorizeUrl({
        clientId,
        redirectUri,
        codeChallenge: await createCodeChallenge(codeVerifier),
        state: oauthState,
      }),
    )
  }

  // Shared with concurrent callers (StrictMode runs the callback effect twice): the authorization
  // code is single-use, so a second call must join the exchange, not start another.
  let inflightCallback: Promise<HandleCallbackResult> | undefined

  function failedCallback(
    startTime: number,
    failureReason: string,
    exchangeDurationMs?: number,
  ): HandleCallbackResult {
    return {
      loginMethod: 'token',
      flow: 'exchange',
      success: false,
      durationMs: Math.round(performance.now() - startTime),
      exchangeDurationMs,
      failureReason,
      error: {
        type: 'auth-failed',
        message: 'Signing in with OAuth did not complete. Please try logging in again.',
      },
    }
  }

  function handleCallbackUrl(): Promise<HandleCallbackResult> {
    const startTime = performance.now()
    const {pathname, search} = getLocation()
    const params = new URLSearchParams(search)

    // An authorization response carries `state` and either a code or an error. Anything else is
    // an ordinary Studio URL, even one with an unrelated `error` parameter.
    if (!params.has('state') || (!params.has('code') && !params.has('error'))) {
      return (
        inflightCallback ??
        Promise.resolve({
          loginMethod: 'token',
          flow: 'already-authenticated',
          success: true,
          durationMs: Math.round(performance.now() - startTime),
        })
      )
    }
    if (inflightCallback) return inflightCallback

    // The response has to belong to the request this tab made, whether it carries a code or an
    // error. A mismatch touches neither the URL nor the stored flow, which may still be waiting
    // for its own response.
    const flow = readFlow(flowStorageKey)
    if (!flow) return Promise.resolve(failedCallback(startTime, 'no authorization request'))
    if (params.get('state') !== flow.state) {
      return Promise.resolve(failedCallback(startTime, 'state mismatch'))
    }
    clearFlow(flowStorageKey)

    // Out of the address bar, history, and Referer before anything else can read the code. Only
    // the OAuth parameters go; anything else the URL carried stays.
    const remaining = new URLSearchParams(search)
    for (const name of OAUTH_RESPONSE_PARAMS) remaining.delete(name)
    const query = remaining.toString()
    replaceUrl(query ? `${pathname}?${query}` : pathname)

    const callbackProcessed = processCallback(params, flow, startTime).finally(() => {
      if (inflightCallback === callbackProcessed) inflightCallback = undefined
    })
    inflightCallback = callbackProcessed
    return callbackProcessed
  }

  async function processCallback(
    params: URLSearchParams,
    flow: OAuthFlow,
    startTime: number,
  ): Promise<HandleCallbackResult> {
    const fail = (failureReason: string, exchangeDurationMs?: number) =>
      failedCallback(startTime, failureReason, exchangeDurationMs)

    // Report the RFC 6749 error code only. `error_description` is free text from the URL, and
    // telemetry is no place for it.
    const error = params.get('error')
    if (error) {
      return fail(OAUTH_ERROR_CODE.test(error) ? error : 'authorization server error')
    }

    // RFC 9207: a response that names an issuer must name this one, or it may be a code from
    // another authorization server replayed at this Studio. A response without `iss` is accepted,
    // since the server does not advertise support for it.
    const iss = params.get('iss')
    if (iss !== null && iss !== issuer) {
      return fail('issuer mismatch')
    }

    // Captured before the exchange, like in `refresh`: a logout while it is out must win.
    const epoch = sessionEpoch()
    const exchangeStart = performance.now()
    let tokens: OAuthTokens
    try {
      tokens = toTokens(
        await endpoints.exchangeCode({
          clientId,
          redirectUri: flow.redirectUri,
          code: params.get('code') as string,
          codeVerifier: flow.codeVerifier,
        }),
      )
    } catch (err) {
      return fail(exchangeFailureReason(err), Math.round(performance.now() - exchangeStart))
    }
    const exchangeDurationMs = Math.round(performance.now() - exchangeStart)
    // Snapshot before the settle wait, with the same meaning as in `createAuthStore`.
    const durationMs = Math.round(performance.now() - startTime)

    // Under the refresh lock, so a logout or refresh in another tab finishes before this pair
    // lands, and cannot clear or overwrite it halfway.
    const published = await withLock(refreshLockName, async () => {
      if (epoch !== sessionEpoch()) return false
      const replaced = latestTokens()
      tokenStorage.update(tokens)
      // The pair this sign-in replaces is no longer used by any tab. Revoked in the background,
      // so the sign-in does not wait for it.
      if (replaced && replaced.refreshToken !== tokens.refreshToken) void revokeTokens(replaced)
      return true
    })
    if (!published) {
      // The user logged out while the code was being exchanged. The pair is valid on the server
      // and known only here, so revoke it rather than drop it.
      await revokeTokens(tokens)
      return fail('logged out during sign-in', exchangeDurationMs)
    }
    const settle = await waitForAuthenticatedState(tokens)
    if (flow.redirectPath) replaceUrl(flow.redirectPath)

    return {
      loginMethod: 'token',
      flow: 'exchange',
      success: true,
      durationMs,
      exchangeDurationMs,
      ...settle,
      authMethod: 'oauth',
    }
  }

  /**
   * Waits until the state reflects the exchanged tokens, so the AuthBoundary does not open onto a
   * stale logged-out state. Bounded like the callback settle wait in `createAuthStore`.
   *
   * Matched on the client's token, not just `authenticated`: `state` replays its last value, so a
   * user who was already signed in would otherwise settle on the previous session before the new
   * token was probed.
   */
  async function waitForAuthenticatedState(tokens: OAuthTokens): Promise<{
    stateSettleDurationMs: number
    stateSettleTimedOut: boolean
  }> {
    const start = performance.now()
    // Raced as observables, so whichever loses is unsubscribed. A promise race would keep the
    // subscription to `state` alive after a timeout, for a token that may never authenticate.
    const result = await firstValueFrom(
      race(
        state.pipe(
          filter(
            (authState) =>
              authState.authenticated && authState.client.config().token === tokens.accessToken,
          ),
          map(() => 'settled' as const),
        ),
        timer(AUTH_STATE_SETTLE_TIMEOUT_MS).pipe(map(() => 'timeout' as const)),
      ),
    )
    return {
      stateSettleDurationMs: Math.round(performance.now() - start),
      stateSettleTimedOut: result === 'timeout',
    }
  }

  /** Best-effort revocation of both tokens (RFC 7009 answers 200 whatever happened). */
  function revokeTokens(tokens: OAuthTokens): Promise<unknown> {
    return Promise.allSettled(
      [tokens.accessToken, tokens.refreshToken]
        .filter((token): token is string => Boolean(token))
        .map((token) => endpoints.revoke({clientId, token})),
    )
  }

  async function logout(): Promise<void> {
    sessionGeneration++
    try {
      if (supportsLocalStorage) localStorage.setItem(logoutEpochKey, createState())
    } catch {
      // Best-effort: other tabs then only stop at the lock.
    }
    // Under the refresh lock, so a refresh in flight in any tab settles first, and the pair
    // revoked here is the latest one rather than the one it was about to replace.
    await withLock(refreshLockName, async () => {
      const tokens = latestTokens() ?? tokenStorage.get()
      // Best-effort, like `createAuthStore`: a forced logout reacting to a 401 revokes tokens
      // that are already dead, and a failed revocation must not keep the user signed in locally.
      if (tokens) await revokeTokens(tokens)
      clearFlow(flowStorageKey)
      tokenStorage.update(undefined)
    })
  }

  return {
    handleCallbackUrl,
    state,
    token: tokenStorage.value.pipe(
      map((tokens) => tokens?.accessToken ?? null),
      distinctUntilChanged(),
    ),
    LoginComponent: createOAuthLoginComponent({login}),
    logout,
  }
}

const defaultEnvironment: OAuthAuthStoreEnvironment = {
  getLocation: () => window.location,
  navigate: (url) => window.location.assign(url),
  replaceUrl: (path) => window.history.replaceState(window.history.state, '', path),
  // Browsers without Web Locks fall back to the in-tab single flight in `refresh`.
  withLock: (name, task) =>
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request(name, task)
      : task(),
}

/**
 * @internal
 */
export const createOAuthAuthStore: (options: OAuthAuthStoreOptions) => AuthStore = memoize(
  (options: OAuthAuthStoreOptions): AuthStore =>
    _createOAuthAuthStore({...options, ...defaultEnvironment}),
  // Same cache key rule as `createAuthStore`: the lazy getters are runtime wiring, not identity.
  ({
    getRequestErrorHandler: _getRequestErrorHandler,
    getRequestFailureDiagnostics: _getRequestFailureDiagnostics,
    ...options
  }: OAuthAuthStoreOptions) => canonicalHash(options),
)
