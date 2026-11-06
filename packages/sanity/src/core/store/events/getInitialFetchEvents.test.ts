import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  deleteDocumentVersionEvent,
  DOCUMENT_ID,
  DRAFT_ID,
  minutesAfterBase,
  publishDocumentVersionEvent,
  VERSION_ID,
} from './__fixtures__/events.fixture'
import {createMockClient, type RecordedRequest} from './__fixtures__/mockClient'
import {createTransaction, editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentTransactions} from './getDocumentTransactions'
import {
  accumulateEvents,
  type FetchedEventsValue,
  type FetchEventsResult,
  findEditEventsBaseline,
  getInitialFetchEvents,
} from './getInitialFetchEvents'
import {type DocumentGroupEvent} from './types'

vi.mock('./getDocumentTransactions', () => ({
  getDocumentTransactions: vi.fn(),
}))

const mockGetDocumentTransactions = vi.mocked(getDocumentTransactions)

function eventsResponse(documentId: string, events: DocumentGroupEvent[], nextCursor = '') {
  return (request: RecordedRequest) => {
    if (!request.url.includes('/events/documents/')) {
      throw new Error(`Unexpected request: ${request.url}`)
    }
    return {events: {[documentId]: events}, nextCursor}
  }
}

describe('getInitialFetchEvents', () => {
  beforeEach(() => {
    mockGetDocumentTransactions.mockReset()
    mockGetDocumentTransactions.mockResolvedValue([])
  })

  it('draft: fetches events, assigns ids, and fetches the transactions after the baseline revision', async () => {
    const apiCreate = createDocumentVersionEvent()
    const {client, requests} = createMockClient({respond: eventsResponse(DRAFT_ID, [apiCreate])})
    const edit = editTransaction({id: 'tx-edit-1', timestamp: minutesAfterBase(1)})
    mockGetDocumentTransactions.mockResolvedValue([edit])

    const {events$} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(requests[0].url).toContain(`/events/documents/${DRAFT_ID}?limit=100`)
    // Transactions are fetched from the newest revision-bearing event to the present.
    expect(mockGetDocumentTransactions).toHaveBeenCalledWith({
      client,
      documentId: DRAFT_ID,
      fromTransaction: apiCreate.versionRevisionId,
      toTransaction: undefined,
    })

    const result = values.at(-1)!
    // Edit events are synthesized later, together with the remote transactions.
    expect(result.events.map((event) => event.type)).toEqual(['createDocumentVersion'])
    expect(result.transactionBatches).toEqual([[edit]])
    // Ids are (re)assigned client-side per variant.
    expect(result.events[0].id).toBe(apiCreate.versionRevisionId)
    expect(result.historyCleared).toBe(false)
    expect(result.error).toBeNull()
  })

  it('version: uses the creation event as the baseline for edit synthesis', async () => {
    const apiCreate = createDocumentVersionEvent({
      versionId: VERSION_ID,
      versionRevisionId: 'version-create-rev',
      documentVariantType: 'version',
    })
    const apiPublish = publishDocumentVersionEvent({versionId: VERSION_ID})
    const {client} = createMockClient({
      respond: eventsResponse(VERSION_ID, [apiPublish, apiCreate]),
    })

    const {events$} = getInitialFetchEvents({client, documentId: VERSION_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(mockGetDocumentTransactions).toHaveBeenCalledWith(
      expect.objectContaining({fromTransaction: 'version-create-rev'}),
    )
  })

  it('published: does not fetch edit transactions', async () => {
    const apiPublish = publishDocumentVersionEvent()
    const {client} = createMockClient({respond: eventsResponse(DOCUMENT_ID, [apiPublish])})

    const {events$} = getInitialFetchEvents({client, documentId: DOCUMENT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
    expect(values.at(-1)?.events.map((event) => event.type)).toEqual(['publishDocumentVersion'])
    expect(values.at(-1)?.transactionBatches).toEqual([[]])
  })

  it('falls back to fromTransaction "" when the batch has no baseline (known quirk: walks the whole translog)', async () => {
    const {client} = createMockClient({respond: eventsResponse(DRAFT_ID, [])})

    const {events$} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(mockGetDocumentTransactions).toHaveBeenCalledWith(
      expect.objectContaining({fromTransaction: ''}),
    )
  })

  it('flags the history as cleared when the API has no events but the translog has edits', async () => {
    const {client} = createMockClient({respond: eventsResponse(DRAFT_ID, [])})
    mockGetDocumentTransactions.mockResolvedValue([editTransaction({id: 'tx-edit-1'})])

    const {events$} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(values.at(-1)).toMatchObject({events: [], historyCleared: true})
  })

  it('does not flag the history as cleared when the translog has no edits', async () => {
    const {client} = createMockClient({respond: eventsResponse(DRAFT_ID, [])})
    mockGetDocumentTransactions.mockResolvedValue([createTransaction({id: 'tx-create'})])

    const {events$} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(values.at(-1)?.historyCleared).toBe(false)
  })

  it('loadMore fetches the next page with the cursor, and is a no-op without one', async () => {
    const firstBatch = publishDocumentVersionEvent({id: 'publish-1'})
    const secondBatch = publishDocumentVersionEvent({
      id: 'publish-2',
      revisionId: 'publish-2',
      timestamp: minutesAfterBase(-10),
    })
    let call = 0
    const {client, requests} = createMockClient({
      respond: () => {
        call += 1
        return call === 1
          ? {events: {[DOCUMENT_ID]: [firstBatch]}, nextCursor: 'cursor-1'}
          : {events: {[DOCUMENT_ID]: [secondBatch]}, nextCursor: ''}
      },
    })

    const {events$, loadMore} = getInitialFetchEvents({client, documentId: DOCUMENT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.nextCursor).toBe('cursor-1'))

    loadMore()
    await vi.waitFor(() => expect(values.at(-1)?.events).toHaveLength(2))
    expect(requests[1].url).toContain('nextCursor=cursor-1')

    // No cursor left: loadMore must not trigger another request.
    loadMore()
    expect(requests).toHaveLength(2)
    subscription.unsubscribe()
  })

  it('reload fetches with limit 10 and keeps the previous cursor', async () => {
    let call = 0
    const {client, requests} = createMockClient({
      respond: () => {
        call += 1
        return {
          events: {[DOCUMENT_ID]: [publishDocumentVersionEvent()]},
          nextCursor: call === 1 ? 'cursor-1' : 'reload-cursor',
        }
      },
    })

    const {events$, reloadEvents} = getInitialFetchEvents({client, documentId: DOCUMENT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.nextCursor).toBe('cursor-1'))

    reloadEvents()
    await vi.waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1].url).toContain('limit=10')
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    // The reload response cursor is discarded; the previous cursor is kept.
    expect(values.at(-1)?.nextCursor).toBe('cursor-1')
    subscription.unsubscribe()
  })

  it('reloads fetch their transactions into a new batch, opened as soon as the reload starts', async () => {
    const {client} = createMockClient({
      respond: eventsResponse(DRAFT_ID, [createDocumentVersionEvent()]),
    })
    const first = editTransaction({id: 'tx-first'})
    const second = editTransaction({id: 'tx-second'})
    mockGetDocumentTransactions.mockResolvedValueOnce([first]).mockResolvedValueOnce([second])

    const {events$, reloadEvents} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    expect(values.at(-1)?.transactionBatches).toEqual([[first]])

    reloadEvents()
    expect(values.at(-1)).toMatchObject({loading: true, transactionBatches: [[first], []]})
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    expect(values.at(-1)?.transactionBatches).toEqual([[first], [second]])
    subscription.unsubscribe()
  })

  it('emits the error and keeps previously accumulated events when a fetch fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let call = 0
    const {client} = createMockClient({
      respond: () => {
        call += 1
        if (call === 1) {
          return {events: {[DOCUMENT_ID]: [publishDocumentVersionEvent()]}, nextCursor: 'cursor-1'}
        }
        throw new Error('events fetch failed')
      },
    })

    const {events$, loadMore} = getInitialFetchEvents({client, documentId: DOCUMENT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.nextCursor).toBe('cursor-1'))

    loadMore()
    await vi.waitFor(() => expect(values.at(-1)?.error).toBeInstanceOf(Error))
    const result = values.at(-1)!
    expect(result.events).toHaveLength(1)
    // Known quirk: a failed non-reload fetch resets the cursor, disabling further pagination.
    expect(result.nextCursor).toBe('')
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
    subscription.unsubscribe()
  })
})

describe('findEditEventsBaseline', () => {
  it('version: uses the creation event, ignoring newer revision-bearing events', () => {
    const create = createDocumentVersionEvent({
      versionId: VERSION_ID,
      versionRevisionId: 'version-create-rev',
      documentVariantType: 'version',
    })
    const publish = publishDocumentVersionEvent({
      versionId: VERSION_ID,
      versionRevisionId: 'publish-rev',
    })
    expect(findEditEventsBaseline([publish, create], 'version')).toBe('version-create-rev')
  })

  it('version: returns undefined when the batch has no creation event', () => {
    const publish = publishDocumentVersionEvent({versionId: VERSION_ID})
    expect(findEditEventsBaseline([publish], 'version')).toBeUndefined()
  })

  it('draft: uses the newest revision-bearing event, skipping deletes', () => {
    // Delete events carry a versionRevisionId, but it is unreliable and must be skipped.
    const deleted = deleteDocumentVersionEvent({versionRevisionId: 'delete-rev'})
    const publish = publishDocumentVersionEvent({versionRevisionId: 'publish-rev'})
    const create = createDocumentVersionEvent({versionRevisionId: 'create-rev'})
    expect(findEditEventsBaseline([deleted, publish, create], 'draft')).toBe('publish-rev')
  })

  it('draft: returns undefined for an empty batch (callers fall back to the full translog)', () => {
    expect(findEditEventsBaseline([], 'draft')).toBeUndefined()
  })
})

describe('accumulateEvents', () => {
  const publish = publishDocumentVersionEvent({id: 'tx-pub'})
  const fetchedEdit = editTransaction({id: 'tx-fetched'})
  const prev: FetchedEventsValue = {
    events: [publish],
    nextCursor: 'cursor-1',
    loading: false,
    error: null,
    transactionBatches: [[fetchedEdit]],
    historyCleared: false,
  }

  function fetchResult(overrides: Partial<FetchEventsResult>): FetchEventsResult {
    return {
      events: [],
      nextCursor: '',
      loading: false,
      error: null,
      transactions: [],
      historyCleared: false,
      origin: 'reload',
      ...overrides,
    }
  }

  it('merges batches via removeDupes, keeping the existing event on id collision', () => {
    const incomingDupe = publishDocumentVersionEvent({id: 'tx-pub', author: 'someone-else'})
    const older = publishDocumentVersionEvent({id: 'tx-pub-old', timestamp: minutesAfterBase(-10)})
    const result = accumulateEvents(
      prev,
      fetchResult({events: [incomingDupe, older], nextCursor: 'cursor-2', origin: 'loadMore'}),
    )
    expect(result.events.map((event) => event.id)).toEqual(['tx-pub', 'tx-pub-old'])
    // The previously accumulated event wins over the incoming duplicate.
    expect(result.events[0].author).toBe('author-1')
  })

  it('reloads keep the previous cursor', () => {
    const result = accumulateEvents(prev, fetchResult({nextCursor: 'reload-cursor'}))
    expect(result.nextCursor).toBe('cursor-1')
  })

  it('initial and loadMore fetches take the response cursor', () => {
    for (const origin of ['initial', 'loadMore'] as const) {
      const result = accumulateEvents(prev, fetchResult({nextCursor: 'cursor-2', origin}))
      expect(result.nextCursor).toBe('cursor-2')
    }
  })

  it('passes loading and error through from the incoming emission', () => {
    const error = new Error('fetch failed')
    const result = accumulateEvents(prev, fetchResult({loading: true, error, origin: 'loadMore'}))
    expect(result.loading).toBe(true)
    expect(result.error).toBe(error)
    // Known quirk: the failed non-reload emission resets the cursor.
    expect(result.nextCursor).toBe('')
  })

  it('opens a transaction batch when a reload starts, and fills it when it resolves', () => {
    const reloadedEdit = editTransaction({id: 'tx-reloaded'})
    const started = accumulateEvents(prev, fetchResult({loading: true}))
    expect(started.transactionBatches).toEqual([[fetchedEdit], []])

    const resolved = accumulateEvents(started, fetchResult({transactions: [reloadedEdit]}))
    expect(resolved.transactionBatches).toEqual([[fetchedEdit], [reloadedEdit]])
  })

  it('leaves the batch of a failed reload empty', () => {
    const started = accumulateEvents(prev, fetchResult({loading: true}))
    const failed = accumulateEvents(started, fetchResult({error: new Error('fetch failed')}))
    expect(failed.transactionBatches).toEqual([[fetchedEdit], []])
  })

  it('leaves the transaction batches alone on loadMore fetches', () => {
    const started = accumulateEvents(prev, fetchResult({loading: true, origin: 'loadMore'}))
    const resolved = accumulateEvents(started, fetchResult({origin: 'loadMore'}))
    expect(resolved.transactionBatches).toEqual([[fetchedEdit]])
  })

  it('keeps historyCleared once a fetch set it', () => {
    const cleared = accumulateEvents(prev, fetchResult({historyCleared: true}))
    expect(cleared.historyCleared).toBe(true)
    expect(accumulateEvents(cleared, fetchResult({})).historyCleared).toBe(true)
  })
})
