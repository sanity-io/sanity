import {
  type AuthState as ClientAuthState,
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type RequestHandler,
  type RequestHandlerOptions,
  type SanityClient,
} from '@sanity/client'
import memoize from 'lodash-es/memoize.js'
import {
  BehaviorSubject,
  defer,
  EMPTY,
  firstValueFrom,
  from,
  fromEvent,
  interval,
  merge,
  type Observable,
  of,
  race,
  ReplaySubject,
  Subject,
  timer,
} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  share,
  shareReplay,
  skip,
  switchMap,
  tap,
  timeout,
} from 'rxjs/operators'

import {type OAuthConfig} from '../../../config/auth/types'
import {isStaging} from '../../../environment/isStaging'
import {type RequestFailureDiagnostics} from '../../../studio/requestErrors/diagnoseRequestFailure'
import {type StudioErrorHandler} from '../../../studio/requestErrors/types'
import {isInvalidSessionError} from '../../../util/apiErrors'
import {canonicalHash} from '../../../util/canonicalHash'
import {supportsLocalStorage} from '../../../util/supportsLocalStorage'
import {type AuthState, type AuthStore} from '../types'
import {createAuthIdProbe} from '../utils/createAuthIdProbe'
import {
  type BroadcastedState,
  createBroadcastState,
  createLocalStorageStorage,
} from '../utils/createBroadcastState'
import {getCurrentUser} from '../utils/getCurrentUser'
import {
  AUTH_CLIENT_OPTIONS,
  AUTH_STATE_SETTLE_TIMEOUT_MS,
  getOAuthFlowStorageKey,
  getOAuthTokensStorageKey,
  OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY,
} from './constants'
import {createOAuthLoginComponent, type OAuthCallbackError} from './createOAuthLoginComponent'
import {debug, describeTokens, refreshTokenTag, tokenTag} from './debug'
import {
  createOAuthEndpoints,
  type OAuthEndpoints,
  OAuthRequestError,
  OAuthRequestTimeoutError,
  type OAuthTokenResponse,
} from './oauthEndpoints'
import {createCodeChallenge, createCodeVerifier, createState} from './pkce'
import {type OAuthCallbackResult} from './types'

/** Parameters of an authorization response (RFC 6749 section 4.1.2, RFC 9207 `iss`). */
const OAUTH_RESPONSE_PARAMS = ['code', 'state', 'error', 'error_description', 'error_uri', 'iss']

/** How long before expiry the access token is renewed, unless configured. */
const DEFAULT_RENEW_BEFORE_EXPIRY_MS = 60_000

/** Never renew sooner than this after a token was issued, so a very short lifetime can't spin. */
const MIN_REFRESH_DELAY_MS = 5_000

/** How often the debug log counts down to the next renewal (only while debug logging is on). */
const RENEWAL_COUNTDOWN_INTERVAL_MS = 30_000

/**
 * How long a refused refresh token waits for another tab's rotation to land before it is taken
 * as the end of the session. Only matters without an exclusive cross-tab lock, where two tabs
 * can redeem the same refresh token at once and the loser's `invalid_grant` is caused by the
 * winner's rotation, not by a dead session.
 */
const INVALID_GRANT_GRACE_MS = 1_000

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
  /**
   * Emits when the tab becomes visible again. A renewal that fell due while the tab was hidden
   * or the machine asleep starts on it, ahead of the requests the UI makes on wake.
   */
  visible$?: Observable<unknown>
}

/**
 * The pair a token response yields. `previous` is the pair a refresh renews: its refresh token
 * stays in use when the server did not rotate it.
 */
function toTokens(
  response: OAuthTokenResponse,
  renewBeforeExpiryMs: number,
  previous?: OAuthTokens,
): OAuthTokens {
  const issuedAt = Date.now()
  const lifetimeMs = Math.min(response.expires_in * 1000, debugAccessTokenLifetimeMs() ?? Infinity)
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? previous?.refreshToken,
    expiresAt: issuedAt + lifetimeMs,
    refreshAt: issuedAt + renewAfterMs(lifetimeMs, renewBeforeExpiryMs),
  }
}

/**
 * How long after issue a token with `lifetimeMs` left is renewed: the margin before expiry, but
 * never earlier than halfway through the lifetime (a margin longer than a short-lived token would
 * otherwise renew at once) and never sooner than the floor after issue.
 */
function renewAfterMs(lifetimeMs: number, renewBeforeExpiryMs: number): number {
  return Math.max(lifetimeMs - renewBeforeExpiryMs, lifetimeMs / 2, MIN_REFRESH_DELAY_MS)
}

/**
 * The stored pair with its lifetime cut to the debug flag, or `undefined` when the flag is unset
 * or the pair already expires within it. The flag is usually set after signing in, so the pair
 * in storage still carries the real expiry; this applies the flag without waiting for a rotation.
 */
function capStoredLifetime(
  tokens: OAuthTokens,
  renewBeforeExpiryMs: number,
): OAuthTokens | undefined {
  const capMs = debugAccessTokenLifetimeMs()
  if (capMs === undefined) return undefined
  const now = Date.now()
  if (tokens.expiresAt - now <= capMs) return undefined
  return {
    ...tokens,
    expiresAt: now + capMs,
    refreshAt: now + renewAfterMs(capMs, renewBeforeExpiryMs),
  }
}

/**
 * The access token lifetime cap set through the localStorage debug flag, in milliseconds, or
 * `undefined` when unset or unusable.
 */
function debugAccessTokenLifetimeMs(): number | undefined {
  if (!supportsLocalStorage) return undefined
  try {
    const seconds = Number(localStorage.getItem(OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY))
    if (!Number.isFinite(seconds) || seconds <= 0) return undefined
    debug('debug flag: treating the access token lifetime as %ds', seconds)
    return seconds * 1000
  } catch {
    return undefined
  }
}

/**
 * Whether two auth states describe the same signed-in user with the same roles, which is all
 * the studio builds its workspace from. The client is the store's one client in both.
 */
function isSameAuthState(a: AuthState, b: AuthState): boolean {
  if (a.authenticated !== b.authenticated) return false
  if (a.currentUser?.id !== b.currentUser?.id) return false
  const rolesOf = (state: AuthState) => (state.currentUser?.roles ?? []).map((role) => role.name)
  const [rolesA, rolesB] = [rolesOf(a), rolesOf(b)]
  return rolesA.length === rolesB.length && rolesA.every((name, i) => name === rolesB[i])
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
    throw new Error(
      `auth.experimental_oauth.redirectUri must be an absolute URL, got ${redirectUri}`,
    )
  }
  if (redirectUri.includes('#')) {
    throw new Error(
      `auth.experimental_oauth.redirectUri must not have a fragment, got ${redirectUri}`,
    )
  }
  if (url.origin !== origin) {
    throw new Error(
      `auth.experimental_oauth.redirectUri must be on the Studio origin (${origin}), got ${redirectUri}`,
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
  renewBeforeExpiryMs = DEFAULT_RENEW_BEFORE_EXPIRY_MS,
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
  visible$ = defaultEnvironment.visible$,
}: OAuthAuthStoreOptions & OAuthAuthStoreEnvironment): AuthStore {
  if (!Number.isFinite(renewBeforeExpiryMs) || renewBeforeExpiryMs < 0) {
    throw new Error(
      `auth.experimental_oauth.renewBeforeExpiryMs must be a non-negative number of milliseconds, got ${renewBeforeExpiryMs}`,
    )
  }

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

  debug('store created for project %s, client %s, issuer %s', projectId, clientId, issuer)
  tokenStorage.value.subscribe((tokens) => debug('tokens now: %s', describeTokens(tokens)))

  const startingTokens = tokenStorage.get()
  const cappedTokens = startingTokens && capStoredLifetime(startingTokens, renewBeforeExpiryMs)
  if (cappedTokens) {
    debug('debug flag: cutting the stored pair short, %s', describeTokens(cappedTokens))
    tokenStorage.update(cappedTokens)
  }

  /**
   * The latest pair any tab wrote. localStorage is shared, so it can be ahead of this tab's
   * broadcast state. Without it, this tab's own state is all there is.
   */
  const latestTokens = (): OAuthTokens | undefined =>
    supportsLocalStorage ? persistedTokens.load() : tokenStorage.get()

  let inflightRefresh: Promise<OAuthTokens | undefined> | undefined
  /**
   * Every renewal this tab starts, as it starts. The session credentials hand it to the client,
   * so a request made while it is out waits for the new token instead of sending the old one.
   */
  const renewalStarted$ = new Subject<{
    rejected: OAuthTokens
    renewal: Promise<OAuthTokens | undefined>
  }>()

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
    if (inflightRefresh) {
      debug('refresh requested for %s: joining the refresh in flight', describeTokens(rejected))
      return inflightRefresh
    }
    debug('refresh requested for %s, waiting for the lock', describeTokens(rejected))
    const renewal = withLock(refreshLockName, async () => {
      const stored = latestTokens()
      if (!stored) {
        debug('refresh: no stored pair (signed out meanwhile), clearing')
        tokenStorage.update(undefined)
        return undefined
      }
      if (stored.refreshToken !== rejected.refreshToken) {
        debug('refresh: another tab already rotated, adopting %s', describeTokens(stored))
        if (stored.accessToken !== tokenStorage.get()?.accessToken) tokenStorage.update(stored)
        return stored
      }
      if (!stored.refreshToken) {
        debug('refresh: no refresh token to redeem, signing out')
        tokenStorage.update(undefined)
        return undefined
      }
      try {
        debug('refresh: redeeming refresh token %s', refreshTokenTag(stored.refreshToken))
        const response = await endpoints.refresh({clientId, refreshToken: stored.refreshToken})
        // The session this renewed ended while the request was out: the user logged out, or a
        // sign-in replaced the pair (a code exchange does not wait for this lock). The pair it
        // obtained is valid on the server and known only here, so revoke it rather than drop it
        // or publish it over the current one. The check and the write below are synchronous, so
        // nothing in this tab can slip in between.
        if (epoch !== sessionEpoch()) {
          debug('refresh: logged out while the request was out, revoking the pair it returned')
          await revokeTokens(toTokens(response, renewBeforeExpiryMs))
          return undefined
        }
        const latest = latestTokens()
        if (latest && latest.refreshToken !== stored.refreshToken) {
          debug('refresh: pair replaced while the request was out, revoking the pair it returned')
          await revokeTokens(toTokens(response, renewBeforeExpiryMs))
          return latest
        }
        // `latest` may be gone without a logout: without an exclusive lock, a tab that redeemed
        // the same refresh token after us was refused and cleared the pair. Our renewal is the
        // one that succeeded, so publishing it signs that tab back in.
        const next = toTokens(response, renewBeforeExpiryMs, stored)
        debug('refresh: renewed, %s', describeTokens(next))
        tokenStorage.update(next)
        return next
      } catch (err) {
        // `invalid_grant`: the refresh token expired, was used already, or its session was
        // revoked in Manage. Anything else (a request or client error, network, 5xx) says
        // nothing about the session, so keep the tokens and let the caller see the failure.
        if (err instanceof OAuthRequestError && err.error === 'invalid_grant') {
          // Without an exclusive lock, another tab may have redeemed this refresh token first,
          // in which case its rotation is what made ours invalid. Give that pair a moment to
          // land and adopt it; only then is the refusal the end of the session.
          const rotated = await rotationBy(stored, INVALID_GRANT_GRACE_MS)
          if (rotated) {
            debug(
              'refresh: refused because another tab rotated first, adopting %s',
              describeTokens(rotated),
            )
            if (rotated.accessToken !== tokenStorage.get()?.accessToken)
              tokenStorage.update(rotated)
            return rotated
          }
          debug('refresh: refresh token refused (invalid_grant), signing out: %s', err.message)
          tokenStorage.update(undefined)
          return undefined
        }
        debug('refresh: failed, keeping the pair: %s', err instanceof Error ? err.message : err)
        throw err
      }
    }).finally(() => {
      inflightRefresh = undefined
    })
    inflightRefresh = renewal
    renewalStarted$.next({rejected, renewal})
    return renewal
  }

  /**
   * A pair, from any tab, whose refresh token differs from `previous`'s: one already stored, or
   * one that lands within `withinMs`. Resolves `undefined` when none does.
   */
  function rotationBy(previous: OAuthTokens, withinMs: number): Promise<OAuthTokens | undefined> {
    const rotated = (tokens: OAuthTokens | undefined): tokens is OAuthTokens =>
      Boolean(tokens && tokens.refreshToken !== previous.refreshToken)
    const stored = latestTokens()
    if (rotated(stored)) return Promise.resolve(stored)
    return firstValueFrom(
      tokenStorage.value.pipe(
        filter(rotated),
        timeout(withinMs),
        catchError(() => of(undefined)),
      ),
    )
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
      const sent = bearerTokenOf(request)
      debug(
        'request rejected as invalid session: %s (sent %s, current %s)',
        request.url,
        tokenTag(sent),
        tokenTag(current?.accessToken),
      )
      if (!current) throw err
      // A request that went out before a renewal only needs the pair that replaced its token.
      const tokens = sent === current.accessToken ? await refresh(current) : current
      if (!tokens) {
        debug('request rejected: session is over, giving up on %s', request.url)
        throw err
      }
      debug('request rejected: retrying %s with %s', request.url, tokenTag(tokens.accessToken))
      return next(withBearerToken(request, tokens.accessToken))
    }
  }

  /**
   * The store's credential, in the shape the client's reactive `auth` takes: a promise per
   * emission. One for the store's lifetime: a rotation and a re-login are both just the next
   * token on it, and signed out is `undefined` (anonymous). Only the access token matters to the
   * client, so a refresh that keeps the access token emits nothing and no stream reconnects. A
   * stored token that is valid is handed out settled. A renewal, whether started by a rejected
   * request, the schedule or an expired token found here, is handed out as the renewal itself,
   * so a request made while it is out waits for the new token rather than sending the one being
   * replaced; the pair it yields then re-enters through `tokenStorage`.
   *
   * Signing out does not end the client's streams from here: the studio's login screen unmounts
   * everything that subscribed to them, which is what ends them. Nothing may stay subscribed to
   * an anonymous client while signed out.
   */
  const stored$ = tokenStorage.value.pipe(
    distinctUntilChanged((a, b) => a?.accessToken === b?.accessToken),
    map((tokens): Promise<ClientAuthState> => {
      if (!tokens) return Promise.resolve(undefined)
      if (Date.now() < tokens.expiresAt) return Promise.resolve({token: tokens.accessToken})
      debug('access token %s has expired, renewing before use', tokenTag(tokens.accessToken))
      // A failure keeps the pair (`renewAtBoot` has shown it), so the expired token goes out
      // and fails as a visible 401 rather than hanging every request.
      return renewAtBoot(tokens).then((renewed) => ({token: (renewed ?? tokens).accessToken}))
    }),
  )
  const renewing$ = renewalStarted$.pipe(
    map(({rejected, renewal}) => credentialAfter(renewal, rejected)),
  )
  const auth$ = merge(stored$, renewing$).pipe(shareReplay({bufferSize: 1, refCount: false}))
  // Connected now, ahead of everything else that reads `tokenStorage`, so a request made in the
  // same tick a new pair lands (the probe `authState$` starts for it) resolves the new token and
  // not the one being replaced. Lives as long as the store.
  auth$.subscribe()

  /**
   * The credential a renewal yields: the new token; `undefined` when the renewal ended the
   * session (the cleared pair follows through `tokenStorage`); or, when the renewal failed and
   * the pair was kept, the token that was to be replaced, so the failure surfaces as a 401 on
   * the request rather than a hang.
   */
  function credentialAfter(
    renewal: Promise<OAuthTokens | undefined>,
    rejected: OAuthTokens,
  ): Promise<ClientAuthState> {
    return renewal.then(
      (renewed) => (renewed ? {token: renewed.accessToken} : undefined),
      () => ({token: rejected.accessToken}),
    )
  }

  const clientConfig = {
    ...AUTH_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    auth: auth$,
    ignoreBrowserTokenWarning: true,
    requestHandler: refreshOnInvalidSession,
  }
  // Probes `/users/me` and serves the signed-out state.
  const client = clientFactory(clientConfig)

  /**
   * The client a signed-in state hands to the studio. Studio caches key on the credential source,
   * `config().auth`, by reference (`getClientCredentialSegments`), so each signed-in user gets a
   * source of their own: what was cached for one user (document pairs, project grants) is never
   * served to the next, whether they signed in here or in another tab. It reads the same `auth$`,
   * so a rotation within the session changes nothing; the state only emits for a new user, new
   * roles or a sign-in after sign-out, and those all get a new source.
   */
  function sessionClient(): SanityClient {
    return clientFactory({...clientConfig, auth: defer(() => auth$)})
  }

  const unauthenticated: AuthState = {client, authenticated: false, currentUser: null}

  async function probeClient(): Promise<AuthState> {
    debug('probing /users/me')
    const currentUser = await getCurrentUser(
      client,
      'oauth',
      getRequestErrorHandler,
      getRequestFailureDiagnostics?.(),
    )
    debug(
      'probe result: %s',
      currentUser?.id ? `authenticated as ${currentUser.id}` : 'not authenticated',
    )
    return {client, authenticated: Boolean(currentUser?.id), currentUser: currentUser || null}
  }

  /** The access token a probe-triggered renewal produced, so its own rejection renews no further. */
  let tokenRenewedByProbe: string | undefined

  /**
   * The auth state behind `accessToken`, probed once. An access token that had expired is
   * renewed by the credential itself before the probe goes out. If the API still rejects the
   * token the store believed valid (revoked, clock skew, or expired while the probe waited), one
   * renewal; the token it yields re-enters `authState$` and is probed there. A second rejection
   * means the pair cannot be used, and the signed-out state is shown with the pair kept, rather
   * than rotating the refresh token for every rejection.
   */
  async function probeToken(accessToken: string): Promise<AuthState> {
    const state = await probeClient()
    if (state.authenticated) return state
    const tokens = tokenStorage.get()
    if (!tokens || tokens.accessToken !== accessToken || !tokens.refreshToken) return state
    if (accessToken === tokenRenewedByProbe) return state
    const renewed = await renewAtBoot(tokens)
    if (renewed && renewed.accessToken !== accessToken) tokenRenewedByProbe = renewed.accessToken
    // A new token has replaced this probe through `authState$`; otherwise this is the answer.
    return state
  }

  /**
   * The renewal behind the auth state itself. A refused refresh token ends the session, which
   * `refresh` reports as `undefined`. Anything else says nothing about the session and must not
   * error the state, which would take the studio down: network failures and timeouts go to the
   * studio's retryable error dialog like the `/users/me` probe's do, and a failure the handler
   * does not claim (a token endpoint 5xx, an unexpected 4xx) keeps the pair for the next attempt
   * and shows the signed-out state.
   */
  async function renewAtBoot(tokens: OAuthTokens): Promise<OAuthTokens | undefined> {
    const errorHandler = getRequestErrorHandler?.()
    debug('access token rejected at boot, renewing %s', describeTokens(tokens))
    try {
      return errorHandler
        ? await errorHandler.attempt(() => refresh(tokens), {retryable: true})
        : await refresh(tokens)
    } catch (err) {
      debug(
        'renewal at boot failed, keeping the pair and showing signed out: %s',
        err instanceof Error ? err.message : err,
      )
      return undefined
    }
  }

  // The schedule follows the refresh token and the expiry, which a renewal can change while
  // keeping the access token.
  const renewals$ = tokenStorage.value.pipe(
    distinctUntilChanged(
      (a, b) => a?.refreshToken === b?.refreshToken && a?.refreshAt === b?.refreshAt,
    ),
  )

  /** Every probe result, in order, before the state dedupes it. See `waitForAuthenticatedState`. */
  let probeCount = 0
  const probed$ = new ReplaySubject<{sequence: number; state: AuthState}>(1)
  let everAuthenticated = false

  // Every access token is probed once: a sign-in, a renewal, or a pair another tab wrote, which
  // may belong to a different user. The state emits only when what the studio builds its
  // workspace from changes, the signed-in user and their roles, so a rotation that keeps both
  // changes nothing above the store, while a re-login as someone else, or a role change seen at
  // a renewal, does. A probe that fails for a reason other than a rejected token, after the
  // store has once been authenticated, keeps the current state: a steady session must not land
  // on the login screen because one renewal's probe hit a network error.
  const authState$ = tokenStorage.value.pipe(
    map((tokens) => tokens?.accessToken),
    distinctUntilChanged(),
    switchMap((accessToken): Observable<AuthState> => {
      if (!accessToken) return of(unauthenticated)
      return from(probeToken(accessToken)).pipe(
        catchError((err: unknown) => {
          if (!everAuthenticated) throw err
          debug(
            'probe failed after a renewal, keeping the current state: %s',
            err instanceof Error ? err.message : err,
          )
          return EMPTY
        }),
      )
    }),
    tap((state) => {
      if (state.authenticated) everAuthenticated = true
      probed$.next({sequence: ++probeCount, state})
    }),
    distinctUntilChanged(isSameAuthState),
    map((state) => (state.authenticated ? {...state, client: sessionClient()} : state)),
  )

  // Renews ahead of expiry while anything is subscribed to the state. Failures are left to the
  // invalid-session handler above, which retries on the next rejected request.
  const scheduledRefresh$ = renewals$.pipe(
    switchMap((tokens) => {
      if (!tokens?.refreshToken) return EMPTY
      const delay = Math.max(tokens.refreshAt - Date.now(), 0)
      debug('scheduling renewal in %ds', Math.round(delay / 1000))
      const renewal$ = timer(delay).pipe(
        switchMap(() => {
          debug('scheduled renewal due')
          return from(refresh(tokens)).pipe(
            catchError((err: unknown) => {
              debug(
                'scheduled renewal failed, next request will retry: %s',
                err instanceof Error ? err.message : err,
              )
              return EMPTY
            }),
          )
        }),
      )
      // Debugging aid: a countdown to the renewal and the expiry, while debug logging is on.
      const countdown$ = debug.enabled
        ? interval(RENEWAL_COUNTDOWN_INTERVAL_MS).pipe(
            tap(() => debug('countdown: %s', describeTokens(tokens))),
          )
        : EMPTY
      return merge(renewal$, countdown$)
    }),
    ignoreElements(),
  )

  // A renewal that fell due while the tab was hidden (throttled timers) or the machine asleep
  // starts the moment the tab is shown, so the requests the UI makes on wake wait for the new
  // token instead of going out with the expired one and earning a 401 each. Nothing to do when
  // the renewal is not due; the schedule covers that.
  const wake$ = (visible$ ?? EMPTY).pipe(
    tap(() => {
      const tokens = tokenStorage.get()
      if (!tokens?.refreshToken || Date.now() < tokens.refreshAt) return
      debug('tab visible with a renewal overdue, renewing %s', describeTokens(tokens))
      refresh(tokens).catch((err: unknown) => {
        debug(
          'renewal on wake failed, next request will retry: %s',
          err instanceof Error ? err.message : err,
        )
      })
    }),
    ignoreElements(),
  )

  const state = merge(authState$, scheduledRefresh$, wake$).pipe(
    share({connector: () => new ReplaySubject(1), resetOnRefCountZero: () => timer(1000)}),
  )

  /** The authorization server's refusal of this tab's last request, for the login screen. */
  const callbackError$ = new BehaviorSubject<OAuthCallbackError | undefined>(undefined)

  async function login(redirectPath: string): Promise<void> {
    callbackError$.next(undefined)
    const codeVerifier = createCodeVerifier()
    const oauthState = createState()
    const {origin} = getLocation()
    const redirectUri = redirectUriOption ?? `${origin}${basePath.replace(/\/+$/, '')}`
    assertRedirectUri(redirectUri, origin)
    writeFlow(flowStorageKey, {codeVerifier, state: oauthState, redirectUri, redirectPath})
    debug(
      'login: leaving for the authorization server, redirect_uri %s, will return to %s',
      redirectUri,
      redirectPath,
    )
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
  let inflightCallback: Promise<OAuthCallbackResult> | undefined

  function failedCallback(
    startTime: number,
    failureReason: string,
    exchangeDurationMs?: number,
  ): OAuthCallbackResult {
    return {
      loginMethod: 'oauth',
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

  function handleCallbackUrl(): Promise<OAuthCallbackResult> {
    const startTime = performance.now()
    const {pathname, search} = getLocation()
    const params = new URLSearchParams(search)

    // An authorization response carries `state` and either a code or an error. Anything else is
    // an ordinary Studio URL, even one with an unrelated `error` parameter.
    if (!params.has('state') || (!params.has('code') && !params.has('error'))) {
      return (
        inflightCallback ??
        Promise.resolve({
          loginMethod: 'oauth',
          flow: 'already-authenticated',
          success: true,
          durationMs: Math.round(performance.now() - startTime),
        })
      )
    }
    if (inflightCallback) {
      debug('callback: joining the exchange already in flight')
      return inflightCallback
    }

    // The response has to belong to the request this tab made, whether it carries a code or an
    // error. A mismatch touches neither the URL nor the stored flow, which may still be waiting
    // for its own response.
    const flow = readFlow(flowStorageKey)
    if (!flow) {
      debug('callback: authorization response but no pending request in this tab, ignoring')
      return Promise.resolve(failedCallback(startTime, 'no authorization request'))
    }
    if (params.get('state') !== flow.state) {
      debug('callback: state does not match the pending request, ignoring')
      return Promise.resolve(failedCallback(startTime, 'state mismatch'))
    }
    debug(
      'callback: authorization response for our request (%s)',
      params.has('code') ? 'code' : 'error',
    )
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
  ): Promise<OAuthCallbackResult> {
    const fail = (failureReason: string, exchangeDurationMs?: number) =>
      failedCallback(startTime, failureReason, exchangeDurationMs)

    // Report the RFC 6749 error code only. `error_description` is free text from the URL, and
    // telemetry is no place for it. The login screen shows both: the response was matched to
    // this tab's request by `state` above, so it is the authorization server's own answer.
    const error = params.get('error')
    if (error) {
      const description = params.get('error_description') ?? undefined
      debug(
        'callback: authorization server refused: %s (%s)',
        error,
        description ?? 'no description',
      )
      const code = OAUTH_ERROR_CODE.test(error) ? error : 'authorization server error'
      callbackError$.next({error: code, description})
      return fail(code)
    }

    // RFC 9207: a response that names an issuer must name this one, or it may be a code from
    // another authorization server replayed at this Studio. A response without `iss` is accepted,
    // since the server does not advertise support for it.
    const iss = params.get('iss')
    if (iss !== null && iss !== issuer) {
      debug('callback: iss %s does not match issuer %s, refusing', iss, issuer)
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
        renewBeforeExpiryMs,
      )
    } catch (err) {
      debug('callback: code exchange failed: %s', err instanceof Error ? err.message : err)
      return fail(exchangeFailureReason(err), Math.round(performance.now() - exchangeStart))
    }
    const exchangeDurationMs = Math.round(performance.now() - exchangeStart)
    debug('callback: code exchanged in %dms, %s', exchangeDurationMs, describeTokens(tokens))
    // Snapshot before the settle wait, with the same meaning as in `createClassicAuthStore`.
    const durationMs = Math.round(performance.now() - startTime)

    // Under the refresh lock, so a logout or refresh in another tab finishes before this pair
    // lands, and cannot clear or overwrite it halfway.
    const probesBeforeExchange = probeCount
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
      debug('callback: logged out during the exchange, revoking the new pair')
      await revokeTokens(tokens)
      return fail('logged out during sign-in', exchangeDurationMs)
    }
    const settle = await waitForAuthenticatedState(probesBeforeExchange)
    debug(
      'callback: state %s after %dms, returning to %s',
      settle.stateSettleTimedOut ? 'did not settle' : 'settled',
      settle.stateSettleDurationMs,
      flow.redirectPath ?? 'current path',
    )
    if (flow.redirectPath) replaceUrl(flow.redirectPath)

    return {
      loginMethod: 'oauth',
      flow: 'exchange',
      success: true,
      durationMs,
      exchangeDurationMs,
      ...settle,
    }
  }

  /**
   * Waits until the exchanged pair has been probed and found authenticated, so the AuthBoundary
   * does not open onto a stale logged-out state. Bounded like the callback settle wait in
   * `createClassicAuthStore`.
   *
   * Matched on a probe made after the exchange, not on `state`: the state replays its last
   * value and does not emit when the same user signs in again, so a user who was already signed
   * in would otherwise settle on the previous probe, or never.
   */
  async function waitForAuthenticatedState(probesBefore: number): Promise<{
    stateSettleDurationMs: number
    stateSettleTimedOut: boolean
  }> {
    const start = performance.now()
    // Raced as observables, so whichever loses is unsubscribed. A promise race would keep the
    // subscription alive after a timeout, for a token that may never authenticate. `state` is
    // subscribed alongside so the probe runs even if nothing else holds the state yet.
    const result = await firstValueFrom(
      race(
        merge(
          probed$.pipe(
            filter(
              ({sequence, state: probedState}) =>
                sequence > probesBefore && probedState.authenticated,
            ),
          ),
          state.pipe(ignoreElements()),
        ).pipe(map(() => 'settled' as const)),
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
    debug('logout requested')
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
      // Best-effort, like `createClassicAuthStore`: a forced logout reacting to a 401 revokes tokens
      // that are already dead, and a failed revocation must not keep the user signed in locally.
      if (tokens) {
        debug('logout: revoking %s', describeTokens(tokens))
        await revokeTokens(tokens)
      }
      clearFlow(flowStorageKey)
      tokenStorage.update(undefined)
      debug('logout: done')
    })
  }

  /**
   * The lightweight signed-in check: the user `/auth/id` answers for the access token this store
   * holds, on a plain client. Not on the store's own client, whose request handler would answer a
   * rejected token with a renewal, and not with the API cookie, which belongs to the project's
   * other workspaces. Asks again when the access token changes, here or in another tab.
   */
  const currentUserId = createAuthIdProbe({
    clientConfig: () => {
      const accessToken = tokenStorage.get()?.accessToken
      return accessToken
        ? {
            ...AUTH_CLIENT_OPTIONS,
            ...hostOptions,
            projectId,
            dataset,
            token: accessToken,
            ignoreBrowserTokenWarning: true,
          }
        : undefined
    },
    changes: () =>
      tokenStorage.value.pipe(
        map((tokens) => tokens?.accessToken),
        distinctUntilChanged(),
        skip(1),
      ),
  })

  return {
    handleCallbackUrl,
    state,
    token: tokenStorage.value.pipe(
      map((tokens) => tokens?.accessToken ?? null),
      distinctUntilChanged(),
    ),
    LoginComponent: createOAuthLoginComponent({login, callbackError$}),
    logout,
    currentUserId,
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
  visible$:
    typeof document === 'undefined'
      ? EMPTY
      : fromEvent(document, 'visibilitychange').pipe(
          filter(() => document.visibilityState === 'visible'),
        ),
}

/**
 * @internal
 */
export const createOAuthAuthStore: (options: OAuthAuthStoreOptions) => AuthStore = memoize(
  (options: OAuthAuthStoreOptions): AuthStore =>
    _createOAuthAuthStore({...options, ...defaultEnvironment}),
  // Same cache key rule as `createClassicAuthStore`: the lazy getters are runtime wiring, not identity.
  ({
    getRequestErrorHandler: _getRequestErrorHandler,
    getRequestFailureDiagnostics: _getRequestFailureDiagnostics,
    ...options
  }: OAuthAuthStoreOptions) => canonicalHash(options),
)
