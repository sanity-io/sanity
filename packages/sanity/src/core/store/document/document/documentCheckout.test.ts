import {type SanityClient} from '@sanity/client'
import {of, Subject, throwError} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {reportLatency} from '../document-pair/checkoutPair'
import {type PendingMutationsEvent} from '../types'
import {documentCheckout} from './documentCheckout'
import {getDocumentListener} from './getDocumentListener'

vi.mock('../buffered-doc/createBufferedDocument', () => ({createBufferedDocument: vi.fn()}))
vi.mock('./getDocumentListener', () => ({getDocumentListener: vi.fn()}))
vi.mock('../document-pair/checkoutPair', () => ({
  reportLatency: vi.fn(() => of(null)),
  SLOW_COMMIT_TIMEOUT_MS: 1,
}))

const mockCreateBufferedDocument = createBufferedDocument as Mock<typeof createBufferedDocument>
const mockGetDocumentListener = getDocumentListener as Mock<typeof getDocumentListener>
const mockReportLatency = reportLatency as Mock<typeof reportLatency>

function createClient() {
  return {
    dataRequest: vi.fn(() => Promise.resolve({transactionId: 'tx'})),
    observable: {
      action: vi.fn(() => of({transactionId: 'tx'})),
    },
  } as unknown as SanityClient
}

function createBufferedDocumentFixture() {
  return {
    events: new Subject<any>(),
    remoteSnapshot$: new Subject<any>(),
    commitRequest$: new Subject<any>(),
    patch: vi.fn(),
    create: vi.fn(),
    createIfNotExists: vi.fn(),
    createOrReplace: vi.fn(),
    delete: vi.fn(),
    mutate: vi.fn(),
    commit: vi.fn(),
  }
}

function createCommitRequest(mutations: unknown[]) {
  return {
    mutation: {
      params: {
        transactionId: 'tx1',
        resultRev: 'rev',
        mutations,
      },
    },
    firstMutationReceivedAt: 1,
    success: vi.fn(),
    failure: vi.fn(),
    cancel: vi.fn(),
  }
}

describe('documentCheckout', () => {
  beforeEach(() => {
    mockCreateBufferedDocument.mockReset()
    mockGetDocumentListener.mockReset()
    mockReportLatency.mockClear()
  })

  it('tags listener, buffered, and remote snapshot events with the document variant', () => {
    const client = createClient()
    const listenerEvents$ = new Subject<PendingMutationsEvent | {type: 'reconnect'}>()
    const bufferedDocument = createBufferedDocumentFixture()
    const events: unknown[] = []
    const remoteSnapshots: unknown[] = []
    const pending: unknown[] = []

    mockGetDocumentListener.mockReturnValue(listenerEvents$ as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client, {tag: 'test'})

    checkout.document.events.subscribe((event) => events.push(event))
    checkout.document.remoteSnapshot$.subscribe((event) => remoteSnapshots.push(event))
    checkout.transactionsPendingEvents$.subscribe((event) => pending.push(event))

    listenerEvents$.next({type: 'reconnect'})
    listenerEvents$.next({type: 'pending', phase: 'begin'})
    bufferedDocument.events.next({type: 'committed'})
    bufferedDocument.remoteSnapshot$.next({type: 'snapshot', document: {_id: 'drafts.example-id'}})

    expect(events).toMatchObject([
      {type: 'reconnect', version: 'draft'},
      {type: 'committed', version: 'draft'},
    ])
    expect(remoteSnapshots).toMatchObject([{type: 'snapshot', version: 'draft'}])
    expect(pending).toEqual([{type: 'pending', phase: 'begin'}])
    expect(mockGetDocumentListener).toHaveBeenCalledWith(client, 'drafts.example-id', {
      tag: 'test',
      onSyncErrorRecovery: undefined,
    })
  })

  it('commits non-live-edit writes through document actions', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([
      {create: {_id: 'drafts.example-id', _type: 'movie', title: 'Alien'}},
      {patch: {id: 'drafts.example-id', set: {title: 'Aliens'}}},
    ])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const subscription = checkout.document.events.subscribe()

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(client.observable.action).toHaveBeenCalledWith(
      [
        expect.objectContaining({actionType: 'sanity.action.document.create'}),
        expect.objectContaining({actionType: 'sanity.action.document.edit'}),
      ],
      expect.objectContaining({tag: 'document.commit', transactionId: 'tx1'}),
    )
    expect(request.success).toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('uses a noop edit action when local-only mutations leave no server actions', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([
      {createIfNotExists: {_id: 'drafts.example-id', _type: 'movie'}},
    ])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const subscription = checkout.document.events.subscribe()

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(client.observable.action).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          actionType: 'sanity.action.document.edit',
          patch: {unset: ['_empty_action_guard_pseudo_field_']},
        }),
      ],
      expect.any(Object),
    )
    subscription.unsubscribe()
  })

  it('fails action commits that cannot be mapped to document actions', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{unknown: {id: 'drafts.example-id'}}])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const errors: unknown[] = []
    const subscription = checkout.document.events.subscribe({error: (error) => errors.push(error)})

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(errors).toEqual([new Error('Cannot map mutation to action')])
    subscription.unsubscribe()
  })

  it('fails action commits with create mutations missing ids', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{create: {_type: 'movie'}}])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const errors: unknown[] = []
    const subscription = checkout.document.events.subscribe({error: (error) => errors.push(error)})

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(errors).toEqual([new Error('Expected document to have an _id')])
    subscription.unsubscribe()
  })

  it('fails action commits with ambiguous mutation payloads', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([
      {create: {_id: 'drafts.example-id', _type: 'movie'}, patch: {id: 'drafts.example-id'}},
    ])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const errors: unknown[] = []
    const subscription = checkout.document.events.subscribe({error: (error) => errors.push(error)})

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(errors).toEqual([new Error('Did not expect multiple mutations in the same payload')])
    subscription.unsubscribe()
  })

  it('keeps published live-edit writes on the raw mutation path', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{patch: {id: 'example-id', set: {title: 'Alien'}}}])

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('example-id', client)
    const subscription = checkout.document.events.subscribe()

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(client.dataRequest).toHaveBeenCalled()
    expect(client.observable.action).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('cancels bad request commit failures', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{patch: {id: 'drafts.example-id', set: {title: 'Alien'}}}])

    vi.mocked(client.observable.action).mockReturnValue(throwError(() => ({statusCode: 400})))
    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const subscription = checkout.document.events.subscribe({error: () => undefined})

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(request.cancel).toHaveBeenCalledWith({statusCode: 400})
    subscription.unsubscribe()
  })

  it('marks non-bad-request commit failures as failures', async () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{patch: {id: 'drafts.example-id', set: {title: 'Alien'}}}])
    const error = {statusCode: 503}

    vi.mocked(client.observable.action).mockReturnValue(throwError(() => error))
    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client)
    const subscription = checkout.document.events.subscribe({error: () => undefined})

    bufferedDocument.commitRequest$.next(request)
    await Promise.resolve()

    expect(request.failure).toHaveBeenCalledWith(error)
    subscription.unsubscribe()
  })

  it('reports slow commits and document rebases as side effects', async () => {
    vi.useFakeTimers()
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const request = createCommitRequest([{patch: {id: 'drafts.example-id', set: {title: 'Alien'}}}])
    const onSlowCommit = vi.fn()
    const onDocumentRebase = vi.fn()

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client, {
      onSlowCommit,
      onDocumentRebase,
    })
    const subscription = checkout.document.events.subscribe()

    bufferedDocument.commitRequest$.next(request)
    vi.advanceTimersByTime(1)
    bufferedDocument.events.next({
      type: 'rebase',
      remoteMutations: [{patch: {id: 'drafts.example-id'}}],
      localMutations: [{patch: {id: 'drafts.example-id'}}],
    })

    expect(onSlowCommit).toHaveBeenCalled()
    expect(onDocumentRebase).toHaveBeenCalledWith({
      remoteMutationCount: 1,
      localMutationCount: 1,
    })

    subscription.unsubscribe()
    vi.useRealTimers()
  })

  it('keeps telemetry callback failures from killing the event stream', () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const onDocumentRebase = vi.fn(() => {
      throw new Error('telemetry failed')
    })

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client, {onDocumentRebase})
    const events: unknown[] = []
    const subscription = checkout.document.events.subscribe((event) => events.push(event))

    bufferedDocument.events.next({
      type: 'rebase',
      remoteMutations: [],
      localMutations: [],
    })
    bufferedDocument.events.next({type: 'committed'})

    expect(events).toMatchObject([
      {type: 'rebase', version: 'draft'},
      {type: 'committed', version: 'draft'},
    ])
    expect(onDocumentRebase).toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('reports latency when latency callbacks are configured', () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client, {
      onReportLatency: vi.fn(),
    })
    const subscription = checkout.document.events.subscribe()

    expect(mockReportLatency).toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('reports mutation performance when only mutation performance callback is configured', () => {
    const client = createClient()
    const bufferedDocument = createBufferedDocumentFixture()
    const onReportMutationPerformance = vi.fn()

    mockGetDocumentListener.mockReturnValue(new Subject() as any)
    mockCreateBufferedDocument.mockReturnValue(bufferedDocument as any)

    const checkout = documentCheckout('drafts.example-id', client, {
      onReportMutationPerformance,
    })
    const subscription = checkout.document.events.subscribe()

    expect(mockReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({onReportMutationPerformance}),
    )
    subscription.unsubscribe()
  })
})
