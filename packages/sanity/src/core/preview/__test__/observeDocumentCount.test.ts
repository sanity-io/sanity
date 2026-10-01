import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {defer, of, Subject, throwError} from 'rxjs'
import {catchError} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../../util/const'
import {createObserveDocumentCount} from '../observeDocumentCount'
import {type InvalidationChannelEvent} from '../types'

const BATCH_DEBOUNCE_MS = 100
const MUTATION_THROTTLE_MS = 1000

const MAX_FETCH_RETRIES = 3

// The retry delay ladder is `attempt * 1000`, so three retries span 1s + 2s + 3s.
const RETRY_LADDER_MS = 6000

interface FetchCall {
  query: string
  params: Record<string, unknown>
  perspective: StackablePerspective[] | undefined
  tag: string | undefined
  variant: string | undefined
}

const TYPE_PARAM_PATTERN = /^c(\d+)_type$/

function resolveCountsFromParams(
  params: Record<string, unknown>,
  countForType: (typeName: string) => number,
): Record<string, number> {
  return Object.entries(params).reduce<Record<string, number>>((accumulator, [key, value]) => {
    const match = key.match(TYPE_PARAM_PATTERN)
    if (!match) {
      return accumulator
    }
    const [, projectionIndex] = match
    return {...accumulator, [projectionIndex]: countForType(value as string)}
  }, {})
}

type FetchErrorSource = Error | (() => Error | undefined)

function resolveFetchError(source: FetchErrorSource | undefined): Error | undefined {
  return typeof source === 'function' ? source() : source
}

function createMockClient(
  countForType: (typeName: string) => number,
  fetchError?: FetchErrorSource,
) {
  const fetchCalls: FetchCall[] = []
  const client = {
    observable: {
      fetch: (
        query: string,
        params: Record<string, unknown>,
        options: {perspective?: StackablePerspective[]; tag?: string; variant?: string},
      ) =>
        // `defer` keeps the request cold, so a retry's resubscribe counts as another call the way
        // it would against a real client.
        defer(() => {
          fetchCalls.push({
            query,
            params,
            perspective: options?.perspective,
            tag: options?.tag,
            variant: options?.variant,
          })
          const error = resolveFetchError(fetchError)
          return error ? throwError(() => error) : of(resolveCountsFromParams(params, countForType))
        }),
    },
    withConfig: () => client,
  }
  return {client: client as unknown as SanityClient, fetchCalls}
}

const AUTHOR_TYPE = 'author'
const BOOK_TYPE = 'book'

function countForType(typeName: string): number {
  if (typeName === AUTHOR_TYPE) {
    return 5
  }
  if (typeName === BOOK_TYPE) {
    return 3
  }
  return 0
}

function setup(
  countFor: (typeName: string) => number = countForType,
  fetchError?: FetchErrorSource,
) {
  const {client, fetchCalls} = createMockClient(countFor, fetchError)
  const invalidationChannel = new Subject<InvalidationChannelEvent>()

  return {
    fetchCalls,
    invalidationChannel,
    observe: createObserveDocumentCount({client, invalidationChannel}),
  }
}

function mutationEvent(documentId: string): InvalidationChannelEvent {
  return {type: 'mutation', documentId, visibility: 'query'}
}

function countByEmbeddedTypeIndex(typeName: string): number {
  const match = typeName.match(/^type(\d+)$/)
  return match ? (Number(match[1]) + 1) * 7 : 0
}

// The type name always travels as a param, so a combined query's length no longer depends on it -
// only the descriptor count does. 400 descriptors comfortably exceeds a chunk's ~286-member budget,
// forcing a split across multiple queries.
const MANY_TYPE_NAMES = Array.from({length: 400}, (_unused, index) => `type${index}`)

describe('observeDocumentCount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shares one cache entry and one query for identical descriptors', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    expect(observe(AUTHOR_TYPE, [])).toBe(observe(AUTHOR_TYPE, []))

    const subscriptionOne = observe(AUTHOR_TYPE, []).subscribe()
    const subscriptionTwo = observe(AUTHOR_TYPE, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionOne.unsubscribe()
    subscriptionTwo.unsubscribe()

    expect(fetchCalls).toHaveLength(1)
  })

  it('merges two different descriptors requested in the same tick into one combined query', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscriptionAuthor = observe(AUTHOR_TYPE, []).subscribe()
    const subscriptionBook = observe(BOOK_TYPE, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionAuthor.unsubscribe()
    subscriptionBook.unsubscribe()

    expect(fetchCalls).toHaveLength(1)
    expect(Object.values(fetchCalls[0].params)).toEqual(
      expect.arrayContaining([AUTHOR_TYPE, BOOK_TYPE]),
    )
  })

  it('demuxes the combined result back to each caller', async () => {
    const {invalidationChannel, observe} = setup()

    const authorEmissions: number[] = []
    const bookEmissions: number[] = []
    const subscriptionAuthor = observe(AUTHOR_TYPE, []).subscribe((count) =>
      authorEmissions.push(count),
    )
    const subscriptionBook = observe(BOOK_TYPE, []).subscribe((count) => bookEmissions.push(count))

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionAuthor.unsubscribe()
    subscriptionBook.unsubscribe()

    expect(authorEmissions).toEqual([5])
    expect(bookEmissions).toEqual([3])
  })

  it('evicts the cache entry on last unsubscribe so a fresh subscribe rebuilds', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const firstInstance = observe(AUTHOR_TYPE, [])
    const firstSubscription = firstInstance.subscribe()
    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    firstSubscription.unsubscribe()

    const secondInstance = observe(AUTHOR_TYPE, [])
    expect(secondInstance).not.toBe(firstInstance)

    const secondSubscription = secondInstance.subscribe()
    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    secondSubscription.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches on a connected event and refetches on a mutation event', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscription = observe(AUTHOR_TYPE, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(fetchCalls).toHaveLength(1)

    invalidationChannel.next(mutationEvent('author-1'))
    await vi.advanceTimersByTimeAsync(MUTATION_THROTTLE_MS + BATCH_DEBOUNCE_MS)
    subscription.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches different perspectives requested in one tick as separate queries', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscriptionPublished = observe(AUTHOR_TYPE, ['published']).subscribe()
    const subscriptionDrafts = observe(AUTHOR_TYPE, ['drafts']).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionPublished.unsubscribe()
    subscriptionDrafts.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls.map((call) => call.perspective)).toEqual(
      expect.arrayContaining([['published'], ['drafts']]),
    )
  })

  it('splits a perspective group into multiple chunked queries once descriptors exceed the max query size, demuxing every descriptor to its own count and keeping every query at or under the max size', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup(countByEmbeddedTypeIndex)

    const emissionsByIndex = MANY_TYPE_NAMES.map(() => [] as number[])
    const subscriptions = MANY_TYPE_NAMES.map((typeName, index) =>
      observe(typeName, []).subscribe((count) => emissionsByIndex[index].push(count)),
    )

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptions.forEach((subscription) => subscription.unsubscribe())

    expect(fetchCalls.length).toBeGreaterThan(1)
    fetchCalls.forEach((call) => {
      expect(call.query.length).toBeLessThanOrEqual(MAX_DOCUMENT_ID_CHUNK_SIZE)
    })
    emissionsByIndex.forEach((emissions, index) => {
      expect(emissions).toEqual([(index + 1) * 7])
    })
  })

  it('does not re-emit to subscribers when an invalidation refetch resolves to the same count, but does when the count changes', async () => {
    let authorCount = 5
    const {invalidationChannel, observe} = setup((typeName) =>
      typeName === AUTHOR_TYPE ? authorCount : 0,
    )

    const emissions: number[] = []
    const subscription = observe(AUTHOR_TYPE, []).subscribe((count) => emissions.push(count))

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)

    invalidationChannel.next(mutationEvent('author-1'))
    await vi.advanceTimersByTimeAsync(MUTATION_THROTTLE_MS + BATCH_DEBOUNCE_MS)

    authorCount = 6
    invalidationChannel.next(mutationEvent('author-2'))
    await vi.advanceTimersByTimeAsync(MUTATION_THROTTLE_MS + BATCH_DEBOUNCE_MS)

    subscription.unsubscribe()

    expect(emissions).toEqual([5, 6])
  })

  it('stops retrying a failing fetch without erroring the stream', async () => {
    const fetchError = new Error('fetch rejected')
    const {fetchCalls, invalidationChannel, observe} = setup(countForType, fetchError)

    const caughtErrors: unknown[] = []
    const emissions: number[] = []
    const subscription = observe(AUTHOR_TYPE, [])
      .pipe(
        catchError((error) => {
          caughtErrors.push(error)
          return of(0)
        }),
      )
      .subscribe((count) => emissions.push(count))

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS + RETRY_LADDER_MS)

    expect(fetchCalls).toHaveLength(MAX_FETCH_RETRIES + 1)
    expect(caughtErrors).toEqual([])
    expect(emissions).toEqual([])

    // A loop that ignored `count` would still be firing after the ladder has run out.
    await vi.advanceTimersByTimeAsync(RETRY_LADDER_MS)
    expect(fetchCalls).toHaveLength(MAX_FETCH_RETRIES + 1)

    subscription.unsubscribe()
  })

  it('refetches on the next invalidation after a fetch exhausted its retries', async () => {
    let fetchError: Error | undefined = new Error('fetch rejected')
    const {fetchCalls, invalidationChannel, observe} = setup(countForType, () => fetchError)

    const emissions: number[] = []
    const subscription = observe(AUTHOR_TYPE, []).subscribe((count) => emissions.push(count))

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS + RETRY_LADDER_MS)

    expect(fetchCalls).toHaveLength(MAX_FETCH_RETRIES + 1)
    expect(emissions).toEqual([])

    fetchError = undefined
    invalidationChannel.next(mutationEvent('author-1'))
    await vi.advanceTimersByTimeAsync(MUTATION_THROTTLE_MS + BATCH_DEBOUNCE_MS)

    expect(emissions).toEqual([5])

    subscription.unsubscribe()
  })

  it('does not share a cache entry between the same descriptor with and without a variant', () => {
    const {observe} = setup()

    expect(observe(AUTHOR_TYPE, [], {variant: 'variant-a'})).not.toBe(observe(AUTHOR_TYPE, []))
  })

  it('fetches two variants of the same descriptor requested in one tick as separate queries and passes the variant through to the client', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscriptionA = observe(AUTHOR_TYPE, [], {variant: 'variant-a'}).subscribe()
    const subscriptionB = observe(AUTHOR_TYPE, [], {variant: 'variant-b'}).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionA.unsubscribe()
    subscriptionB.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls.map((call) => call.variant)).toEqual(
      expect.arrayContaining(['variant-a', 'variant-b']),
    )
  })
})
