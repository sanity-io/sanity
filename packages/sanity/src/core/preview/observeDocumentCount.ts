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
import {combineCountQuery, demuxCountResult} from './utils/combineCountQuery'
import {debounceCollect} from './utils/debounceCollect'

const DEFAULT_TAG = 'structure.list-pane-counts'

const BATCH_DEBOUNCE_MS = 100

const MUTATION_THROTTLE_MS = 1000

const MAX_CONCURRENT_BATCH_FETCHES = 10

/** Approximate per-descriptor overhead added by its projection key and `count()` wrapper. */
const COUNT_PROJECTION_OVERHEAD = '"000": count(*[]),'.length

interface ObserveOptions {
  tag?: string
}

type CollectedArg = [
  filter: string,
  params: Record<string, unknown>,
  perspective: StackablePerspective[],
  observeOptions?: ObserveOptions,
]

interface GroupMember {
  originalIndex: number
  filter: string
  params: Record<string, unknown>
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

function stableParamsKey(params: Record<string, unknown>): string {
  const sortedEntries = Object.keys(params)
    .sort()
    .map((key) => [key, params[key]])
  return JSON.stringify(sortedEntries)
}

function groupByPerspective(collectedArgs: CollectedArg[]): PerspectiveGroup[] {
  const groupsByKey = collectedArgs.reduce(
    (accumulator, [descriptorFilter, params, perspective, observeOptions], originalIndex) => {
      const perspectiveKey = perspective.join(',')
      const member: GroupMember = {originalIndex, filter: descriptorFilter, params}
      const existing = accumulator.get(perspectiveKey)

      if (existing) {
        existing.members.push(member)
      } else {
        accumulator.set(perspectiveKey, {
          perspective,
          tag: observeOptions?.tag ?? DEFAULT_TAG,
          members: [member],
        })
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
    bufferByByteSize(
      (member: GroupMember) => member.filter.length + COUNT_PROJECTION_OVERHEAD,
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

  const groups = groupByPerspective(collectedArgs)

  return combineLatest(groups.map((group) => fetchGroup(client, group))).pipe(
    // Realign the per-group results to the original `collectedArgs` order: `debounceCollect`
    // demuxes by position, so a misaligned array would hand callers the wrong counts.
    map((groupResults) => {
      const output = Array.from<number>({length: collectedArgs.length}).fill(0)
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
 * Create a function that observes the number of documents matching a groq filter under a given
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
  filter: string,
  params: Record<string, unknown>,
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
    descriptorFilter: string,
    params: Record<string, unknown>,
    perspective: StackablePerspective[],
    observeOptions?: ObserveOptions,
  ): Observable<number> {
    const key = `${descriptorFilter}|${stableParamsKey(params)}|${perspective.join(',')}`
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
      switchMap(() => fetchCount(descriptorFilter, params, perspective, observeOptions)),
      distinctUntilChanged(),
      finalize(() => cache.delete(key)),
      shareReplay({refCount: true, bufferSize: 1}),
    )

    cache.set(key, instance)
    return instance
  }
}
