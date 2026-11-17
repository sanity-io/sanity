import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {from, type Observable, of, ReplaySubject, share, timer} from 'rxjs'
import {catchError, distinctUntilChanged, switchMap, tap} from 'rxjs/operators'

/**
 * Describes the request of a failed check for the warning: the project, the URL and the kind of
 * credential, never the credential itself.
 */
function describeRequest(config: SanityClientConfig): string {
  const apiHost = (config.apiHost ?? 'https://api.sanity.io').replace(/\/+$/, '')
  const [protocol, host] = apiHost.split('://', 2)
  const credential = config.token ? 'token' : config.withCredentials ? 'cookie' : 'no credentials'
  return `project "${config.projectId}" (GET ${protocol}://${config.projectId}.${host}/…/auth/id, ${credential})`
}

async function fetchUserId(
  client: SanityClient,
  config: SanityClientConfig,
): Promise<string | undefined> {
  try {
    const response = await client.request<{id?: string}>({
      url: '/auth/id',
      tag: 'auth.probe',
    })
    return typeof response?.id === 'string' ? response.id : undefined
  } catch (err) {
    // 401 is the canonical "not authenticated" signal.
    if ((err as {statusCode?: number})?.statusCode === 401) {
      return undefined
    }
    // Any other failure (a network error, a 5xx, a CORS misconfiguration) is reported and passed
    // on, and the probe shows it as signed out without keeping it (see `createAuthIdProbe`). A
    // network error ("Failed to fetch") usually means the project doesn't exist, or doesn't allow
    // this origin in its CORS settings, so the warning says which project and URL the check asked.
    console.warn(
      `Signed-in check for ${describeRequest(config)} failed; treating as signed out:`,
      err,
    )
    throw err
  }
}

// `/auth/id` requests in flight, by what decides their answer: the API host, the project (the
// endpoint is project-scoped, so not the dataset) and the credential. Workspaces of one project
// that are checked together, as when the workspace menu opens, share one request. Entries are
// removed as soon as the request settles, so an answer is never reused once it has arrived.
const inFlight = new Map<string, Promise<string | undefined>>()

/**
 * Requests the user id for `config`. With `reuseInFlight`, it reuses a request already in flight
 * for the same credential. Without it, it sends a request of its own, which later requests then
 * reuse: a request that follows a sign-in or sign-out must not get the answer of a request that
 * started before it.
 */
function requestUserId(
  config: SanityClientConfig,
  clientFactory: (config: SanityClientConfig) => SanityClient,
  {reuseInFlight}: {reuseInFlight: boolean},
): Promise<string | undefined> {
  const credential = config.token ? `token:${config.token}` : config.withCredentials ? 'cookie' : ''
  const key = JSON.stringify([config.apiHost ?? '', config.projectId ?? '', credential])
  const pending = inFlight.get(key)
  if (pending && reuseInFlight) return pending
  // No retries: a failed check reads as signed out, and the next check asks again. The client's
  // default retries a network error five times, which for a project the browser can't reach
  // means six requests per check.
  const request: Promise<string | undefined> = fetchUserId(
    clientFactory({...config, maxRetries: 0}),
    config,
  ).finally(() => {
    // A newer request may have replaced this one in the map.
    if (inFlight.get(key) === request) inFlight.delete(key)
  })
  inFlight.set(key, request)
  return request
}

// How long the last `/auth/id` answer, and the subscription to the configs, stay alive after the
// last subscriber unsubscribes. The answer stays current while they are alive, because a new
// config still triggers a new check. So opening the workspace menu some seconds after hovering it,
// or opening it again, does not ask twice. A failed check is not kept (see `createAuthIdProbe`).
const KEEP_ALIVE_MS = 30_000

/** @internal */
export interface AuthIdProbeOptions {
  clientFactory?: (config: SanityClientConfig) => SanityClient
}

/**
 * Asks `/auth/id` which user each client config in `configs` is signed in as. Emits the user's
 * id, or `undefined` when the API refuses the credential, the check fails, or `configs` emits
 * `undefined` (there is no credential to ask with). A new config cancels the check before it.
 *
 * The first config of a subscription may share a request that another workspace of the same
 * project already has in flight. A later config follows a change, such as a sign-in, so it is
 * always asked with a request of its own.
 *
 * A failed check shows as signed out while the probe has subscribers, but is not kept after the
 * last one leaves: the next subscriber asks again, instead of seeing a stale "signed out" for the
 * whole keep-alive time.
 *
 * An auth store creates one probe for its `currentUserId`. The probe writes nothing to storage or
 * broadcast channels, so checking many workspaces never disturbs the active one.
 *
 * @internal
 */
export function createAuthIdProbe(
  configs: Observable<SanityClientConfig | undefined>,
  options: AuthIdProbeOptions = {},
): Observable<string | undefined> {
  const clientFactory = options.clientFactory ?? createSanityClient
  let lastCheckFailed = false
  return configs.pipe(
    switchMap((config, index) => {
      if (!config) {
        lastCheckFailed = false
        return of(undefined)
      }
      return from(requestUserId(config, clientFactory, {reuseInFlight: index === 0})).pipe(
        tap(() => {
          lastCheckFailed = false
        }),
        catchError(() => {
          lastCheckFailed = true
          return of(undefined)
        }),
      )
    }),
    distinctUntilChanged(),
    share({
      connector: () => new ReplaySubject<string | undefined>(1),
      resetOnRefCountZero: () => (lastCheckFailed ? of(true) : timer(KEEP_ALIVE_MS)),
    }),
  )
}
