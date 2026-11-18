import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {defer, firstValueFrom, of, Subject, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createMockSanityClient,
  createMockSanityClientAsClient,
} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {createDocumentPreviewStore} from '../../../preview/documentPreviewStore'
import {createSchema} from '../../../schema/createSchema'
import {useDocumentPreviewStore} from '../../datastores'
import {snapshotPair} from '../../document/document-pair/snapshotPair'
import {getDocumentPairPermissions, useDocumentPairPermissions} from '../documentPairPermissions'
import {type GrantsStore, type PermissionCheckResult} from '../types'

vi.mock('../../document/document-pair/snapshotPair', () => ({snapshotPair: vi.fn()}))
vi.mock('../../datastores', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentPreviewStore: vi.fn(),
}))

const mockedSnapshotPair = vi.mocked(snapshotPair)
const mockedUseDocumentPreviewStore = vi.mocked(useDocumentPreviewStore)

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

  it('returns the SAME observable for ids that normalize to the same published id', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const publishedId = `book-${Math.random().toString(36).slice(2)}`

    const shared = {client, schema, grantsStore, type: 'book', permission: 'publish'} as const

    const fromPublishedId = getDocumentPairPermissions({...shared, id: publishedId})
    const fromDraftId = getDocumentPairPermissions({...shared, id: `drafts.${publishedId}`})

    expect(fromPublishedId).toBe(fromDraftId)
  })

  it('returns DISTINCT observables for different version', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const shared = {client, schema, grantsStore, id, type: 'book', permission: 'publish'} as const

    const versionA = getDocumentPairPermissions({...shared, version: 'rABC'})
    const versionB = getDocumentPairPermissions({...shared, version: 'rXYZ'})

    expect(versionA).not.toBe(versionB)
  })

  it('returns DISTINCT observables for different userId', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const shared = {client, schema, grantsStore, id, type: 'book', permission: 'publish'} as const

    const userA = getDocumentPairPermissions({...shared, userId: 'user-a'})
    const userB = getDocumentPairPermissions({...shared, userId: 'user-b'})

    // Distinct memo entries per user stop an in-place user switch from replaying
    // the previous user's grants out of the never-cleared module-level cache.
    expect(userA).not.toBe(userB)
  })

  it('returns DISTINCT observables for undefined vs defined userId', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const shared = {client, schema, grantsStore, id, type: 'book', permission: 'publish'} as const

    const anonymous = getDocumentPairPermissions(shared)
    const identified = getDocumentPairPermissions({...shared, userId: 'user-a'})

    expect(anonymous).not.toBe(identified)
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
      listener: 'document',
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

  it('emits only when the granted flag or the reason changes', () => {
    const {draft$, published$, version$} = createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const results: PermissionCheckResult[] = []
    const subscription = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      type: 'book',
      permission: 'publish',
      listener: 'document',
    }).subscribe((result) => results.push(result))

    const draftDoc: SanityDocument = {
      _id: `drafts.${id}`,
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
    }
    published$.next(null)
    version$.next(null)
    draft$.next(draftDoc)
    draft$.next({...draftDoc, _rev: 'r2'})
    draft$.next({...draftDoc, _rev: 'r3'})

    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledTimes(9)
    expect(results).toEqual([{granted: true, reason: ''}])

    vi.mocked(grantsStore.checkDocumentPermission).mockReturnValue(
      of({granted: false, reason: 'no matching grants'}),
    )
    draft$.next({...draftDoc, _rev: 'r4'})

    expect(results).toHaveLength(2)
    expect(results[1].granted).toBe(false)

    subscription.unsubscribe()
  })
})

describe('getDocumentPairPermissions global listener', () => {
  beforeEach(() => {
    mockedSnapshotPair.mockReset()
  })

  const book = (_id: string): SanityDocument => ({
    _id,
    _type: 'book',
    _rev: 'r1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  })

  it('checks the documents `observeDocument` reports, without checking out the document pair', () => {
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`
    const documents = new Map<string, Subject<SanityDocument | undefined>>()
    const observeDocument = vi.fn((documentId: string) => {
      const document$ = new Subject<SanityDocument | undefined>()
      documents.set(documentId, document$)
      return document$.asObservable()
    })

    const results: PermissionCheckResult[] = []
    const subscription = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      version: 'rABC',
      type: 'book',
      permission: 'discardVersion',
      listener: 'global',
      observeDocument,
    }).subscribe((result) => results.push(result))

    expect(observeDocument.mock.calls.map(([documentId]) => documentId)).toEqual([
      `drafts.${id}`,
      id,
      `versions.rABC.${id}`,
    ])
    const version = book(`versions.rABC.${id}`)
    documents.get(`drafts.${id}`)?.next(undefined)
    documents.get(id)?.next(book(id))
    documents.get(`versions.rABC.${id}`)?.next(version)

    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledExactlyOnceWith('update', version)
    expect(results).toEqual([{granted: true, reason: ''}])
    expect(mockedSnapshotPair).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('checks a document `observeDocument` reports as missing as `null`', () => {
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`

    const subscription = getDocumentPairPermissions({
      client,
      schema,
      grantsStore,
      id,
      type: 'book',
      permission: 'publish',
      listener: 'global',
      observeDocument: (documentId) => of(documentId === id ? book(id) : undefined),
    }).subscribe()

    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledWith('update', book(id))
    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledWith('update', null)
    expect(grantsStore.checkDocumentPermission).toHaveBeenCalledWith('create', null)
    subscription.unsubscribe()
  })

  it('retries a failed `observeDocument` instead of erroring the permission check', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true})
    try {
      const grantsStore = createGrantsStore()
      const id = `book-${Math.random().toString(36).slice(2)}`
      let attempts = 0
      const observeDocument = (documentId: string) =>
        documentId === id
          ? defer(() => {
              attempts += 1
              return attempts === 1
                ? throwError(() => new Error('503 Service Unavailable'))
                : of(book(id))
            })
          : of(undefined)

      const result = firstValueFrom(
        getDocumentPairPermissions({
          client,
          schema,
          grantsStore,
          id,
          type: 'book',
          permission: 'publish',
          listener: 'global',
          observeDocument,
        }),
      )
      await vi.advanceTimersByTimeAsync(1000)

      await expect(result).resolves.toEqual({granted: true, reason: ''})
      expect(attempts).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops retrying a global document load after three failures and errors the permission check', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true})
    try {
      const id = `book-${Math.random().toString(36).slice(2)}`
      let attempts = 0
      const observeDocument = (documentId: string) =>
        documentId === id
          ? defer(() => {
              attempts += 1
              return throwError(() => new Error('503 Service Unavailable'))
            })
          : of(undefined)

      const result = firstValueFrom(
        getDocumentPairPermissions({
          client,
          schema,
          grantsStore: createGrantsStore(),
          id,
          type: 'book',
          permission: 'publish',
          listener: 'global',
          observeDocument,
        }),
      )
      // Attach before the retries elapse. The stream rejects during the timer
      // flush, and a handler attached afterwards is already too late.
      const rejected = expect(result).rejects.toThrow('503 Service Unavailable')
      // one attempt plus three retries, delayed 1s + 2s + 3s
      await vi.advanceTimersByTimeAsync(6_000)

      await rejected
      expect(attempts).toBe(4)
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    {name: 'no listener', listener: undefined},
    {name: 'the global listener', listener: 'global'},
  ] as const)(
    'errors without an `observeDocument` to follow the documents through, given $name',
    async ({listener}) => {
      const id = `book-${Math.random().toString(36).slice(2)}`

      await expect(
        firstValueFrom(
          getDocumentPairPermissions({
            client,
            schema,
            grantsStore: createGrantsStore(),
            id,
            type: 'book',
            permission: 'publish',
            listener,
          }),
        ),
      ).rejects.toThrow('needs `observeDocument`')
      expect(mockedSnapshotPair).not.toHaveBeenCalled()
    },
  )

  it('keeps the document pair and the global listener in separate cache entries', () => {
    createSnapshotPairMock()
    const grantsStore = createGrantsStore()
    const id = `book-${Math.random().toString(36).slice(2)}`
    const shared = {client, schema, grantsStore, id, type: 'book', permission: 'publish'} as const

    const observeDocument = () => of(undefined)
    const withoutListener = getDocumentPairPermissions({...shared, observeDocument})
    const documentListener = getDocumentPairPermissions({...shared, listener: 'document'})
    const globalListener = getDocumentPairPermissions({
      ...shared,
      listener: 'global',
      observeDocument,
    })

    expect(globalListener).toBe(withoutListener)
    expect(globalListener).not.toBe(documentListener)
  })
})

describe('useDocumentPairPermissions', () => {
  beforeEach(() => {
    mockedSnapshotPair.mockReset()
  })

  it.each([
    {name: 'no listener', listener: undefined, global: true},
    {name: 'the document listener', listener: 'document', global: false},
    {name: 'the global listener', listener: 'global', global: true},
  ] as const)(
    'checks out the document pair only off the global listener, given $name',
    async ({listener, global}) => {
      createSnapshotPairMock()
      const documentPreviewStore = createDocumentPreviewStore({
        client: createMockSanityClientAsClient(),
      })
      const observeDocument = vi
        .spyOn(documentPreviewStore, 'unstable_observeDocument')
        .mockImplementation(() => of(undefined))
      mockedUseDocumentPreviewStore.mockReturnValue(documentPreviewStore)
      const grantsStore = createGrantsStore()
      const id = `book-${Math.random().toString(36).slice(2)}`
      const wrapper = await createTestProvider({
        client,
        config: {
          schema: {
            types: [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}],
          },
        },
      })

      renderHook(
        () =>
          useDocumentPairPermissions({
            id,
            type: 'book',
            permission: 'publish',
            grantsStore,
            listener,
          }),
        {wrapper},
      )

      await waitFor(() => {
        expect(mockedSnapshotPair).toHaveBeenCalledTimes(global ? 0 : 1)
        expect(observeDocument).toHaveBeenCalledTimes(global ? 2 : 0)
      })
    },
  )
})
