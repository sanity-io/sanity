import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type RequestHandler,
  type RequestHandlerOptions,
  type SanityClient,
} from '@sanity/client'
import memoize from 'lodash-es/memoize.js'
import {EMPTY, firstValueFrom, from, merge, type Observable, of, ReplaySubject, timer} from 'rxjs'
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
  createBroadcastState,
  createLocalStorageStorage,
  createMemoryStorage,
} from './createBroadcastState'
import {createOAuthLoginComponent} from './createOAuthLoginComponent'
import {
  createOAuthEndpoints,
  type OAuthEndpoints,
  OAuthRequestError,
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

  const endpoints =
    endpointsOption ?? createOAuthEndpoints(hostOptions.apiHost ?? 'https://api.sanity.io')
  const clientFactory = clientFactoryOption ?? createSanityClient
  const flowStorageKey = getOAuthFlowStorageKey(projectId)

  // The storage is kept alongside the broadcast state so a refresh can read what another tab
  // wrote, before that tab's broadcast has arrived here. See `refresh`.
  const tokensStorageKey = getOAuthTokensStorageKey(projectId, clientId)
  const persistedTokens = supportsLocalStorage
    ? createLocalStorageStorage<OAuthTokens>(tokensStorageKey)
    : createMemoryStorage<OAuthTokens>()
  const tokenStorage = createBroadcastState<OAuthTokens>(
    `${tokensStorageKey}_broadcast`,
    (current) => current,
    persistedTokens,
  )

  let inflightRefresh: Promise<OAuthTokens | undefined> | undefined

  // Bumped by `logout`. A refresh that started before a logout must not write its result back,
  // or it would sign the user in again. The cross-tab lock covers other tabs; this covers this
  // tab when Web Locks are unavailable and the lock is not exclusive.
  let sessionGeneration = 0
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
    const generation = sessionGeneration
    inflightRefresh ??= withLock(refreshLockName, async () => {
      const stored = persistedTokens.load()
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
        if (generation !== sessionGeneration) {
          // The user logged out while this refresh was in flight. The pair it obtained is valid
          // on the server and known only here, so revoke it rather than drop it.
          await revokeTokens(toTokens(response))
          return undefined
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

  const tokens$ = tokenStorage.value.pipe(
    distinctUntilChanged((a, b) => a?.accessToken === b?.accessToken),
  )

  const authState$ = tokens$.pipe(
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
  const scheduledRefresh$ = tokens$.pipe(
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
    const redirectUri =
      redirectUriOption ?? `${getLocation().origin}${basePath.replace(/\/+$/, '')}`
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
      return fail(/^[a-z_]{1,64}$/.test(error) ? error : 'authorization server error')
    }

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
      return fail(
        err instanceof Error ? err.message : 'code exchange failed',
        Math.round(performance.now() - exchangeStart),
      )
    }
    const exchangeDurationMs = Math.round(performance.now() - exchangeStart)
    // Snapshot before the settle wait, with the same meaning as in `createAuthStore`.
    const durationMs = Math.round(performance.now() - startTime)

    tokenStorage.update(tokens)
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<'timeout'>((resolve) => {
      timeoutId = setTimeout(() => resolve('timeout'), AUTH_STATE_SETTLE_TIMEOUT_MS)
    })
    const result = await Promise.race([
      firstValueFrom(
        state.pipe(
          filter(
            (authState) =>
              authState.authenticated && authState.client.config().token === tokens.accessToken,
          ),
        ),
      ),
      timeout,
    ]).finally(() => clearTimeout(timeoutId))
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
    // Under the refresh lock, so a refresh in flight in any tab settles first, and the pair
    // revoked here is the latest one rather than the one it was about to replace.
    await withLock(refreshLockName, async () => {
      const tokens = persistedTokens.load() ?? tokenStorage.get()
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
