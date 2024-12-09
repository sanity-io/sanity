import {ClientError, type SanityClient} from '@sanity/client'
import {
  BehaviorSubject,
  catchError,
  concat,
  concatWith,
  EMPTY,
  filter,
  from,
  merge,
  type Observable,
  of,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs'
import {map, mergeMap, startWith, toArray} from 'rxjs/operators'

import {type DocumentPreviewStore} from '../../preview'
import {listenQuery} from '../../store/_legacy'
import {RELEASE_DOCUMENT_TYPE, RELEASE_DOCUMENTS_PATH} from './constants'
import {createReleaseMetadataAggregator} from './createReleaseMetadataAggregator'
import {requestAction} from './createReleaseOperationStore'
import {releasesReducer, type ReleasesReducerAction, type ReleasesReducerState} from './reducer'
import {type ReleaseDocument, type ReleaseStore} from './types'

type ActionWrapper = {action: ReleasesReducerAction}
type ResponseWrapper = {response: ReleaseDocument[]}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTER = `_type=="${RELEASE_DOCUMENT_TYPE}" && _id in path("${RELEASE_DOCUMENTS_PATH}.*")`

// TODO: Extend the projection with the fields needed
const QUERY_PROJECTION = `{
  ...,
}`

// Newest releases first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTER}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const INITIAL_STATE: ReleasesReducerState = {
  releases: new Map(),
  state: 'initialising' as const,
}

const RELEASE_METADATA_TMP_DOC_PATH = 'system-tmp-releases'
// todo: remove this after first tagged release
function migrateWith(client: SanityClient) {
  return client.observable.fetch(`*[_id in path('${RELEASE_METADATA_TMP_DOC_PATH}.**')]`).pipe(
    tap((tmpDocs: ReleaseDocument[]) => {
      // eslint-disable-next-line
      console.log('Migrating %d release documents', tmpDocs.length)
    }),
    mergeMap((tmpDocs: ReleaseDocument[]) => {
      if (tmpDocs.length === 0) {
        return EMPTY
      }
      return from(tmpDocs).pipe(
        mergeMap(async (tmpDoc) => {
          const releaseId = tmpDoc._id.slice(RELEASE_METADATA_TMP_DOC_PATH.length + 1)
          await requestAction(client, {
            actionType: 'sanity.action.release.edit',
            releaseId,
            patch: {
              set: {metadata: tmpDoc.metadata},
            },
          }).catch((err) => {
            if (err instanceof ClientError) {
              if (err.details.description == `Release "${releaseId}" was not found`) {
                // ignore
                return
              }
            }
            throw err
          })
          await client.delete(tmpDoc._id)
        }, 2),
      )
    }),
    toArray(),
    tap((migrated) => {
      // eslint-disable-next-line
      console.log('Migrated %d releases', migrated.length)
    }),
    mergeMap(() => EMPTY),
  )
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
        map((releases) =>
          releases.map(
            (releaseDoc: ReleaseDocument): ReleaseDocument => ({
              ...releaseDoc,
              metadata: {...(releaseDoc as any).userMetadata, ...releaseDoc.metadata},
            }),
          ),
        ),
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

  const migrateTmpReleases = process.env.NODE_ENV === 'development' ? migrateWith(client) : EMPTY
  const state$ = concat(migrateTmpReleases, merge(listFetch$, dispatch$)).pipe(
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
