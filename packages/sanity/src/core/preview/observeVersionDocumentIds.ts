import {type SanityClient} from '@sanity/client'
import isEqual from 'lodash-es/isEqual.js'
import {concat, from, type Observable, of, type OperatorFunction, retry, Subject, timer} from 'rxjs'
import {
  bufferWhen,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  tap,
  toArray,
} from 'rxjs/operators'

import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../releases/util/releasesClient'
import {versionedClient} from '../studioClient'
import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../util/const'
import {getPublishedId} from '../util/draftUtils'
import {type InvalidationChannelEvent} from './types'
import {debounceCollect} from './utils/debounceCollect'

/**
 * Approximate per-id overhead of a single document group member subquery.
 */
const VERSION_OF_QUERY_OVERHEAD = '*[sanity::versionOf("")]._id,'.length

/**
 * Maximum number of batch queries to keep in flight at once.
 */
const MAX_CONCURRENT_BATCH_FETCHES = 10

/**
 * Create a function that observes the set of version and variant document ids
 * that exist for the provided document group id.
 *
 * Unlike `createDocumentIdSetObserver`, which opens a dedicated listener for
 * each document group id, this observer is driven by the shared global
 * `invalidationChannel`. It condenses the queries for all observed document
 * group ids into a single GROQ query (one `sanity::versionOf()` call per id),
 * batching the request if it exceeds `MAX_DOCUMENT_ID_BATCH_SIZE`.
 *
 * @internal
 */
export function createObserveVersionDocumentIds(options: {
  client: SanityClient
  invalidationChannel: Observable<InvalidationChannelEvent>
}): (documentGroupId: string) => Observable<string[]> {
  const {client, invalidationChannel} = options
  const releasesClient = versionedClient(client, RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion)

  const fetchFast = debounceCollect(
    (collectedArgs: [documentGroupId: string][]) =>
      fetchVersionIdSets(releasesClient, collectedArgs),
    100,
  )

  const fetchSlow = debounceCollect(
    (collectedArgs: [documentGroupId: string][]) =>
      fetchVersionIdSets(releasesClient, collectedArgs),
    1000,
  )

  const cache = new Map<string, Observable<string[]>>()

  return function observeVersionDocumentIds(documentGroupId: string): Observable<string[]> {
    const cachedInstance = cache.get(documentGroupId)

    if (cachedInstance) {
      return cachedInstance
    }

    const instance = invalidationChannel.pipe(
      filter(
        (event) =>
          event.type === 'connected' || getPublishedId(event.documentId) === documentGroupId,
      ),
      switchMap((event) => {
        if (event.type === 'connected' || event.visibility === 'query') {
          return fetchFast(documentGroupId).pipe(
            mergeMap((ids) => {
              // A newly created version may not be indexed yet when its mutation
              // event arrives. If the mutated document isn't reflected in the
              // fresh result, schedule a slow refetch to catch up (mirroring the
              // fast/slow fallback in `observeFields`).
              const maybeIndexPending =
                event.type === 'mutation' &&
                event.documentId !== documentGroupId &&
                !ids.includes(event.documentId)

              if (maybeIndexPending) {
                return concat(of(ids), fetchSlow(documentGroupId))
              }

              return of(ids)
            }),
          )
        }
        return fetchSlow(documentGroupId)
      }),
      distinctUntilChanged(isEqual),
      finalize(() => cache.delete(documentGroupId)),
      shareReplay({
        refCount: true,
        bufferSize: 1,
      }),
    )

    cache.set(documentGroupId, instance)
    return instance
  }
}

/**
 * Buffer source values into batches, closing the current batch just before a
 * value would push its cumulative byte size to or beyond `maxBytes`. The
 * overflowing value becomes the first entry of the next batch; a value whose
 * own size already meets the limit is emitted as a single-element batch.
 *
 * @internal
 */
export function bufferByByteSize<Type extends string>(
  byteSize: (value: Type) => number,
  maxBytes: number,
): OperatorFunction<Type, Type[]> {
  return (source) => {
    const closeBuffer = new Subject<void>()
    let bufferedBytes = 0

    return source.pipe(
      tap((value) => {
        const size = byteSize(value)
        // Close the current (non-empty) buffer before this value would exceed
        // the limit, so the overflowing value becomes the first entry of the
        // next buffer instead.
        if (bufferedBytes > 0 && bufferedBytes + size >= maxBytes) {
          bufferedBytes = 0
          closeBuffer.next()
        }
        bufferedBytes += size
      }),
      bufferWhen(() => closeBuffer),
    )
  }
}

function buildQuery(documentGroupIds: string[]): string {
  const subQueries = documentGroupIds.map((id) => `*[sanity::versionOf(${JSON.stringify(id)})]._id`)
  return `[${subQueries.join(',')}]`
}

function fetchBatch(client: SanityClient, ids: string[]): Observable<string[][]> {
  return client.observable
    .fetch<string[][]>(buildQuery(ids), {}, {tag: 'preview.observe-version-ids'})
    .pipe(
      retry({delay: (_: unknown, attempt) => timer(Math.min(30_000, attempt * 1000))}),
      // Sort each set ascending so consumers get a stable order.
      map((result) => result.map((versionIds) => [...versionIds].sort())),
    )
}

function fetchVersionIdSets(
  client: SanityClient,
  collectedArgs: [documentGroupIds: string][],
): Observable<string[][]> {
  const documentGroupIds = collectedArgs.map(([documentGroupId]) => documentGroupId)

  if (documentGroupIds.length === 0) {
    return of([])
  }

  return from(documentGroupIds).pipe(
    // Split into batches small enough that each combined query stays within the
    // max query size.
    bufferByByteSize((id) => id.length + VERSION_OF_QUERY_OVERHEAD, MAX_DOCUMENT_ID_CHUNK_SIZE),
    // Fetch batches in parallel, tracking each batch's position so results can
    // be reordered.
    mergeMap(
      (batch, index) => fetchBatch(client, batch).pipe(map((result) => ({index, result}))),
      MAX_CONCURRENT_BATCH_FETCHES,
    ),
    toArray(),
    // Restore source order (parallel fetches may settle out of order), and
    // flatten the batch results back into a single array aligned with
    // `documentGroupIds`.
    map((settled) => settled.sort((a, b) => a.index - b.index).flatMap(({result}) => result)),
  )
}
