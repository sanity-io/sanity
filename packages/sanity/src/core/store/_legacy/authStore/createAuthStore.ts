import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {isEqual, memoize} from 'lodash'
import {defer} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, startWith, switchMap} from 'rxjs/operators'

import {type AuthConfig} from '../../../config'
import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'
import {CorsOriginError} from '../cors'
import {createBroadcastChannel} from './createBroadcastChannel'
import {createLoginComponent} from './createLoginComponent'
import {getSessionId} from './sessionId'
import * as storage from './storage'
import {type AuthState, type AuthStore} from './types'
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
      throw new CorsOriginError({projectId: client.config()?.projectId})
    }

    // Some non-CORS error - is it one of those undefinable network errors?
    if (err.isNetworkError && !err.message && err.request && err.request.url) {
      const host = new URL(err.request.url).host
      throw new Error(`Unknown network error attempting to reach ${host}`)
    }

    // Some other error, just throw it
    throw err
  }
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

  // // TODO: there is currently a bug where the AuthBoundary flashes the
  // // `NotAuthenticatedComponent` on the first load after a login with
  // // cookieless mode. A potential solution to fix this bug is to delay
  // // emitting `state$` until the session ID has been converted to a token
  // const firstMessage = messages.pipe(first())

  const token$ = messages.pipe(
    startWith(isCookielessCompatibleLoginMethod(loginMethod) ? getToken(projectId) : null),
  )

  // Allow configuration of `apiHost` through source configuration
  const hostOptions: {apiHost?: string} = {}
  if (apiHost) {
    hostOptions.apiHost = apiHost
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
  } else if (typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true) {
    /* __SANITY_STAGING__ is a global variable set by the vite config */
    hostOptions.apiHost = 'https://api.sanity.work'
  }

  const state$ = token$.pipe(
    // // see above
    // debounce(() => firstMessage),
    map((token) =>
      clientFactory({
        projectId,
        dataset,
        apiVersion: '2021-06-07',
        useCdn: false,
        ...(token ? {token} : {withCredentials: true}),
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

  async function handleCallbackUrl() {
    const sessionId = getSessionId()

    if (!sessionId) {
      broadcast(loginMethod === 'cookie' ? null : getToken(projectId))
      return
    }

    const requestClient = clientFactory({
      projectId,
      dataset,
      useCdn: true,
      withCredentials: true,
      apiVersion: '2021-06-07',
      requestTagPrefix: 'sanity.studio',
      headers: DEFAULT_STUDIO_CLIENT_HEADERS,
      ...hostOptions,
    })

    let currentUser
    if (loginMethod === 'dual' || loginMethod === 'cookie') {
      // try to get the current user by using the cookie credentials
      currentUser = await getCurrentUser(requestClient, broadcast)
    }

    // If we have a user, or token authentication is explicitly disallowed (`cookie` mode),
    // then we don't need/want to fetch a token
    if (currentUser || loginMethod === 'cookie') {
      // if that worked, then we don't need to fetch a token
      broadcast(null)
      return
    }

    // If we allow using token authentication, we should try to trade the session ID
    // for a token and store it locally for subsequent use
    const token = await tradeSessionForToken(requestClient, sessionId)
    broadcast(token ?? null)
  }

  async function tradeSessionForToken(client: SanityClient, sessionId: string): Promise<string> {
    const {token} = await client.request<{token: string}>({
      method: 'GET',
      uri: `/auth/fetch`,
      query: {sid: sessionId},
      tag: 'auth.fetch-token',
    })

    saveToken({token, projectId})
    return token
  }

  async function logout() {
    const token = getToken(projectId)
    const requestClient = clientFactory({
      projectId,
      dataset,
      useCdn: true,
      ...(token ? {token} : {withCredentials: true}),
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
export const createAuthStore = memoize(_createAuthStore, hash)
