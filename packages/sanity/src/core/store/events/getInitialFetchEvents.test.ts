import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  deleteDocumentVersionEvent,
  DOCUMENT_ID,
  DRAFT_ID,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
  VERSION_ID,
} from './__fixtures__/events.fixture'
import {createMockClient, type RecordedRequest} from './__fixtures__/mockClient'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentTransactions} from './getDocumentTransactions'
import {
  accumulateEvents,
  findEditEventsBaseline,
  getInitialFetchEvents,
  HISTORY_CLEARED_EVENT_ID,
  withHistoryClearedEvent,
} from './getInitialFetchEvents'
import {type DocumentGroupEvent, type EventsObservableValue} from './types'

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

  it('draft: fetches events, assigns ids, and synthesizes edit events from the baseline revision', async () => {
    const apiCreate = createDocumentVersionEvent()
    const {client, requests} = createMockClient({respond: eventsResponse(DRAFT_ID, [apiCreate])})
    mockGetDocumentTransactions.mockResolvedValue([
      editTransaction({id: 'tx-edit-1', timestamp: minutesAfterBase(1)}),
    ])

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
    expect(result.events.map((event) => event.type)).toEqual([
      'editDocumentVersion',
      'createDocumentVersion',
    ])
    // Ids are (re)assigned client-side per variant.
    expect(result.events[1].id).toBe(apiCreate.versionRevisionId)
    expect(result.error).toBeNull()
  })

  it('version: does not duplicate a delete that shares its id with a synthesized edit', async () => {
    // Delete events often reuse the last edit's revision as versionRevisionId, so the
    // synthesized edit and the delete get the same client-side id.
    const lastEditRevision = '6bffe811-d5cc-4c73-995f-8b742d3a77f9'
    const apiDelete = deleteDocumentVersionEvent({
      versionId: VERSION_ID,
      versionRevisionId: lastEditRevision,
      timestamp: '2026-08-26T09:51:12Z',
      documentVariantType: 'version',
    })
    const apiCreate = createDocumentVersionEvent({
      versionId: VERSION_ID,
      versionRevisionId: 'HyFGxFe6HLdujEBXb2YLpb',
      timestamp: '2026-08-26T09:47:08Z',
      documentVariantType: 'version',
    })
    const {client} = createMockClient({
      respond: eventsResponse(VERSION_ID, [apiDelete, apiCreate]),
    })
    mockGetDocumentTransactions.mockResolvedValue([
      editTransaction({
        id: lastEditRevision,
        documentId: VERSION_ID,
        timestamp: '2026-08-26T09:50:00Z',
      }),
    ])

    const {events$} = getInitialFetchEvents({client, documentId: VERSION_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    const events = values.at(-1)!.events
    expect(events.filter((event) => event.type === 'deleteDocumentVersion')).toHaveLength(1)
    expect(events.map((event) => event.type)).toEqual([
      'deleteDocumentVersion',
      'createDocumentVersion',
    ])
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

  it('prepends a synthetic historyCleared event when the API has no events but edits exist', async () => {
    const {client} = createMockClient({respond: eventsResponse(DRAFT_ID, [])})
    const edit = editTransaction({id: 'tx-edit-1', timestamp: minutesAfterBase(10)})
    mockGetDocumentTransactions.mockResolvedValue([edit])

    const {events$} = getInitialFetchEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(events$)
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    const result = values.at(-1)!
    expect(result.events.map((event) => event.type)).toEqual([
      'historyCleared',
      'editDocumentVersion',
    ])
    expect(result.events[0].id).toBe(HISTORY_CLEARED_EVENT_ID)
    // Timestamped 1ms before the oldest edit event.
    expect(Date.parse(result.events[0].timestamp)).toBe(Date.parse(edit.timestamp) - 1)
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

describe('withHistoryClearedEvent', () => {
  const editEvents = [
    editDocumentVersionEvent({revisionId: 'tx-2', timestamp: minutesAfterBase(10)}),
    editDocumentVersionEvent({revisionId: 'tx-1', timestamp: minutesAfterBase(5)}),
  ]

  it('prepends a historyCleared event when the API has no events but edits exist', () => {
    const result = withHistoryClearedEvent(editEvents, {
      apiEvents: [],
      transactions: [{}, {}],
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result.map((event) => event.type)).toEqual([
      'historyCleared',
      'editDocumentVersion',
      'editDocumentVersion',
    ])
    expect(result[0]).toMatchObject({
      id: HISTORY_CLEARED_EVENT_ID,
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    // Timestamped 1ms before the oldest edit event so it sorts after it.
    expect(Date.parse(result[0].timestamp)).toBe(Date.parse(editEvents[1].timestamp) - 1)
  })

  it('returns the edit events untouched when the API returned events', () => {
    const result = withHistoryClearedEvent(editEvents, {
      apiEvents: [publishDocumentVersionEvent()],
      transactions: [{}],
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result).toBe(editEvents)
  })

  it('returns the edit events untouched when there are no edits to anchor the timestamp to', () => {
    const result = withHistoryClearedEvent([], {
      apiEvents: [],
      transactions: [{}],
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result).toEqual([])
  })
})

describe('accumulateEvents', () => {
  const publish = publishDocumentVersionEvent({id: 'tx-pub'})
  const prev: EventsObservableValue = {
    events: [publish],
    nextCursor: 'cursor-1',
    loading: false,
    error: null,
  }

  it('merges batches via removeDupes, keeping the existing event on id collision', () => {
    const incomingDupe = publishDocumentVersionEvent({id: 'tx-pub', author: 'someone-else'})
    const older = publishDocumentVersionEvent({id: 'tx-pub-old', timestamp: minutesAfterBase(-10)})
    const result = accumulateEvents(prev, {
      events: [incomingDupe, older],
      nextCursor: 'cursor-2',
      loading: false,
      error: null,
      origin: 'loadMore',
    })
    expect(result.events.map((event) => event.id)).toEqual(['tx-pub', 'tx-pub-old'])
    // The previously accumulated event wins over the incoming duplicate.
    expect(result.events[0].author).toBe('author-1')
  })

  it('reloads keep the previous cursor', () => {
    const result = accumulateEvents(prev, {
      events: [],
      nextCursor: 'reload-cursor',
      loading: false,
      error: null,
      origin: 'reload',
    })
    expect(result.nextCursor).toBe('cursor-1')
  })

  it('initial and loadMore fetches take the response cursor', () => {
    for (const origin of ['initial', 'loadMore'] as const) {
      const result = accumulateEvents(prev, {
        events: [],
        nextCursor: 'cursor-2',
        loading: false,
        error: null,
        origin,
      })
      expect(result.nextCursor).toBe('cursor-2')
    }
  })

  it('passes loading and error through from the incoming emission', () => {
    const error = new Error('fetch failed')
    const result = accumulateEvents(prev, {
      events: [],
      nextCursor: '',
      loading: true,
      error,
      origin: 'loadMore',
    })
    expect(result.loading).toBe(true)
    expect(result.error).toBe(error)
    // Known quirk: the failed non-reload emission resets the cursor.
    expect(result.nextCursor).toBe('')
  })
})
