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
  combineLatest,
  concat,
  EMPTY,
  firstValueFrom,
  fromEvent,
  merge,
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
  tap,
} from 'rxjs/operators'

import {type AuthConfig} from '../../../config'
import {isStaging} from '../../../environment/isStaging'
import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'
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

const getCurrentUser = async (
  client: SanityClient,
  tag: string,
): Promise<CurrentUser | undefined> => {
  try {
    const user = await client.request({
      uri: '/users/me',
      tag: `users.get-current${tag ? `.${tag}` : ''}`,
    })

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : undefined
  } catch (err) {
    if (err.statusCode === 401) {
      return undefined
    }
    throw err
  }
}

const UNAUTHENTICATED = {authenticated: false} as const

const API_VERSION = 'v2026-04-09'

/**
 * Probe whether a given auth method works by calling /auth/id.
 */
const probeCurrentUser = (client: SanityClient): Promise<AuthProbeResult> => {
  return client
    .request<{id: string; expiry: number}>({
      uri: '/users/me',
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

const COMMON_CLIENT_OPTIONS = {
  apiVersion: API_VERSION,
  useCdn: false,
  perspective: 'raw',
  requestTagPrefix: 'sanity.studio',
  allowReconfigure: false,
  headers: DEFAULT_STUDIO_CLIENT_HEADERS,
} as const

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
    `__studio_auth_token_${projectId}`,
    // sets the initial value
    (currentTokenValue) => {
      if (!isCookielessCompatibleLoginMethod(loginMethod)) {
        // note: this will also clear any existing state
        return undefined
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
    `__studio_auth_cookie_state_${projectId}`,
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
    ...COMMON_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    withCredentials: true,
  })

  const currentTokenState = tokenStorage.get()

  const initialTokenClient = clientFactory({
    ...COMMON_CLIENT_OPTIONS,
    ...hostOptions,
    projectId,
    dataset,
    ...(currentTokenState?.token
      ? {token: currentTokenState.token, ignoreBrowserTokenWarning: true}
      : {}),
  })

  const initialDualClient = clientFactory({
    ...COMMON_CLIENT_OPTIONS,
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
      const currentUser = await getCurrentUser(client, 'initial')
      return {
        client,
        authenticated: Boolean(currentUser?.id),
        currentUser: currentUser || null,
      }
    }),
  )

  // Listen for hash changes and consume any token found in the hash.
  // The tap triggers tokenStorage.update() which pushes to the BehaviorSubject
  // backing tokenStorage.value — so the actual emission comes from that stream.
  // switchMap to EMPTY so this branch produces no direct values.
  const hashTokenChange = fromEvent(document, 'hashchange').pipe(
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
            ...COMMON_CLIENT_OPTIONS,
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

  const dualClient$ = concat(
    of(initialDualClient),
    merge(hashTokenChange, tokenStorage.value.pipe(skip(1))).pipe(
      map((nextTokenState) => {
        return clientFactory({
          ...COMMON_CLIENT_OPTIONS,
          ...hostOptions,
          projectId,
          dataset,
          ...(nextTokenState?.token
            ? {token: nextTokenState.token, ignoreBrowserTokenWarning: true}
            : {withCredentials: true}),
        })
      }),
    ),
  ).pipe(shareReplay({bufferSize: 1, refCount: true}))

  const cookieAuthChanged$ = cookieAuthState.value.pipe(
    filter((v) => v?.authenticated !== 'pending'),
    distinctUntilChanged(isEqual),
  )

  const workspaceClient$ = combineLatest([
    tokenClient$,
    dualClient$,
    cookieAuthChanged$.pipe(map(({authenticated}) => (authenticated ? cookieClient : undefined))),
  ]).pipe(
    map(([tokenClient, dualClient, _cookieClient]) => {
      return loginMethod === 'dual'
        ? dualClient
        : loginMethod === 'cookie'
          ? _cookieClient
          : tokenClient
    }),
    distinctUntilChanged(),
  )

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

  const authState$ = concat(
    initial$,
    merge(workspaceClient$.pipe(skip(1)), dualCookieRecheck$).pipe(
      mergeMap(async (client): Promise<AuthState> => {
        if (!client) {
          return {client: cookieClient, authenticated: false, currentUser: null}
        }
        const currentUser = await getCurrentUser(client, 'update')
        return {
          client,
          authenticated: Boolean(currentUser?.id),
          currentUser: currentUser || null,
        }
      }),
    ),
  ).pipe(
    tap((s) => {
      // sync with other tabs
      cookieAuthState.update({authenticated: s.authenticated})
    }),
    share({connector: () => new ReplaySubject(1), resetOnRefCountZero: () => timer(1000)}),
  )

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

    // Client used to exchange SID (Session ID) for a token (and a cookie as a side effect)
    const exchangeClient = clientFactory({
      ...COMMON_CLIENT_OPTIONS,
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

    if (loginMethod === 'dual' || loginMethod === 'cookie') {
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
      } else if (loginMethod === 'cookie') {
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
    }

    // Fallback to token auth (dual mode with failed cookie probe), or explicit loginMethod: 'token'.
    // Store the token so subscribers re-init clients with it.
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

  async function logout() {
    const tokenClient = await firstValueFrom(tokenClient$)

    // Destroy both token and cookie when logging out.
    // Note that the initialTokenClient might not actually be configured with a token —
    // that's ok, since the logout endpoint will then just respond with 204.
    //
    // Also note that even if the studio is configured with loginMethod=token, an
    // auth cookie may still be set on the project api domain. When the user hits
    // the log-out button, we need to make sure we destroy both
    await Promise.all([
      tokenClient.request({uri: '/auth/logout', method: 'POST'}).then(() =>
        // This will update token auth subscribers and re-init clients
        tokenStorage.update(undefined),
      ),
      cookieClient.request({uri: '/auth/logout', method: 'POST'}).then(() =>
        // Broadcast cookie invalidation to other tabs
        cookieAuthState.update({authenticated: false}),
      ),
    ])
  }

  const LoginComponent = createLoginComponent({
    ...providerOptions,
    client$: authState$.pipe(map((state) => state.client)),
    loginMethod,
  })

  return {
    handleCallbackUrl,
    state: authState$,
    LoginComponent,
    logout,
  }
}

function hash(value: unknown): string {
  if (typeof value !== 'object' || value === null) return `${value}`

  // note: this code path works for arrays as well as objects
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, v]) => [k, hash(v)]),
    ),
  )
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
export const createAuthStore = memoize(
  (options: CreateAuthStoreOptions): AuthStore =>
    _createAuthStore({
      ...options,
      getSessionId: defaultGetSessionId,
      consumeHashToken: defaultConsumeHashToken,
    }),
  hash,
)
