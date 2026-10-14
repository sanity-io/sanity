import {type ClientConfig as SanityClientConfig} from '@sanity/client'
import {EMPTY, merge, type Observable} from 'rxjs'
import {distinctUntilChanged, filter, map, skip, startWith} from 'rxjs/operators'

import {type LoginMethod} from '../../../config/auth/types'
import {type AuthIdProbeOptions, createAuthIdProbe} from '../utils/createAuthIdProbe'
import {type BroadcastedState} from '../utils/createBroadcastState'
import {AUTH_CLIENT_OPTIONS} from './constants'

/** @internal */
export interface CurrentUserIdInput {
  projectId: string
  dataset: string
  /** The API host to ask, already resolved for staging. */
  apiHost?: string
  /** The store's login method, which decides the credential to ask with. Defaults to `dual`. */
  loginMethod?: LoginMethod
  /** The store's token storage. */
  tokenState: Pick<BroadcastedState<{token?: string}>, 'get' | 'value'>
  /** The store's cookie auth state, announced across the project's workspaces and tabs. */
  cookieState: Pick<BroadcastedState<unknown>, 'value'>
}

/**
 * Asks `/auth/id` which user is signed in to a workspace on the legacy store, with the credential
 * the store itself would use for its `loginMethod`:
 * - `dual`: the store's token when it has one, and the API cookie otherwise.
 * - `token`: the store's token. Without one there is nothing to ask with, so it is signed out.
 * - `cookie`: the API cookie, whatever token the store has.
 *
 * It reads the store's token on every ask, so it sends the token the store holds, whether in
 * localStorage or, where that is unavailable, in memory. It asks again when the store's token
 * changes, or when a cookie sign-in or sign-out is announced (cookies raise no browser event), as
 * far as the login method uses that credential. Both reach the store from this tab and from
 * others. It only listens: it never writes to the store's state.
 *
 * @internal
 */
export function observeCurrentUserId(
  input: CurrentUserIdInput,
  options: AuthIdProbeOptions = {},
): Observable<string | undefined> {
  const loginMethod = input.loginMethod ?? 'dual'
  const storedToken = (): string | undefined =>
    loginMethod === 'cookie' ? undefined : input.tokenState.get()?.token || undefined
  // Whether the next ask uses the cookie: with `cookie` always, with `dual` while the store has no
  // token, with `token` never.
  const usesCookie = () => loginMethod !== 'token' && !storedToken()
  const clientConfig = (): SanityClientConfig | undefined => {
    const token = storedToken()
    if (!token && loginMethod === 'token') return undefined
    return {
      ...AUTH_CLIENT_OPTIONS,
      projectId: input.projectId,
      dataset: input.dataset,
      ...(input.apiHost ? {apiHost: input.apiHost} : {}),
      ...(token ? {token, ignoreBrowserTokenWarning: true} : {withCredentials: true}),
    }
  }

  // Both states replay their current value on subscribe: skip it, so only changes count.
  const tokenChanges = input.tokenState.value.pipe(
    map((value) => value?.token),
    distinctUntilChanged(),
    skip(1),
  )
  const cookieChanges = input.cookieState.value.pipe(skip(1))
  const changes = merge(
    loginMethod === 'cookie' ? EMPTY : tokenChanges,
    // A token sign-in does not depend on the cookie, so a cookie announcement only counts while
    // the next ask would use the cookie.
    loginMethod === 'token' ? EMPTY : cookieChanges.pipe(filter(usesCookie)),
  )
  return createAuthIdProbe(
    changes.pipe(
      startWith(undefined),
      map(() => clientConfig()),
    ),
    options,
  )
}
