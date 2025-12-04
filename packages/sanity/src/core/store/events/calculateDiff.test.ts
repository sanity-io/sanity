import {describe, expect, it} from 'vitest'

import {calculateDiff} from './calculateDiff'
import {type DocumentGroupEvent} from './types'

describe('calculateDiff', () => {
  it('should calculate the diff between the initial and final document when adding values', () => {
    const initialDoc = {
      _createdAt: '2025-12-04T15:21:51Z',
      _id: 'drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a',
      _rev: '9b52f140-fb84-4e82-82ed-c5d80ed2422a',
      _type: 'author',
      _updatedAt: '2025-12-04T15:21:51Z',
      name: 'foo',
    }
    const documentId = 'drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a'
    const transactions = [
      {
        id: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
        timestamp: '2025-12-04T15:22:07.930920Z',
        author: 'p8xDvUMxC',
        documentIDs: ['drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a'],
        effects: {
          'drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a': {
            apply: [11, 3, 23, 0, 15, 22, '2:07', 23, 19, 20, 15, 17, 'foo bar', 'name'],
            revert: [10, 0, 14, '_updatedAt', 17, 'foo', 'name'],
          },
        },
      },
    ]
    const events: DocumentGroupEvent[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a',
        id: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
        timestamp: '2025-12-04T15:22:07.930Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-12-04T15:22:07.930Z',
            revisionId: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
          },
        ],
        documentVariantType: 'draft',
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-12-04T15:21:51Z',
        documentId: '43bfd2c2-565a-4c17-b6d2-243b8538384a',
        releaseId: '',
        versionId: 'drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a',
        versionRevisionId: '9b52f140-fb84-4e82-82ed-c5d80ed2422a',
        id: '9b52f140-fb84-4e82-82ed-c5d80ed2422a',
        documentVariantType: 'draft',
      },
    ] as const
    const diff = calculateDiff({initialDoc, documentId, transactions, events})
    expect(diff).toMatchInlineSnapshot(`
      {
        "action": "changed",
        "annotation": {
          "author": "p8xDvUMxC",
          "event": undefined,
          "timestamp": "2025-12-04T15:22:07.930920Z",
        },
        "fields": {
          "name": {
            "action": "changed",
            "annotation": {
              "author": "p8xDvUMxC",
              "event": undefined,
              "timestamp": "2025-12-04T15:22:07.930920Z",
            },
            "fromValue": "foo",
            "isChanged": true,
            "segments": [
              {
                "action": "unchanged",
                "text": "foo",
                "type": "stringSegment",
              },
              {
                "action": "added",
                "annotation": {
                  "author": "p8xDvUMxC",
                  "event": undefined,
                  "timestamp": "2025-12-04T15:22:07.930920Z",
                },
                "text": " bar",
                "type": "stringSegment",
              },
            ],
            "toValue": "foo bar",
            "type": "string",
          },
        },
        "fromValue": {
          "_createdAt": "2025-12-04T15:21:51Z",
          "_id": "drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a",
          "_rev": "9b52f140-fb84-4e82-82ed-c5d80ed2422a",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:21:51Z",
          "name": "foo",
        },
        "isChanged": true,
        "toValue": {
          "_createdAt": "2025-12-04T15:21:51Z",
          "_id": "drafts.43bfd2c2-565a-4c17-b6d2-243b8538384a",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:22:07Z",
          "name": "foo bar",
        },
        "type": "object",
      }
    `)
    expect(diff.fields.name.action).toBe('changed')
    expect(diff.fields.name.annotation).not.toBeNull()
  })
  it('should calculate the diff between the initial and final document when removing values', () => {
    const initialDoc = {
      _createdAt: '2025-12-04T15:25:51Z',
      _id: 'drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d',
      _rev: 'f6266dd2-f0c8-4621-ac46-5efb6d53de39',
      _type: 'author',
      _updatedAt: '2025-12-04T15:25:52Z',
      name: 'bar',
    }
    const documentId = 'drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d'
    const transactions = [
      {
        id: '728ea45c-b994-4a18-ac0e-a51594721d57',
        timestamp: '2025-12-04T15:25:55.873634Z',
        author: 'p8xDvUMxC',
        documentIDs: ['drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d'],
        effects: {
          'drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d': {
            apply: [19, 4, 11, 3, 23, 0, 18, 22, '5', 23, 19, 20, 15],
            revert: [11, 3, 23, 0, 18, 22, '2', 23, 19, 20, 15, 17, 'bar', 'name'],
          },
        },
      },
    ]
    const events: DocumentGroupEvent[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d',
        id: '728ea45c-b994-4a18-ac0e-a51594721d57',
        timestamp: '2025-12-04T15:25:55.873Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '728ea45c-b994-4a18-ac0e-a51594721d57',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-12-04T15:25:55.873Z',
            revisionId: '728ea45c-b994-4a18-ac0e-a51594721d57',
          },
        ],
        documentVariantType: 'draft',
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-12-04T15:25:52Z',
        documentId: '6ee654a6-d6a4-4f68-84a6-4b9c06789c4d',
        releaseId: '',
        versionId: 'drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d',
        versionRevisionId: 'f6266dd2-f0c8-4621-ac46-5efb6d53de39',
        id: 'f6266dd2-f0c8-4621-ac46-5efb6d53de39',
        documentVariantType: 'draft',
      },
    ]
    const diff = calculateDiff({initialDoc, documentId, transactions, events})
    expect(diff).toMatchInlineSnapshot(`
      {
        "action": "changed",
        "annotation": {
          "author": "p8xDvUMxC",
          "event": undefined,
          "timestamp": "2025-12-04T15:25:55.873634Z",
        },
        "fields": {
          "name": {
            "action": "removed",
            "annotation": {
              "author": "p8xDvUMxC",
              "event": undefined,
              "timestamp": "2025-12-04T15:25:55.873634Z",
            },
            "fromValue": "bar",
            "isChanged": true,
            "segments": [
              {
                "action": "removed",
                "annotation": {
                  "author": "p8xDvUMxC",
                  "event": undefined,
                  "timestamp": "2025-12-04T15:25:55.873634Z",
                },
                "text": "bar",
                "type": "stringSegment",
              },
            ],
            "toValue": undefined,
            "type": "string",
          },
        },
        "fromValue": {
          "_createdAt": "2025-12-04T15:25:51Z",
          "_id": "drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d",
          "_rev": "f6266dd2-f0c8-4621-ac46-5efb6d53de39",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:25:52Z",
          "name": "bar",
        },
        "isChanged": true,
        "toValue": {
          "_createdAt": "2025-12-04T15:25:51Z",
          "_id": "drafts.6ee654a6-d6a4-4f68-84a6-4b9c06789c4d",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:25:55Z",
        },
        "type": "object",
      }
    `)
    expect(diff.fields.name.action).toBe('removed')
    expect(diff.fields.name.annotation).not.toBeNull()
  })
})
