import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {defer, EMPTY, fromEvent, type Observable} from 'rxjs'
import {distinctUntilChanged, filter, shareReplay, startWith, switchMap} from 'rxjs/operators'

import {isStaging} from '../../environment/isStaging'
import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../studioClient'
import {supportsLocalStorage} from '../../util/supportsLocalStorage'

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

const API_VERSION = 'v2026-05-04'
const TOKEN_STORAGE_PREFIX = '__studio_auth_token_'

const PROBE_CLIENT_OPTIONS = {
  apiVersion: API_VERSION,
  useCdn: false,
  perspective: 'raw',
  requestTagPrefix: 'sanity.studio',
  allowReconfigure: false,
  headers: DEFAULT_STUDIO_CLIENT_HEADERS,
} as const

const UNAUTHENTICATED: WorkspaceAuthProbeResult = {authenticated: false}
const AUTHENTICATED: WorkspaceAuthProbeResult = {authenticated: true}

function getStoredToken(projectId: string): string | undefined {
  if (!supportsLocalStorage) return undefined
  try {
    const raw = localStorage.getItem(`${TOKEN_STORAGE_PREFIX}${projectId}`)
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

// Module-level cache. Lives for the lifetime of the page; bounded by the
// number of distinct (apiHost, projectId, token) tuples in the studio
// config, which is small in practice.
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
    ...PROBE_CLIENT_OPTIONS,
    projectId: input.projectId,
    dataset: input.dataset,
    ...(apiHost ? {apiHost} : {}),
    ...(token ? {token, ignoreBrowserTokenWarning: true} : {withCredentials: true}),
  }

  const client = factory(clientConfig)

  // Re-probe when this project's token key changes in another tab.
  // We don't write to storage from here — only listen.
  const tokenKey = `${TOKEN_STORAGE_PREFIX}${input.projectId}`
  const storageEvents$: Observable<unknown> =
    typeof window === 'undefined'
      ? EMPTY
      : fromEvent<StorageEvent>(window, 'storage').pipe(filter((e) => e.key === tokenKey))

  const observable$ = storageEvents$.pipe(
    startWith(undefined),
    switchMap(() => defer(() => callAuthId(client))),
    // `callAuthId` always returns one of two stable references
    // (`AUTHENTICATED` / `UNAUTHENTICATED`), so default `===` is enough.
    distinctUntilChanged(),
    shareReplay({bufferSize: 1, refCount: true}),
  )

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
 * workspace's auth state.
 *
 * Probes are deduped by `(apiHost, projectId, token)`. Workspaces in the same
 * project that share a token (or both rely on the cookie) share a single
 * underlying request via `shareReplay`.
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
