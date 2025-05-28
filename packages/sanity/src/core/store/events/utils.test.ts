import {describe, expect, it} from 'vitest'

import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from './types'
import {addParentToEvents, sortEvents} from './utils'

describe('addParentToEvents', () => {
  it('should add the correct parentId to the events', () => {})
})

describe('sortEvents', () => {
  it('should sort events in the right order, if published and edited have same timestamp, published goes first ', () => {
    const remoteEdits: (UpdateLiveDocumentEvent | EditDocumentVersionEvent)[] = []
    const events: DocumentGroupEvent[] = [
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T11:46:10Z',
        documentId: 'b149d8d0-a4eb-451e-8160-4e489380b670',
        revisionId: '5IENz7UduDBgah5qw8P7st',
        releaseId: '',
        versionId: 'drafts.b149d8d0-a4eb-451e-8160-4e489380b670',
        versionRevisionId: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
        publishCause: 'document.publish',
        id: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T11:46:05Z',
        documentId: 'b149d8d0-a4eb-451e-8160-4e489380b670',
        releaseId: '',
        versionId: 'drafts.b149d8d0-a4eb-451e-8160-4e489380b670',
        versionRevisionId: 'a45d633f-f692-409a-8b5a-423eab31dd9f',
        id: 'a45d633f-f692-409a-8b5a-423eab31dd9f',
        parentId: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
      },
    ]
    const expandedEvents: EditDocumentVersionEvent[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.b149d8d0-a4eb-451e-8160-4e489380b670',
        id: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
        timestamp: '2025-01-23T11:46:10.620240Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T11:46:10.620240Z',
            revisionId: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T11:46:06.415469Z',
            revisionId: 'caa420f8-fae4-41c1-9e68-057e5cc0b3cd',
          },
        ],
        parentId: 'b3075281-d9f1-41d0-9304-bca31a6ec958',
      },
    ]
    const result = sortEvents({events, remoteEdits, expandedEvents})
    expect(result[0].type).toBe('publishDocumentVersion')
    expect(result[1].type).toBe('editDocumentVersion')
    expect(result[2].type).toBe('createDocumentVersion')
  })
  it('should handle remote edits correctly', () => {
    const remoteEdits: (UpdateLiveDocumentEvent | EditDocumentVersionEvent)[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        timestamp: '2025-01-23T13:37:13.450Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T13:37:13.450Z',
            revisionId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T13:37:09.416Z',
            revisionId: '45a3edd4-3975-4fa2-89ce-77d40b8de86f',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T13:37:07.984Z',
            revisionId: 'd16f0b19-8aeb-4628-a377-0153c48828aa',
          },
        ],
      },
    ]
    const events: DocumentGroupEvent[] = [
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T13:37:12Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        id: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        parentId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
      },
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T13:37:17Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        revisionId: 'Fa2iQBQggalMSxRpi8pie2',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        publishCause: 'document.publish',
        id: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
      },
    ]
    const expandedEvents: EditDocumentVersionEvent[] = []
    const result = sortEvents({events, remoteEdits, expandedEvents})
    expect(result[0].type).toBe('publishDocumentVersion')
    expect(result[1].type).toBe('editDocumentVersion')
    expect(result[2].type).toBe('createDocumentVersion')
  })
})

describe('addParentToEvents', () => {
  it('should add the parents', () => {
    const events: DocumentGroupEvent[] = [
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: '0d2e2557-d165-48f7-866e-31231232',
        timestamp: '2025-01-23T15:00:05.081Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '0d2e2557-d165-48f7-866e-31231232',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T15:00:05.081Z',
            revisionId: '0d2e2557-d165-48f7-866e-31231232',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T15:00:03.842Z',
            revisionId: 'f3d6993d-3147-4b2e-8e98-b7e09e69de82',
          },
        ],
      },
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T14:00:08Z',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        revisionId: 'Fa2iQBQggalMSxRpi8prWU',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        publishCause: 'document.publish',
        id: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
      },
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        timestamp: '2025-01-23T14:00:05.081Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T14:00:05.081Z',
            revisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T14:00:03.842Z',
            revisionId: 'f3d6993d-3147-4b2e-8e98-b7e09e69de82',
          },
        ],
      },
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: '625db1c4-24a8-4f58-b60a-d70574624dd9',
        timestamp: '2025-01-23T13:57:15.574671Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '625db1c4-24a8-4f58-b60a-d70574624dd9',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T13:57:15.574671Z',
            revisionId: '625db1c4-24a8-4f58-b60a-d70574624dd9',
          },
        ],
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T13:57:14Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '6818a2df-ad70-460f-b827-6e40beeb1518',
        id: '6818a2df-ad70-460f-b827-6e40beeb1518',
        parentId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
      },
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T13:37:17Z',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        revisionId: 'Fa2iQBQggalMSxRpi8pie2',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        publishCause: 'document.publish',
        id: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        creationEvent: {
          author: 'p8xDvUMxC',
          type: 'createDocumentVersion',
          timestamp: '2025-01-23T13:37:12Z',
          documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
          releaseId: '',
          versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
          versionRevisionId: '1fc72aa1-9870-4020-8a88-9ad18f199840',
          id: '1fc72aa1-9870-4020-8a88-9ad18f199840',
          parentId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        },
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T13:37:12Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        id: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        parentId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
      },
    ]
    const result = addParentToEvents(events)
    expect(result).toEqual([
      // This event is not modified
      events[0],
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T14:00:08Z',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        revisionId: 'Fa2iQBQggalMSxRpi8prWU',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        publishCause: 'document.publish',
        id: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        // Creation event is added given his is a published event
        creationEvent: {
          author: 'p8xDvUMxC',
          type: 'createDocumentVersion',
          timestamp: '2025-01-23T13:57:14Z',
          documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
          releaseId: '',
          versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
          versionRevisionId: '6818a2df-ad70-460f-b827-6e40beeb1518',
          id: '6818a2df-ad70-460f-b827-6e40beeb1518',
          parentId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        },
      },
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: 'f3d6993d-3147-4b2e-8e98-b7e09e69de82',
        timestamp: '2025-01-23T14:00:05.081Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T14:00:05.081Z',
            revisionId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
          },
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T14:00:03.842Z',
            revisionId: 'f3d6993d-3147-4b2e-8e98-b7e09e69de82',
          },
        ],
        // Parent id is added given this is an edit event
        parentId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
      },
      {
        type: 'editDocumentVersion',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        id: '625db1c4-24a8-4f58-b60a-d70574624dd9',
        timestamp: '2025-01-23T13:57:15.574671Z',
        author: 'p8xDvUMxC',
        contributors: ['p8xDvUMxC'],
        revisionId: '625db1c4-24a8-4f58-b60a-d70574624dd9',
        transactions: [
          {
            type: 'editTransaction',
            author: 'p8xDvUMxC',
            timestamp: '2025-01-23T13:57:15.574671Z',
            revisionId: '625db1c4-24a8-4f58-b60a-d70574624dd9',
          },
        ],
        // Parent id is added given this is an edit event
        parentId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T13:57:14Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '6818a2df-ad70-460f-b827-6e40beeb1518',
        id: '6818a2df-ad70-460f-b827-6e40beeb1518',
        // Parent id is added given this is a create event
        parentId: '0d2e2557-d165-48f7-866e-1b664f25a5a5',
      },
      {
        author: 'p8xDvUMxC',
        type: 'publishDocumentVersion',
        timestamp: '2025-01-23T13:37:17Z',
        documentId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        revisionId: 'Fa2iQBQggalMSxRpi8pie2',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        publishCause: 'document.publish',
        id: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        creationEvent: {
          author: 'p8xDvUMxC',
          type: 'createDocumentVersion',
          timestamp: '2025-01-23T13:37:12Z',
          documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
          releaseId: '',
          versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
          versionRevisionId: '1fc72aa1-9870-4020-8a88-9ad18f199840',
          id: '1fc72aa1-9870-4020-8a88-9ad18f199840',
          parentId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
        },
      },
      {
        author: 'p8xDvUMxC',
        type: 'createDocumentVersion',
        timestamp: '2025-01-23T13:37:12Z',
        documentId: 'bcbfdedd-a719-4959-98fb-f68c8851d32f',
        releaseId: '',
        versionId: 'drafts.bcbfdedd-a719-4959-98fb-f68c8851d32f',
        versionRevisionId: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        id: '1fc72aa1-9870-4020-8a88-9ad18f199840',
        // Parent id is added given this is a create event
        parentId: '577b6fa4-ceba-40bd-babd-9ffbcfff682d',
      },
    ])
  })
})
