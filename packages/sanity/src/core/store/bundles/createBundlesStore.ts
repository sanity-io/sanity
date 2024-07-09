import {type ListenEvent, type ListenOptions, type SanityClient} from '@sanity/client'
import {
  BehaviorSubject,
  catchError,
  concatWith,
  delay,
  EMPTY,
  filter,
  map,
  merge,
  type Observable,
  of,
  retry,
  scan,
  shareReplay,
  skip,
  startWith,
  Subject,
  switchMap,
  tap,
  throttleTime,
  timeout,
} from 'rxjs'

import {type BundlesMetadataMap} from '../../releases/tool/useBundlesMetadata'
import {bundlesReducer, type bundlesReducerAction, type bundlesReducerState} from './reducer'
import {type BundleDocument, type BundlesStore} from './types'

type ActionWrapper = {action: bundlesReducerAction}
type EventWrapper = {event: ListenEvent<BundleDocument>}
type ResponseWrapper = {response: BundleDocument[]}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "bundle"`]

// TODO: Extend the projection with the fields needed
const QUERY_PROJECTION = `{
  ...,
}`

// Newest bundles first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
  tag: 'bundles.listen',
}

const INITIAL_STATE: bundlesReducerState = {
  bundles: new Map(),
  state: 'initialising',
}

const NOOP_BUNDLES_STORE: BundlesStore = {
  state$: EMPTY.pipe(startWith(INITIAL_STATE)),
  aggState$: () => EMPTY,
  dispatch: () => undefined,
}

/**
 * The bundles store is initialised lazily when first subscribed to. Upon subscription, it will
 * fetch a list of bundles and create a listener to keep the locally held state fresh.
 *
 * The store is not disposed of when all subscriptions are closed. After it has been initialised,
 * it will keep listening for the duration of the app's lifecycle. Subsequent subscriptions will be
 * given the latest state upon subscription.
 */
export function createBundlesStore(context: {
  addOnClient: SanityClient | null
  studioClient: SanityClient | null
}): BundlesStore {
  const {addOnClient: client, studioClient} = context

  // While the comments dataset is initialising, this factory function will be called with an empty
  // `client` value. Return a noop store while the client is unavailable.
  //
  // TODO: While the comments dataset is initialising, it incorrectly emits an empty object for the
  // client instead of `null`, as the types suggest. Once this is fixed, we can remove the object
  // keys length check.
  if (!client || Object.keys(client).length === 0) {
    return NOOP_BUNDLES_STORE
  }

  const dispatch$ = new Subject<bundlesReducerAction>()
  const fetchPending$ = new BehaviorSubject<boolean>(false)

  function dispatch(action: bundlesReducerAction): void {
    dispatch$.next(action)
  }

  const listFetch$ = of<ActionWrapper>({
    action: {
      type: 'LOADING_STATE_CHANGED',
      payload: {
        loading: true,
        error: undefined,
      },
    },
  }).pipe(
    // Ignore invocations while the list fetch is pending.
    filter(() => !fetchPending$.value),
    tap(() => fetchPending$.next(true)),
    concatWith(
      client.observable.fetch<BundleDocument[]>(QUERY, {}, {tag: 'bundles.list'}).pipe(
        timeout(10_000), // 10s timeout
        retry({
          count: 2,
          delay: 1_000,
          resetOnSuccess: true,
        }),
        tap(() => fetchPending$.next(false)),
        map((response) => ({response})),
      ),
    ),
    catchError((error) =>
      of<ActionWrapper>({
        action: {
          type: 'LOADING_STATE_CHANGED',
          payload: {
            loading: false,
            error,
          },
        },
      }),
    ),
    switchMap<ActionWrapper | ResponseWrapper, Observable<bundlesReducerAction | undefined>>(
      (entry) => {
        if ('action' in entry) {
          return of<bundlesReducerAction>(entry.action)
        }

        return of<bundlesReducerAction[]>(
          {type: 'BUNDLES_SET', payload: entry.response},
          {
            type: 'LOADING_STATE_CHANGED',
            payload: {
              loading: false,
              error: undefined,
            },
          },
        )
      },
    ),
  )

  const listener$ = client.observable.listen<BundleDocument>(QUERY, {}, LISTEN_OPTIONS).pipe(
    map((event) => ({event})),
    catchError((error) =>
      of<ActionWrapper>({
        action: {
          type: 'LOADING_STATE_CHANGED',
          payload: {
            loading: false,
            error,
          },
        },
      }),
    ),
    // Skip the first event received upon subscription. This `welcome` event would cause the list
    // to be fetched again, which is not desirable immediately after the initial fetch has occurred.
    skip(1),
    // Ignore events emitted while the list fetch is pending.
    filter(() => !fetchPending$.value),
    switchMap<ActionWrapper | EventWrapper, Observable<bundlesReducerAction | undefined>>(
      (entry) => {
        if ('action' in entry) {
          return of(entry.action)
        }

        const {event} = entry

        // After successful reconnection, fetch the list. Note that the first event is skipped, so
        // this will not occur upon initial connection.
        if (event.type === 'welcome') {
          return listFetch$.pipe(delay(1_000))
        }

        // The reconnect event means that we are trying to reconnect to the realtime listener.
        // In this case we set loading to true to indicate that we're trying to
        // reconnect. Once a connection has been established, the welcome event
        // will be received and we'll fetch all bundles again (above)
        if (event.type === 'reconnect') {
          return of<bundlesReducerAction>({
            type: 'LOADING_STATE_CHANGED',
            payload: {
              loading: true,
              error: undefined,
            },
          })
        }

        // Handle mutations (create, update, delete) from the realtime listener
        // and update the bundles store accordingly
        if (event.type === 'mutation') {
          if (event.transition === 'disappear') {
            return of<bundlesReducerAction>({type: 'BUNDLE_DELETED', id: event.documentId})
          }

          if (event.transition === 'appear') {
            const nextBundle = event.result

            if (nextBundle) {
              return of<bundlesReducerAction>({type: 'BUNDLE_RECEIVED', payload: nextBundle})
            }

            return of(undefined)
          }

          if (event.transition === 'update') {
            const updatedBundle = event.result

            if (updatedBundle) {
              return of<bundlesReducerAction>({type: 'BUNDLE_UPDATED', payload: updatedBundle})
            }
          }
        }

        return of(undefined)
      },
    ),
  )

  const state$ = merge(listFetch$, listener$, dispatch$).pipe(
    filter((action): action is bundlesReducerAction => typeof action !== 'undefined'),
    scan((state, action) => bundlesReducer(state, action), INITIAL_STATE),
    startWith(INITIAL_STATE),
    shareReplay(1),
  )

  const aggFetch$ = (bundleIds: string[]): Observable<BundlesMetadataMap> => {
    if (!bundleIds?.length || !studioClient) return EMPTY

    const getSafeId = (id: string) => `bundle_${id.replaceAll('-', '_')}`

    const query = bundleIds.reduce(
      ({subquery: accSubquery, projection: accProjection}, bundleId, index) => {
        const safeId = getSafeId(bundleId)
        const trailingComma = index === bundleIds.length - 1 ? '' : ','

        const subquery = `${accSubquery}"${safeId}": *[_id in path("${bundleId}.*")]{
          _updatedAt
        } | order(_updatedAt desc)
          ${trailingComma}`

        const projection = `${accProjection}"${bundleId}": {
          "lastEdited": ${safeId}[0]._updatedAt,
          "matches": count(${safeId})
        }${trailingComma}`

        return {subquery, projection}
      },
      {subquery: '', projection: ''},
    )

    return studioClient.observable
      .fetch<BundlesMetadataMap>(`{${query.subquery}}{${query.projection}}`)
      .pipe(
        catchError((error) => {
          console.error('Failed to fetch bundle metadata', error)
          return EMPTY
        }),
      )
  }

  const aggListener$ = (bundleIds: string[]) => {
    if (!bundleIds?.length || !studioClient) return EMPTY

    const query = `*[defined(_version) && (${bundleIds.reduce(
      (accQuery, bundleId, index) =>
        `${accQuery}${index === 0 ? '' : '||'} _id in path("${bundleId}.*")`,
      '',
    )})]`

    return studioClient.observable
      .listen(query, {}, {...LISTEN_OPTIONS, includeResult: false, tag: 'bundle-docs.listen'})
      .pipe(
        skip(1),
        throttleTime(1_000),
        switchMap(() => aggFetch$(bundleIds)?.pipe()),
        catchError((error) => {
          console.error('Failed to listen for bundle metadata', error)
          return EMPTY
        }),
      )
  }

  const aggState$ = (bundleIds: string[]) => merge(aggFetch$(bundleIds), aggListener$(bundleIds))

  return {
    state$,
    aggState$,
    dispatch,
  }
}
