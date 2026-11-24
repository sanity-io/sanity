import {describe, expect, it} from 'vitest'

import {
  createDocumentVersionEvent,
  DRAFT_ID,
  minutesAfterBase,
  publishDocumentVersionEvent,
} from './__fixtures__/events.fixture'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {
  addEditTransactionEvents,
  getEditEvents,
  getEffectState,
  mergeEditEvents,
  toUpdateLiveDocumentEvents,
} from './getEditEvents'
import {type EditDocumentVersionEvent, type UpdateLiveDocumentEvent} from './types'

describe('getEditEvents()', () => {
  const editTransactions = [
    {
      id: 'edit-tx-2',
      timestamp: '2024-11-19T08:27:33.251404Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [19, 4, 11, 3, 23, 0, 17, 22, '33', 23, 19, 20, 15],
          revert: [
            11,
            3,
            23,
            0,
            17,
            22,
            '27',
            23,
            19,
            20,
            15,
            17,
            {
              _ref: '54105815-db4e-4a96-8c8a-edaf1e2beab2',
              _type: 'reference',
            },
            'bestFriend',
          ],
        },
      },
    },
    {
      id: 'edit-tx-1',
      timestamp: '2024-11-19T08:27:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'developer', 'role'],
          revert: [11, 3, 23, 0, 9, 22, '8T17:48:0', 23, 18, 20, 15, 17, 'designer', 'role'],
        },
      },
    },
  ]
  describe('when the document is not liveEdit', () => {
    const expectedEvent: EditDocumentVersionEvent = {
      type: 'editDocumentVersion',
      id: 'edit-tx-2',
      documentId: 'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
      timestamp: '2024-11-19T08:27:33.251404Z',
      author: 'p8xDvUMxC',
      contributors: ['p8xDvUMxC'],
      revisionId: 'edit-tx-2',
      documentVariantType: 'version',
      transactions: [
        {
          type: 'editTransaction',
          author: 'p8xDvUMxC',
          timestamp: '2024-11-19T08:27:33.251404Z',
          revisionId: 'edit-tx-2',
        },
        {
          type: 'editTransaction',
          author: 'p8xDvUMxC',
          timestamp: '2024-11-19T08:27:27.753746Z',
          revisionId: 'edit-tx-1',
        },
      ],
    }

    it('should merge the events if they are in the time window.', () => {
      const events = getEditEvents(
        editTransactions,
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
      )
      expect(events).toEqual([expectedEvent])
    })
    it("should not merge the events if they aren't in the time window.", () => {
      const newTransaction = {
        id: 'new-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
            revert: [11, 3, 23, 0, 9, 22, '8T17:48:0', 23, 18, 20, 15, 17, 'developer', 'role'],
          },
        },
      }
      const newEvent: EditDocumentVersionEvent = {
        type: 'editDocumentVersion',
        documentId: 'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        timestamp: '2024-11-19T08:35:27.753746Z',
        id: 'new-tx',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: 'new-tx',
        documentVariantType: 'version',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2024-11-19T08:35:27.753746Z',
            revisionId: 'new-tx',
          },
        ],
      }
      const events = getEditEvents(
        [...editTransactions, newTransaction],
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
      )
      expect(events).toEqual([newEvent, expectedEvent])
    })
    it('should filter non edit events', () => {
      const creationTransaction = {
        id: 'create-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
            revert: [0, null],
          },
        },
      }
      const deleteTx = {
        id: 'delete-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [0, null],
            revert: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
          },
        },
      }
      const undefinedTx = {
        id: 'undefined-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': undefined,
        },
      }
      const events = getEditEvents(
        [deleteTx, ...editTransactions, undefinedTx, creationTransaction],
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
      )
      expect(events).toEqual([expectedEvent])
    })

    it('does not populate releaseId for variant-scoped version ids', () => {
      // Variant document ids are `versions.<scopeId>.<groupId>` where the scope id is an opaque
      // server-generated hash, not a release id. Synthesized edits must not throw or treat the
      // hash as a releaseId.
      const variantDocumentId = 'versions.a1b2c3d4e5f6.f8dece19-c458-4cff-bf76-732b00617183'
      const variantTx = {
        id: 'variant-edit-tx',
        timestamp: '2024-11-19T08:27:33.251404Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: [variantDocumentId],
        effects: {
          [variantDocumentId]: {
            apply: [19, 4, 11, 3, 23, 0, 17, 22, '33', 23, 19, 20, 15],
            revert: [11, 3, 23, 0, 17, 22, '27', 23, 19, 20, 15],
          },
        },
      }

      const events = getEditEvents([variantTx], variantDocumentId)

      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        type: 'editDocumentVersion',
        documentId: variantDocumentId,
        documentVariantType: 'version',
      })
      expect(events[0]).not.toHaveProperty('releaseId')
    })
  })
  describe('toUpdateLiveDocumentEvents()', () => {
    const expectedEvent: UpdateLiveDocumentEvent = {
      type: 'updateLiveDocument',
      id: 'edit-tx-2',
      documentId: 'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
      timestamp: '2024-11-19T08:27:33.251404Z',
      author: 'p8xDvUMxC',
      revisionId: 'edit-tx-2',
      documentVariantType: 'version',
    }
    it('should merge the events if they are in the time window.', () => {
      const events = toUpdateLiveDocumentEvents(
        getEditEvents(editTransactions, 'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'),
      )
      expect(events).toEqual([expectedEvent])
    })
    it("should not merge the events if they aren't in the time window.", () => {
      const newTransaction = {
        id: 'new-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
            revert: [11, 3, 23, 0, 9, 22, '8T17:48:0', 23, 18, 20, 15, 17, 'developer', 'role'],
          },
        },
      }
      const newEvent: UpdateLiveDocumentEvent = {
        type: 'updateLiveDocument',
        documentId: 'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        timestamp: '2024-11-19T08:35:27.753746Z',
        id: 'new-tx',
        author: 'p8xDvUMxC',
        revisionId: 'new-tx',
        documentVariantType: 'version',
      }
      const events = toUpdateLiveDocumentEvents(
        getEditEvents(
          [...editTransactions, newTransaction],
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        ),
      )
      expect(events).toEqual([newEvent, expectedEvent])
    })
    it('should filter non edit events', () => {
      const creationTransaction = {
        id: 'create-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
            revert: [0, null],
          },
        },
      }
      const deleteTx = {
        id: 'delete-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
            apply: [0, null],
            revert: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
          },
        },
      }
      const undefinedTx = {
        id: 'undefined-tx',
        timestamp: '2024-11-19T08:35:27.753746Z',
        author: 'p8xDvUMxC',
        mutations: [],
        documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
        effects: {
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': undefined,
        },
      }
      const events = toUpdateLiveDocumentEvents(
        getEditEvents(
          [deleteTx, ...editTransactions, undefinedTx, creationTransaction],
          'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        ),
      )
      expect(events).toEqual([expectedEvent])
    })

    it('drops merged in-window transactions entirely, including other authors', () => {
      const transactions = [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(0), author: 'author-1'}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(1), author: 'author-2'}),
      ]

      const events = toUpdateLiveDocumentEvents(getEditEvents(transactions, DRAFT_ID))
      // Only the newest transaction survives; author-1's edit leaves no trace.
      expect(events).toEqual([
        expect.objectContaining({type: 'updateLiveDocument', id: 'tx-2', author: 'author-2'}),
      ])
    })
  })

  describe('merge window characterization', () => {
    it('anchors the window to the group head, not the previous transaction', () => {
      // Three edits 4 minutes apart: each is within 5 minutes of the previous one, but the third
      // is 8 minutes from the group head — so it starts a new event (known quirk: a continuous
      // editing session splits every 5 minutes).
      const transactions = [
        editTransaction({id: 'tx-0', timestamp: minutesAfterBase(0)}),
        editTransaction({id: 'tx-4', timestamp: minutesAfterBase(4)}),
        editTransaction({id: 'tx-8', timestamp: minutesAfterBase(8)}),
      ]

      const events = getEditEvents(transactions, DRAFT_ID)
      expect(events).toHaveLength(2)
      expect(events[0].id).toBe('tx-8')
      expect(events[0].transactions.map((tx) => tx.revisionId)).toEqual(['tx-8', 'tx-4'])
      expect(events[1].id).toBe('tx-0')
    })

    it('accumulates distinct authors as contributors when merging', () => {
      const transactions = [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(0), author: 'author-1'}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(1), author: 'author-2'}),
      ]

      const [event] = getEditEvents(transactions, DRAFT_ID)
      expect(event.author).toBe('author-2')
      expect(event.contributors).toEqual(['author-2', 'author-1'])
      expect(event.transactions.map((tx) => tx.revisionId)).toEqual(['tx-2', 'tx-1'])
    })
  })

  describe('mergeEditEvents()', () => {
    const fetchedEdit = editTransaction({id: 'tx-fetched', timestamp: minutesAfterBase(1)})
    const liveEdit = editTransaction({
      id: 'tx-live',
      author: 'author-2',
      timestamp: minutesAfterBase(2),
    })

    it('groups consecutive edit events like one getEditEvents call over all their transactions', () => {
      const transactions = [
        editTransaction({id: 'tx-0', timestamp: minutesAfterBase(0)}),
        editTransaction({id: 'tx-4', timestamp: minutesAfterBase(4)}),
        editTransaction({id: 'tx-8', author: 'author-2', timestamp: minutesAfterBase(8)}),
      ]
      // tx-0 and tx-4 were fetched as one event, tx-8 was received live afterwards.
      const merged = mergeEditEvents([
        ...getEditEvents(transactions.slice(2), DRAFT_ID),
        ...getEditEvents(transactions.slice(0, 2), DRAFT_ID),
      ])
      expect(merged).toEqual(getEditEvents(transactions, DRAFT_ID))
      // The window is anchored to the newest transaction, so tx-0 starts its own event again.
      expect(merged.map((event) => event.id)).toEqual(['tx-8', 'tx-0'])
    })

    it('never groups edit events on both sides of another event', () => {
      const events = [
        ...getEditEvents([liveEdit], DRAFT_ID),
        createDocumentVersionEvent({timestamp: minutesAfterBase(1.5)}),
        ...getEditEvents([fetchedEdit], DRAFT_ID),
      ]
      expect(mergeEditEvents(events)).toEqual(events)
    })

    it('keeps a transaction found in more than one edit event once', () => {
      const merged = mergeEditEvents([
        ...getEditEvents([liveEdit, fetchedEdit], DRAFT_ID),
        ...getEditEvents([fetchedEdit], DRAFT_ID),
      ])
      expect(merged).toEqual(getEditEvents([liveEdit, fetchedEdit], DRAFT_ID))
    })

    it('leaves the edit events nested under an expanded publish as they are', () => {
      const [expanded] = getEditEvents([fetchedEdit], DRAFT_ID)
      const events = [...getEditEvents([liveEdit], DRAFT_ID), {...expanded, parentId: 'tx-publish'}]
      expect(mergeEditEvents(events)).toEqual(events)
    })
  })

  describe('addEditTransactionEvents()', () => {
    const transactions = [
      editTransaction({id: 'tx-1', timestamp: minutesAfterBase(1), author: 'author-1'}),
      editTransaction({id: 'tx-2', timestamp: minutesAfterBase(2), author: 'author-2'}),
      editTransaction({id: 'tx-3', timestamp: minutesAfterBase(3), author: 'author-1'}),
    ]

    it('lists the transactions older than the group revision after the group, newest first', () => {
      const [group] = getEditEvents(transactions, DRAFT_ID)
      const create = createDocumentVersionEvent()

      const result = addEditTransactionEvents([group, create])

      expect(result).toEqual([
        group,
        {
          type: 'editDocumentVersion',
          documentId: DRAFT_ID,
          documentVariantType: 'draft',
          id: 'tx-2',
          revisionId: 'tx-2',
          timestamp: minutesAfterBase(2),
          author: 'author-2',
          contributors: ['author-2'],
          transactions: [group.transactions[1]],
          parentId: 'tx-3',
          isTransaction: true,
        },
        expect.objectContaining({id: 'tx-1', parentId: 'tx-3', isTransaction: true}),
        create,
      ])
    })

    it('lists nothing for an edit event with a single transaction', () => {
      const events = getEditEvents(transactions.slice(0, 1), DRAFT_ID)
      expect(addEditTransactionEvents(events)).toEqual(events)
    })

    it('skips the publish revision when the group id was re-pointed at its second transaction', () => {
      // `addParentToEvents` moves the id of the last edit before a publish to its second
      // transaction, as the first one is the revision the publish event already stands for.
      const [group] = getEditEvents(transactions, DRAFT_ID)
      const publish = publishDocumentVersionEvent({id: 'tx-3', versionRevisionId: 'tx-3'})
      const nested = {...group, id: 'tx-2', parentId: publish.id}

      const result = addEditTransactionEvents([publish, nested])

      expect(result.map((event) => event.id)).toEqual(['tx-3', 'tx-2', 'tx-1'])
      expect(result[2]).toMatchObject({parentId: 'tx-2', isTransaction: true})
    })

    it('lists the transactions of edit events nested under an expanded publish', () => {
      const [group] = getEditEvents(transactions, DRAFT_ID)
      const nested = {...group, parentId: 'tx-publish'}

      const result = addEditTransactionEvents([nested])

      expect(result.map((event) => [event.id, 'parentId' in event && event.parentId])).toEqual([
        ['tx-3', 'tx-publish'],
        ['tx-2', 'tx-3'],
        ['tx-1', 'tx-3'],
      ])
    })
  })

  describe('getEffectState()', () => {
    it('classifies effects by their apply/revert delete patches', () => {
      expect(getEffectState(undefined)).toBe('noop')
      expect(getEffectState({apply: [0, null], revert: [11, 3]})).toBe('deleted')
      expect(getEffectState({apply: [11, 3], revert: [0, null]})).toBe('created')
      expect(getEffectState({apply: [11, 3], revert: [11, 4]})).toBe('modified')
      // A transaction that both creates and deletes reports 'deleted' (apply wins).
      expect(getEffectState({apply: [0, null], revert: [0, null]})).toBe('deleted')
    })
  })
})
