import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import memoize from 'lodash-es/memoize.js'
import {defer} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, startWith, switchMap} from 'rxjs/operators'

import {type AuthConfig, type LoginMethod} from '../../../config'
import {isStaging} from '../../../environment/isStaging'
import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'
import {CorsOriginError} from '../cors'
import {createBroadcastChannel} from './createBroadcastChannel'
import {createLoginComponent} from './createLoginComponent'
import {clearSessionId, getSessionId} from './sessionId'
import * as storage from './storage'
import {type AuthState, type AuthStore, type HandleCallbackResult} from './types'
import {isCookielessCompatibleLoginMethod} from './utils/asserters'

/** @internal */
export interface AuthStoreOptions extends AuthConfig {
  clientFactory?: (options: SanityClientConfig) => SanityClient
  projectId: string
  dataset: string
}

const getStorageKey = (projectId: string): string => {
  // Project ID is part of the localStorage key so that different projects can
  // store their separate tokens, and it's easier to do book keeping.
  if (!projectId) throw new Error('Invalid project id')
  return `__studio_auth_token_${projectId}`
}

const getHashToken = (): string | null => {
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return null
  }

  // Token pattern used for extracting tokens from URL hash
  const tokenPattern = /token=([^&]{32,})&?/
  const [, tokenParam] = window.location.hash.match(tokenPattern) || []
  if (!tokenParam) {
    return null
  }

  // Remove the token from URL for security
  const newHash = window.location.hash.replace(tokenPattern, '')
  const newUrl = new URL(window.location.href)
  newUrl.hash = newHash.length > 1 ? newHash : ''
  history.replaceState(null, '', newUrl)

  return tokenParam
}

const getAuthOptions = (
  loginMethod: LoginMethod,
  token: string | null,
): {token: string} | {withCredentials: boolean} | null => {
  if (loginMethod === 'cookie') {
    return {withCredentials: true}
  }

  if (loginMethod === 'token') {
    return token ? {token} : null
  }

  return token ? {token} : {withCredentials: true}
}

const getStoredToken = (projectId: string): string | null => {
  try {
    const item = storage.getItem(getStorageKey(projectId))
    if (!item) return null

    const {token} = JSON.parse(item) as {token: string}
    return token && typeof token === 'string' ? token : null
  } catch (err) {
    console.error(err)
    return null
  }
}

const getToken = (projectId: string): string | null => {
  const storedToken = getStoredToken(projectId)
  const hashToken = getHashToken()

  // Prefer hash token over stored token when available and different
  if (hashToken && (!storedToken || hashToken !== storedToken)) {
    saveToken({token: hashToken, projectId})
    return hashToken
  }

  return storedToken || null
}

const clearToken = (projectId: string): void => {
  try {
    storage.removeItem(getStorageKey(projectId))
  } catch (err) {
    console.error('Failed to clear auth token from storage:', err)
  }
}

const saveToken = ({token, projectId}: {token: string; projectId: string}): void => {
  try {
    storage.setItem(
      getStorageKey(projectId),
      JSON.stringify({token, time: new Date().toISOString()}),
    )
  } catch (err) {
    console.error('Failed to save auth token to storage:', err)
  }
}

const getCurrentUser = async (
  client: SanityClient,
  broadcastToken: (token: string | null) => void,
) => {
  try {
    const user = await client.request({
      uri: '/users/me',
      tag: 'users.get-current',
    })

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : null
  } catch (err) {
    // 401 means the user had some kind of credentials, but failed to authenticate,
    // we should clear any local token in this case and treat it as if the used was
    // logged out
    if (err.statusCode === 401) {
      clearToken(client.config().projectId || '')
      broadcastToken(null)
      return null
    }

    // Request failed for a non-auth reason, see if this was a CORS-error by
    // checking the `/ping` endpoint, which allows all origins
    const invalidCorsConfig = await client
      .request({uri: '/ping', withCredentials: false, tag: 'cors-check'})
      .then(
        () => true, // Request succeeded, so likely the CORS origin is disallowed
        () => false, // Request failed, so likely a network error of some kind
      )

    if (invalidCorsConfig) {
      // Throw a specific error on CORS-errors, to allow us to show a customized dialog
      throw new CorsOriginError({
        isStaging: client.config().apiHost.endsWith('.work'),
        projectId: client.config()?.projectId,
      })
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

/**
 * Probe whether a given auth method works by calling /users/me.
 * Returns the user if authenticated, null otherwise. Unlike `getCurrentUser`,
 * this function has no side effects (no token clearing, no CORS checks) -
 * it's only used during the post-login probe phase.
 */
async function probeCurrentUser(client: SanityClient): Promise<CurrentUser | null> {
  try {
    const user = await client.request({uri: '/users/me', tag: 'users.probe'})
    // /users/me returns an empty object (not a 401) when unauthenticated,
    // so we check for a string `id` field to confirm a real user
    return typeof user?.id === 'string' ? user : null
  } catch {
    return null
  }
}

/**
 * Exchange a session ID for both a cookie and a token via /auth/exchange.
 * The endpoint sets a Set-Cookie header (stored under the Studio's partition key
 * because this is a fetch with credentials from the Studio's origin) and returns
 * the token in the response body.
 */
async function exchangeSessionForToken(client: SanityClient, sessionId: string): Promise<string> {
  const {token} = await client.request<{success: boolean; token: string}>({
    method: 'GET',
    uri: '/auth/exchange',
    query: {sid: sessionId},
    tag: 'auth.exchange',
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
  ...providerOptions
}: AuthStoreOptions): AuthStore {
  // this broadcast channel receives either a token as a `string` or `null`.
  // a new client will be created from it, otherwise, it'll only trigger a retry
  // for cookie-based auth
  const {broadcast, messages} = createBroadcastChannel<string | null>(`dual_mode_auth_${projectId}`)

  const clientFactory = clientFactoryOption ?? createSanityClient

  const token$ = messages.pipe(
    startWith(isCookielessCompatibleLoginMethod(loginMethod) ? getToken(projectId) : null),
  )

  // Allow configuration of `apiHost` through source configuration
  const hostOptions: {apiHost?: string} = {}
  if (apiHost) {
    hostOptions.apiHost = apiHost
  } else if (isStaging) {
    hostOptions.apiHost = 'https://api.sanity.work'
  }

  const state$ = token$.pipe(
    map((token) =>
      clientFactory({
        projectId,
        dataset,
        apiVersion: '2021-06-07',
        useCdn: false,
        ...getAuthOptions(loginMethod, token),
        perspective: 'raw',
        requestTagPrefix: 'sanity.studio',
        ignoreBrowserTokenWarning: true,
        allowReconfigure: false,
        headers: DEFAULT_STUDIO_CLIENT_HEADERS,
        ...hostOptions,
      }),
    ),
    switchMap((client) =>
      defer(async (): Promise<AuthState> => {
        const currentUser = await getCurrentUser(client, broadcast)

        return {
          currentUser,
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
    shareReplay(1),
  )

  async function handleCallbackUrl(): Promise<HandleCallbackResult> {
    const startTime = performance.now()
    const sessionId = getSessionId()
    // workaround for https://github.com/vercel/next.js/issues/91819
    clearSessionId()

    // No session ID means this is a normal cold load, not a post-login redirect.
    // Broadcast the existing token (if any) so state$ can check /users/me.
    if (!sessionId) {
      broadcast(loginMethod === 'cookie' ? null : getToken(projectId))
      return {
        loginMethod,
        flow: 'already-authenticated',
        success: true,
        durationMs: Math.round(performance.now() - startTime),
      }
    }

    // --- Post-login redirect: we have a session ID from the auth provider ---

    // Step 1: Exchange the session ID for a token (and a cookie as a side effect).
    // The fetch uses credentials: include so the browser stores the Set-Cookie
    // under the correct partition key (the Studio's origin).
    const exchangeClient = clientFactory({
      projectId,
      dataset,
      useCdn: false,
      withCredentials: true,
      apiVersion: '2021-06-07',
      requestTagPrefix: 'sanity.studio',
      headers: DEFAULT_STUDIO_CLIENT_HEADERS,
      ...hostOptions,
    })

    let token: string
    const exchangeStart = performance.now()
    try {
      token = await exchangeSessionForToken(exchangeClient, sessionId)
    } catch (err) {
      broadcast(null)
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

    // Step 2: Probe which auth methods work by calling /users/me.
    // We create separate clients for each probe to isolate the auth mechanisms.
    // Only create the clients we actually need for the configured login method.
    const probeStart = performance.now()

    const probeClientOptions = {
      projectId,
      dataset,
      useCdn: false,
      apiVersion: '2021-06-07',
      requestTagPrefix: 'sanity.studio',
      headers: DEFAULT_STUDIO_CLIENT_HEADERS,
      ...hostOptions,
    } as const

    let cookieUser: CurrentUser | null = null
    let tokenUser: CurrentUser | null = null

    if (loginMethod === 'dual') {
      // Dual mode: probe both methods in parallel
      const [cookieResult, tokenResult] = await Promise.allSettled([
        probeCurrentUser(clientFactory({...probeClientOptions, withCredentials: true})),
        probeCurrentUser(clientFactory({...probeClientOptions, token})),
      ])
      cookieUser = cookieResult.status === 'fulfilled' ? cookieResult.value : null
      tokenUser = tokenResult.status === 'fulfilled' ? tokenResult.value : null
    } else if (loginMethod === 'cookie') {
      // Cookie-only mode: only probe cookies
      cookieUser = await probeCurrentUser(
        clientFactory({...probeClientOptions, withCredentials: true}),
      )
    } else {
      // Token-only mode: only probe token
      tokenUser = await probeCurrentUser(clientFactory({...probeClientOptions, token}))
    }

    const probeDurationMs = Math.round(performance.now() - probeStart)
    const durationMs = Math.round(performance.now() - startTime)

    // Step 3: Determine the outcome based on which probes succeeded.

    // Prefer cookie auth when available (avoids storing tokens in localStorage)
    if (cookieUser) {
      broadcast(null)
      return {
        loginMethod,
        flow: 'exchange',
        success: true,
        durationMs,
        exchangeDurationMs,
        probeDurationMs,
        authMethod: 'cookie',
      }
    }

    if (tokenUser) {
      saveToken({token, projectId})
      broadcast(token)
      return {
        loginMethod,
        flow: 'exchange',
        success: true,
        durationMs,
        exchangeDurationMs,
        probeDurationMs,
        authMethod: 'token',
      }
    }

    // Neither probe succeeded
    broadcast(null)

    if (loginMethod === 'cookie') {
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

    return {
      loginMethod,
      flow: 'exchange',
      success: false,
      durationMs,
      exchangeDurationMs,
      probeDurationMs,
      failureReason: 'all auth probes failed',
      error: {
        type: 'auth-failed',
        message: 'Authentication failed. Please try logging in again.',
      },
    }
  }

  async function logout() {
    const token = getToken(projectId)
    const requestClient = clientFactory({
      projectId,
      dataset,
      useCdn: true,
      ...getAuthOptions(loginMethod, token),
      apiVersion: '2021-06-07',
      requestTagPrefix: 'sanity.studio',
      headers: DEFAULT_STUDIO_CLIENT_HEADERS,
      ...hostOptions,
    })

    clearToken(projectId)
    await requestClient.request<void>({uri: '/auth/logout', method: 'POST'})
    broadcast(null)
  }

  const LoginComponent = createLoginComponent({
    ...providerOptions,
    getClient: () => state$.pipe(map((state) => state.client)),
    loginMethod,
  })

  return {
    handleCallbackUrl,
    token: token$,
    state: state$,
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
