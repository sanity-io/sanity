import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {difference, flatten, memoize} from 'lodash'
import {
  combineLatest,
  concat,
  defer,
  EMPTY,
  fromEvent,
  merge,
  type Observable,
  of,
  timer,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  share,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../releases/util/releasesClient'
import {versionedClient} from '../studioClient'
import {getPublishedId, idMatchesPerspective, isVersionId} from '../util/draftUtils'
import {INCLUDE_FIELDS} from './constants'
import {
  type ApiConfig,
  type FieldName,
  type Id,
  type InvalidationChannelEvent,
  type Selection,
} from './types'
import {debounceCollect} from './utils/debounceCollect'
import {hasEqualFields} from './utils/hasEqualFields'
import {isUniqueBy} from './utils/isUniqueBy'
import {combineSelections, reassemble, toQuery} from './utils/optimizeQuery'

type CachedFieldObserver = {
  id: Id
  fields: FieldName[]
  changes$: Observable<any>
}

type Cache = {
  [id: string]: CachedFieldObserver[]
}

/**
 * Note: this should be the minimal interface createObserveFields needs to function
 * It should be kept compatible with the Sanity Client
 */
export interface ClientLike {
  withConfig(config: ApiConfig): ClientLike
  observable: {
    fetch: (
      query: string,
      params: Record<string, string>,
      options: {tag: string},
    ) => Observable<unknown>
  }
}

/**
 * Creates a function that allows observing individual fields on a document.
 * It will automatically debounce and batch requests, and maintain an in-memory cache of the latest field values
 * @param options - Options to use when creating the observer
 * @internal
 */
export function createObserveFields(options: {
  client: SanityClient
  invalidationChannel: Observable<InvalidationChannelEvent>
}) {
  const {client: currentDatasetClient, invalidationChannel} = options

  function fetchAllDocumentPathsWith(client: SanityClient, perspective?: StackablePerspective[]) {
    return function fetchAllDocumentPath(selections: Selection[]) {
      const combinedSelections = combineSelections(selections)
      // If any document is a version document we need to use the release API version
      const useReleaseVersion =
        (perspective && perspective.length > 0) ||
        combinedSelections.some((selection) => selection.ids.some(isVersionId))

      return versionedClient(
        client,
        useReleaseVersion ? RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion : undefined,
      )
        .observable.fetch(
          toQuery(combinedSelections),
          {},
          {tag: 'preview.document-paths', perspective},
        )
        .pipe(map((result: any) => reassemble(result, combinedSelections)))
    }
  }
  const batchFetchersCache = new Map()
  function getBatchFetchersForPerspective(perspective?: StackablePerspective[]) {
    const key = perspective?.join('-') || 'raw'
    if (batchFetchersCache.has(key)) {
      return batchFetchersCache.get(key)
    }
    const batchFetchers = {
      fast: debounceCollect(fetchAllDocumentPathsWith(currentDatasetClient, perspective), 100),
      slow: debounceCollect(fetchAllDocumentPathsWith(currentDatasetClient, perspective), 1000),
    }
    batchFetchersCache.set(key, batchFetchers)
    return batchFetchers
  }

  function currentDatasetListenFields(
    documentId: Id,
    fields: FieldName[],
    perspective?: StackablePerspective[],
  ) {
    const {fast: fetchDocumentPathsFast, slow: fetchDocumentPathsSlow} =
      getBatchFetchersForPerspective(perspective)

    const hasPerspective = perspective && perspective.length > 0
    /**
     * Q: Why are we using published id if perspective is provided?
     * A: Normally, queries for fetching preview values will be based on the _id of the document,
     * for example `*[_id == "drafts.foo"]`. However, if a perspective passed, the query
     * `*[_id == "drafts.foo"]` will not match anything since the `_id` will always be the published id
     * Therefore, if perspective is provided, we need to refetch using the published id instead.
     */
    const fetchId = hasPerspective ? getPublishedId(documentId) : documentId

    return invalidationChannel.pipe(
      filter((event) => {
        // we always want to fetch when the listener just (re) connected
        if (event.type === 'connected') {
          return true
        }
        if (hasPerspective) {
          // if a perspective stack was provided, we need to refetch if we receive a mutation
          // for a document whose _id matches either:
          // - the published _id (since it's always implied)
          // - any version id matching the provided perspectives
          return idMatchesPerspective(perspective, documentId)
        }
        // if not using perspective, refetch previews for the document that was actually changed
        return event.documentId === documentId
      }),
      switchMap((event) => {
        if (event.type === 'connected' || event.visibility === 'query') {
          return fetchDocumentPathsFast(fetchId, fields).pipe(
            mergeMap((result) => {
              return concat(
                of(result),
                result === null // hack: if we get undefined as result here it can be because the document has
                  ? // just been created and is not yet indexed. We therefore need to wait a bit
                    // and then re-fetch.
                    fetchDocumentPathsSlow(fetchId, fields)
                  : [],
              )
            }),
          )
        }
        return fetchDocumentPathsSlow(fetchId, fields)
      }),
    )
  }

  const CACHE: Cache = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

  const getBatchFetcherForDataset = memoize(
    function getBatchFetcherForDataset(apiConfig: ApiConfig) {
      const client = currentDatasetClient.withConfig(apiConfig)
      const fetchAll = fetchAllDocumentPathsWith(client, ['published'])
      return debounceCollect(fetchAll, 10)
    },
    (apiConfig) => apiConfig.dataset + apiConfig.projectId,
  )

  const CROSS_DATASET_PREVIEW_POLL_INTERVAL = 10000
  // We want to poll for changes in the other dataset, but only when window/tab is visible
  // This sets up a shared stream that emits an event every `POLL_INTERVAL` milliseconds as long as the
  // document is visible. It starts emitting immediately (if the page is visible)
  const visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
    startWith(0),
    map(() => document.visibilityState === 'visible'),
    switchMap((visible) => (visible ? timer(0, CROSS_DATASET_PREVIEW_POLL_INTERVAL) : EMPTY)),
    share(),
  )

  function crossDatasetListenFields(id: Id, fields: FieldName[], apiConfig: ApiConfig) {
    return visiblePoll$.pipe(startWith(0)).pipe(
      switchMap(() => {
        const batchFetcher = getBatchFetcherForDataset(apiConfig)
        return batchFetcher(id, fields)
      }),
    )
  }

  function createCachedFieldObserver<T>(
    id: string,
    fields: FieldName[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ): CachedFieldObserver {
    // Note: `undefined` means the memo has not been set, while `null` means the memo is explicitly set to null (e.g. we did fetch, but got null back)
    let latest: T | undefined | null = undefined
    const changes$ = merge(
      defer(() => (latest === undefined ? EMPTY : of(latest))),
      (apiConfig
        ? (crossDatasetListenFields(id, fields, apiConfig) as any)
        : currentDatasetListenFields(id, fields, perspective)) as Observable<T>,
    ).pipe(
      tap((v: T | null) => (latest = v)),
      shareReplay({refCount: true, bufferSize: 1}),
    )

    return {id, fields, changes$}
  }

  function cachedObserveFields(
    id: Id,
    fields: FieldName[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ) {
    const cacheKey = apiConfig
      ? `${apiConfig.projectId}:${apiConfig.dataset}:${id}`
      : `$current$-${id}-${perspective?.join('-') || 'raw'}`

    if (!(cacheKey in CACHE)) {
      CACHE[cacheKey] = []
    }

    const existingObservers = CACHE[cacheKey]
    const missingFields = difference(
      fields,
      flatten(existingObservers.map((cachedFieldObserver) => cachedFieldObserver.fields)),
    )

    if (missingFields.length > 0) {
      existingObservers.push(createCachedFieldObserver(id, fields, apiConfig, perspective))
    }

    const cachedFieldObservers = existingObservers
      .filter((observer) => observer.fields.some((fieldName) => fields.includes(fieldName)))
      .map((cached) => cached.changes$)

    return combineLatest(cachedFieldObservers).pipe(
      // in the event that a document gets deleted, the cached values will be updated to store `undefined`
      // if this happens, we should not pick any fields from it, but rather just return null
      map((snapshots) => snapshots.filter(Boolean)), // make sure all snapshots agree on same revision
      filter((snapshots) => isUniqueBy(snapshots, (snapshot) => snapshot._rev)), // pass on value with the requested fields (or null if value is deleted)
      map((snapshots) => (snapshots.length === 0 ? null : pickFrom(snapshots, fields))), // emit values only if changed
      distinctUntilChanged(hasEqualFields(fields)),
    )
  }

  return cachedObserveFields

  function pickFrom(objects: Record<string, any>[], fields: string[]) {
    return [...INCLUDE_FIELDS, ...fields].reduce((result, fieldName) => {
      const value = getFirstFieldValue(objects, fieldName)
      if (value !== undefined) {
        ;(result as any)[fieldName] = value
      }
      return result
    }, {})
  }

  function getFirstFieldValue(objects: Record<string, any>[], fieldName: string) {
    let value
    objects.some((object) => {
      if (fieldName in object) {
        value = object[fieldName]
        return true
      }
      return false
    })
    return value
  }
}
