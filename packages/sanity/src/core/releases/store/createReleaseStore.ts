import {type ListenEvent, type ListenOptions, type SanityClient} from '@sanity/client'
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
  Subject,
  switchMap,
  tap,
  timeout,
} from 'rxjs'
import {startWith} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {type DocumentPreviewStore} from '../../preview'
import {listenQuery} from '../../store/_legacy'
import {RELEASE_METADATA_TMP_DOC_PATH} from './constants'
import {createReleaseMetadataAggregator} from './createReleaseMetadataAggregator'
import {releasesReducer, type ReleasesReducerAction, type ReleasesReducerState} from './reducer'
import {type ReleaseDocument, type ReleaseStore, type ReleaseSystemDocument} from './types'

type ActionWrapper = {action: ReleasesReducerAction}
type EventWrapper = {event: ListenEvent<ReleaseDocument>}
type ResponseWrapper = {response: ReleaseDocument[]}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type=="system.release" && (_id in path("_.**"))`]

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
  previewStore: DocumentPreviewStore
  client: SanityClient
}): ReleaseStore {
  const {client, previewStore} = context

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
      listenQuery(client, QUERY, {}, {tag: 'releases.listen'}).pipe(
        timeout(10_000), // 10s timeout
        retry({
          count: 2,
          delay: 1_000,
          resetOnSuccess: true,
        }),
        tap(() => fetchPending$.next(false)),
        mergeMapArray((releaseSystemDocument: ReleaseSystemDocument) =>
          previewStore
            // Temporary release metadata document
            .unstable_observeDocument(
              `${RELEASE_METADATA_TMP_DOC_PATH}.${releaseSystemDocument.name}`,
            )
            .pipe(
              map((metadataDocument) => ({
                metadataDocument,
                releaseSystemDocument,
              })),
            ),
        ),
        map((results) =>
          results.flatMap(({metadataDocument, releaseSystemDocument}): ReleaseDocument[] => {
            return metadataDocument && releaseSystemDocument
              ? {...(metadataDocument as any), ...releaseSystemDocument}
              : []
          }),
        ),
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

  const state$ = merge(listFetch$, dispatch$).pipe(
    filter((action): action is ReleasesReducerAction => typeof action !== 'undefined'),
    scan((state, action) => releasesReducer(state, action), INITIAL_STATE),
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
