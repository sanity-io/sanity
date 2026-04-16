import {type SanityClient, type StackablePerspective} from '@sanity/client'
import difference from 'lodash-es/difference.js'
import flatten from 'lodash-es/flatten.js'
import memoize from 'lodash-es/memoize.js'
import {
  BehaviorSubject,
  combineLatest,
  concat,
  defer,
  EMPTY,
  from,
  fromEvent,
  merge,
  type Observable,
  of,
  retry,
  timer,
} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  reduce,
  share,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../releases/util/releasesClient'
import {versionedClient} from '../studioClient'
import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../util/const'
import {getPublishedId, idMatchesPerspective, isVersionId} from '../util/draftUtils'
import {INCLUDE_FIELDS} from './constants'
import {
  type ApiConfig,
  type FieldName,
  type Id,
  type InvalidationChannelEvent,
  type Selection,
} from './types'
import {allRevKeys} from './utils/allRevKeys'
import {debounceCollect} from './utils/debounceCollect'
import {extractAllReferencedIds} from './utils/extractAllReferencedIds'
import {hasEqualFields} from './utils/hasEqualFields'
import {isUniqueBy} from './utils/isUniqueBy'
import {type CombinedSelection, combineSelections, reassemble, toQuery} from './utils/optimizeQuery'

/**
 * Chunks combined selections into smaller groups based on the total byte size of document IDs.
 * This prevents queries from becoming too large and timing out.
 *
 * Similar to chunkDocumentIds in availability.ts, but handles CombinedSelection structure.
 *
 * @param combinedSelections - The combined selections to chunk
 * @returns Array of chunked combined selections, each within the size limit
 * @internal
 */
export function chunkCombinedSelections(
  combinedSelections: CombinedSelection[],
): CombinedSelection[][] {
  const chunks: CombinedSelection[][] = []

  for (const selection of combinedSelections) {
    let chunk: string[] = []
    let chunkMap: number[] = []
    let chunkSize = 0

    const makeChunkSelection = (
      chunkIds: string[],
      chunkMapIndices: number[],
    ): CombinedSelection => ({
      ids: chunkIds,
      fields: selection.fields,
      map: chunkMapIndices,
      ...(selection.projection ? {projection: selection.projection} : {}),
    })

    for (let i = 0; i < selection.ids.length; i++) {
      const id = selection.ids[i]
      // +3 accounts for quotes and comma in GROQ request structure: ["id1","id2"]
      const idSize = id.length + 3

      // Reached the max length? Start a new chunk
      if (chunkSize + idSize >= MAX_DOCUMENT_ID_CHUNK_SIZE && chunk.length > 0) {
        chunks.push([makeChunkSelection(chunk, chunkMap)])
        chunk = []
        chunkMap = []
        chunkSize = 0
      }

      chunk.push(id)
      chunkMap.push(selection.map[i])
      chunkSize += idSize
    }

    if (chunk.length > 0) {
      chunks.push([makeChunkSelection(chunk, chunkMap)])
    }
  }

  return chunks
}

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

      const apiClient = versionedClient(
        client,
        useReleaseVersion ? RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion : undefined,
      )

      // Chunk the selections to avoid massive queries that timeout
      const selectionChunks = chunkCombinedSelections(combinedSelections)

      // Helper to fetch a single chunk
      const fetchChunk = (chunk: CombinedSelection[]) =>
        apiClient.observable
          .fetch(toQuery(chunk), {}, {tag: 'preview.document-paths', perspective})
          .pipe(
            retry({
              delay: (_: unknown, attempt) => timer(Math.min(30_000, attempt * 1000)),
            }),
            map((result: any) => reassemble(result, chunk)),
          )

      // No chunks - return empty array early
      if (selectionChunks.length === 0) {
        return of([])
      }

      // Single chunk - no merging needed (most common case)
      // Kept for performance reasons, as it is the common case (no massive releases) and faster
      if (selectionChunks.length === 1) {
        return fetchChunk(selectionChunks[0])
      }

      // Multiple chunks - fetch in parallel and merge results
      // Each chunk's reassemble places results at their original map indices
      // We collect all results and build the final array at the end
      const totalSelections = selections.length
      return from(selectionChunks).pipe(
        mergeMap(fetchChunk, 10),
        reduce((merged: (Record<string, any> | null)[], chunkResults) => {
          chunkResults.forEach((result, idx) => {
            if (result !== null && result !== undefined) merged[idx] = result
          })
          return merged
        }, new Array(totalSelections).fill(null)),
      )
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
    projectionOpts?: {
      projection: string
      trackedRefIds: BehaviorSubject<Set<string>>
    },
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

    const selectionFields = projectionOpts ? [] : fields
    const selectionProjection = projectionOpts?.projection

    const source$ = projectionOpts
      ? invalidationChannel.pipe(startWith({type: 'connected' as const}))
      : invalidationChannel

    return source$.pipe(
      filter((event) => {
        if (event.type === 'connected') {
          return true
        }
        if (hasPerspective) {
          const matches =
            getPublishedId(event.documentId) === getPublishedId(documentId) &&
            idMatchesPerspective(perspective, event.documentId)
          if (matches) return true
        } else if (event.documentId === documentId) {
          return true
        }
        if (projectionOpts) {
          const eventPubId = getPublishedId(event.documentId)
          return projectionOpts.trackedRefIds.value.has(eventPubId)
        }
        return false
      }),
      switchMap((event) => {
        const fetchArgs: [Id, FieldName[]] | [Id, FieldName[], string] = selectionProjection
          ? [fetchId, selectionFields, selectionProjection]
          : [fetchId, selectionFields]

        if (event.type === 'connected' || event.visibility === 'query') {
          return fetchDocumentPathsFast(...fetchArgs).pipe(
            mergeMap((result) => {
              return concat(of(result), result === null ? fetchDocumentPathsSlow(...fetchArgs) : [])
            }),
          )
        }
        return fetchDocumentPathsSlow(...fetchArgs)
      }),
      tap((result) => {
        if (projectionOpts) {
          projectionOpts.trackedRefIds.next(
            extractAllReferencedIds(result as Record<string, unknown> | null),
          )
        }
      }),
    )
  }

  const CACHE: Cache = {} // todo: use a LRU cache instead (e.g. hashlru or quick-lru)

  type BatchFetchFn = (id: Id, fields: FieldName[], projection?: string) => Observable<any>

  const getBatchFetcherForDataset = memoize(
    function getBatchFetcherForDataset(apiConfig: ApiConfig): BatchFetchFn {
      const client = currentDatasetClient.withConfig(apiConfig)
      const fetchAll = fetchAllDocumentPathsWith(client, ['drafts'])
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

  function createCachedFieldObserver(
    id: string,
    fields: FieldName[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
    projectionOpts?: {projection: string; trackedRefIds: BehaviorSubject<Set<string>>},
  ): CachedFieldObserver {
    let latest: any
    const source$ = apiConfig
      ? crossDatasetListenFields(id, fields, apiConfig)
      : currentDatasetListenFields(id, fields, perspective, projectionOpts)

    let changes$ = merge(
      defer(() => (latest === undefined ? EMPTY : of(latest))),
      source$,
    ).pipe(tap((v) => (latest = v)))

    if (projectionOpts) {
      changes$ = changes$.pipe(
        distinctUntilChanged((prev, curr) => allRevKeys(prev) === allRevKeys(curr)),
      )
    }

    changes$ = changes$.pipe(shareReplay({refCount: true, bufferSize: 1}))

    return {id, fields, changes$}
  }

  function cachedObserveFields(
    id: Id,
    fields: FieldName[],
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
    projection?: string,
  ) {
    if (projection) {
      const cacheKey = `$proj$-${id}-${perspective?.join('-') || 'raw'}-${projection}`

      if (!(cacheKey in CACHE)) {
        const trackedRefIds = new BehaviorSubject<Set<string>>(new Set())
        CACHE[cacheKey] = [
          createCachedFieldObserver(id, [], undefined, perspective, {projection, trackedRefIds}),
        ]
      }

      return CACHE[cacheKey][0].changes$
    }

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
