import {BehaviorSubject, type Observable, of, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SanityClient} from '../../form/studio/assetSourceDataset/uploader'
import {createPathObserver} from '../createPathObserver'
import {type ClientLike, createObserveFields} from '../observeFields'
import {type InvalidationChannelEvent} from '../types'

function collectEmissions<T>(observable: Observable<T>): {
  values: T[]
  unsubscribe: () => void
} {
  const values: T[] = []
  const subscription = observable.subscribe((value) => values.push(value))
  return {values, unsubscribe: () => subscription.unsubscribe()}
}

describe('createPathObserver', () => {
  describe('_rev-based deduplication', () => {
    it('should not rebuild subscription tree when _rev has not changed', () => {
      let observeFieldsCalls = 0
      const subject = new BehaviorSubject<Record<string, unknown> | null>({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        title: 'Hello',
      })

      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          observeFieldsCalls++
          return subject
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title']),
      )

      expect(observeFieldsCalls).toBe(1)
      expect(values).toHaveLength(1)

      // Re-emit the same _rev with a fresh object (simulates JSON parse from refetch)
      subject.next({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        title: 'Hello',
      })

      // switchMap should NOT have fired again since _rev is the same
      expect(values).toHaveLength(1)

      unsubscribe()
    })

    it('should rebuild subscription tree when _rev changes', () => {
      const subject = new BehaviorSubject<Record<string, unknown> | null>({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        title: 'Hello',
      })

      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return subject
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title']),
      )

      expect(values).toHaveLength(1)

      subject.next({
        _id: 'doc1',
        _rev: 'rev2',
        _type: 'test',
        title: 'Updated',
      })

      expect(values).toHaveLength(2)
      expect(values[1]).toMatchObject({title: 'Updated'})

      unsubscribe()
    })

    it('should pass through null snapshots (deleted documents) regardless of _rev', () => {
      const subject = new BehaviorSubject<Record<string, unknown> | null>({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        title: 'Hello',
      })

      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return subject
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title']),
      )

      expect(values).toHaveLength(1)

      // Document deleted: null has no _rev, which differs from 'rev1'
      subject.next(null)

      expect(values).toHaveLength(2)
      expect(values[1]).toBeNull()

      unsubscribe()
    })

    it('should not re-emit when object fields are identical but references are fresh objects', () => {
      const subject = new BehaviorSubject<Record<string, unknown> | null>({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        image: {_ref: 'image-abc', _type: 'reference'},
      })

      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return subject
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['image']),
      )

      expect(values).toHaveLength(1)

      // Fresh object, same _rev: simulates what happens on every refetch from JSON parse
      subject.next({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        image: {_ref: 'image-abc', _type: 'reference'},
      })

      expect(values).toHaveLength(1)

      unsubscribe()
    })

    it('should handle multiple rapid emissions with same _rev', () => {
      const subject = new BehaviorSubject<Record<string, unknown> | null>({
        _id: 'doc1',
        _rev: 'rev1',
        _type: 'test',
        title: 'Hello',
      })

      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return subject
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title']),
      )

      // Simulate the polling storm: 10 rapid re-emissions with same _rev
      for (let i = 0; i < 10; i++) {
        subject.next({
          _id: 'doc1',
          _rev: 'rev1',
          _type: 'test',
          title: 'Hello',
        })
      }

      // Only the initial emission should have passed through
      expect(values).toHaveLength(1)

      unsubscribe()
    })
  })

  describe('integration: query count with real observeFields pipeline', () => {
    it('should not amplify fetches through subscription tree rebuilds when document has not changed', async () => {
      let fetchCallCount = 0

      const client: ClientLike = {
        observable: {
          fetch: (_query: string) => {
            fetchCallCount++
            return of([
              [
                {
                  _id: 'mainContentList',
                  _rev: 'rev1',
                  _type: 'contentList',
                  name: 'Main Content',
                  _createdAt: '2025-01-01T00:00:00Z',
                  _updatedAt: '2025-01-01T00:00:00Z',
                },
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
      const observePaths = createPathObserver({observeFields})

      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'mainContentList'}, ['name']),
      )

      // Initial connect triggers the first fetch
      invalidationChannel.next({type: 'connected'})
      await new Promise((resolve) => setTimeout(resolve, 200))

      const fetchCountAfterConnect = fetchCallCount
      expect(fetchCountAfterConnect).toBeGreaterThanOrEqual(1)
      expect(values.length).toBeGreaterThanOrEqual(1)

      // Simulate 10 mutation events for the same document (same _rev comes back each time).
      // This reproduces the HAR scenario: global listener fires repeatedly,
      // observeFields re-fetches, but the document hasn't actually changed.
      for (let i = 0; i < 10; i++) {
        invalidationChannel.next({
          type: 'mutation',
          documentId: 'mainContentList',
          visibility: 'query',
        })
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      // Without the fix: switchMap would rebuild the subscription tree on each
      // re-emission, causing recursive observePaths calls and additional fetches.
      // With the fix: distinctUntilChanged(_rev) suppresses identical emissions,
      // so no subscription tree rebuild occurs.
      //
      // We allow some fetches from the invalidation channel (observeFields still
      // re-fetches on mutation events), but the key assertion is that the total
      // number of fetches is bounded, not proportional to mutation count * tree depth.
      const totalFetches = fetchCallCount
      // In a HAR where we have identified the issue, the unfixed version produced too many unneded fetches for the same document.
      // With the fix, observeFields may still refetch per invalidation, but
      // the recursive observePaths won't amplify each refetch into additional queries.
      expect(totalFetches).toBeLessThan(20)

      unsubscribe()
    })
  })

  describe('basic path resolution', () => {
    it('should resolve simple paths from a document', () => {
      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return of({
            _id: 'doc1',
            _rev: 'rev1',
            _type: 'test',
            title: 'Hello',
            subtitle: 'World',
          })
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title', 'subtitle']),
      )

      expect(values).toHaveLength(1)
      expect(values[0]).toMatchObject({title: 'Hello', subtitle: 'World'})

      unsubscribe()
    })

    it('should return null for deleted documents', () => {
      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return of(null)
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'doc1'}, ['title']),
      )

      expect(values).toHaveLength(1)
      expect(values[0]).toBeNull()

      unsubscribe()
    })

    it('should return leaf values as-is', () => {
      const observeFields = vi.fn()
      const observePaths = createPathObserver({observeFields})

      const {values, unsubscribe} = collectEmissions(observePaths(null as any, ['title']))

      expect(values).toHaveLength(1)
      expect(values[0]).toBeNull()
      expect(observeFields).not.toHaveBeenCalled()

      unsubscribe()
    })
  })
})
