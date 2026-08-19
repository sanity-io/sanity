import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../../util/const'
import {createObserveDocumentCount} from '../observeDocumentCount'
import {type InvalidationChannelEvent} from '../types'

const BATCH_DEBOUNCE_MS = 100
const MUTATION_THROTTLE_MS = 1000

interface FetchCall {
  query: string
  params: Record<string, unknown>
  perspective: StackablePerspective[] | undefined
  tag: string | undefined
}

function parseFilters(query: string): string[] {
  const matches = query.match(/count\(\*\[(.*?)\]\)/g) ?? []
  return matches.map((match) => match.replace(/^count\(\*\[/, '').replace(/\]\)$/, ''))
}

function createMockClient(countForFilter: (filter: string) => number) {
  const fetchCalls: FetchCall[] = []
  const client = {
    observable: {
      fetch: (
        query: string,
        params: Record<string, unknown>,
        options: {perspective?: StackablePerspective[]; tag?: string},
      ) => {
        fetchCalls.push({query, params, perspective: options?.perspective, tag: options?.tag})
        const result = parseFilters(query).reduce<Record<string, number>>(
          (accumulator, filterText, index) => ({
            ...accumulator,
            [String(index)]: countForFilter(filterText),
          }),
          {},
        )
        return of(result)
      },
    },
  }
  return {client: client as unknown as SanityClient, fetchCalls}
}

const AUTHOR_FILTER = '_type == "author"'
const BOOK_FILTER = '_type == "book"'

function countForFilter(filterText: string): number {
  if (filterText.includes('author')) {
    return 5
  }
  if (filterText.includes('book')) {
    return 3
  }
  return 0
}

function setup(countFor: (filter: string) => number = countForFilter) {
  const {client, fetchCalls} = createMockClient(countFor)
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

function buildDescriptorFilter(index: number, targetLength: number): string {
  const marker = `_type == "type${index}"`
  const paddingLength = Math.max(0, targetLength - marker.length - 1)
  return `${marker} ${'a'.repeat(paddingLength)}`
}

function countByEmbeddedTypeIndex(filterText: string): number {
  const match = filterText.match(/_type == "type(\d+)"/)
  return match ? (Number(match[1]) + 1) * 7 : 0
}

// Each filter takes over a third of the query-size budget, so at most two fit in a chunk and five
// descriptors must span several queries. Per-descriptor projection overhead only pushes toward more
// chunks, so the split holds without the test having to mirror that constant.
const CHUNK_TEST_FILTERS = Array.from({length: 5}, (_unused, index) =>
  buildDescriptorFilter(index, Math.floor(MAX_DOCUMENT_ID_CHUNK_SIZE / 2.5)),
)

describe('observeDocumentCount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shares one cache entry and one query for identical descriptors', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    expect(observe(AUTHOR_FILTER, {}, [])).toBe(observe(AUTHOR_FILTER, {}, []))

    const subscriptionOne = observe(AUTHOR_FILTER, {}, []).subscribe()
    const subscriptionTwo = observe(AUTHOR_FILTER, {}, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionOne.unsubscribe()
    subscriptionTwo.unsubscribe()

    expect(fetchCalls).toHaveLength(1)
  })

  it('merges two different descriptors requested in the same tick into one combined query', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscriptionAuthor = observe(AUTHOR_FILTER, {}, []).subscribe()
    const subscriptionBook = observe(BOOK_FILTER, {}, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionAuthor.unsubscribe()
    subscriptionBook.unsubscribe()

    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0].query).toContain('_type == "author"')
    expect(fetchCalls[0].query).toContain('_type == "book"')
  })

  it('demuxes the combined result back to each caller', async () => {
    const {invalidationChannel, observe} = setup()

    const authorEmissions: number[] = []
    const bookEmissions: number[] = []
    const subscriptionAuthor = observe(AUTHOR_FILTER, {}, []).subscribe((count) =>
      authorEmissions.push(count),
    )
    const subscriptionBook = observe(BOOK_FILTER, {}, []).subscribe((count) =>
      bookEmissions.push(count),
    )

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionAuthor.unsubscribe()
    subscriptionBook.unsubscribe()

    expect(authorEmissions).toEqual([5])
    expect(bookEmissions).toEqual([3])
  })

  it('evicts the cache entry on last unsubscribe so a fresh subscribe rebuilds', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const firstInstance = observe(AUTHOR_FILTER, {}, [])
    const firstSubscription = firstInstance.subscribe()
    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    firstSubscription.unsubscribe()

    const secondInstance = observe(AUTHOR_FILTER, {}, [])
    expect(secondInstance).not.toBe(firstInstance)

    const secondSubscription = secondInstance.subscribe()
    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    secondSubscription.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches on a connected event and refetches on a mutation event', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup()

    const subscription = observe(AUTHOR_FILTER, {}, []).subscribe()

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

    const subscriptionPublished = observe(AUTHOR_FILTER, {}, ['published']).subscribe()
    const subscriptionDrafts = observe(AUTHOR_FILTER, {}, ['drafts']).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptionPublished.unsubscribe()
    subscriptionDrafts.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls.map((call) => call.perspective)).toEqual(
      expect.arrayContaining([['published'], ['drafts']]),
    )
  })

  it('splits a perspective group into multiple chunked queries once descriptors exceed the max query size, demuxing every descriptor to its own count', async () => {
    const {fetchCalls, invalidationChannel, observe} = setup(countByEmbeddedTypeIndex)

    const emissionsByIndex = CHUNK_TEST_FILTERS.map(() => [] as number[])
    const subscriptions = CHUNK_TEST_FILTERS.map((descriptorFilter, index) =>
      observe(descriptorFilter, {}, []).subscribe((count) => emissionsByIndex[index].push(count)),
    )

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    subscriptions.forEach((subscription) => subscription.unsubscribe())

    expect(fetchCalls.length).toBeGreaterThan(1)
    emissionsByIndex.forEach((emissions, index) => {
      expect(emissions).toEqual([(index + 1) * 7])
    })
  })

  it('does not re-emit to subscribers when an invalidation refetch resolves to the same count, but does when the count changes', async () => {
    let authorCount = 5
    const {invalidationChannel, observe} = setup((filterText) =>
      filterText.includes('author') ? authorCount : 0,
    )

    const emissions: number[] = []
    const subscription = observe(AUTHOR_FILTER, {}, []).subscribe((count) => emissions.push(count))

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
})
