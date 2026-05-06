import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {defer, EMPTY, fromEvent, merge, type Observable, using} from 'rxjs'
import {distinctUntilChanged, filter, shareReplay, skip, startWith, switchMap} from 'rxjs/operators'

import {isStaging} from '../../environment/isStaging'
import {supportsLocalStorage} from '../../util/supportsLocalStorage'
import {
  AUTH_CLIENT_OPTIONS,
  AUTHENTICATED,
  getAuthTokenStorageKey,
  getCookieAuthStateKey,
  UNAUTHENTICATED,
} from './constants'
import {createBroadcastState} from './createBroadcastState'

/** @internal */
export interface WorkspaceAuthProbeInput {
  projectId: string
  dataset: string
  apiHost?: string
}

/** @internal */
export interface WorkspaceAuthProbeResult {
  authenticated: boolean
}

function getStoredToken(projectId: string): string | undefined {
  if (!supportsLocalStorage) return undefined
  try {
    const raw = localStorage.getItem(getAuthTokenStorageKey(projectId))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as {token?: string} | null
    return parsed?.token
  } catch {
    return undefined
  }
}

function resolveApiHost(apiHost?: string): string | undefined {
  if (apiHost) return apiHost
  if (isStaging) return 'https://api.sanity.work'
  return undefined
}

async function callAuthId(client: SanityClient): Promise<WorkspaceAuthProbeResult> {
  try {
    const response = await client.request<{id?: string}>({
      uri: '/auth/id',
      tag: 'auth.probe',
    })
    return typeof response?.id === 'string' ? AUTHENTICATED : UNAUTHENTICATED
  } catch (err) {
    // 401 is the canonical "not authenticated" signal.
    if ((err as {statusCode?: number})?.statusCode === 401) {
      return UNAUTHENTICATED
    }
    // For any other failure (network blip, 5xx, CORS misconfig) we fail
    // open as `unauthenticated` rather than throw. Throwing here would
    // propagate to React's error boundary and tear down the studio for
    // a transient probe failure. The user can still attempt to log in
    // from the workspace menu / login screen, and the next probe attempt
    // (e.g. on remount) will pick up the truth.
    console.warn('Workspace auth probe failed; treating as unauthenticated:', err)
    return UNAUTHENTICATED
  }
}

// Module-level cache for observable identity. Keeps two simultaneous probes
// for the same tuple sharing one underlying request via `shareReplay`.
// The cache holds observable references only; the inner BroadcastChannel
// and DOM listeners are created on first subscribe and disposed on last
// unsubscribe (see `using` below). Bounded by the number of distinct
// (apiHost, projectId, token) tuples in the studio config — typically a
// handful, so a plain `Map` (no LRU eviction) is sufficient.
const cache = new Map<string, Observable<WorkspaceAuthProbeResult>>()

function cacheKey(input: {
  apiHost: string | undefined
  projectId: string
  token: string | undefined
}): string {
  // Cookie probes (no token) collapse across workspaces of the same project
  // on the same apiHost. Token probes are keyed per-token so different tokens
  // resolve independently.
  const auth = input.token ? `tok:${input.token}` : 'cookie'
  return `${input.apiHost ?? 'default'}|${input.projectId}|${auth}`
}

interface CreateProbeOptions {
  clientFactory?: (options: SanityClientConfig) => SanityClient
}

function buildProbe(
  input: WorkspaceAuthProbeInput,
  options: CreateProbeOptions = {},
): Observable<WorkspaceAuthProbeResult> {
  const apiHost = resolveApiHost(input.apiHost)
  const token = getStoredToken(input.projectId)
  const factory = options.clientFactory ?? createSanityClient

  const key = cacheKey({apiHost, projectId: input.projectId, token})
  const existing = cache.get(key)
  if (existing) return existing

  const clientConfig: SanityClientConfig = {
    ...AUTH_CLIENT_OPTIONS,
    projectId: input.projectId,
    dataset: input.dataset,
    ...(apiHost ? {apiHost} : {}),
    ...(token ? {token, ignoreBrowserTokenWarning: true} : {withCredentials: true}),
  }

  const client = factory(clientConfig)

  const tokenKey = getAuthTokenStorageKey(input.projectId)
  const cookieKey = getCookieAuthStateKey(input.projectId)

  // Re-probe when an external signal indicates auth state may have changed.
  //
  // Token workspaces: `localStorage` writes from another tab fire a `storage`
  // event natively. Always subscribe.
  //
  // Cookie/dual workspaces: cookies don't generate browser events, so the
  // active workspace's `AuthStore` broadcasts on a per-project channel after
  // login/logout. We listen but never write — token-only probes ignore this
  // signal because their credential (the token) is independent of cookie
  // state. We treat any emit as a tick: re-run `callAuthId` rather than
  // trusting the broadcast value.
  type ProbeResource = {
    cookieState: ReturnType<typeof createBroadcastState> | null
    unsubscribe: () => void
  }
  const observable$ = using(
    (): ProbeResource => {
      // Resource factory: opens the BroadcastChannel on first subscribe and
      // closes it on last unsubscribe. Token-only probes have no use for
      // the cookie broadcast, so they skip the channel entirely. The
      // resource is owned by `using` per subscription, so simultaneous
      // teardown/resubscribe cycles can't cross-dispose each other.
      const cookieState = token ? null : createBroadcastState(cookieKey)
      return {cookieState, unsubscribe: () => cookieState?.dispose()}
    },
    (resource) => {
      const {cookieState} = resource as ProbeResource
      // `createBroadcastState` is a `BehaviorSubject`-backed value
      // observable; skip its initial replay so we only fire on subsequent
      // (i.e., genuinely new) emits.
      const cookieTicks$ = cookieState?.value.pipe(skip(1)) ?? EMPTY
      const storageEvents$: Observable<unknown> =
        typeof window === 'undefined'
          ? EMPTY
          : fromEvent<StorageEvent>(window, 'storage').pipe(filter((e) => e.key === tokenKey))
      return merge(storageEvents$, cookieTicks$).pipe(
        startWith(undefined),
        switchMap(() => defer(() => callAuthId(client))),
        // `callAuthId` always returns one of two stable references
        // (`AUTHENTICATED` / `UNAUTHENTICATED`), so default `===` is enough.
        distinctUntilChanged(),
      )
    },
  ).pipe(shareReplay({bufferSize: 1, refCount: true}))

  cache.set(key, observable$)
  return observable$
}

/**
 * Probe whether the current user is authenticated against a workspace's project.
 *
 * Hits the project-scoped `/auth/id` endpoint, which only returns whether the
 * caller has a valid session — no user object, no current-user PII.
 *
 * Independent of the full `AuthStore`: does not write to localStorage or
 * BroadcastChannels, so probing many workspaces never poisons the active
 * workspace's auth state. The probe does *listen* to the cookie auth
 * broadcast (cookie/dual probes only) and to `storage` events (all probes)
 * to re-probe when another tab logs in or out.
 *
 * Probes are deduped by `(apiHost, projectId, token)`. Workspaces in the same
 * project that share a token (or both rely on the cookie) share a single
 * underlying request via `shareReplay`. The BroadcastChannel and DOM
 * listeners are created on first subscribe and disposed when the last
 * subscriber unsubscribes.
 *
 * @internal
 */
export function probeWorkspaceAuth(
  input: WorkspaceAuthProbeInput,
): Observable<WorkspaceAuthProbeResult> {
  return buildProbe(input)
}

/**
 * @internal
 * Test-only: clear the dedup cache.
 */
export function _resetProbeWorkspaceAuthCache(): void {
  cache.clear()
}

/**
 * @internal
 * Test-only: build a probe with an injected client factory.
 */
export function _probeWorkspaceAuthForTest(
  input: WorkspaceAuthProbeInput,
  options: CreateProbeOptions,
): Observable<WorkspaceAuthProbeResult> {
  return buildProbe(input, options)
}
