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
  })
  it('should handle additions and removals in multiple transactions', () => {
    const initialDoc = {
      _createdAt: '2025-12-04T15:58:23Z',
      _id: 'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8',
      _rev: '4318b535-f950-460e-b334-cd84c054804c',
      _type: 'author',
      _updatedAt: '2025-12-04T15:58:23Z',
      name: 'Foo',
    }
    const documentId = 'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8'
    const transactions = [
      {
        id: '0f16838b-ba66-4719-a916-ad6cfe18ccf1',
        timestamp: '2025-12-04T15:58:28.105248Z',
        author: 'p8xDvUMxC',

        documentIDs: ['drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8'],
        effects: {
          'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8': {
            apply: [11, 3, 23, 0, 18, 22, '8', 23, 19, 20, 15, 17, 'F', 'name'],
            revert: [10, 0, 14, '_updatedAt', 17, 'Foo', 'name'],
          },
        },
      },
      {
        id: '8532447b-3639-4b9b-abf0-9be4c6e80fdd',
        timestamp: '2025-12-04T15:58:34.265377Z',
        author: 'p8xDvUMxC',
        documentIDs: ['drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8'],
        effects: {
          'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8': {
            apply: [11, 3, 23, 0, 17, 22, '34', 23, 19, 20, 15, 17, 'developer', 'role'],
            revert: [19, 5, 11, 3, 23, 0, 17, 22, '28', 23, 19, 20, 15],
          },
        },
      },
    ]
    const events: DocumentGroupEvent[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8',
        id: '8532447b-3639-4b9b-abf0-9be4c6e80fdd',
        timestamp: '2025-12-04T15:58:34.265Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '8532447b-3639-4b9b-abf0-9be4c6e80fdd',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-12-04T15:58:34.265Z',
            revisionId: '8532447b-3639-4b9b-abf0-9be4c6e80fdd',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-12-04T15:58:28.105Z',
            revisionId: '0f16838b-ba66-4719-a916-ad6cfe18ccf1',
          },
        ],
        documentVariantType: 'draft',
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-12-04T15:58:23Z',
        documentId: '102042fa-0115-4c2c-aa61-23cca17b9ad8',
        releaseId: '',
        versionId: 'drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8',
        versionRevisionId: '4318b535-f950-460e-b334-cd84c054804c',
        id: '4318b535-f950-460e-b334-cd84c054804c',
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
          "timestamp": "2025-12-04T15:58:34.265377Z",
        },
        "fields": {
          "name": {
            "action": "changed",
            "annotation": {
              "author": "p8xDvUMxC",
              "event": undefined,
              "timestamp": "2025-12-04T15:58:28.105248Z",
            },
            "fromValue": "Foo",
            "isChanged": true,
            "segments": [
              {
                "action": "unchanged",
                "text": "F",
                "type": "stringSegment",
              },
              {
                "action": "removed",
                "annotation": {
                  "author": "p8xDvUMxC",
                  "event": undefined,
                  "timestamp": "2025-12-04T15:58:28.105248Z",
                },
                "text": "oo",
                "type": "stringSegment",
              },
            ],
            "toValue": "F",
            "type": "string",
          },
          "role": {
            "action": "added",
            "annotation": {
              "author": "p8xDvUMxC",
              "event": undefined,
              "timestamp": "2025-12-04T15:58:34.265377Z",
            },
            "fromValue": undefined,
            "isChanged": true,
            "segments": [
              {
                "action": "added",
                "annotation": {
                  "author": "p8xDvUMxC",
                  "event": undefined,
                  "timestamp": "2025-12-04T15:58:34.265377Z",
                },
                "text": "developer",
                "type": "stringSegment",
              },
            ],
            "toValue": "developer",
            "type": "string",
          },
        },
        "fromValue": {
          "_createdAt": "2025-12-04T15:58:23Z",
          "_id": "drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8",
          "_rev": "4318b535-f950-460e-b334-cd84c054804c",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:58:23Z",
          "name": "Foo",
        },
        "isChanged": true,
        "toValue": {
          "_createdAt": "2025-12-04T15:58:23Z",
          "_id": "drafts.102042fa-0115-4c2c-aa61-23cca17b9ad8",
          "_type": "author",
          "_updatedAt": "2025-12-04T15:58:34Z",
          "name": "F",
          "role": "developer",
        },
        "type": "object",
      }
    `)
  })
})
