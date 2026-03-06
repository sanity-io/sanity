import {type SanityClient} from '@sanity/client'
import {
  catchError,
  defer,
  distinctUntilChanged,
  map,
  Observable,
  of,
  ReplaySubject,
  share,
  shareReplay,
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

const EMPTY_STATE: AgentBundlesState = {bundles: [], loading: false}

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
      if (!organizationId) return of(EMPTY_STATE)
      return listenToBundles(client, organizationId)
    }),
    startWith(INITIAL_STATE),
    share({connector: () => new ReplaySubject(1)}),
  )

  return {state$}
}

function buildUrl(client: SanityClient, organizationId: string): string {
  const {apiHost} = client.config()
  // Dev override: point at a local agent API during development.
  // Set SANITY_STUDIO_AGENT_API_HOST=http://localhost:58300 in .env.local
  const envHost: string | undefined = process.env.SANITY_STUDIO_AGENT_API_HOST
  const base = envHost || apiHost || 'https://api.sanity.io'
  const url = new URL(`/v1/agent/${organizationId}/bundles/mine/listen`, base)

  return url.toString()
}

/**
 * Lazy-loaded eventsource polyfill with custom header support.
 * Uses the same pattern as the sanity client listener.
 */
type EventSourceConstructor = typeof EventSource

const eventSourcePolyfill$ = defer(() => import('@sanity/eventsource')).pipe(
  map(({default: ES}) => ES as EventSourceConstructor),
  shareReplay(1),
)

type PolyfillEventSourceInit = EventSourceInit & {headers?: Record<string, string>}

function listenToBundles(
  client: SanityClient,
  organizationId: string,
): Observable<AgentBundlesState> {
  const {token, withCredentials} = client.config()
  const url = buildUrl(client, organizationId)

  const esOptions: PolyfillEventSourceInit = {}
  if (token || withCredentials) esOptions.withCredentials = true
  if (token) esOptions.headers = {Authorization: `Bearer ${token}`}

  // Use polyfill when headers are needed (token auth), native EventSource otherwise
  const es$: Observable<EventSource> = (
    esOptions.headers ? eventSourcePolyfill$ : of(EventSource)
  ).pipe(map((ES) => new ES(url, esOptions)))

  return es$.pipe(
    switchMap(
      (es) =>
        new Observable<AgentBundlesState>((subscriber) => {
          es.addEventListener('bundles', ((event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data) as {bundles: AgentBundle[]}
              subscriber.next({bundles: data.bundles, loading: false})
            } catch {
              // Ignore malformed messages
            }
          }) as EventListener)

          es.addEventListener('error', (() => {
            // EventSource auto-reconnects on transient errors.
          }) as EventListener)

          return () => {
            es.close()
          }
        }),
    ),
    catchError(() => of(EMPTY_STATE)),
  )
}
