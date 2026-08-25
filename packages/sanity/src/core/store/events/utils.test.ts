import {describe, expect, it} from 'vitest'

import {
  BASE_TIME,
  createDocumentVersionEvent,
  createLiveDocumentEvent,
  deleteDocumentGroupEvent,
  deleteDocumentVersionEvent,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
  scheduleDocumentVersionEvent,
  unpublishDocumentEvent,
  unscheduleDocumentVersionEvent,
  updateLiveDocumentEvent,
} from './__fixtures__/events.fixture'
import {remoteMutationEvent} from './__fixtures__/transactions.fixture'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from './types'
import {
  addEventId,
  addParentToEvents,
  isWithinMergeWindow,
  remoteMutationToTransaction,
  removeDupes,
  sortEvents,
  squashLiveEditEvents,
  updateVersionEvents,
} from './utils'

describe('addParentToEvents', () => {
  it('should add the correct parentId to the events', () => {})
})

describe('sortEvents', () => {
  it('should sort events in the right order, if published and edited have same timestamp, published goes first ', () => {
    const remoteEdits: (UpdateLiveDocumentEvent | EditDocumentVersionEvent)[] = []
    const events: DocumentGroupEvent[] = [
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
        // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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

describe('sortEvents (paired publish/edit)', () => {
  it('sorts a publish before its paired edit even when the edit timestamp is newer', () => {
    const edit = editDocumentVersionEvent({
      revisionId: 'edit-rev',
      id: 'edit-rev',
      timestamp: minutesAfterBase(1),
    })
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'edit-rev',
      timestamp: BASE_TIME,
    })

    const result = sortEvents({remoteEdits: [edit], events: [publish], expandedEvents: []})
    expect(result.map((event) => event.type)).toEqual([
      'publishDocumentVersion',
      'editDocumentVersion',
    ])
  })

  it('produces the same order regardless of input order (transitive sort)', () => {
    // A publish whose timestamp trails its paired edit, plus an unrelated event in between:
    // the comparator-based sort used to be non-transitive here and depended on input order.
    const edit = editDocumentVersionEvent({
      revisionId: 'edit-rev',
      id: 'edit-rev',
      timestamp: minutesAfterBase(2),
    })
    const unrelated = createDocumentVersionEvent({id: 'unrelated', timestamp: minutesAfterBase(1)})
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'edit-rev',
      timestamp: BASE_TIME,
    })

    const orderings = [
      [edit, unrelated, publish],
      [publish, unrelated, edit],
      [unrelated, publish, edit],
    ].map((events) =>
      sortEvents({remoteEdits: [], events, expandedEvents: []}).map((event) => event.id),
    )

    expect(orderings[0]).toEqual([publish.id, 'edit-rev', 'unrelated'])
    expect(orderings[1]).toEqual(orderings[0])
    expect(orderings[2]).toEqual(orderings[0])
  })
})

describe('removeDupes', () => {
  it('appends events with unseen ids in encounter order', () => {
    const create = createDocumentVersionEvent({id: 'a'})
    const edit = editDocumentVersionEvent({id: 'b'})
    const publish = publishDocumentVersionEvent({id: 'c'})

    expect(removeDupes([create, edit], [publish])).toEqual([create, edit, publish])
    expect(removeDupes([create], [create])).toEqual([create])
  })

  it('replaces an existing edit event with a non-edit event sharing the same id', () => {
    // A publish event and the last edit before that publish share the same id.
    const edit = editDocumentVersionEvent({id: 'shared', revisionId: 'shared'})
    const publish = publishDocumentVersionEvent({id: 'shared'})

    const result = removeDupes([edit], [publish])
    // Known quirk: because the types also differ, the publish is stored under both the plain id
    // key and the synthetic `${id}-${type}` key, so it appears twice in the output.
    expect(result).toEqual([publish, publish])
  })

  it('keeps both events when two non-edit events share an id but differ in type', () => {
    const create = createDocumentVersionEvent({id: 'shared'})
    const publish = publishDocumentVersionEvent({id: 'shared'})

    expect(removeDupes([create], [publish])).toEqual([create, publish])
  })

  it('keeps only the first event when two events share id and type', () => {
    const first = createDocumentVersionEvent({id: 'shared', author: 'author-1'})
    const second = createDocumentVersionEvent({id: 'shared', author: 'author-2'})

    expect(removeDupes([first], [second])).toEqual([first])
  })

  it('collides all empty-string ids onto one key (known quirk)', () => {
    // addEventId produces empty ids e.g. for unpublish events on non-published variants.
    const first = unpublishDocumentEvent({id: '', timestamp: BASE_TIME})
    const second = unpublishDocumentEvent({id: '', timestamp: minutesAfterBase(1)})

    expect(removeDupes([], [first, second])).toEqual([first])
  })
})

describe('addEventId', () => {
  it('createDocumentVersion: published uses revisionId, falling back to a synthetic id', () => {
    const withRevision = createDocumentVersionEvent({revisionId: 'pub-rev'})
    expect(addEventId(withRevision, 'published').id).toBe('pub-rev')

    const withoutRevision = createDocumentVersionEvent({timestamp: BASE_TIME})
    expect(addEventId(withoutRevision, 'published').id).toBe(`publishCreation--${BASE_TIME}`)

    expect(addEventId(createDocumentVersionEvent(), 'draft').id).toBe(
      createDocumentVersionEvent().versionRevisionId,
    )
  })

  it('deleteDocumentVersion: published gets a synthetic deleteAt id, versions use versionRevisionId', () => {
    const event = deleteDocumentVersionEvent({timestamp: BASE_TIME})
    expect(addEventId(event, 'published').id).toBe(`deleteAt-${BASE_TIME}`)
    expect(addEventId(event, 'draft').id).toBe(event.versionRevisionId)
  })

  it('publishDocumentVersion: published uses revisionId, versions prefer versionRevisionId', () => {
    const event = publishDocumentVersionEvent({
      revisionId: 'published-rev',
      versionRevisionId: 'version-rev',
    })
    expect(addEventId(event, 'published').id).toBe('published-rev')
    expect(addEventId(event, 'draft').id).toBe('version-rev')

    // Release publishes have no versionRevisionId: falls back to revisionId.
    const releasePublish = publishDocumentVersionEvent({
      revisionId: 'published-rev',
      versionRevisionId: undefined,
      publishCause: 'release.publish',
    })
    expect(addEventId(releasePublish, 'version').id).toBe('published-rev')
  })

  it('unpublishDocument: synthetic id on published, empty string otherwise (known quirk)', () => {
    const event = unpublishDocumentEvent({timestamp: BASE_TIME})
    expect(addEventId(event, 'published').id).toBe(`unpublishAt-${BASE_TIME}`)
    expect(addEventId(event, 'draft').id).toBe('')
  })

  it('schedule/unschedule: versionRevisionId on versions, empty string on published (known quirk)', () => {
    const schedule = scheduleDocumentVersionEvent()
    expect(addEventId(schedule, 'version').id).toBe(schedule.versionRevisionId)
    expect(addEventId(schedule, 'published').id).toBe('')

    const unschedule = unscheduleDocumentVersionEvent()
    expect(addEventId(unschedule, 'version').id).toBe(unschedule.versionRevisionId)
    expect(addEventId(unschedule, 'published').id).toBe('')
  })

  it('deleteDocumentGroup gets a synthetic deleted-<timestamp> id on every variant', () => {
    const event = deleteDocumentGroupEvent({timestamp: BASE_TIME})
    expect(addEventId(event, 'published').id).toBe(`deleted-${BASE_TIME}`)
    expect(addEventId(event, 'draft').id).toBe(`deleted-${BASE_TIME}`)
  })

  it('live and edit events use their revisionId', () => {
    const createLive = createLiveDocumentEvent({revisionId: 'live-rev'})
    expect(addEventId(createLive, 'published').id).toBe('live-rev')

    const updateLive = updateLiveDocumentEvent({revisionId: 'live-rev-2'})
    expect(addEventId(updateLive, 'published').id).toBe('live-rev-2')

    const edit = editDocumentVersionEvent({revisionId: 'edit-rev'})
    expect(addEventId(edit, 'draft').id).toBe('edit-rev')
  })
})

describe('isWithinMergeWindow', () => {
  it('is true below 5 minutes, false at exactly 5 minutes, regardless of argument order', () => {
    expect(isWithinMergeWindow(BASE_TIME, minutesAfterBase(4))).toBe(true)
    expect(isWithinMergeWindow(minutesAfterBase(4), BASE_TIME)).toBe(true)
    expect(isWithinMergeWindow(BASE_TIME, minutesAfterBase(5))).toBe(false)
    expect(isWithinMergeWindow(BASE_TIME, minutesAfterBase(6))).toBe(false)
  })
})

describe('squashLiveEditEvents', () => {
  it('squashes adjacent same-author live edits within the merge window, keeping the first in list order', () => {
    const newest = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(4)})
    const oldest = updateLiveDocumentEvent({id: 'live-1', timestamp: BASE_TIME})

    expect(squashLiveEditEvents([newest, oldest])).toEqual([newest])
  })

  it('does not squash live edits by different authors', () => {
    const a = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(4)})
    const b = updateLiveDocumentEvent({id: 'live-1', timestamp: BASE_TIME, author: 'author-2'})

    expect(squashLiveEditEvents([a, b])).toEqual([a, b])
  })

  it('does not squash live edits outside the merge window', () => {
    const a = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(10)})
    const b = updateLiveDocumentEvent({id: 'live-1', timestamp: BASE_TIME})

    expect(squashLiveEditEvents([a, b])).toEqual([a, b])
  })

  it('breaks the run when another event type sits between live edits', () => {
    const a = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(2)})
    const between = deleteDocumentGroupEvent({timestamp: minutesAfterBase(1)})
    const b = updateLiveDocumentEvent({id: 'live-1', timestamp: BASE_TIME})

    expect(squashLiveEditEvents([a, between, b])).toEqual([a, between, b])
  })
})

describe('remoteMutationToTransaction', () => {
  it('maps a remote mutation into the translog transaction shape', () => {
    const mutation = remoteMutationEvent()
    const transaction = remoteMutationToTransaction(mutation)

    expect(transaction).toEqual({
      id: mutation.transactionId,
      author: mutation.author,
      timestamp: mutation.timestamp.toISOString(),
      documentIDs: [],
      effects: {
        [mutation.head._id]: {
          apply: mutation.effects.apply,
          revert: mutation.effects.revert,
        },
      },
    })
  })
})

describe('updateVersionEvents', () => {
  it('rewrites documentId to versionId on publish events only', () => {
    const publish = publishDocumentVersionEvent({versionId: 'versions.rX.doc-1'})
    const edit = editDocumentVersionEvent()

    const result = updateVersionEvents([publish, edit])
    expect(result[0]).toEqual({...publish, documentId: 'versions.rX.doc-1'})
    expect(result[1]).toBe(edit)
  })
})
