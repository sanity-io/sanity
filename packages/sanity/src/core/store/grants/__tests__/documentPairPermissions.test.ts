import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {of, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema'
import {snapshotPair} from '../../document'
import {getDocumentPairPermissions} from '../documentPairPermissions'
import {type GrantsStore} from '../types'

vi.mock('../../document', () => ({snapshotPair: vi.fn()}))

const mockedSnapshotPair = vi.mocked(snapshotPair)

const schema = createSchema({
  name: 'default',
  types: [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

const client = createMockSanityClient() as unknown as SanityClient

/**
 * A `snapshotPair` mock whose draft/published/version snapshots are driven by
 * `Subject`s, plus a spy that counts how many times the mock factory itself is
 * invoked (i.e. how many times the underlying chain is built).
 */
function createSnapshotPairMock() {
  const draft$ = new Subject<SanityDocument | null>()
  const published$ = new Subject<SanityDocument | null>()
  const version$ = new Subject<SanityDocument | null>()

  mockedSnapshotPair.mockImplementation(
    () =>
      of({
        draft: {snapshots$: draft$.asObservable()},
        published: {snapshots$: published$.asObservable()},
        version: {snapshots$: version$.asObservable()},
      }) as unknown as ReturnType<typeof snapshotPair>,
  )

  return {draft$, published$, version$}
}

/**
 * A minimal `grantsStore` whose `checkDocumentPermission` always grants and
 * carries a spy so tests can count how many grant-check passes occur.
 */
function createGrantsStore(): GrantsStore {
  return {
    checkDocumentPermission: vi.fn().mockReturnValue(of({granted: true, reason: ''})),
  }
}

describe('getDocumentPairPermissions (Pattern-B memoization)', () => {
  beforeEach(() => {
    mockedSnapshotPair.mockReset()
  })

  it('returns the SAME observable instance for repeated calls with identical options', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    // Unique id per run dodges the module-level memoize cache from other tests.
    const id = `book-${Math.random().toString(36).slice(2)}`

    const options = {client, schema, grantsStore, id, type: 'book', permission: 'publish'} as const

    const firstObservable = getDocumentPairPermissions(options)
    const secondObservable = getDocumentPairPermissions(options)

    expect(firstObservable).toBe(secondObservable)
  })

  it('returns DISTINCT observables for different permission', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const publishObservable = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      type: 'book',
      permission: 'publish',
    })
    const deleteObservable = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      type: 'book',
      permission: 'delete',
    })

    expect(publishObservable).not.toBe(deleteObservable)
  })

  it('builds the underlying chain only once for N subscribers', () => {
    const {draft$, published$, version$} = createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const observable = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      type: 'book',
      permission: 'publish',
    })

    const subscriberCount = 5
    const subscriptions = Array.from({length: subscriberCount}, () => observable.subscribe())

    // Drive one emission through so the chain evaluates the grant checks.
    const draftDoc: SanityDocument = {
      _id: `drafts.${id}`,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    draft$.next(draftDoc)
    published$.next(null)
    version$.next(null)

    // shareReplay means the source chain (snapshotPair + grant matching) is
    // built exactly once regardless of subscriber count.
    expect(mockedSnapshotPair).toHaveBeenCalledTimes(1)

    // The `publish` permission runs three grant checks per emission; with a
    // single shared chain that is 3 total, not 3 * subscriberCount.
    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledTimes(3)

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })
})
