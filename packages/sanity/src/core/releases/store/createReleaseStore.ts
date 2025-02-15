import {type SanityClient} from '@sanity/client'
import {
  BehaviorSubject,
  catchError,
  concat,
  concatWith,
  count,
  filter,
  from,
  merge,
  type Observable,
  of,
  type OperatorFunction,
  pipe,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs'
import {distinctUntilChanged, map, startWith} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../preview'
import {listenQuery} from '../../store/_legacy'
import {RELEASE_DOCUMENT_TYPE, RELEASE_DOCUMENTS_PATH} from './constants'
import {createReleaseMetadataAggregator} from './createReleaseMetadataAggregator'
import {releasesReducer, type ReleasesReducerAction, type ReleasesReducerState} from './reducer'
import {type ReleaseDocument, type ReleaseStore, type ReleaseType} from './types'

type ActionWrapper = {action: ReleasesReducerAction}
type ResponseWrapper = {response: ReleaseDocument[]}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTER = `_type=="${RELEASE_DOCUMENT_TYPE}" && _id in path("${RELEASE_DOCUMENTS_PATH}.*")`

const DEFAULT_RELEASE_TYPE: ReleaseType = 'undecided'
const QUERY_PROJECTION = `{
  _id,
  _type,
  _rev,
  _createdAt,
  _updatedAt,
  state,
  finalDocumentStates,
  publishAt,
  publishedAt,
  "metadata": coalesce(metadata, {
    "title": "",
    "releaseType": "${DEFAULT_RELEASE_TYPE}",
  }),
  // Content Lake initially encoded non-error states as {error: {message: ""}}. This projection
  // ensures the error field only appears if the document has a non-empty error message.
  ...select(
    length(error.message) > 0 => { error },
    {}
  ),
}`

// Newest releases first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTER}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const INITIAL_STATE: ReleasesReducerState = {
  releases: new Map(),
  state: 'initialising' as const,
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
  const {client} = context

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
        tap(() => fetchPending$.next(false)),
        map((releases) => ({response: releases})),
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

  const state$ = concat(merge(listFetch$, dispatch$)).pipe(
    filter((action): action is ReleasesReducerAction => typeof action !== 'undefined'),
    scan((state, action) => releasesReducer(state, action), INITIAL_STATE),
    startWith(INITIAL_STATE),
    shareReplay(1),
  )

  const errorCount$ = state$.pipe(releaseStoreErrorCount(), shareReplay(1))

  const getMetadataStateForSlugs$ = createReleaseMetadataAggregator(client)

  return {
    state$,
    errorCount$,
    getMetadataStateForSlugs$,
    dispatch,
  }
}

/**
 * @internal
 */
export function releaseStoreErrorCount(): OperatorFunction<ReleasesReducerState, number> {
  return pipe(
    switchMap(({releases}) =>
      from(releases.values()).pipe(
        filter((release) => release.state === 'active'),
        filter((release) => typeof release.error !== 'undefined'),
        count(),
      ),
    ),
    distinctUntilChanged(),
  )
}
