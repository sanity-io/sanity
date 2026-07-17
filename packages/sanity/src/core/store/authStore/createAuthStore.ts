import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import memoize from 'lodash-es/memoize.js'
import {
  concat,
  defer,
  EMPTY,
  firstValueFrom,
  from,
  fromEvent,
  merge,
  type Observable,
  of,
  ReplaySubject,
  skip,
  timer,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  share,
  shareReplay,
  switchMap,
  take,
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
  AUTH_STATE_SETTLE_TIMEOUT_MS,
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
import {
  observeWorkbenchToken as defaultObserveWorkbenchToken,
  refreshWorkbenchToken as defaultRefreshWorkbenchToken,
} from './workbenchToken'

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
  /**
   * Observes the session token issued by the embedding workbench "OS", if the
   * Studio is running as a federated remote inside it. While it yields a token,
   * that token is authoritative: it takes precedence over `loginMethod` and
   * every other mechanism, is used in-memory only (never persisted), and the
   * auth state tracks it over time — so an OS sign-out (`null`) transitions the
   * Studio to unauthenticated. Returns `undefined` outside the workbench, in
   * which case the normal auth flow runs. Defaults to a no-op.
   * @internal
   */
  observeWorkbenchToken?: () => Observable<string | null> | undefined
  /**
   * Asks the workbench "OS" to reissue its session token, called when the
   * current one is rejected (a 401 surfaced as forced logout). In the workbench
   * this replaces tearing down the session locally, since the OS owns it — the
   * reissued token flows back through `observeWorkbenchToken`. Defaults to a
   * no-op.
   * @internal
   */
  refreshWorkbenchToken?: () => void
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
  observeWorkbenchToken = () => undefined,
  refreshWorkbenchToken = () => {},
  getRequestErrorHandler,
  getRequestFailureDiagnostics,
  ...providerOptions
}: AuthStoreOptions): AuthStore {
  // Precedence when initializing auth:
  // * if embedded in the workbench (`observeWorkbenchToken`), the OS auth state
  //   is authoritative and overrides everything below — see the `authState$`
  //   branch. Otherwise `loginMethod` decides:
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

  // Set by initial$; read by cookieRecheck$, which is only subscribed after
  // initial$ completes, so it's always set by then.
  let initialProbeAuthenticated: boolean | undefined

  // The post-exchange auth state, probed by the callback and handed to the
  // chain here (see applyCredentialUpdate). One-shot: the chain's reaction to
  // the credential update consumes it instead of probing again. Cleared on
  // logout.
  let pendingCallbackState: {state: Promise<AuthState>; expiresAt: number} | undefined

  /**
   * The pending callback state, if one exists and is still fresh. The chain's
   * reaction to a credential update normally consumes the one-shot within the
   * settle window — but when the update is a no-op for the chain (e.g. a
   * cookie-mode login while the channel already reads authenticated) nothing
   * consumes it, and without the expiry an unrelated emission hours later
   * (say, a cross-tab login) would emit this stale snapshot instead of
   * probing fresh. Expired entries are dropped here.
   */
  function freshPendingCallbackState(): Promise<AuthState> | undefined {
    if (pendingCallbackState && performance.now() > pendingCallbackState.expiresAt) {
      pendingCallbackState = undefined
    }
    return pendingCallbackState?.state
  }

  /**
   * Computes the auth state for a client — one `/users/me` round trip. Every
   * auth state this store emits is built here.
   */
  async function probeAuthState(client: SanityClient, tag: string): Promise<AuthState> {
    const currentUser = await getCurrentUser(
      client,
      tag,
      getRequestErrorHandler,
      getRequestFailureDiagnostics?.(),
    )
    return {client, authenticated: Boolean(currentUser?.id), currentUser: currentUser || null}
  }

  const initial$ = defer(async (): Promise<AuthState> => {
    const state = await probeAuthState(initialWorkspaceClient, 'initial')
    // Seed cookieAuthState from this probe so the channel leaves 'pending' —
    // but only for cookie/dual workspaces (token-only ones know nothing about
    // cookie validity), and only if nothing wrote a real value first: a value
    // written while this probe was in flight (post-login callback, another
    // tab) is fresher and must not be overwritten.
    if (loginMethod === 'cookie' || loginMethod === 'dual') {
      initialProbeAuthenticated = state.authenticated
      if (cookieAuthState.get()?.authenticated === 'pending') {
        cookieAuthState.update({authenticated: state.authenticated})
      }
    }
    // A callback exchange that completed mid-probe has fresher state than
    // this result. Not consumed: the chain's reaction still needs it.
    return freshPendingCallbackState() ?? state
  })

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

  // Derived from the live token state, not concat'ed with a pre-built
  // initial client: a positional skip would drop a token applied while the
  // initial probe is in flight (fast sid exchange), leaving the store stuck
  // on the credential-less client. Same shape as dualClient$ below.
  const tokenClient$ = merge(hashTokenChange, tokenStorage.value).pipe(
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
    shareReplay({bufferSize: 1, refCount: true}),
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

  // Dual/token modes: re-probe once, at subscribe time, if the token changed
  // while the initial probe was in flight — workspaceClient$'s skip(1) below
  // assumes its first emission is the client the initial probe used, which
  // no longer holds after such an early update. Later token changes flow
  // through workspaceClient$ itself; re-emitting them here would duplicate
  // the probe, hence take(1) on both the outer and the never-completing
  // inner stream.
  const initialToken = currentTokenState?.token ?? null
  const tokenRecheck$ = isCookielessCompatibleLoginMethod(loginMethod)
    ? tokenStorage.value.pipe(
        take(1),
        map((state) => state?.token ?? null),
        filter((token): token is string => typeof token === 'string' && token !== initialToken),
        switchMap(() => (loginMethod === 'dual' ? dualClient$ : tokenClient$).pipe(take(1))),
      )
    : EMPTY

  // Cookie-mode analogue of tokenRecheck$: a callback can write
  // cookieAuthState while the initial probe is in flight, and since the
  // channel replays only its latest value, skip(1) would eat that update and
  // no re-probe would ever run. Compare the first non-pending value against
  // the initial probe's own result; later changes flow through
  // workspaceClient$.
  const cookieRecheck$ =
    loginMethod === 'cookie'
      ? cookieAuthChanged$.pipe(
          take(1),
          filter(({authenticated}) => authenticated !== initialProbeAuthenticated),
          map(({authenticated}) => (authenticated ? cookieClient : undefined)),
        )
      : EMPTY

  const existingAuthState$ = concat(
    initial$,
    merge(workspaceClient$.pipe(skip(1)), dualCookieRecheck$, tokenRecheck$, cookieRecheck$).pipe(
      mergeMap(async (client): Promise<AuthState> => {
        if (!client) {
          // Credentials were torn down (e.g. a cross-tab logout broadcast).
          // Same rule as logout(): an unconsumed callback snapshot is stale
          // from this moment, and must not satisfy a later consumer that is
          // still inside the settle window.
          pendingCallbackState = undefined
          return {client: cookieClient, authenticated: false, currentUser: null}
        }
        // This emission is the chain's reaction to a callback's credential
        // update: consume the pre-probed state instead of repeating the
        // /users/me request.
        const callbackState = freshPendingCallbackState()
        if (callbackState) {
          pendingCallbackState = undefined
          return callbackState
        }
        return probeAuthState(client, 'update')
      }),
    ),
  )

  // Outside the workbench this is `undefined` and the normal reactive graph
  // runs unchanged. Inside, the OS auth state is authoritative: it emits the
  // current token (or `null` when the OS is signed out) and keeps emitting as
  // that changes, so `loginMethod` and the recheck streams are bypassed and a
  // later OS sign-out transitions the Studio to unauthenticated. The token is
  // never persisted (so it can't go stale in storage), which is also why it
  // feeds the `token` output below — consumers like Bifur (realtime) read that
  // directly and would otherwise authenticate from empty/stale storage.
  const workbenchToken$ = observeWorkbenchToken()?.pipe(
    shareReplay({bufferSize: 1, refCount: true}),
  )

  const authState$ = (
    workbenchToken$
      ? workbenchToken$.pipe(
          switchMap((workbenchToken): Observable<AuthState> => {
            if (!workbenchToken) {
              return of({client: cookieClient, authenticated: false, currentUser: null})
            }
            const client = clientFactory({
              ...AUTH_CLIENT_OPTIONS,
              ...hostOptions,
              projectId,
              dataset,
              token: workbenchToken,
              ignoreBrowserTokenWarning: true,
            })
            return from(
              getCurrentUser(
                client,
                'initial',
                getRequestErrorHandler,
                getRequestFailureDiagnostics?.(),
              ),
            ).pipe(
              map(
                (currentUser): AuthState => ({
                  client,
                  authenticated: Boolean(currentUser?.id),
                  currentUser: currentUser || null,
                }),
              ),
            )
          }),
        )
      : existingAuthState$
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

  /**
   * Applies a credential update and reports when the auth state reflects it:
   * the resulting state is probed with `client` (which already carries the
   * new credential) and handed to the chain, so that — unless flagged
   * `stateSettleTimedOut` — any authState$ emission delivered after the
   * returned promise resolves reflects the exchange. (When the chain is hot,
   * the emission itself also lands before resolution; when nothing is
   * subscribed yet, the first subscriber picks the state up via initial$.)
   *
   * The probe is handed to the chain BEFORE `update()` runs, because the
   * chain reacts to the update synchronously and must find it there. The
   * timeout bounds only how long the caller waits on a hung probe; the
   * probe keeps running and still updates the state if it completes. A
   * failed probe rejects, like the chain's own probes.
   */
  function applyCredentialUpdate(
    update: () => void,
    client: SanityClient,
  ): Promise<{stateSettleDurationMs: number; stateSettleTimedOut: boolean}> {
    const start = performance.now()

    const callbackState = probeAuthState(client, 'callback')
    pendingCallbackState = {
      state: callbackState,
      expiresAt: start + AUTH_STATE_SETTLE_TIMEOUT_MS,
    }
    update()

    let timeoutId: ReturnType<typeof setTimeout>
    const timeout = new Promise<undefined>((resolve) => {
      timeoutId = setTimeout(() => resolve(undefined), AUTH_STATE_SETTLE_TIMEOUT_MS)
    })
    // Ordering note: because `update()` already ran, a hot chain has adopted
    // `callbackState` by the time this race settles, and its emission is
    // delivered a microtask before an awaiter of this promise resumes —
    // that's what makes "the state reflects the exchange before the callback
    // resolves" hold. This is scheduling-sensitive: don't insert awaits
    // between `update()` and this race. The "resolves only after the state
    // reflects…" tests in createAuthStore.test.ts pin the ordering.
    return Promise.race([callbackState, timeout])
      .finally(() => clearTimeout(timeoutId))
      .then((state) => ({
        stateSettleDurationMs: Math.round(performance.now() - start),
        stateSettleTimedOut: state === undefined,
      }))
  }

  // Set while a post-login callback exchange is in flight (sid exchange).
  // LoginComponent reads this to suppress redirectOnSingle during the exchange to avoid redirecting back to the provider
  let _isHandlingCallback = false

  // The in-flight sid exchange, shared with concurrent callers (StrictMode
  // runs the callback effect twice): the sid is a one-shot, so a second call
  // must join the exchange rather than resolve 'already-authenticated'
  // mid-flight and reopen AuthBoundary's loading gate. Cleared once settled,
  // so later calls are ordinary loads again — no replayed results
  // double-logging telemetry, and no cached rejection blocking recovery
  // until a page reload.
  let _inflightCallback: Promise<HandleCallbackResult> | undefined

  async function handleCallbackUrl(): Promise<HandleCallbackResult> {
    const startTime = performance.now()
    const sessionId = getSessionId()
    // workaround for https://github.com/vercel/next.js/issues/91819
    clearHashSessionId()

    if (!sessionId) {
      if (_inflightCallback) {
        return _inflightCallback
      }
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
    const callbackProcessed = processCallback(sessionId, startTime).finally(() => {
      _isHandlingCallback = false
      // Guarded so a newer exchange (fresh sid) isn't clobbered by an older
      // one settling late.
      if (_inflightCallback === callbackProcessed) {
        _inflightCallback = undefined
      }
    })
    _inflightCallback = callbackProcessed
    return callbackProcessed
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
      // Retain the exchanged token (the dual client authenticates via the
      // Authorization header) and probe the resulting state so it's emitted
      // before this callback resolves — AuthBoundary holds the loading
      // screen until then. Skipped for an empty token: no client is ever
      // built with a falsy token, and the caller should see the failure
      // promptly.
      const settle = token
        ? applyCredentialUpdate(
            () => tokenStorage.update({token}),
            clientFactory({
              ...AUTH_CLIENT_OPTIONS,
              ...hostOptions,
              projectId,
              dataset,
              token,
              ignoreBrowserTokenWarning: true,
            }),
          )
        : undefined
      if (!token) tokenStorage.update({token})
      // The probe below can reject before `settle` is awaited — keep its
      // eventual rejection observed (doesn't affect the await further down).
      settle?.catch(() => {})

      const probeStart = performance.now()
      const authProbe = await probeCurrentUser(exchangeClient)
      const probeDurationMs = Math.round(performance.now() - probeStart)
      // Snapshot before the settle wait: `durationMs` keeps its version-2
      // meaning (exchange + probe) so aggregations stay comparable across
      // releases. The settle wait is reported in `stateSettleDurationMs`.
      const durationMs = Math.round(performance.now() - startTime)

      // sync with other tabs
      cookieAuthState.update({authenticated: authProbe.authenticated})

      const settleResult = settle ? await settle : undefined

      return {
        flow: 'exchange',
        loginMethod,
        success: !!token,
        durationMs,
        exchangeDurationMs,
        probeDurationMs,
        ...settleResult,
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
      // Same durationMs snapshot rationale as in dual mode above.
      const durationMs = Math.round(performance.now() - startTime)

      if (authProbe.authenticated) {
        // As in dual mode: probe the post-exchange state so it's emitted
        // before this callback resolves. The channel write doubles as the
        // cross-tab sync broadcast.
        const settle = applyCredentialUpdate(
          () => cookieAuthState.update({authenticated: true}),
          cookieClient,
        )

        return {
          flow: 'exchange',
          loginMethod,
          success: true,
          durationMs,
          exchangeDurationMs,
          probeDurationMs,
          ...(await settle),
          authMethod: 'cookie',
        }
      }
      // The cookie couldn't be established and there is no token to fall
      // back on. Nothing to wait for — the state is and stays unauthenticated.
      cookieAuthState.update({authenticated: false})
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
    // Same contract as dual mode — see the comment there.
    const settle = token
      ? applyCredentialUpdate(
          () => tokenStorage.update({token}),
          clientFactory({
            ...AUTH_CLIENT_OPTIONS,
            ...hostOptions,
            projectId,
            dataset,
            token,
            ignoreBrowserTokenWarning: true,
          }),
        )
      : undefined
    if (!token) tokenStorage.update({token})
    // Same durationMs snapshot rationale as in dual mode above.
    const durationMs = Math.round(performance.now() - startTime)
    const settleResult = settle ? await settle : undefined

    return {
      loginMethod,
      flow: 'exchange',
      success: !!token,
      durationMs,
      exchangeDurationMs,
      ...settleResult,
      authMethod: 'token',
      failureReason: token ? undefined : 'token exchange returned empty token',
    }
  }

  // Tracks whether the current unauthenticated state came from an explicit
  // logout action. Used by LoginComponent to suppress redirectOnSingle after
  // logout (so the user can pick a different account).
  let _didLogOut = false

  async function logout() {
    // In the workbench the OS owns the session, so a logout here is really a
    // rejected/expired OS token (surfaced as a forced logout on a 401). Ask the
    // OS to reissue rather than tearing the session down ourselves — the new
    // token arrives via `observeWorkbenchToken` and re-drives `authState$`.
    if (workbenchToken$) {
      refreshWorkbenchToken()
      return
    }

    _didLogOut = true
    // An unconsumed state from a callback exchange is stale the moment
    // credentials are torn down — the chain must not emit it later.
    pendingCallbackState = undefined
    // Behavior parity: logout has always hit /auth/logout with the client
    // built from the boot-time token (`firstValueFrom` on the old
    // concat-based tokenClient$ replayed exactly that). Now that tokenClient$
    // tracks live token state, keep using the boot-time client here — moving
    // to the live token changes which session gets invalidated and belongs in
    // its own change.
    const tokenClient = initialTokenClient

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
    token: workbenchToken$ ?? tokenStorage.value.pipe(map((t) => t?.token || null)),
    LoginComponent,
    logout,
  }
}

/**
 * Public options for `createAuthStore`. The `getSessionId`, `consumeHashToken`,
 * `observeWorkbenchToken` and `refreshWorkbenchToken` dependencies are wired
 * automatically using the default implementations.
 * @internal
 */
export type CreateAuthStoreOptions = Omit<
  AuthStoreOptions,
  'getSessionId' | 'consumeHashToken' | 'observeWorkbenchToken' | 'refreshWorkbenchToken'
>

/**
 * @internal
 */
export const createAuthStore: (options: CreateAuthStoreOptions) => AuthStore = memoize(
  (options: CreateAuthStoreOptions): AuthStore =>
    _createAuthStore({
      ...options,
      getSessionId: defaultGetSessionId,
      consumeHashToken: defaultConsumeHashToken,
      observeWorkbenchToken: defaultObserveWorkbenchToken,
      refreshWorkbenchToken: defaultRefreshWorkbenchToken,
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
