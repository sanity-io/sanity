import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import memoize from 'lodash-es/memoize.js'
import {combineLatest, defer, EMPTY, firstValueFrom, fromEvent, merge} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, switchMap, tap} from 'rxjs/operators'

import {type AuthConfig} from '../../../config'
import {isStaging} from '../../../environment/isStaging'
import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'
import {createBroadcastState} from './createBroadcastState'
import {createLoginComponent} from './createLoginComponent'
import {createTokenStorage} from './createTokenStorage'
import {consumeHashToken} from './hashToken'
import {clearHashSessionId, getHashSessionId} from './sessionId'
import {
  type AuthState,
  type AuthStore,
  type HandleCallbackResult,
  type AuthProbeResult,
} from './types'
import {isCookielessCompatibleLoginMethod} from './utils/asserters'

/** @internal */
export interface AuthStoreOptions extends AuthConfig {
  clientFactory?: (options: SanityClientConfig) => SanityClient
  projectId: string
  dataset: string
}

const getCurrentUser = async (
  client: SanityClient,
  onUnauthorized?: () => void,
): Promise<CurrentUser | undefined> => {
  try {
    const user = await client.request({
      uri: '/users/me',
      tag: 'users.get-current',
    })

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : undefined
  } catch (err) {
    // 401 means the user had some kind of credentials, but failed to authenticate.
    // Clear any stale local token so we don't keep retrying with bad credentials.
    if (err.statusCode === 401) {
      onUnauthorized?.()
      return undefined
    }

    // Some non-CORS error - is it one of those undefinable network errors?
    if (err.isNetworkError && !err.message && err.request && err.request.url) {
      const host = new URL(err.request.url).host
      throw new Error(`Unknown network error attempting to reach ${host}`, {cause: err})
    }

    // Some other error, just throw it
    throw err
  }
}

const UNAUTHENTICATED = {authenticated: false} as const
// Uses the experimental API version for access to /auth/id and /auth/exchange endpoints
const API_VERSION = 'vX'

/**
 * Probe whether a given auth method works by calling /auth/id.
 */
const probeCurrentUser = (client: SanityClient): Promise<AuthProbeResult> => {
  return client
    .withConfig({apiVersion: API_VERSION})
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
              expiry: new Date(response.expiry * 1000).toISOString(),
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

/**
 * Exchange a session ID for both a cookie and a token via /auth/exchange.
 * The endpoint sets a Set-Cookie header (stored under the Studio's partition key
 * because this is a fetch with credentials from the Studio's origin) and returns
 * the token in the response body.
 */
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

  const tokenStorage = createTokenStorage(
    `__studio_auth_token_${projectId}`,
    (currentTokenValue) => {
      // sets the initial value
      if (!isCookielessCompatibleLoginMethod(loginMethod)) {
        // note: this will also clear any existing tokens
        return undefined
      }
      const hashToken = consumeHashToken()
      // use hash token if it exists
      return hashToken ? {token: hashToken} : currentTokenValue
    },
  )

  const token$ = merge(
    tokenStorage.value,
    // Listen for hash changes and consume any token found in the hash.
    // The tap triggers tokenStorage.update() which pushes to the BehaviorSubject
    // backing tokenStorage.value — so the actual emission comes from that stream.
    // switchMap to EMPTY so this branch produces no direct values.
    fromEvent(document, 'hashchange').pipe(
      tap(() => {
        const hashToken = consumeHashToken()
        if (hashToken) {
          tokenStorage.update({token: hashToken})
        }
      }),
      switchMap(() => EMPTY),
    ),
  )

  const invalidateCookieAuth = createBroadcastState(
    `__studio_auth_cookie_invalidations_${projectId}`,
  )

  const clientFactory = clientFactoryOption ?? createSanityClient

  // Allow configuration of `apiHost` through source configuration
  const hostOptions: {apiHost?: string} = {}
  if (apiHost) {
    hostOptions.apiHost = apiHost
  } else if (isStaging) {
    hostOptions.apiHost = 'https://api.sanity.work'
  }

  const cookieClient$ = invalidateCookieAuth.value.pipe(
    // note: invalidating cookie auth does not trigger any change to client options – it's important
    // that we emit a new object to signal change (i.e. no distinctUntilChanged)
    map(() =>
      clientFactory({
        ...COMMON_CLIENT_OPTIONS,
        ...hostOptions,
        projectId,
        dataset,
        withCredentials: true,
      }),
    ),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  const tokenClient$ = token$.pipe(
    distinctUntilChanged(isEqual),
    map((storedToken) => {
      return {
        ...COMMON_CLIENT_OPTIONS,
        ...hostOptions,
        projectId,
        dataset,
        ...(storedToken ? {token: storedToken.token, ignoreBrowserTokenWarning: true} : {}),
      }
    }),
    map((clientConfig) => clientFactory(clientConfig)),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  const dualClient$ = token$.pipe(
    distinctUntilChanged(isEqual),
    map((storedToken) => {
      return {
        ...COMMON_CLIENT_OPTIONS,
        ...hostOptions,
        projectId,
        dataset,
        ...(storedToken
          ? {token: storedToken.token, ignoreBrowserTokenWarning: true}
          : {withCredentials: true}),
      }
    }),
    map((clientConfig) => clientFactory(clientConfig)),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  // loginMethod is constant per auth store instance — select the right stream directly
  const workspaceClient$ =
    loginMethod === 'dual' ? dualClient$ : loginMethod === 'cookie' ? cookieClient$ : tokenClient$

  const authState$ = workspaceClient$.pipe(
    switchMap((client) =>
      defer(async (): Promise<AuthState> => {
        const currentUser = await getCurrentUser(client, () => {
          // Clear stale token on 401 so we don't keep retrying with bad credentials
          tokenStorage.update(undefined)
        })
        return {
          currentUser: currentUser || null,
          client,
          authenticated: !!currentUser,
        }
      }),
    ),
    distinctUntilChanged((prev, next) =>
      // Only notify subscribers if the the currentUser object has changed.
      // Using isEqual is OK since the currentUser object being a small data structure.
      isEqual(prev.currentUser, next.currentUser),
    ),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  async function handleCallbackUrl(): Promise<HandleCallbackResult> {
    const startTime = performance.now()
    const sessionId = getHashSessionId()
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

      if (authProbe.authenticated) {
        // broadcast to other tabs
        invalidateCookieAuth.update()
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
    const [cookieClient, tokenClient] = await firstValueFrom(
      combineLatest([cookieClient$, tokenClient$]),
    )
    // Destroy both token and cookie when logging out.
    // Note that tokenClient might not actually be configured with a token —
    // that's ok, since the logout endpoint will then just respond with 204.
    await Promise.all([
      tokenClient.request({uri: '/auth/logout', method: 'POST'}).then(() =>
        // This will update token auth subscribers and re-init clients
        tokenStorage.update(undefined),
      ),
      cookieClient.request({uri: '/auth/logout', method: 'POST'}).then(() =>
        // Broadcast cookie invalidation to other tabs
        invalidateCookieAuth.update(),
      ),
    ])
  }

  const LoginComponent = createLoginComponent({
    ...providerOptions,
    getClient: () => authState$.pipe(map((state) => state.client)),
    loginMethod,
  })

  return {
    handleCallbackUrl,
    token: token$.pipe(map((t) => t?.token || null)),
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
 * @internal
 */
export const createAuthStore: typeof _createAuthStore = memoize(_createAuthStore, hash)
