import {BehaviorSubject, type Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should not amplify fetches through subscription tree rebuilds when document has not changed', async () => {
      let fetchCallCount = 0

      const client: ClientLike = {
        observable: {
          fetch: () => {
            fetchCallCount++
            return of([
              [
                {
                  _id: 'mainContentList',
                  _rev: 'rev1',
                  _type: 'contentList',
                  name: 'Main Content',
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

      invalidationChannel.next({type: 'connected'})
      await vi.advanceTimersByTimeAsync(200)

      const fetchCountAfterConnect = fetchCallCount
      expect(fetchCountAfterConnect).toBeGreaterThanOrEqual(1)
      expect(values.length).toBeGreaterThanOrEqual(1)

      for (let i = 0; i < 10; i++) {
        invalidationChannel.next({
          type: 'mutation',
          documentId: 'mainContentList',
          visibility: 'query',
        })
        await vi.advanceTimersByTimeAsync(200)
      }

      // Each mutation triggers at most one fetch via observeFields (no amplification
      // from the recursive subscription tree thanks to distinctUntilChanged on _rev).
      expect(fetchCallCount).toBeLessThanOrEqual(fetchCountAfterConnect + 10)

      unsubscribe()
    })

    it('should propagate new emissions downstream when _rev changes between fetches', async () => {
      let fetchCallCount = 0

      const client: ClientLike = {
        observable: {
          fetch: () => {
            fetchCallCount++
            return of([
              [
                {
                  _id: 'mainContentList',
                  _rev: `rev${fetchCallCount}`,
                  _type: 'contentList',
                  name: `Content v${fetchCallCount}`,
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

      invalidationChannel.next({type: 'connected'})
      await vi.advanceTimersByTimeAsync(200)

      expect(values.length).toBeGreaterThanOrEqual(1)
      const valuesAfterConnect = values.length

      invalidationChannel.next({
        type: 'mutation',
        documentId: 'mainContentList',
        visibility: 'query',
      })
      await vi.advanceTimersByTimeAsync(200)

      expect(values.length).toBeGreaterThan(valuesAfterConnect)

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

    it('should resolve nested paths through references', () => {
      const observeFields = vi.fn(
        (id: string, fields: string[]): Observable<Record<string, unknown> | null> => {
          if (id === 'book1') {
            return of({
              _id: 'book1',
              _rev: 'rev1',
              _type: 'book',
              author: {_ref: 'author1', _type: 'reference'},
            })
          }
          if (id === 'author1') {
            return of({
              _id: 'author1',
              _rev: 'rev1',
              _type: 'author',
              name: 'Alice',
            })
          }
          return of(null)
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_type: 'reference', _ref: 'book1'}, [['author', 'name']]),
      )

      expect(values.length).toBeGreaterThanOrEqual(1)
      const last = values[values.length - 1]
      expect(last).toMatchObject({author: {name: 'Alice'}})
      expect(observeFields).toHaveBeenCalledWith('author1', ['name'], undefined, undefined)

      unsubscribe()
    })

    it('should resolve paths on documents passed by _id (not _ref)', () => {
      const observeFields = vi.fn(
        (_id: string, _fields: string[]): Observable<Record<string, unknown> | null> => {
          return of({
            _id: 'doc1',
            _rev: 'rev1',
            _type: 'test',
            title: 'Direct',
          })
        },
      )

      const observePaths = createPathObserver({observeFields})
      const {values, unsubscribe} = collectEmissions(
        observePaths({_id: 'doc1', _type: 'test'}, ['title']),
      )

      expect(values).toHaveLength(1)
      expect(values[0]).toMatchObject({title: 'Direct'})

      unsubscribe()
    })
  })
})
