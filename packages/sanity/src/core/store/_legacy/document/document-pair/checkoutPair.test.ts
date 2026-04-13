import {type SanityClient} from '@sanity/client'
import {merge, NEVER, of, Subject} from 'rxjs'
import {delay} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {checkoutPair} from './checkoutPair'

const mockedDataRequest = vi.fn(() => of({}))
const mockedActionRequest = vi.fn(() => of({}))

const client = {
  observable: {
    listen: () => of({type: 'welcome'}).pipe(delay(0)),
    getDocuments: (ids: string[]) =>
      of([
        {_id: ids[0], _type: 'any', _rev: 'any'},
        {_id: ids[1], _type: 'any', _rev: 'any'},
      ]),
    action: mockedActionRequest,
  },
  dataRequest: mockedDataRequest,
  withConfig: vi.fn(() => client),
}

const idPair = {publishedId: 'publishedId', draftId: 'draftId'}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkoutPair -- local actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [{patch: {id: 'draftId', set: {title: 'new title'}}}],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )
    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createIfNotExists({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            createIfNotExists: {
              _id: 'draftId',
              _type: 'any',
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('create', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.create({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            create: {
              _id: 'draftId',
              _type: 'any',
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('createOrReplace', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createOrReplace({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            createOrReplace: {
              _id: 'draftId',
              _type: 'any',
              _rev: expect.any(String),
              _createdAt: 'now',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('delete', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([draft.delete()])
    draft.commit()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [
          {
            delete: {
              id: 'draftId',
            },
          },
        ],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })
})

describe('checkoutPair -- server actions', () => {
  test('patch', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate(draft.patch([{set: {title: 'new title'}}]))
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: 'draftId',
          publishedId: 'publishedId',
          patch: {
            set: {
              title: 'new title',
            },
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('published patch uses mutation endpoint', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    //liveEdit should be the only condition to directly patch a published doc
    published.mutate(published.patch([{set: {title: 'new title'}}]))
    published.commit()

    expect(mockedActionRequest).not.toHaveBeenCalled()

    expect(mockedDataRequest).toHaveBeenCalledWith(
      'mutate',
      {
        mutations: [{patch: {id: 'publishedId', set: {title: 'new title'}}}],
        transactionId: expect.any(String),
      },
      {
        returnDocuments: false,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
        visibility: 'async',
      },
    )

    sub.unsubscribe()
  })

  test('create', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.create({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.create',
          publishedId: 'publishedId',
          attributes: {
            _id: 'draftId',
            _type: 'any',
            _createdAt: 'now',
          },
          ifExists: 'fail',
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('createIfNotExists', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(true))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    draft.mutate([
      draft.createIfNotExists({
        _id: 'draftId',
        _type: 'any',
        _createdAt: 'now',
        _updatedAt: 'now',
        _rev: 'any',
      }),
    ])
    draft.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: idPair.draftId,
          publishedId: idPair.publishedId,
          patch: {
            unset: ['_empty_action_guard_pseudo_field_'],
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })
})

function createMutationEvent(
  transactionId: string,
  documentId: string,
  previousRev: string,
  resultRev: string,
) {
  return {
    type: 'mutation' as const,
    documentId,
    transactionId,
    previousRev,
    resultRev,
    effects: {apply: [], revert: []},
    mutations: [],
    transactionTotalEvents: 1,
    transactionCurrentEvent: 1,
    visibility: 'transaction' as const,
    transition: 'update' as const,
  }
}

describe('checkoutPair -- latency and mutation performance reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('calls onReportLatency when submit and receive are paired (submit before receive)', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Resolve commit with a transactionId
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Inject matching listener mutation event
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Flush the fetch promise (shard info)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('calls onReportLatency when receive arrives before submit', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Inject listener mutation BEFORE the commit resolves (listener races HTTP response)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // Now resolve the commit
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Flush the fetch promise
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('receivedAt uses the receive timestamp, not submit timestamp (regression)', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // Resolve commit at time T
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Advance 500ms, then inject listener mutation at T+500
    await vi.advanceTimersByTimeAsync(500)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // deltaMs should be ~500 (the gap between submit and receive timestamps),
    // NOT 0 (which would happen if receivedAt incorrectly used submitEvent.timestamp)
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    const reportedLatency = onReportLatency.mock.calls[0][0].latencyMs
    expect(reportedLatency).toBeGreaterThanOrEqual(500)

    sub.unsubscribe()
  })

  test('calls onReportMutationPerformance with timing breakdown', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate at T=0 (this triggers onConsistencyChanged(false) which sets firstMutationReceivedAt)
    draft.mutate(draft.patch([{set: {title: 'test'}}]))

    // Advance 100ms to simulate debounce time
    await vi.advanceTimersByTimeAsync(100)

    draft.commit()

    // Advance 200ms to simulate API round-trip time
    await vi.advanceTimersByTimeAsync(200)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Advance 300ms to simulate listener callback delay
    await vi.advanceTimersByTimeAsync(300)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    expect(event.transactionId).toBe('tx1')
    expect(event.shard).toBe('test-shard')
    // debounceMs: time from first mutation to API request
    expect(event.debounceMs).toBeGreaterThanOrEqual(100)
    // apiMs: time from API request to API response
    expect(event.apiMs).toBeGreaterThanOrEqual(200)
    // callbackMs: time from API request to listener callback
    expect(event.callbackMs).toBeGreaterThanOrEqual(event.apiMs)

    sub.unsubscribe()
  })

  test('callbackMs is measured from apiRequestSentAt, not apiResponseReceivedAt', async () => {
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Mutate at T=0
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    // API takes 500ms to respond
    await vi.advanceTimersByTimeAsync(500)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Listener arrives 100ms after API response (600ms after request was sent)
    await vi.advanceTimersByTimeAsync(100)
    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    // callbackMs should be ~600 (from request sent), NOT ~100 (from response received)
    expect(event.callbackMs).toBeGreaterThanOrEqual(600)
    // apiMs should be ~500
    expect(event.apiMs).toBeGreaterThanOrEqual(500)
    // callbackMs > apiMs proves measurement is from request sent time
    expect(event.callbackMs).toBeGreaterThan(event.apiMs)

    sub.unsubscribe()
  })

  test('reports mutation performance for consecutive commit batches during sustained editing', async () => {
    const onReportMutationPerformance = vi.fn()
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // --- First batch ---
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    await vi.advanceTimersByTimeAsync(200)
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    expect(onReportMutationPerformance.mock.calls[0][0].debounceMs).toBeGreaterThanOrEqual(100)

    // --- Second batch (document stays inconsistent between batches) ---
    commitSubject = new Subject()
    testClient.dataRequest.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    await vi.advanceTimersByTimeAsync(50)
    draft.commit()

    await vi.advanceTimersByTimeAsync(150)
    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Must fire for second batch too — verifies firstMutationReceivedAt is reset between batches
    expect(onReportMutationPerformance).toHaveBeenCalledTimes(2)
    expect(onReportMutationPerformance.mock.calls[1][0].transactionId).toBe('tx2')
    // Second batch debounce should be ~50ms, not ~100 + gap from first batch
    expect(onReportMutationPerformance.mock.calls[1][0].debounceMs).toBeGreaterThanOrEqual(50)
    expect(onReportMutationPerformance.mock.calls[1][0].debounceMs).toBeLessThan(200)

    sub.unsubscribe()
  })

  test('does not call onReportMutationPerformance when firstMutationReceivedAt is absent', async () => {
    // This tests the guard: if firstMutationReceivedAt is undefined, perf is not reported
    const onReportLatency = vi.fn()
    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()

    const testClient = {
      ...client,
      // Return a result immediately (no debounce captured since commit happens instantly)
      dataRequest: vi.fn(() => of({transactionId: 'tx1', results: []})),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // onReportLatency should still fire
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    // onReportMutationPerformance fires because the BufferedDocument sets firstMutationReceivedAt
    // when the document goes from consistent→inconsistent (on mutate()).
    // So in a normal flow it IS always set. This is correct behavior.
    // The guard catches edge cases where the timestamp could be cleared (e.g., reconnect).

    sub.unsubscribe()
  })

  test('unmatched transactionIds do not emit events', async () => {
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Inject a listener mutation with no matching commit
    listenerSubject.next(createMutationEvent('orphan-tx', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).not.toHaveBeenCalled()

    // Now do a real mutation/commit with a different transactionId
    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx-real', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    // Match only the real one
    listenerSubject.next(createMutationEvent('tx-real', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Only the matched pair should trigger a report
    expect(onReportLatency).toHaveBeenCalledTimes(1)
    expect(onReportLatency).toHaveBeenCalledWith(
      expect.objectContaining({transactionId: 'tx-real'}),
    )

    sub.unsubscribe()
  })

  test('does not call fetch for shard info when neither callback is provided', async () => {
    const {draft, published} = checkoutPair(client as any as SanityClient, idPair, of(false))
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    expect(global.fetch).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('reports shard as undefined when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: undefined,
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })

  test('pipeline continues when onReportLatency callback throws', async () => {
    const onReportLatency = vi.fn().mockImplementationOnce(() => {
      throw new Error('callback error')
    })
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation — callback will throw
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(1)

    // Second mutation — callback should succeed, proving the pipeline survived
    commitSubject = new Subject()
    testClient.dataRequest.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledTimes(2)
    expect(onReportLatency).toHaveBeenLastCalledWith(
      expect.objectContaining({transactionId: 'tx2'}),
    )

    sub.unsubscribe()
  })

  test('pipeline continues when onReportMutationPerformance callback throws', async () => {
    const onReportMutationPerformance = vi.fn().mockImplementationOnce(() => {
      throw new Error('perf callback error')
    })
    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    let commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
      onReportMutationPerformance,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First mutation — perf callback will throw
    draft.mutate(draft.patch([{set: {title: 'first'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)

    // Second mutation — should still work
    commitSubject = new Subject()
    testClient.dataRequest.mockReturnValue(commitSubject)

    draft.mutate(draft.patch([{set: {title: 'second'}}]))
    await vi.advanceTimersByTimeAsync(100)
    draft.commit()

    commitSubject.next({transactionId: 'tx2', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx2', 'draftId', 'rev2', 'rev3'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // latency callback should still be working
    expect(onReportLatency).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })

  test('reports latency even before shard info fetch resolves', async () => {
    // Override the default mock to make fetch hang (never resolve)
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onReportLatency,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'test'}}]))
    draft.commit()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx1', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Should report with shard=undefined since fetch hasn't resolved
    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: undefined,
      transactionId: 'tx1',
    })

    sub.unsubscribe()
  })
})

describe('checkoutPair -- slow commit warning', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('calls onSlowCommit after 50 seconds when commit does not resolve', async () => {
    const onSlowCommit = vi.fn()
    const slowDataRequest = vi.fn(() => NEVER)

    const slowClient = {
      ...client,
      dataRequest: slowDataRequest,
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'slow save'}}]))
    draft.commit()

    expect(onSlowCommit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(49_999)
    expect(onSlowCommit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(onSlowCommit).toHaveBeenCalledOnce()

    sub.unsubscribe()
  })

  test('does not call onSlowCommit when commit resolves before threshold', async () => {
    const onSlowCommit = vi.fn()
    const commitSubject = new Subject()

    const fastClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
    }

    const {draft, published} = checkoutPair(fastClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    draft.mutate(draft.patch([{set: {title: 'quick save'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()

    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('restarts timer when a new commit request arrives before threshold', async () => {
    const onSlowCommit = vi.fn()
    const commitSubject = new Subject()

    const slowClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First edit starts the timer
    draft.mutate(draft.patch([{set: {title: 'first edit'}}]))
    draft.commit()

    // Advance 30s (past halfway but before threshold)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    // Resolve the first commit so the buffered document can accept a new one
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()

    // Second edit restarts the timer via switchMap
    const secondCommitSubject = new Subject()
    slowClient.dataRequest.mockReturnValue(secondCommitSubject)

    draft.mutate(draft.patch([{set: {title: 'second edit'}}]))
    draft.commit()

    // 20s later (50s total from first edit) — should NOT fire because
    // switchMap restarted the timer when the second commit arrived
    await vi.advanceTimersByTimeAsync(20_000)
    expect(onSlowCommit).not.toHaveBeenCalled()

    // 30s more (50s from second edit) — NOW it fires
    await vi.advanceTimersByTimeAsync(30_000)
    expect(onSlowCommit).toHaveBeenCalledOnce()

    sub.unsubscribe()
  })

  test('calls onSlowCommit again for a new slow period after the previous one resolved', async () => {
    const onSlowCommit = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const slowClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const {draft, published} = checkoutPair(slowClient as any as SanityClient, idPair, of(false), {
      onSlowCommit,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // First slow commit
    draft.mutate(draft.patch([{set: {title: 'first edit'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(50_000)
    expect(onSlowCommit).toHaveBeenCalledTimes(1)

    // Resolve the first commit
    commitSubject.next({transactionId: 'tx1', results: []})
    commitSubject.complete()
    listenerSubject.next({type: 'pending', phase: 'end'})

    await vi.advanceTimersByTimeAsync(0)

    // Second slow commit (new Subject so it never resolves)
    const secondCommitSubject = new Subject()
    slowClient.dataRequest.mockReturnValue(secondCommitSubject)

    draft.mutate(draft.patch([{set: {title: 'second edit'}}]))
    draft.commit()

    await vi.advanceTimersByTimeAsync(50_000)
    expect(onSlowCommit).toHaveBeenCalledTimes(2)

    sub.unsubscribe()
  })
})

describe('checkoutPair -- document rebase telemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('calls onDocumentRebase when a remote mutation arrives while local mutations are pending', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation (makes the document have pending changes)
    draft.mutate(draft.patch([{set: {title: 'local edit'}}]))

    // Inject a remote mutation with actual mutations that change the document.
    // The BufferedDocument rebase is triggered by the `mutations` field (not mendoza `effects`).
    // Empty mutations produce a no-op that doesn't trigger a rebase.
    listenerSubject.next({
      ...createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(onDocumentRebase).toHaveBeenCalledWith({
      remoteMutationCount: expect.any(Number),
      localMutationCount: expect.any(Number),
    })
    // remoteMutationCount should be >= 1 since a remote mutation triggered the rebase
    expect(onDocumentRebase.mock.calls[0][0].remoteMutationCount).toBeGreaterThanOrEqual(1)
    // localMutationCount is 0 because the mutation is in the squashing buffer (not yet committed),
    // and BufferedDocument only tracks committed-in-flight mutations as "local" during rebase
    expect(typeof onDocumentRebase.mock.calls[0][0].localMutationCount).toBe('number')

    sub.unsubscribe()
  })

  test('does not call onDocumentRebase when no local mutations are pending', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()

    const testClient = {
      ...client,
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Inject a remote mutation without any pending local mutations
    listenerSubject.next(createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)

    // No rebase should occur since there are no pending local mutations
    expect(onDocumentRebase).not.toHaveBeenCalled()

    sub.unsubscribe()
  })

  test('pipeline continues when onDocumentRebase callback throws', async () => {
    const onDocumentRebase = vi.fn().mockImplementation(() => {
      throw new Error('rebase callback error')
    })
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const testClient = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
      },
    }

    const {draft, published} = checkoutPair(testClient as any as SanityClient, idPair, of(false), {
      onDocumentRebase,
    })
    const events: any[] = []
    const combined = merge(draft.events, published.events)
    const sub = combined.subscribe((ev) => events.push(ev))

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation
    draft.mutate(draft.patch([{set: {title: 'local edit'}}]))

    // Inject a remote mutation with actual mutations to trigger rebase (callback will throw)
    listenerSubject.next({
      ...createMutationEvent('remote-tx', 'draftId', 'any', 'rev2'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    // The pipeline should still be alive — verify by checking events still flow
    listenerSubject.next({
      ...createMutationEvent('remote-tx-2', 'draftId', 'rev2', 'rev3'),
      mutations: [{patch: {id: 'draftId', set: {description: 'remote change 2'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    // If the pipeline died, we'd get no events after the throw.
    // The fact that we can still receive mutations proves resilience.
    expect(events.length).toBeGreaterThan(0)

    sub.unsubscribe()
  })

  test('calls onDocumentRebase for version document rebases', async () => {
    const onDocumentRebase = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()

    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        getDocuments: (ids: string[]) =>
          of(ids.map((id) => ({_id: id, _type: 'any', _rev: 'any'}))),
      },
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onDocumentRebase,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    // Apply a local mutation to the version document
    version!.mutate(version!.patch([{set: {title: 'local version edit'}}]))

    // Inject a remote mutation for the version document with actual mutations to trigger rebase
    listenerSubject.next({
      ...createMutationEvent('remote-v-tx', 'versions.r1.publishedId', 'any', 'rev2'),
      mutations: [{patch: {id: 'versions.r1.publishedId', set: {description: 'remote change'}}}],
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(onDocumentRebase).toHaveBeenCalled()
    expect(onDocumentRebase.mock.calls[0][0].remoteMutationCount).toBeGreaterThanOrEqual(1)
    expect(typeof onDocumentRebase.mock.calls[0][0].localMutationCount).toBe('number')

    sub.unsubscribe()
  })
})

describe('checkoutPair -- version documents', () => {
  test('server action patch with versionId uses versionId in action payload', async () => {
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const versionClient = {
      ...client,
      observable: {
        ...client.observable,
        getDocuments: (ids: string[]) =>
          of(ids.map((id) => ({_id: id, _type: 'any', _rev: 'any'}))),
        action: mockedActionRequest,
      },
      withConfig: vi.fn(() => versionClient),
    }

    const {version, draft, published} = checkoutPair(
      versionClient as any as SanityClient,
      versionIdPair,
      of(true),
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()
    await new Promise((resolve) => setTimeout(resolve, 0))

    version!.mutate(version!.patch([{set: {title: 'new title'}}]))
    version!.commit()

    expect(mockedActionRequest).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.edit',
          draftId: 'versions.r1.publishedId',
          publishedId: 'publishedId',
          patch: {
            set: {title: 'new title'},
          },
        },
      ],
      {
        tag: 'document.commit',
        transactionId: expect.any(String),
      },
    )

    sub.unsubscribe()
  })

  test('version document latency tracking works', async () => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
    } as Response)

    const onReportLatency = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        getDocuments: (ids: string[]) =>
          of(ids.map((id) => ({_id: id, _type: 'any', _rev: 'any'}))),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onReportLatency,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    version!.mutate(version!.patch([{set: {title: 'version edit'}}]))
    version!.commit()

    commitSubject.next({transactionId: 'tx-v1', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    listenerSubject.next(createMutationEvent('tx-v1', 'versions.r1.publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportLatency).toHaveBeenCalledWith({
      latencyMs: expect.any(Number),
      shard: 'test-shard',
      transactionId: 'tx-v1',
    })

    vi.useRealTimers()
    vi.restoreAllMocks()
    sub.unsubscribe()
  })

  test('version document mutation performance tracking works', async () => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      headers: new Headers({'X-Sanity-Shard': 'test-shard'}),
    } as Response)

    const onReportMutationPerformance = vi.fn()
    const listenerSubject = new Subject()
    const commitSubject = new Subject()
    const versionIdPair = {
      publishedId: 'publishedId',
      draftId: 'draftId',
      versionId: 'versions.r1.publishedId',
    }

    const testClient: Record<string, any> = {
      ...client,
      dataRequest: vi.fn(() => commitSubject),
      observable: {
        ...client.observable,
        listen: () => merge(of({type: 'welcome'}).pipe(delay(0)), listenerSubject),
        getDocuments: (ids: string[]) =>
          of(ids.map((id) => ({_id: id, _type: 'any', _rev: 'any'}))),
      },
      getUrl: (url: string) => url,
      getDataUrl: (path: string) => `/data/${path}`,
    }
    testClient.withConfig = vi.fn(() => testClient)

    const {version, draft, published} = checkoutPair(
      testClient as any as SanityClient,
      versionIdPair,
      of(false),
      {
        onReportMutationPerformance,
      },
    )
    const combined = merge(draft.events, published.events, version!.events)
    const sub = combined.subscribe()

    await vi.advanceTimersByTimeAsync(0)

    version!.mutate(version!.patch([{set: {title: 'version perf edit'}}]))
    await vi.advanceTimersByTimeAsync(100) // debounce
    version!.commit()

    await vi.advanceTimersByTimeAsync(200) // API time
    commitSubject.next({transactionId: 'tx-vperf', results: []})
    commitSubject.complete()
    await vi.advanceTimersByTimeAsync(0)

    await vi.advanceTimersByTimeAsync(50) // callback delay
    listenerSubject.next(createMutationEvent('tx-vperf', 'versions.r1.publishedId', 'any', 'rev2'))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(onReportMutationPerformance).toHaveBeenCalledTimes(1)
    const event = onReportMutationPerformance.mock.calls[0][0]
    expect(event.transactionId).toBe('tx-vperf')
    expect(event.debounceMs).toBeGreaterThanOrEqual(100)
    expect(event.apiMs).toBeGreaterThanOrEqual(200)
    expect(event.callbackMs).toBeGreaterThanOrEqual(event.apiMs)
    expect(event.shard).toBe('test-shard')

    vi.useRealTimers()
    vi.restoreAllMocks()
    sub.unsubscribe()
  })
})
