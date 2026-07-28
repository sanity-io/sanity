import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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
    withConfig: () => client,
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

describe('observeDocumentCount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shares one cache entry and one query for identical descriptors', async () => {
    const {client, fetchCalls} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

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
    const {client, fetchCalls} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

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
    const {client} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

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
    const {client, fetchCalls} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

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
    const {client, fetchCalls} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

    const subscription = observe(AUTHOR_FILTER, {}, []).subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(BATCH_DEBOUNCE_MS)
    expect(fetchCalls).toHaveLength(1)

    invalidationChannel.next({type: 'mutation', documentId: 'author-1', visibility: 'query'})
    await vi.advanceTimersByTimeAsync(MUTATION_THROTTLE_MS + BATCH_DEBOUNCE_MS)
    subscription.unsubscribe()

    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches different perspectives requested in one tick as separate queries', async () => {
    const {client, fetchCalls} = createMockClient(countForFilter)
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveDocumentCount({client, invalidationChannel})

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
})
