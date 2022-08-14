import createClient, {SanityClient} from '@sanity/client'
import {defer} from 'rxjs'
import {map, shareReplay, startWith, switchMap} from 'rxjs/operators'
import {memoize} from 'lodash'
import {checkCors, CorsOriginError} from '../cors'
import {AuthState, AuthStore} from './types'
import {createBroadcastChannel} from './createBroadcastChannel'
import {sessionId} from './sessionId'
import * as storage from './storage'
import {createLoginComponent} from './createLoginComponent'

export interface AuthProvider {
  name: string
  title: string
  url: string
  logo?: string
}

export interface AuthStoreOptions {
  projectId: string
  dataset: string
  /**
   * Login method to use for the studio the studio. Can be one of:
   * - `dual` (default) - attempt to use cookies where possible, falling back to
   *   storing authentication token in `localStorage` otherwise
   * - `cookie` - explicitly disable `localStorage` method, relying only on
   *   cookies
   */
  loginMethod?: 'dual' | 'cookie'
  /**
   * Append the custom providers to the default providers or replace them.
   */
  mode?: 'append' | 'replace'
  /**
   * If true, don't show the choose provider logo screen, automatically redirect
   * to the single provider login
   */
  redirectOnSingle?: boolean
  /**
   * The custom provider implementations
   */
  providers?: AuthProvider[]
}

const getStorageKey = (projectId: string) => {
  // Project ID is part of the localStorage key so that different projects can
  // store their separate tokens, and it's easier to do book keeping.
  if (!projectId) throw new Error('Invalid project id')
  return `__studio_auth_token_${projectId}`
}

const getToken = (projectId: string): string | null => {
  try {
    const item = storage.getItem(getStorageKey(projectId))
    if (item) {
      const {token} = JSON.parse(item) as {token: string}
      if (token && typeof token === 'string') {
        return token
      }
    }
  } catch (err) {
    console.error(err)
  }
  return null
}

const clearToken = (projectId: string): void => {
  try {
    storage.removeItem(getStorageKey(projectId))
  } catch (err) {
    console.error(err)
  }
}

const saveToken = ({token, projectId}: {token: string; projectId: string}): void => {
  try {
    storage.setItem(
      getStorageKey(projectId),
      JSON.stringify({token, time: new Date().toISOString()})
    )
  } catch (err) {
    console.error(err)
  }
}

const getCurrentUser = async (client: SanityClient) => {
  const result = await checkCors(client)

  if (result?.isCorsError) {
    throw new CorsOriginError({...result, projectId: client.config()?.projectId})
  }

  try {
    const user = await client.request({
      uri: '/users/me',
      withCredentials: true,
      tag: 'users.get-current',
    })

    // if the user came back with an id, assume it's a full CurrentUser
    return typeof user?.id === 'string' ? user : null
  } catch (err) {
    if (err.statusCode === 401) return null
    throw err
  }
}

/**
 * @internal
 */
export function _createAuthStore({
  projectId,
  dataset,
  loginMethod = 'dual',
  ...providerOptions
}: AuthStoreOptions): AuthStore {
  // this broadcast channel receives either a token as a `string` or `null`.
  // a new client will be created from it, otherwise, it'll only trigger a retry
  // for cookie-based auth
  const {broadcast, messages} = createBroadcastChannel<string | null>(`dual_mode_auth_${projectId}`)

  // // TODO: there is currently a bug where the AuthBoundary flashes the
  // // `NotAuthenticatedComponent` on the first load after a login with
  // // cookieless mode. A potential solution to fix this bug is to delay
  // // emitting `state$` until the session ID has been converted to a token
  // const firstMessage = messages.pipe(first())

  const token$ = messages.pipe(startWith(loginMethod === 'dual' ? getToken(projectId) : null))

  const state$ = token$.pipe(
    // // see above
    // debounce(() => firstMessage),
    map((token) =>
      createClient({
        projectId,
        dataset,
        apiVersion: '2021-06-07',
        useCdn: false,
        ...(token && {token}),
        withCredentials: true,
        requestTagPrefix: 'sanity.studio',
        ignoreBrowserTokenWarning: true,
      })
    ),
    switchMap((client) =>
      defer(async (): Promise<AuthState> => {
        const currentUser = await getCurrentUser(client)

        return {
          currentUser,
          client,
          authenticated: !!currentUser,
        }
      })
    ),
    shareReplay(1)
  )

  async function handleCallbackUrl() {
    if (sessionId && loginMethod === 'dual') {
      const requestClient = createClient({
        projectId,
        dataset,
        useCdn: true,
        withCredentials: true,
        apiVersion: '2021-06-07',
        requestTagPrefix: 'sanity.studio',
      })

      // try to get the current user by using the cookie credentials
      const currentUser = await getCurrentUser(requestClient)

      if (currentUser) {
        // if that worked, then we don't need to fetch a token
        broadcast(null)
      } else {
        // if that didn't work, then we need to trade the session ID for a token
        const {token} = await requestClient.request<{token: string}>({
          method: 'GET',
          uri: `/auth/fetch`,
          query: {sid: sessionId},
          tag: 'auth.fetch-token',
        })

        saveToken({token, projectId})
        broadcast(token)
      }
    } else {
      broadcast(loginMethod === 'dual' ? getToken(projectId) : null)
    }
  }

  async function logout() {
    const requestClient = createClient({
      projectId,
      dataset,
      useCdn: true,
      withCredentials: true,
      apiVersion: '2021-06-07',
      requestTagPrefix: 'sanity.studio',
    })

    clearToken(projectId)
    await requestClient.auth.logout()
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
        .map(([k, v]) => [k, hash(v)])
    )
  )
}

/**
 * @public
 */
const createAuthStore = memoize(_createAuthStore, hash)

export {createAuthStore}
