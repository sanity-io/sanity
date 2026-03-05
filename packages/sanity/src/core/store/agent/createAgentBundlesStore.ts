import {type SanityClient} from '@sanity/client'
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  Observable,
  of,
  ReplaySubject,
  share,
  startWith,
  switchMap,
} from 'rxjs'

const AGENT_BUNDLE_PREFIX = 'agent-'

/**
 * A single active agent bundle as reported by the SSE endpoint.
 *
 * @internal
 */
export type AgentBundle = {
  id: string
  applicationKey: string
}

/**
 * @internal
 */
export type AgentBundlesState = {
  bundles: AgentBundle[]
  loading: boolean
}

/**
 * @internal
 */
export type AgentBundlesStore = {
  state$: Observable<AgentBundlesState>
}

export const INITIAL_STATE: AgentBundlesState = {bundles: [], loading: true}

/**
 * Returns whether the given version name (e.g. from `getVersionFromId`) is an
 * agent bundle name (starts with `agent-`).
 *
 * @internal
 */
export function isAgentBundleName(versionName: unknown): boolean {
  return typeof versionName === 'string' && versionName.startsWith(AGENT_BUNDLE_PREFIX)
}

/**
 * Creates an observable that listens to the agent's `bundles/mine/listen` SSE
 * endpoint. Emits `AgentBundlesState` values whenever the set of active bundles
 * changes.
 *
 * The returned observable is ref-counted — the SSE connection is opened on the
 * first subscriber and closed when the last subscriber unsubscribes.
 */
export function createAgentBundlesStore(context: {
  organizationId$: Observable<string | null>
  client: SanityClient
}): AgentBundlesStore {
  const {organizationId$, client} = context

  const state$ = organizationId$.pipe(
    distinctUntilChanged(),
    switchMap((organizationId) => {
      if (!organizationId) return of(INITIAL_STATE)
      return listenToBundles(client, organizationId)
    }),
    startWith(INITIAL_STATE),
    share({connector: () => new ReplaySubject(1)}),
  )

  return {state$}
}

function buildUrl(client: SanityClient, organizationId: string): string {
  const {apiHost, token} = client.config()
  // Dev override: point at a local agent API during development.
  // Set SANITY_STUDIO_AGENT_API_HOST=http://localhost:58300 in .env.local
  const envHost: string | undefined = process.env.SANITY_STUDIO_AGENT_API_HOST
  const base = envHost || apiHost || 'https://api.sanity.io'
  const url = new URL(`/v1/agent/${organizationId}/bundles/mine/listen`, base)

  // EventSource doesn't support custom headers. If the studio uses token auth
  // we pass it as a query parameter; otherwise the session cookie will be sent
  // automatically.
  if (token) {
    url.searchParams.set('token', token)
  }

  return url.toString()
}

/**
 * Opens an SSE connection and returns an observable that emits the parsed
 * bundle state for each `bundles` event.
 *
 * The EventSource is created on subscribe and closed on unsubscribe.
 */
function listenToBundles(
  client: SanityClient,
  organizationId: string,
): Observable<AgentBundlesState> {
  const token = client.config().token
  const url = buildUrl(client, organizationId)

  return new Observable<AgentBundlesState>((subscriber) => {
    const es = new EventSource(url, {
      withCredentials: !token,
    })

    es.addEventListener('bundles', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as {bundles: AgentBundle[]}
        subscriber.next({bundles: data.bundles, loading: false})
      } catch {
        // Ignore malformed messages
      }
    })

    es.addEventListener('error', () => {
      // EventSource auto-reconnects on transient errors. If the connection
      // is permanently dead the browser will keep retrying, which is fine —
      // the observable stays alive and will emit new values if it reconnects.
      // We don't error the observable so downstream subscribers stay subscribed.
    })

    return () => {
      es.close()
    }
  }).pipe(catchError(() => EMPTY))
}
