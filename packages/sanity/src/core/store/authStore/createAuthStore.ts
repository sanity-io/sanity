import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import memoize from 'lodash-es/memoize.js'
import {concat, EMPTY, firstValueFrom, fromEvent, merge, of, ReplaySubject, skip, timer} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  share,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators'

import {type AuthConfig} from '../../config/auth/types'
import {isStaging} from '../../environment/isStaging'
import {isNetworkError, isUnauthorizedError} from '../../studio/requestErrors/classify'
import {
  type RequestFailureProbe,
  type RequestFailureResult,
} from '../../studio/requestErrors/diagnoseRequestFailure'
import {type StudioErrorHandler} from '../../studio/requestErrors/types'
import {canonicalHash} from '../../util/canonicalHash'
import {
  AUTH_CLIENT_OPTIONS,
  getAuthTokenStorageKey,
  getCookieAuthStateKey,
  UNAUTHENTICATED,
} from './constants'
import {createBroadcastState} from './createBroadcastState'
import {createBroadcastStorage} from './createBroadcastStorage'
import {createLoginComponent} from './createLoginComponent'
import {consumeHashToken as defaultConsumeHashToken} from './hashToken'
import {clearHashSessionId, getHashSessionId as defaultGetSessionId} from './sessionId'
import {
  type AuthProbeResult,
  type AuthState,
  type AuthStore,
  type HandleCallbackResult,
} from './types'
import {isCookielessCompatibleLoginMethod} from './utils/asserters'

/** @internal */
export interface AuthStoreOptions extends AuthConfig {
  clientFactory?: (options: SanityClientConfig) => SanityClient
  projectId: string
  dataset: string
  /**
   * Lazily resolves the channel for delegating unrecoverable boot-time
   * request errors (network / 5xx on the initial `/users/me` probe) to the
   * studio's error dialog instead of crashing the boot sequence.
   *
   * @internal
   */
  getRequestErrorHandler?: () => StudioErrorHandler | undefined
  /**
   * Lazily resolves diagnostics for the `/users/me` probe, so it can detect
   * and report the CORS / missing-project-or-dataset failures the studio
   * request handler would otherwise catch (the probe bypasses that handler).
   * Resolved lazily for the same reason as `getRequestErrorHandler`: it's
   * unhashable runtime wiring that must stay out of the auth-store memo key.
   *
   * @internal
   */
  getRequestFailureDiagnostics?: () => RequestFailureDiagnostics | undefined
  /**
   * Retrieves the session ID from the URL hash for the auth callback flow.
   * Called by `handleCallbackUrl` to obtain the session ID that is exchanged
   * for a token or cookie.
   * @internal
   */
  getSessionId: () => string | undefined
  /**
   * Extracts and consumes a `#token=…` fragment from the URL hash.
   * Called at init to pick up hash tokens and on `hashchange` events.
   * @internal
   */
  consumeHashToken: () => string | undefined
}

/**
 * Lets the auth store's `/users/me` probe diagnose and report the failures the
 * studio request handler would normally catch — but can't here, because the
 * probe runs on a client with that handler stripped (see {@link getCurrentUser}).
 *
 * - `diagnose` — the shared classifier. The client is passed per call rather
 *   than bound up front, because the auth store builds its own clients
 *   internally (so there's no single client to bind the probe to).
 * - `onRequestFailure` — reports a non-`unknown` result to the studio so it
 *   can take over the screen (CORS / missing project or dataset). Must be
 *   idempotent: the probe runs inside a retryable thunk, so a recurring
 *   failure can report the same result more than once.
 *
 * @internal
 */
export interface RequestFailureDiagnostics {
  diagnose: (err: unknown, client: SanityClient) => ReturnType<RequestFailureProbe>
  onRequestFailure: (
    result: Exclude<RequestFailureResult, {type: 'unknown'}>,
    client: SanityClient,
  ) => void
}

const getCurrentUser = async (
  client: SanityClient,
  tag: string,
  getRequestErrorHandler?: () => StudioErrorHandler | undefined,
  diagnostics?: RequestFailureDiagnostics,
): Promise<CurrentUser | undefined> => {
  // Probe with the forced-logout middleware stripped off. That middleware
  // (installed on every studio client) parks 401s forever to drive forced
  // logout — but this probe IS the auth-state source of truth and handles its
  // own 401 below. If the middleware parked this request, `fetchUser` would
  // never settle, so the auth state could never transition to logged-out and
  // the studio would freeze instead of showing the login screen. The 401 must
  // reach the `.catch` here, not the channel.
  //
  // Guarded for custom `unstable_clientFactory` clients that may not implement
  // `withConfig` — those don't carry the middleware anyway.
  const probeClient =
    typeof client.withConfig === 'function'
      ? client.withConfig({_requestHandler: undefined})
      : client
  const fetchUser = () =>
    probeClient
      .request({
        uri: '/users/me',
        tag: `users.get-current${tag ? `.${tag}` : ''}`,
      })
      .catch(async (err) => {
        // 401 means the user had some kind of credentials but failed to
        // authenticate — treat it as logged out. Resolved inside the thunk
        // so the request-error channel never sees the 401: at boot this is
        // the normal logged-out state (AuthBoundary shows the login
        // screen), not a session-expiry event to verify and tear down.
        if (isUnauthorizedError(err)) return undefined

        // This probe runs on a client with the studio request handler stripped
        // (so its 401 reaches the branch above), which means it bypasses the
        // handler's CORS / missing-project-or-dataset detection. Diagnose those
        // here instead: when the studio can't reach the project because the
        // origin isn't allowed (CORS — which can change at any time) or the
        // project/dataset doesn't exist, report it so the studio takes over the
        // screen, and resolve as logged-out rather than surfacing a generic
        // network error.
        if (diagnostics) {
          const result = await diagnostics.diagnose(err, probeClient)
          if (result.type !== 'unknown') {
            // `attempt` (below) may re-run this thunk on a recurring failure, so
            // this can fire more than once — `onRequestFailure` is idempotent.
            diagnostics.onRequestFailure(result, probeClient)
            return undefined
          }
        }
        throw err
      })

  try {
    // Network errors / 5xx on this boot-critical read leave the studio
    // unable to start — there is no local recovery. Delegate them to the
    // studio's request-error dialog (retryable: it's an idempotent GET)
    // instead of crashing the boot sequence. Resolved lazily: the channel
    // may not exist yet when the store is constructed.
    const requestErrorChannel = getRequestErrorHandler?.()
    const user = requestErrorChannel
      ? await requestErrorChannel.attempt(fetchUser, {retryable: true})
      : await fetchUser()

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : undefined
  } catch (err) {
    // Reached only in the no-channel fallback path, or for errors the
    // channel declined to claim. Guarded: a thrown value can be anything,
    // so don't touch properties until it's confirmed to be a network error.
    if (isNetworkError(err) && !err.message) {
      const url = (err as Error & {request?: {url?: string}}).request?.url
      if (url) {
        throw new Error(`Unknown network error attempting to reach ${new URL(url).host}`, {
          cause: err,
        })
      }
    }

    // Some other error, just throw it
    throw err
  }
}

/**
 * Probe whether a given auth method works by calling /auth/id.
 */
const probeCurrentUser = (client: SanityClient): Promise<AuthProbeResult> => {
  // Strip the studio's request handler: it parks any 401 (returns a
  // never-settling observable) so the studio can show the login screen. But
  // this probe IS an auth-state check and handles its own 401 below — if the
  // middleware parked it, the probe would never settle, and the post-login
  // callback (`processCallback`) that awaits it would hang, leaving the studio
  // stuck instead of transitioning to authenticated. The 401 must reach the
  // `.catch` here. Guarded for custom clients that may not implement
  // `withConfig` (those don't carry the middleware anyway).
  const probeClient =
    typeof client.withConfig === 'function'
      ? client.withConfig({_requestHandler: undefined})
      : client
  return probeClient
    .request<{id: string; expiry: number}>({
      uri: '/auth/id',
      tag: 'auth.check-id',
    })
    .then(
      (response) => {
        // Note: currently this endpoint responds with 401 when user is not authenticated
        // so response.id will always be set here.
        // However, to align with /users/me, this endpoint may be changed to
        // return 200 OK with `{}` as the response (see SRE-3648)
        return typeof response?.id === 'string'
          ? {
              authenticated: true,
              id: response.id,
            }
          : UNAUTHENTICATED
      },
      (err) => {
        if (err instanceof ClientError && err.statusCode === 401) {
          return UNAUTHENTICATED
        }
        throw err
      },
    )
}
// the flow:
// on init, all auth stores fetches the current auth state once, then broadcasts it state to other tabs
// of an auth store receives a state update from another tab taht doesn't matches its local state
// it refetches state and broadcasts again
// then, sets up a listener for tab broadcasts and re-checks based on that
async function exchangeSessionForToken(client: SanityClient, sessionId: string): Promise<string> {
  const {token} = await client.request<{token: string}>({
    method: 'GET',
    uri: `/auth/fetch`,
    query: {sid: sessionId},
    tag: 'auth.fetch-token',
  })
  return token
}

/**
 * @internal
 */
export function _createAuthStore({
  clientFactory: clientFactoryOption,
  projectId,
  dataset,
  apiHost,
  loginMethod = 'dual',
  getSessionId,
  consumeHashToken,
  getRequestErrorHandler,
  getRequestFailureDiagnostics,
  ...providerOptions
}: AuthStoreOptions): AuthStore {
  // Precedence when initializing auth:
  // * if loginMethod == 'dual':
  //    1. token in hash (if exists) – will be written as new localStorage token
  //    2. token in localStorage (if it exists)
  //    3. HTTP cookie
  // * if loginMethod == "token"
  //    1. token in hash (if exists) – will be written as new localStorage token
  //    2. token in localStorage (if it exists)
  // * if loginMethod == "cookie"
  //    1. HTTP cookie

  const tokenStorage = createBroadcastStorage<{token?: string}>(
    getAuthTokenStorageKey(projectId),
    // sets the initial value
    (currentTokenValue) => {
      if (!isCookielessCompatibleLoginMethod(loginMethod)) {
        // note: this will also clear any existing state
        // note2: if there is another workspace for the same project using token auth, merely initializing this
        // store will log you out. Need to find a better way to deal with this
        // return undefined
      }
      const hashToken = consumeHashToken()
      // use hash token if it exists, assume authenticated
      return hashToken ? {token: hashToken, authenticated: true} : currentTokenValue
    },
  )

  // We have no way of detecting cookie state change across tabs
  // e.g. user logs in one tab while being logged out in another.
  // But whenever we fetch the user in one tab we can broadcast the status to other tabs. If a tab
  // has a different status that what it received from another tab, it fetches. This ensures all
  // tabs converge on the same auth state
  const cookieAuthState = createBroadcastState<{authenticated: boolean | 'pending'}>(
    getCookieAuthStateKey(projectId),
    () => ({authenticated: 'pending'}),
  )

  const clientFactory = clientFactoryOption ?? createSanityClient

  // Allow configuration of `apiHost` through source configuration
  const hostOptions: {apiHost?: string} = {}
  if (apiHost) {
    hostOptions.apiHost = apiHost
  } else if (isStaging) {
    hostOptions.apiHost = 'https://api.sanity.work'
  }

  const cookieClient = clientFactory({
    ...AUTH_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    withCredentials: true,
  })

  const currentTokenState = tokenStorage.get()

  const initialTokenClient = clientFactory({
    ...AUTH_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    ...(currentTokenState?.token
      ? {token: currentTokenState.token, ignoreBrowserTokenWarning: true}
      : {}),
  })

  const initialDualClient = clientFactory({
    ...AUTH_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    ...(currentTokenState?.token
      ? {token: currentTokenState.token, ignoreBrowserTokenWarning: true}
      : {withCredentials: true}),
  })

  // note: cookie client is constant and doesn't change over time (e.g., based on token updates)
  // both dual and token clients will update when a new token is configured
  const initialWorkspaceClient =
    loginMethod === 'dual'
      ? initialDualClient
      : loginMethod === 'cookie'
        ? cookieClient
        : initialTokenClient

  const initial$ = of(initialWorkspaceClient).pipe(
    mergeMap(async (client): Promise<AuthState> => {
      const currentUser = await getCurrentUser(
        client,
        'initial',
        getRequestErrorHandler,
        getRequestFailureDiagnostics?.(),
      )
      const authenticated = Boolean(currentUser?.id)
      // Seed cookieAuthState once from the initial probe result. This moves
      // the channel out of 'pending' so cookieAuthChanged$ starts emitting
      // and downstream operators (skip(1) in authState$, etc.) behave.
      // Only cookie/dual workspaces should touch this — token-only workspaces
      // have no signal about cookie validity and broadcasting from them
      // would poison sibling cookie workspaces for the same project.
      if (loginMethod === 'cookie' || loginMethod === 'dual') {
        cookieAuthState.update({authenticated})
      }
      return {
        client,
        authenticated,
        currentUser: currentUser || null,
      }
    }),
  )

  // Listen for hash changes and consume any token found in the hash.
  // The tap triggers tokenStorage.update() which pushes to the BehaviorSubject
  // backing tokenStorage.value — so the actual emission comes from that stream.
  // switchMap to EMPTY so this branch produces no direct values.
  // Guarded for SSR: `window` is undefined on the server, where we can't
  // listen for hash changes anyway.
  const hashTokenChange =
    typeof window === 'undefined'
      ? EMPTY
      : fromEvent(window, 'hashchange').pipe(
          tap(() => {
            const hashToken = consumeHashToken()
            if (hashToken) {
              tokenStorage.update({token: hashToken})
            }
          }),
          switchMap(() => EMPTY),
        )

  const tokenClient$ = concat(
    of(initialTokenClient),
    merge(hashTokenChange, tokenStorage.value.pipe(skip(1)))
      .pipe(
        map((nextTokenState) => {
          return clientFactory({
            ...AUTH_CLIENT_OPTIONS,
            ...hostOptions,
            projectId,
            dataset,
            ...(nextTokenState?.token
              ? {token: nextTokenState.token, ignoreBrowserTokenWarning: true}
              : {}),
          })
        }),
      )
      .pipe(shareReplay({bufferSize: 1, refCount: true})),
  )

  // Derive the dual client from the current token state
  const dualClient$ = merge(hashTokenChange, tokenStorage.value).pipe(
    map((nextTokenState) => {
      return clientFactory({
        ...AUTH_CLIENT_OPTIONS,
        ...hostOptions,
        projectId,
        dataset,
        ...(nextTokenState?.token
          ? {token: nextTokenState.token, ignoreBrowserTokenWarning: true}
          : {withCredentials: true}),
      })
    }),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  const cookieAuthChanged$ = cookieAuthState.value.pipe(
    filter((v) => v?.authenticated !== 'pending'),
    distinctUntilChanged(isEqual),
  )

  const cookieWorkspaceClient$ = cookieAuthChanged$.pipe(
    map(({authenticated}) => (authenticated ? cookieClient : undefined)),
  )

  // Only include inputs that are relevant for the current login method.
  const workspaceClient$ = (
    loginMethod === 'dual'
      ? dualClient$
      : loginMethod === 'cookie'
        ? cookieWorkspaceClient$
        : tokenClient$
  ).pipe(distinctUntilChanged())

  // For dual mode, workspaceClient$ always emits the same dualClient reference,
  // so cookie auth state changes alone won't pass distinctUntilChanged above.
  // Merge in cookie state changes to trigger a re-check with the current dualClient.
  const dualCookieRecheck$ =
    loginMethod === 'dual'
      ? cookieAuthChanged$.pipe(
          skip(1),
          switchMap(() => dualClient$),
        )
      : EMPTY

  // For dual mode, re-probe when the token changes from what the initial probe
  // already used
  const initialToken = currentTokenState?.token ?? null
  const dualTokenRecheck$ =
    loginMethod === 'dual'
      ? tokenStorage.value.pipe(
          map((state) => state?.token ?? null),
          distinctUntilChanged(),
          filter((token): token is string => typeof token === 'string' && token !== initialToken),
          switchMap(() => dualClient$),
        )
      : EMPTY

  const authState$ = concat(
    initial$,
    merge(workspaceClient$.pipe(skip(1)), dualCookieRecheck$, dualTokenRecheck$).pipe(
      mergeMap(async (client): Promise<AuthState> => {
        if (!client) {
          return {client: cookieClient, authenticated: false, currentUser: null}
        }
        const currentUser = await getCurrentUser(
          client,
          'update',
          getRequestErrorHandler,
          getRequestFailureDiagnostics?.(),
        )
        return {
          client,
          authenticated: Boolean(currentUser?.id),
          currentUser: currentUser || null,
        }
      }),
    ),
  ).pipe(
    // Cookie state is broadcast to other tabs (and sibling workspaces for the
    // same project in this page) only on meaningful events: post-login probe
    // in handleCallbackUrl, and logout. Broadcasting on every authState$
    // emission turns out to be noisy — each workspace's own probe result
    // would propagate to siblings, causing them to re-evaluate and emit,
    // which re-broadcasts in a feedback loop. Keep the stream quiet here and
    // let the explicit write sites own cross-tab sync.
    share({connector: () => new ReplaySubject(1), resetOnRefCountZero: () => timer(1000)}),
  )

  // Set while a post-login callback exchange is in flight (sid exchange).
  // LoginComponent reads this to suppress redirectOnSingle during the exchange to avoid redirecting back to the provider
  let _isHandlingCallback = false

  async function handleCallbackUrl(): Promise<HandleCallbackResult> {
    const startTime = performance.now()
    const sessionId = getSessionId()
    // workaround for https://github.com/vercel/next.js/issues/91819
    clearHashSessionId()

    if (!sessionId) {
      // No session ID means this is a normal cold load, not a post-login redirect.

      return {
        loginMethod,
        flow: 'already-authenticated',
        success: true,
        durationMs: Math.round(performance.now() - startTime),
      }
    }

    // A sid is present: we're processing a post-login callback. Hold off the
    // redirectOnSingle redirect until this resolves.
    _isHandlingCallback = true
    try {
      return await processCallback(sessionId, startTime)
    } finally {
      _isHandlingCallback = false
    }
  }

  async function processCallback(
    sessionId: string,
    startTime: number,
  ): Promise<HandleCallbackResult> {
    // Client used to exchange SID (Session ID) for a token (and a cookie as a side effect)
    const exchangeClient = clientFactory({
      ...AUTH_CLIENT_OPTIONS,
      ...hostOptions,
      projectId,
      dataset,
      withCredentials: true,
    })

    const exchangeStart = performance.now()
    let token: string | undefined
    try {
      token = await exchangeSessionForToken(exchangeClient, sessionId)
    } catch (err) {
      return {
        loginMethod,
        flow: 'exchange',
        success: false,
        durationMs: Math.round(performance.now() - startTime),
        exchangeDurationMs: Math.round(performance.now() - exchangeStart),
        failureReason: err instanceof Error ? err.message : 'exchange failed',
        error: {
          type: 'auth-failed',
          message: 'Failed to exchange session for credentials. Please try logging in again.',
        },
      }
    }

    const exchangeDurationMs = Math.round(performance.now() - exchangeStart)

    if (loginMethod === 'dual') {
      // Dual mode: always retain the exchanged token so the dual client can
      // authenticate via the Authorization header.
      tokenStorage.update({token})

      const probeStart = performance.now()
      const authProbe = await probeCurrentUser(exchangeClient)
      const probeDurationMs = Math.round(performance.now() - probeStart)
      const durationMs = Math.round(performance.now() - startTime)

      // sync with other tabs
      cookieAuthState.update({authenticated: authProbe.authenticated})

      return {
        flow: 'exchange',
        loginMethod,
        success: !!token,
        durationMs,
        exchangeDurationMs,
        probeDurationMs,
        // Report cookie as the transport when the probe passed, otherwise token —
        // either way the token is stored and available as a fallback.
        authMethod: authProbe.authenticated ? 'cookie' : 'token',
        failureReason: token ? undefined : 'token exchange returned empty token',
      }
    }

    if (loginMethod === 'cookie') {
      // Try to check if the user is authenticated by using the cookie credentials.
      // We can re-use the exchangeClient here because it's configured with withCredentials.
      const probeStart = performance.now()
      const authProbe = await probeCurrentUser(exchangeClient)
      const probeDurationMs = Math.round(performance.now() - probeStart)
      const durationMs = Math.round(performance.now() - startTime)

      // sync with other tabs
      cookieAuthState.update({authenticated: authProbe.authenticated})

      if (authProbe.authenticated) {
        return {
          flow: 'exchange',
          loginMethod,
          success: true,
          durationMs,
          exchangeDurationMs,
          probeDurationMs,
          authMethod: 'cookie',
        }
      }
      // We failed to set cookie and can't fallback to token
      return {
        loginMethod,
        flow: 'exchange',
        success: false,
        durationMs,
        exchangeDurationMs,
        probeDurationMs,
        failureReason: 'cookie probe failed in cookie-only mode',
        error: {
          type: 'cookie-blocked',
          message:
            'Authentication could not be completed because this browser appears to block ' +
            'third-party cookies. This studio is configured to use cookie-based authentication ' +
            'only. Try using a different browser, disabling strict cookie blocking, or ask the ' +
            'studio administrator to enable token-based authentication.',
        },
      }
    }

    // loginMethod === 'token': store the token so subscribers re-init clients with it.
    // (dual already stored it above; cookie returned above.)
    tokenStorage.update({token})

    return {
      loginMethod,
      flow: 'exchange',
      success: !!token,
      durationMs: Math.round(performance.now() - startTime),
      exchangeDurationMs,
      authMethod: 'token',
      failureReason: token ? undefined : 'token exchange returned empty token',
    }
  }

  // Tracks whether the current unauthenticated state came from an explicit
  // logout action. Used by LoginComponent to suppress redirectOnSingle after
  // logout (so the user can pick a different account).
  let _didLogOut = false

  async function logout() {
    _didLogOut = true
    const tokenClient = await firstValueFrom(tokenClient$)

    // Tell the server to invalidate the session. Best-effort: if it fails
    // (network, or the session is already gone — e.g. a forced logout
    // reacting to a 401, where there's nothing left to invalidate), we
    // still tear down local auth state below. Coupling the local teardown
    // to this request succeeding would leave the studio frozen on a failed
    // logout instead of landing on the login screen.
    //
    // The parking middleware must be stripped: it catches any 401 and returns
    // a never-settling observable, so a forced logout reacting to a 401 (the
    // session is already gone) would hit an `/auth/logout` that also 401s, and
    // `Promise.allSettled` would never resolve — the exact freeze this branch
    // fixes for the `/users/me` probe. Guarded for custom clients that may not
    // implement `withConfig` (those don't carry the middleware anyway).
    //
    // Both clients are hit: even with loginMethod=token an auth cookie may
    // be set on the project api domain, so both must be destroyed.
    const stripMiddleware = (c: SanityClient) =>
      typeof c.withConfig === 'function' ? c.withConfig({_requestHandler: undefined}) : c
    await Promise.allSettled([
      stripMiddleware(tokenClient).request({uri: '/auth/logout', method: 'POST'}),
      stripMiddleware(cookieClient).request({uri: '/auth/logout', method: 'POST'}),
    ])

    // Clear local auth state regardless of the server call's outcome. This
    // updates token auth subscribers / re-inits clients, broadcasts cookie
    // invalidation to other tabs, and transitions auth state to
    // unauthenticated so the AuthBoundary shows the login screen.
    tokenStorage.update(undefined)
    cookieAuthState.update({authenticated: false})
  }

  const LoginComponent = createLoginComponent({
    ...providerOptions,
    client$: authState$.pipe(map((state) => state.client)),
    loginMethod,
    wasLogout: () => _didLogOut,
    isHandlingCallback: () => _isHandlingCallback,
  })

  return {
    handleCallbackUrl,
    state: authState$,
    token: tokenStorage.value.pipe(map((t) => t?.token || null)),
    LoginComponent,
    logout,
  }
}

/**
 * Public options for `createAuthStore`. The `getSessionId` and `consumeHashToken`
 * dependencies are wired automatically using the default implementations.
 * @internal
 */
export type CreateAuthStoreOptions = Omit<AuthStoreOptions, 'getSessionId' | 'consumeHashToken'>

/**
 * @internal
 */
export const createAuthStore: (options: CreateAuthStoreOptions) => AuthStore = memoize(
  (options: CreateAuthStoreOptions): AuthStore =>
    _createAuthStore({
      ...options,
      getSessionId: defaultGetSessionId,
      consumeHashToken: defaultConsumeHashToken,
    }),
  // `getRequestErrorHandler` / `getRequestFailureDiagnostics` are functions
  // (not hashable, and not part of the store's identity — they just look up UI
  // wiring lazily). Exclude them from the cache key.
  ({
    getRequestErrorHandler: _getRequestErrorHandler,
    getRequestFailureDiagnostics: _getRequestFailureDiagnostics,
    ...options
  }: CreateAuthStoreOptions) => canonicalHash(options),
)
