import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {combineLatest, from, merge, type Observable, of, retry, timer} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  finalize,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  throttleTime,
  toArray,
} from 'rxjs/operators'

import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../util/const'
import {bufferByByteSize} from './observeVersionDocumentIds'
import {type InvalidationChannelEvent} from './types'
import {
  COMBINED_COUNT_QUERY_MEMBER_SIZE,
  combineCountQuery,
  demuxCountResult,
} from './utils/combineCountQuery'
import {debounceCollect} from './utils/debounceCollect'

const DEFAULT_TAG = 'preview.observe-document-count'

const BATCH_DEBOUNCE_MS = 100

const MUTATION_THROTTLE_MS = 1000

const MAX_CONCURRENT_BATCH_FETCHES = 10

interface ObserveOptions {
  tag?: string
}

type CollectedArg = [
  type: string,
  perspective: StackablePerspective[],
  observeOptions?: ObserveOptions,
]

interface GroupMember {
  originalIndex: number
  type: string
}

interface PerspectiveGroup {
  perspective: StackablePerspective[]
  tag: string
  members: GroupMember[]
}

interface DemuxedCount {
  originalIndex: number
  count: number
}

function resolveTag(observeOptions?: ObserveOptions): string {
  return observeOptions?.tag ?? DEFAULT_TAG
}

/** One query carries one tag, so callers asking for different tags cannot share a batch. */
function groupByPerspectiveAndTag(collectedArgs: CollectedArg[]): PerspectiveGroup[] {
  const groupsByKey = collectedArgs.reduce(
    (accumulator, [type, perspective, observeOptions], originalIndex) => {
      const tag = resolveTag(observeOptions)
      const groupKey = `${perspective.join(',')}|${tag}`
      const member: GroupMember = {originalIndex, type}
      const existing = accumulator.get(groupKey)

      if (existing) {
        existing.members.push(member)
      } else {
        accumulator.set(groupKey, {perspective, tag, members: [member]})
      }

      return accumulator
    },
    new Map<string, PerspectiveGroup>(),
  )

  return Array.from(groupsByKey.values())
}

function fetchChunk(
  client: SanityClient,
  group: PerspectiveGroup,
  chunk: GroupMember[],
): Observable<DemuxedCount[]> {
  const {query, params} = combineCountQuery(chunk)

  return client.observable
    .fetch<unknown>(query, params, {perspective: group.perspective, tag: group.tag})
    .pipe(
      retry({delay: (_error: unknown, attempt) => timer(Math.min(30_000, attempt * 1000))}),
      map((result) => {
        const counts = demuxCountResult(result, chunk.length)
        return chunk.map((member, withinChunkIndex) => ({
          originalIndex: member.originalIndex,
          count: counts[withinChunkIndex],
        }))
      }),
    )
}

function fetchGroup(client: SanityClient, group: PerspectiveGroup): Observable<DemuxedCount[]> {
  return from(group.members).pipe(
    // Split into chunks small enough that each combined query stays within the max query size.
    bufferByByteSize<GroupMember>(
      () => COMBINED_COUNT_QUERY_MEMBER_SIZE,
      MAX_DOCUMENT_ID_CHUNK_SIZE,
    ),
    mergeMap(
      (chunk, chunkIndex) =>
        fetchChunk(client, group, chunk).pipe(map((entries) => ({chunkIndex, entries}))),
      MAX_CONCURRENT_BATCH_FETCHES,
    ),
    toArray(),
    map((settled) =>
      settled
        .sort((first, second) => first.chunkIndex - second.chunkIndex)
        .flatMap(({entries}) => entries),
    ),
  )
}

function batchFetch(client: SanityClient, collectedArgs: CollectedArg[]): Observable<number[]> {
  if (collectedArgs.length === 0) {
    return of([])
  }

  const groups = groupByPerspectiveAndTag(collectedArgs)

  return combineLatest(groups.map((group) => fetchGroup(client, group))).pipe(
    // Realign the per-group results to the original `collectedArgs` order: `debounceCollect`
    // demuxes by position, so a misaligned array would hand callers the wrong counts.
    map((groupResults) => {
      const output = Array.from({length: collectedArgs.length}, () => 0)
      groupResults.forEach((entries) => {
        entries.forEach(({originalIndex, count}) => {
          output[originalIndex] = count
        })
      })
      return output
    }),
  )
}

/**
 * Create a function that observes the number of documents of a given schema type under a given
 * perspective.
 *
 * Like `createObserveVersionDocumentIds`, this is driven by the shared global
 * `invalidationChannel` rather than a dedicated listener, and it condenses every count requested
 * within the same tick into a single combined `count()` query (grouped by perspective). Identical
 * descriptors under the same perspective share one cache entry and one slice of the batch.
 *
 * @internal
 */
export function createObserveDocumentCount(options: {
  client: SanityClient
  invalidationChannel: Observable<InvalidationChannelEvent>
}): (
  type: string,
  perspective: StackablePerspective[],
  observeOptions?: ObserveOptions,
) => Observable<number> {
  const {client, invalidationChannel} = options

  const fetchCount = debounceCollect(
    (collectedArgs: CollectedArg[]) => batchFetch(client, collectedArgs),
    BATCH_DEBOUNCE_MS,
  )

  const cache = new Map<string, Observable<number>>()

  return function observeDocumentCount(
    type: string,
    perspective: StackablePerspective[],
    observeOptions?: ObserveOptions,
  ): Observable<number> {
    const tag = resolveTag(observeOptions)
    const key = JSON.stringify([type, perspective, tag])
    const cachedInstance = cache.get(key)

    if (cachedInstance) {
      return cachedInstance
    }

    const instance = merge(
      // `connected` gives the immediate initial fetch (and reconnect refetch); `mutation` bursts
      // are throttled since counts can't cheaply filter '*' events per-descriptor.
      invalidationChannel.pipe(filter((event) => event.type === 'connected')),
      invalidationChannel.pipe(
        filter((event) => event.type === 'mutation'),
        throttleTime(MUTATION_THROTTLE_MS, undefined, {leading: true, trailing: true}),
      ),
    ).pipe(
      switchMap(() => fetchCount(type, perspective, observeOptions)),
      distinctUntilChanged(),
      finalize(() => cache.delete(key)),
      shareReplay({refCount: true, bufferSize: 1}),
    )

    cache.set(key, instance)
    return instance
  }
}
