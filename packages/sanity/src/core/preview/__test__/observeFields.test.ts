import {firstValueFrom, of, Subject} from 'rxjs'
import {take, tap} from 'rxjs/operators'
import {describe, expect, it} from 'vitest'

import {type SanityClient} from '../../form/studio/assetSourceDataset/uploader'
import {MAX_DOCUMENT_ID_CHUNK_SIZE} from '../../util/const'
import {chunkCombinedSelections, type ClientLike, createObserveFields} from '../observeFields'
import {type InvalidationChannelEvent} from '../types'
import {type CombinedSelection} from '../utils/optimizeQuery'

describe('chunkCombinedSelections', () => {
  it('should return a single chunk when IDs fit within the size limit', () => {
    const selections: CombinedSelection[] = [
      {
        ids: ['doc-1', 'doc-2', 'doc-3'],
        fields: ['title', 'slug'],
        map: [0, 1, 2],
      },
    ]

    const result = chunkCombinedSelections(selections)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual([
      {
        ids: ['doc-1', 'doc-2', 'doc-3'],
        fields: ['title', 'slug'],
        map: [0, 1, 2],
      },
    ])
  })

  it('should split into multiple chunks when IDs exceed the size limit', () => {
    // Create IDs that will exceed MAX_DOCUMENT_ID_CHUNK_SIZE
    // Each ID contributes: id.length + 3 (for quotes and comma in GROQ: ["id",])
    // MAX_DOCUMENT_ID_CHUNK_SIZE is 11164, so we need IDs totaling more than that
    const longId = 'a'.repeat(1000) // 1000 + 3 = 1003 bytes per ID
    const ids = Array.from({length: 15}, (_, i) => `${longId}-${i}`) // ~15045 bytes total
    const map = Array.from({length: 15}, (_, i) => i)

    const selections: CombinedSelection[] = [
      {
        ids,
        fields: ['title'],
        map,
      },
    ]

    const result = chunkCombinedSelections(selections)

    // Should be split into multiple chunks
    expect(result.length).toBeGreaterThan(1)

    // Verify all IDs are present across chunks
    const allIds = result.flatMap((chunk) => chunk[0].ids)
    expect(allIds).toEqual(ids)

    // Verify map indices are preserved correctly
    const allMaps = result.flatMap((chunk) => chunk[0].map)
    expect(allMaps).toEqual(map)

    // Verify each chunk respects the size limit
    for (const chunk of result) {
      const chunkSize = chunk[0].ids.reduce((sum, id) => sum + id.length + 3, 0)
      expect(chunkSize).toBeLessThan(MAX_DOCUMENT_ID_CHUNK_SIZE)
    }
  })
})

describe('observeFields', () => {
  it('should return results directly when no chunking is needed (single chunk)', async () => {
    // Use short IDs that won't trigger chunking
    const documentIds = ['doc-1', 'doc-2', 'doc-3']

    // Track the number of fetch calls
    let fetchCallCount = 0

    const client: ClientLike = {
      observable: {
        fetch: (query: string) => {
          fetchCallCount++

          // Extract IDs from the query
          const idMatches = query.match(/_id in \[([^\]]+)\]/g)
          const results = idMatches?.map((match) => {
            const idsInQuery = match
              .replace('_id in [', '')
              .replace(']', '')
              .split(',')
              .map((id) => id.replace(/"/g, '').trim())

            return idsInQuery.map((id) => ({
              _id: id,
              _rev: `rev-${id}`,
              _type: 'testDoc',
              title: `Title for ${id}`,
            }))
          })

          return of(results || [])
        },
      },
      withConfig: () => client,
    }

    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observeFields = createObserveFields({
      invalidationChannel,
      client: client as unknown as SanityClient,
    })

    // Subscribe to all documents simultaneously
    const results: Record<string, any> = {}
    const subscriptions = documentIds.map((id) =>
      observeFields(id, ['title'])
        .pipe(take(1))
        .subscribe((value) => {
          results[id] = value
        }),
    )

    // Trigger the fetch
    invalidationChannel.next({type: 'connected'})

    // Wait for subscriptions to complete
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Clean up subscriptions
    subscriptions.forEach((sub) => sub.unsubscribe())

    // Verify only one fetch call was made (no chunking)
    expect(fetchCallCount).toBe(1)

    // Verify all documents got results
    const nonNullResults = Object.values(results).filter(Boolean)
    expect(nonNullResults).toHaveLength(documentIds.length)
  })

  it('should merge results correctly when selections are chunked (multiple chunks)', async () => {
    // Create IDs that will trigger chunking when batched together
    // Each ID is ~1000 chars, so 15 IDs will exceed MAX_DOCUMENT_ID_CHUNK_SIZE (11164)
    const longIdPrefix = 'a'.repeat(990)
    const documentIds = Array.from({length: 15}, (_, i) => `${longIdPrefix}-doc-${i}`)

    // Track which IDs were queried in each fetch call
    const fetchedIdGroups: string[][] = []

    const client: ClientLike = {
      observable: {
        fetch: (query: string) => {
          // Extract IDs from the query using regex
          const idMatches = query.match(/_id in \[([^\]]+)\]/g)
          if (idMatches) {
            for (const match of idMatches) {
              const idsInQuery = match
                .replace('_id in [', '')
                .replace(']', '')
                .split(',')
                .map((id) => id.replace(/"/g, '').trim())
              fetchedIdGroups.push(idsInQuery)
            }
          }

          // Return mock results for each ID in the query
          // The query structure is: [subquery1, subquery2, ...][0...n]
          // Each subquery returns an array of docs
          const results = idMatches?.map((match) => {
            const idsInQuery = match
              .replace('_id in [', '')
              .replace(']', '')
              .split(',')
              .map((id) => id.replace(/"/g, '').trim())

            return idsInQuery.map((id) => ({
              _id: id,
              _rev: `rev-${id}`,
              _type: 'testDoc',
              title: `Title for ${id.slice(-6)}`, // Use last 6 chars for readability
            }))
          })

          return of(results || [])
        },
      },
      withConfig: () => client,
    }

    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observeFields = createObserveFields({
      invalidationChannel,
      client: client as unknown as SanityClient,
    })

    // Subscribe to all documents simultaneously so they get batched together
    const results: Record<string, any> = {}
    const subscriptions = documentIds.map((id) =>
      observeFields(id, ['title'])
        .pipe(take(1))
        .subscribe((value) => {
          results[id] = value
        }),
    )

    // Trigger the fetch
    invalidationChannel.next({type: 'connected'})

    // Wait for all subscriptions to complete
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Clean up subscriptions
    subscriptions.forEach((sub) => sub.unsubscribe())

    // Verify that chunking occurred (more than one fetch group)
    expect(fetchedIdGroups.length).toBeGreaterThan(1)

    // Verify all documents got results (merging worked correctly)
    const nonNullResults = Object.values(results).filter(Boolean)
    expect(nonNullResults).toHaveLength(documentIds.length)
  })

  it('should cache the last known value and emit sync', async () => {
    const client: ClientLike = {
      observable: {
        fetch: (query) => {
          expect(query).toEqual('[*[_id in ["foo"]][0...1]{_id,_rev,_type,bar}][0...1]')
          return of([
            [
              // no result
            ],
          ])
        },
      },
      withConfig: () => client,
    }

    const invalidationChannel = new Subject<InvalidationChannelEvent>()
    const observeFields = createObserveFields({
      invalidationChannel,
      client: client as unknown as SanityClient,
    })
    const first = firstValueFrom(observeFields('foo', ['bar']).pipe(take(1)))
    invalidationChannel.next({type: 'connected'})

    expect(await first).toMatchInlineSnapshot(`null`)

    // After we got first value from server and it turned out to be `null`, we should have `null` as the memoized sync value
    let syncValue
    observeFields('foo', ['bar'])
      .pipe(
        tap((value) => {
          syncValue = value
        }),
        take(1),
      )
      .subscribe()
      .unsubscribe()
    expect(syncValue).toBe(null)
  })
})
