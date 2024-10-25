import {type ListenEvent, type ListenOptions, type SanityClient} from '@sanity/client'
import {type User} from '@sanity/types'
import {
  BehaviorSubject,
  catchError,
  concatWith,
  filter,
  map,
  merge,
  type Observable,
  of,
  retry,
  scan,
  shareReplay,
  skip,
  Subject,
  switchMap,
  tap,
  timeout,
} from 'rxjs'
import {startWith} from 'rxjs/operators'

import {RELEASE_DOCUMENT_TYPE, RELEASE_DOCUMENTS_PATH} from './constants'
import {createReleaseMetadataAggregator} from './createReleaseMetadataAggregator'
import {releasesReducer, type ReleasesReducerAction, type ReleasesReducerState} from './reducer'
import {type ReleaseDocument, type ReleaseStore} from './types'

type ActionWrapper = {action: ReleasesReducerAction}
type EventWrapper = {event: ListenEvent<ReleaseDocument>}
type ResponseWrapper = {response: ReleaseDocument[]}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [
  `_type == "${RELEASE_DOCUMENT_TYPE}" && (_id in path("${RELEASE_DOCUMENTS_PATH}.**"))`,
]

// TODO: Extend the projection with the fields needed
const QUERY_PROJECTION = `{
  ...,
}`

// Newest releases first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
  tag: 'releases.listen',
}

const INITIAL_STATE: ReleasesReducerState = {
  releases: new Map(),
  state: 'loaded' as const,
  releaseStack: [],
}

/**
 * The releases store is initialised lazily when first subscribed to. Upon subscription, it will
 * fetch a list of releases and create a listener to keep the locally held state fresh.
 *
 * The store is not disposed of when all subscriptions are closed. After it has been initialised,
 * it will keep listening for the duration of the app's lifecycle. Subsequent subscriptions will be
 * given the latest state upon subscription.
 */
export function createReleaseStore(context: {
  client: SanityClient
  currentUser: User | null
  perspective?: string
}): ReleaseStore {
  const {client, currentUser} = context

  const dispatch$ = new Subject<ReleasesReducerAction>()
  const fetchPending$ = new BehaviorSubject<boolean>(false)

  function dispatch(action: ReleasesReducerAction): void {
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
      client.observable.fetch<ReleaseDocument[]>(QUERY, {}, {tag: 'releases.list'}).pipe(
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
    switchMap<ActionWrapper | ResponseWrapper, Observable<ReleasesReducerAction | undefined>>(
      (entry) => {
        if ('action' in entry) {
          return of<ReleasesReducerAction>(entry.action)
        }

        return of<ReleasesReducerAction[]>(
          {type: 'RELEASES_SET', payload: entry.response},
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

  const listener$ = client.observable.listen<ReleaseDocument>(QUERY, {}, LISTEN_OPTIONS).pipe(
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
    switchMap<ActionWrapper | EventWrapper, Observable<ReleasesReducerAction | undefined>>(
      (entry) => {
        if ('action' in entry) {
          return of(entry.action)
        }

        const {event} = entry

        // After successful reconnection, fetch the list. Note that the first event is skipped, so
        // this will not occur upon initial connection.
        if (event.type === 'welcome') {
          return listFetch$
        }

        // The reconnect event means that we are trying to reconnect to the realtime listener.
        // In this case we set loading to true to indicate that we're trying to
        // reconnect. Once a connection has been established, the welcome event
        // will be received and we'll fetch all releases again (above)
        if (event.type === 'reconnect') {
          return of<ReleasesReducerAction>({
            type: 'LOADING_STATE_CHANGED',
            payload: {
              loading: true,
              error: undefined,
            },
          })
        }

        // Handle mutations (create, update, delete) from the realtime listener
        // and update the releases store accordingly
        if (event.type === 'mutation') {
          if (event.transition === 'disappear') {
            return of<ReleasesReducerAction>({
              type: 'BUNDLE_DELETED',
              id: event.documentId,
              deletedByUserId: event.identity,
              currentUserId: currentUser?.id?.toString(),
            })
          }

          if (event.transition === 'appear') {
            const nextBundle = event.result

            if (nextBundle) {
              return of<ReleasesReducerAction>({type: 'BUNDLE_RECEIVED', payload: nextBundle})
            }

            return of(undefined)
          }

          if (event.transition === 'update') {
            const updatedBundle = event.result

            if (updatedBundle) {
              return of<ReleasesReducerAction>({type: 'BUNDLE_UPDATED', payload: updatedBundle})
            }
          }
        }

        return of(undefined)
      },
    ),
  )

  const state$ = merge(listFetch$, listener$, dispatch$).pipe(
    filter((action): action is ReleasesReducerAction => typeof action !== 'undefined'),
    scan((state, action) => releasesReducer(state, action, context.perspective), INITIAL_STATE),
    startWith(INITIAL_STATE),
    shareReplay(1),
  )

  const getMetadataStateForSlugs$ = createReleaseMetadataAggregator(client)

  return {
    state$,
    getMetadataStateForSlugs$,
    dispatch,
  }
}
