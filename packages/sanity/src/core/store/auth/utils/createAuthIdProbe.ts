import {
  type ClientConfig as SanityClientConfig,
  createClient as createSanityClient,
  type SanityClient,
} from '@sanity/client'
import {defer, type Observable, of, ReplaySubject, share, timer} from 'rxjs'
import {distinctUntilChanged, startWith, switchMap} from 'rxjs/operators'

async function callAuthId(client: SanityClient): Promise<string | undefined> {
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
    // For any other failure (network blip, 5xx, CORS misconfig) we fail
    // open as `unauthenticated` rather than throw. Throwing here would
    // propagate to React's error boundary and tear down the studio for
    // a transient probe failure. The user can still attempt to log in
    // from the workspace menu / login screen, and the next probe attempt
    // (e.g. on remount) will pick up the truth.
    console.warn('Workspace auth probe failed; treating as unauthenticated:', err)
    return undefined
  }
}

// `/auth/id` requests in flight, by what decides their answer: the API host, the project (the
// endpoint is project-scoped, so not the dataset) and the credential. Workspaces of one project
// that are checked together, as when the workspace menu opens, share one request. Entries are
// removed as soon as the request settles: an answer is never reused for a later ask, which may
// follow a sign-in or sign-out.
const inFlight = new Map<string, Promise<string | undefined>>()

function askAuthId(
  config: SanityClientConfig,
  clientFactory: (config: SanityClientConfig) => SanityClient,
): Promise<string | undefined> {
  const credential = config.token ? `token:${config.token}` : config.withCredentials ? 'cookie' : ''
  const key = JSON.stringify([config.apiHost ?? '', config.projectId ?? '', credential])
  const pending = inFlight.get(key)
  if (pending) return pending
  // No retries: a failed check reads as signed out, and the next ask (or a change) checks again.
  // The client's default retries a network error five times, which for a project the browser
  // can't reach means six requests per ask.
  const request = callAuthId(clientFactory({...config, maxRetries: 0})).finally(() =>
    inFlight.delete(key),
  )
  inFlight.set(key, request)
  return request
}

// How long the last `/auth/id` answer and the `changes` subscription stay alive after the last
// subscriber unsubscribes. While they are alive the answer stays current, since `changes` still
// triggers a new ask, so a hover on the workspace menu followed by opening it some seconds later,
// or opening it again, does not ask twice.
const KEEP_ALIVE_MS = 30_000

/** @internal */
export interface AuthIdProbeOptions {
  /**
   * The client to ask `/auth/id` with, or `undefined` when there is no credential to ask with.
   * Read on every ask, so a credential that changes between asks is picked up.
   */
  clientConfig: () => SanityClientConfig | undefined
  /** Emits whenever the answer may have changed, e.g. another tab signed in or out. */
  changes: () => Observable<unknown>
  clientFactory?: (config: SanityClientConfig) => SanityClient
}

/**
 * The user id `/auth/id` answers for a credential, or `undefined` when it is refused; asked again
 * whenever `changes` emits. For an auth store's `currentUserId`, which the store creates once:
 * no writes to storage or channels, so checking many workspaces never disturbs the active one.
 *
 * @internal
 */
export function createAuthIdProbe(options: AuthIdProbeOptions): Observable<string | undefined> {
  const clientFactory = options.clientFactory ?? createSanityClient
  const probe = (): Observable<string | undefined> =>
    defer(() => {
      const config = options.clientConfig()
      return config ? askAuthId(config, clientFactory) : of(undefined)
    })

  return defer(() => options.changes()).pipe(
    startWith(undefined),
    switchMap(probe),
    distinctUntilChanged(),
    share({
      connector: () => new ReplaySubject<string | undefined>(1),
      resetOnRefCountZero: () => timer(KEEP_ALIVE_MS),
    }),
  )
}
