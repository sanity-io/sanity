import {describe, expect, it} from 'vitest'

import {DRAFT_ID, minutesAfterBase} from './__fixtures__/events.fixture'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {getEditEvents, getEffectState} from './getEditEvents'
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
        false,
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
        false,
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
        false,
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

      const events = getEditEvents([variantTx], variantDocumentId, false)

      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        type: 'editDocumentVersion',
        documentId: variantDocumentId,
        documentVariantType: 'version',
      })
      expect(events[0]).not.toHaveProperty('releaseId')
    })
  })
  describe('when the document is liveEdit', () => {
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
      const events = getEditEvents(
        editTransactions,
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        true,
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
      const events = getEditEvents(
        [...editTransactions, newTransaction],
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
        true,
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
        true,
      )
      expect(events).toEqual([expectedEvent])
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

      const events = getEditEvents(transactions, DRAFT_ID, false)
      expect(events).toHaveLength(2)
      expect(events[0].id).toBe('tx-8')
      expect(
        (events[0] as EditDocumentVersionEvent).transactions.map((tx) => tx.revisionId),
      ).toEqual(['tx-8', 'tx-4'])
      expect(events[1].id).toBe('tx-0')
    })

    it('accumulates distinct authors as contributors when merging', () => {
      const transactions = [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(0), author: 'author-1'}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(1), author: 'author-2'}),
      ]

      const [event] = getEditEvents(transactions, DRAFT_ID, false) as EditDocumentVersionEvent[]
      expect(event.author).toBe('author-2')
      expect(event.contributors).toEqual(['author-2', 'author-1'])
      expect(event.transactions.map((tx) => tx.revisionId)).toEqual(['tx-2', 'tx-1'])
    })

    it('liveEdit drops merged in-window transactions entirely, including other authors', () => {
      // Live edit checks for the events received from the events api, not the transactions.
      const transactions = [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(0), author: 'author-1'}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(1), author: 'author-2'}),
      ]

      const events = getEditEvents(transactions, DRAFT_ID, true)
      // Only the newest transaction survives; author-1's edit leaves no trace.
      expect(events).toEqual([
        expect.objectContaining({type: 'updateLiveDocument', id: 'tx-2', author: 'author-2'}),
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
