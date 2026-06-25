import {type SanityClient} from '@sanity/client'
import {firstValueFrom, from, of, Subject} from 'rxjs'
import {take, toArray} from 'rxjs/operators'
import {describe, expect, it} from 'vitest'

import {bufferByByteSize, createObserveVersionDocumentIds} from '../observeVersionDocumentIds'
import {type InvalidationChannelEvent} from '../types'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parsePublishedIds(query: string): string[] {
  const matches = query.match(/sanity::versionOf\("([^"]+)"\)/g) ?? []
  return matches.map((match) => match.replace(/^sanity::versionOf\("/, '').replace(/"\)$/, ''))
}

function createMockClient(onFetch: (query: string) => string[][]) {
  const fetchCalls: string[] = []
  const client = {
    withConfig: () => client,
    observable: {
      fetch: (query: string) => {
        fetchCalls.push(query)
        return of(onFetch(query))
      },
    },
  }
  return {client: client as unknown as SanityClient, fetchCalls}
}

describe('bufferByByteSize', () => {
  it('buffers values into chunks bounded by the byte limit', async () => {
    const chunks = await firstValueFrom(
      from(['a', 'bb', 'ccc', 'dddd']).pipe(
        bufferByByteSize((value) => value.length, 5),
        toArray(),
      ),
    )

    // running totals close just before reaching the limit of 5:
    // a(1), bb(+2=3); ccc would make 6 -> close [a,bb]; ccc(3), dddd would make 7 -> close [ccc]
    expect(chunks).toEqual([['a', 'bb'], ['ccc'], ['dddd']])
  })

  it('emits an oversized value as its own chunk', async () => {
    const chunks = await firstValueFrom(
      from(['x', 'enormous']).pipe(
        bufferByByteSize((value) => value.length, 3),
        toArray(),
      ),
    )

    expect(chunks).toEqual([['x'], ['enormous']])
  })
})

describe('observeVersionDocumentIds', () => {
  it('batches discovery for multiple published ids into a single query', async () => {
    const {client, fetchCalls} = createMockClient((query) =>
      parsePublishedIds(query).map((id) => [`drafts.${id}`, `versions.r1.${id}`]),
    )
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveVersionDocumentIds({client, invalidationChannel})

    const publishedIds = ['article-1', 'article-2', 'article-3']
    const results: Record<string, string[]> = {}
    const subscriptions = publishedIds.map((id) =>
      observe(id)
        .pipe(take(1))
        .subscribe((ids) => {
          results[id] = ids
        }),
    )

    invalidationChannel.next({type: 'connected'})
    await wait(150)
    subscriptions.forEach((sub) => sub.unsubscribe())

    // All three published ids resolved in a single combined query
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]).toContain('sanity::versionOf("article-1")')
    expect(fetchCalls[0]).toContain('sanity::versionOf("article-2")')
    expect(fetchCalls[0]).toContain('sanity::versionOf("article-3")')

    expect(results).toEqual({
      'article-1': ['drafts.article-1', 'versions.r1.article-1'],
      'article-2': ['drafts.article-2', 'versions.r1.article-2'],
      'article-3': ['drafts.article-3', 'versions.r1.article-3'],
    })
  })

  it('chunks large batches into multiple queries and reassembles results', async () => {
    const longPrefix = 'a'.repeat(990)
    const publishedIds = Array.from({length: 15}, (_, i) => `${longPrefix}-${i}`)

    const {client, fetchCalls} = createMockClient((query) =>
      parsePublishedIds(query).map((id) => [`drafts.${id}`]),
    )
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveVersionDocumentIds({client, invalidationChannel})

    const results: Record<string, string[]> = {}
    const subscriptions = publishedIds.map((id) =>
      observe(id)
        .pipe(take(1))
        .subscribe((ids) => {
          results[id] = ids
        }),
    )

    invalidationChannel.next({type: 'connected'})
    await wait(200)
    subscriptions.forEach((sub) => sub.unsubscribe())

    expect(fetchCalls.length).toBeGreaterThan(1)
    for (const id of publishedIds) {
      expect(results[id]).toEqual([`drafts.${id}`])
    }
  })

  it('refetches the set when a relevant mutation arrives', async () => {
    const versionsByPublishedId: Record<string, string[]> = {
      'article-1': ['drafts.article-1'],
    }
    const {client, fetchCalls} = createMockClient((query) =>
      parsePublishedIds(query).map((id) => versionsByPublishedId[id] ?? []),
    )
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveVersionDocumentIds({client, invalidationChannel})

    const emissions: string[][] = []
    const subscription = observe('article-1').subscribe((ids) => emissions.push(ids))

    invalidationChannel.next({type: 'connected'})
    await wait(150)

    // A new version appears for the same published id
    versionsByPublishedId['article-1'] = ['drafts.article-1', 'versions.rNew.article-1']
    invalidationChannel.next({
      type: 'mutation',
      documentId: 'versions.rNew.article-1',
      visibility: 'query',
    })
    await wait(150)

    subscription.unsubscribe()

    expect(emissions).toEqual([
      ['drafts.article-1'],
      ['drafts.article-1', 'versions.rNew.article-1'],
    ])
    expect(fetchCalls).toHaveLength(2)
  })

  it('ignores mutations for unrelated documents', async () => {
    const {client, fetchCalls} = createMockClient((query) =>
      parsePublishedIds(query).map((id) => [`drafts.${id}`]),
    )
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveVersionDocumentIds({client, invalidationChannel})

    const emissions: string[][] = []
    const subscription = observe('article-1').subscribe((ids) => emissions.push(ids))

    invalidationChannel.next({type: 'connected'})
    await wait(150)

    // Mutation for a version of a different published id
    invalidationChannel.next({
      type: 'mutation',
      documentId: 'versions.rNew.article-2',
      visibility: 'query',
    })
    await wait(150)

    subscription.unsubscribe()

    expect(emissions).toEqual([['drafts.article-1']])
    expect(fetchCalls).toHaveLength(1)
  })

  it('caches and shares the observable for the same published id', () => {
    const {client} = createMockClient(() => [])
    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observe = createObserveVersionDocumentIds({client, invalidationChannel})

    expect(observe('article-1')).toBe(observe('article-1'))
    expect(observe('article-1')).not.toBe(observe('article-2'))
  })
})
