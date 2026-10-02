import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {defer, EMPTY, fromEvent, merge, type Observable} from 'rxjs'
import {filter, finalize, skip} from 'rxjs/operators'

import {isStaging} from '../../../environment/isStaging'
import {isRecord} from '../../../util/isRecord'
import {createAuthIdProbe} from '../utils/createAuthIdProbe'
import {createBroadcastState} from '../utils/createBroadcastState'
import {readStoredJson} from '../utils/readStoredJson'
import {AUTH_CLIENT_OPTIONS, getAuthTokenStorageKey, getCookieAuthStateKey} from './constants'

/** @internal */
export interface ClassicAuthProbeInput {
  projectId: string
  dataset: string
  apiHost?: string
}

/**
 * The user signed in to a classic workspace, asked of `/auth/id` with what the workspace has stored: the token of a
 * token sign-in, otherwise the API cookie. Asks again when another tab writes the token, or when
 * the active workspace announces a cookie sign-in or sign-out on the project's channel (cookies
 * raise no browser event). Only listens, never writes.
 *
 * The credential is read on every ask, so a token another tab wrote is the one sent.
 *
 * @internal
 */
export function probeClassicAuth(
  input: ClassicAuthProbeInput,
  options: {clientFactory?: (config: SanityClientConfig) => SanityClient} = {},
): Observable<string | undefined> {
  const apiHost = resolveProbeApiHost(input.apiHost)
  const tokenKey = getAuthTokenStorageKey(input.projectId)
  const storedToken = (): string | undefined => {
    const stored = readStoredJson(tokenKey)
    return isRecord(stored) && typeof stored.token === 'string' && stored.token
      ? stored.token
      : undefined
  }

  return createAuthIdProbe({
    clientConfig: () => {
      const token = storedToken()
      return {
        ...AUTH_CLIENT_OPTIONS,
        projectId: input.projectId,
        dataset: input.dataset,
        ...(apiHost ? {apiHost} : {}),
        ...(token ? {token, ignoreBrowserTokenWarning: true} : {withCredentials: true}),
      }
    },
    // A token sign-in does not depend on the cookie, so a cookie announcement only counts while
    // no token is stored.
    changes: () =>
      merge(
        localStorageChanges(tokenKey),
        cookieChanges(getCookieAuthStateKey(input.projectId)).pipe(filter(() => !storedToken())),
      ),
    clientFactory: options.clientFactory,
  })
}

/** Emits when the active workspace announces a cookie sign-in or sign-out. Opens the channel per subscription. */
function cookieChanges(key: string): Observable<unknown> {
  return defer(() => {
    const cookieState = createBroadcastState(key)
    // A `BehaviorSubject`-backed value: skip its replay so only new announcements count.
    return cookieState.value.pipe(
      skip(1),
      finalize(() => cookieState.dispose()),
    )
  })
}

/** Emits when another tab writes `key` in localStorage. */
function localStorageChanges(key: string): Observable<StorageEvent> {
  return typeof window === 'undefined'
    ? EMPTY
    : fromEvent<StorageEvent>(window, 'storage').pipe(filter((event) => event.key === key))
}

/**
 * The API host the probe talks to: the configured one, or staging when the studio runs against
 * staging.
 */
function resolveProbeApiHost(apiHost?: string): string | undefined {
  if (apiHost) return apiHost
  if (isStaging) return 'https://api.sanity.work'
  return undefined
}
