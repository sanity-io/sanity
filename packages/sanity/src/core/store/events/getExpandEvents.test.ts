import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  DRAFT_ID,
  minutesAfterBase,
  publishDocumentVersionEvent,
} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getExpandEvents} from './getExpandEvents'

vi.mock('./getDocumentTransactions', () => ({
  getDocumentTransactions: vi.fn(),
}))

const mockGetDocumentTransactions = vi.mocked(getDocumentTransactions)

describe('getExpandEvents', () => {
  beforeEach(() => {
    mockGetDocumentTransactions.mockReset()
  })

  it('expands a publish event into parentId-stamped edit events', async () => {
    const {client} = createMockClient()
    const creationEvent = createDocumentVersionEvent({versionRevisionId: 'creation-rev'})
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'published-version-rev',
      creationEvent,
    })
    mockGetDocumentTransactions.mockResolvedValue([
      editTransaction({id: 'tx-edit-1', timestamp: minutesAfterBase(1)}),
    ])

    const {handleExpandEvent, expandedEvents$} = getExpandEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(expandedEvents$)

    await handleExpandEvent(publish)

    expect(mockGetDocumentTransactions).toHaveBeenCalledWith({
      client,
      documentId: DRAFT_ID,
      fromTransaction: 'creation-rev',
      toTransaction: 'published-version-rev',
    })
    expect(values.at(-1)).toEqual([
      expect.objectContaining({
        type: 'editDocumentVersion',
        id: 'tx-edit-1',
        parentId: publish.id,
      }),
    ])
    subscription.unsubscribe()
  })

  it('expanding the same event twice is a no-op', async () => {
    const {client} = createMockClient()
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'published-version-rev',
      creationEvent: createDocumentVersionEvent(),
    })
    mockGetDocumentTransactions.mockResolvedValue([editTransaction({id: 'tx-edit-1'})])

    const {handleExpandEvent} = getExpandEvents({client, documentId: DRAFT_ID})
    await handleExpandEvent(publish)
    await handleExpandEvent(publish)

    expect(mockGetDocumentTransactions).toHaveBeenCalledTimes(1)
  })

  it('logs and ignores events that cannot be expanded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const {client} = createMockClient()
    // No creationEvent attached: not expandable.
    const publish = publishDocumentVersionEvent()

    const {handleExpandEvent, expandedEvents$} = getExpandEvents({client, documentId: DRAFT_ID})
    const {values, subscription} = collectEmissions(expandedEvents$)

    await handleExpandEvent(publish)

    expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith("This event can't be expanded", publish)
    expect(values.at(-1)).toEqual([])
    consoleError.mockRestore()
    subscription.unsubscribe()
  })

  it('propagates transaction fetch failures as a rejected promise (known quirk: callers do not catch)', async () => {
    const {client} = createMockClient()
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'published-version-rev',
      creationEvent: createDocumentVersionEvent(),
    })
    mockGetDocumentTransactions.mockRejectedValue(new Error('translog unavailable'))

    const {handleExpandEvent} = getExpandEvents({client, documentId: DRAFT_ID})
    await expect(handleExpandEvent(publish)).rejects.toThrow('translog unavailable')
  })
})
