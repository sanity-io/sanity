import {beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  deleteDocumentVersionEvent,
  DRAFT_ID,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getExpandEvents, isExpandableEvent} from './getExpandEvents'

vi.mock('./getDocumentTransactions', () => ({
  getDocumentTransactions: vi.fn(),
}))

const mockGetDocumentTransactions = vi.mocked(getDocumentTransactions)

describe('isExpandableEvent', () => {
  it('accepts publish and delete events carrying versionRevisionId and creationEvent', () => {
    const creationEvent = createDocumentVersionEvent()
    expect(
      isExpandableEvent(publishDocumentVersionEvent({versionRevisionId: 'rev', creationEvent})),
    ).toBe(true)
    expect(
      isExpandableEvent(deleteDocumentVersionEvent({versionRevisionId: 'rev', creationEvent})),
    ).toBe(true)
  })

  it('rejects events missing the creation event or the version revision', () => {
    expect(isExpandableEvent(publishDocumentVersionEvent())).toBe(false)
    expect(
      isExpandableEvent(
        publishDocumentVersionEvent({
          versionRevisionId: undefined,
          creationEvent: createDocumentVersionEvent(),
        }),
      ),
    ).toBe(false)
  })

  it('rejects other event types', () => {
    expect(isExpandableEvent(editDocumentVersionEvent())).toBe(false)
    expect(isExpandableEvent(createDocumentVersionEvent())).toBe(false)
  })
})

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
    const transaction = editTransaction({id: 'tx-edit-1', timestamp: minutesAfterBase(1)})
    mockGetDocumentTransactions.mockResolvedValue([transaction])

    const {handleExpandEvent, expandedEvents$, expandedTransactions$} = getExpandEvents({
      client,
      documentId: DRAFT_ID,
    })
    const {values, subscription} = collectEmissions(expandedEvents$)
    const transactions = collectEmissions(expandedTransactions$)

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
    // Kept, so what the edits changed is rebuilt without fetching them again.
    expect(transactions.values.at(-1)).toEqual([[transaction]])
    transactions.subscription.unsubscribe()
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

  it('freezes an expanded edit group without fetching anything', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const {client} = createMockClient()
    const group = editDocumentVersionEvent({
      id: 'tx-2',
      revisionId: 'tx-2',
      transactions: [
        {
          type: 'editTransaction',
          author: 'author-1',
          timestamp: minutesAfterBase(2),
          revisionId: 'tx-2',
        },
        {
          type: 'editTransaction',
          author: 'author-1',
          timestamp: minutesAfterBase(1),
          revisionId: 'tx-1',
        },
      ],
    })

    const {handleExpandEvent, expandedEvents$, frozenEditGroups$} = getExpandEvents({
      client,
      documentId: DRAFT_ID,
    })
    const expanded = collectEmissions(expandedEvents$)
    const frozen = collectEmissions(frozenEditGroups$)

    await handleExpandEvent(group)
    // Expanding it again doesn't emit a new value.
    await handleExpandEvent(group)

    expect(mockGetDocumentTransactions).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expect(expanded.values).toEqual([[]])
    expect(frozen.values).toHaveLength(2)
    expect(frozen.values.at(-1)).toEqual(
      new Map([
        ['tx-2', 'tx-2'],
        ['tx-1', 'tx-2'],
      ]),
    )
    consoleError.mockRestore()
    expanded.subscription.unsubscribe()
    frozen.subscription.unsubscribe()
  })

  it('does not freeze edit events nested under a publish, nor listed transactions', async () => {
    const {client} = createMockClient()
    const {handleExpandEvent, frozenEditGroups$} = getExpandEvents({client, documentId: DRAFT_ID})
    const frozen = collectEmissions(frozenEditGroups$)

    await handleExpandEvent(editDocumentVersionEvent({parentId: 'tx-publish'}))
    await handleExpandEvent(editDocumentVersionEvent({parentId: 'tx-group', isTransaction: true}))

    expect(frozen.values).toEqual([new Map()])
    frozen.subscription.unsubscribe()
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
