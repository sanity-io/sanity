import {
  type CreateDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getSinceEvents} from './getSinceEvents'

const DRAFT_ID = 'drafts.doc-1'
const TIMESTAMP = '2024-01-01T00:00:00.000Z'

function edit(id: string, overrides: Partial<EditDocumentVersionEvent> = {}) {
  return {
    type: 'editDocumentVersion',
    id,
    revisionId: id,
    timestamp: TIMESTAMP,
    author: 'author-1',
    contributors: ['author-1'],
    documentId: DRAFT_ID,
    documentVariantType: 'draft',
    transactions: [],
    ...overrides,
  } satisfies EditDocumentVersionEvent
}

const transaction = (id: string, parentId: string) => edit(id, {parentId, isTransaction: true})

const publish: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish',
  revisionId: 'publish',
  timestamp: TIMESTAMP,
  author: 'author-1',
  documentId: DRAFT_ID,
  documentVariantType: 'draft',
  versionId: DRAFT_ID,
  publishCause: 'document.publish',
}

const create: CreateDocumentVersionEvent = {
  type: 'createDocumentVersion',
  id: 'create',
  timestamp: TIMESTAMP,
  author: 'author-1',
  documentId: DRAFT_ID,
  documentVariantType: 'draft',
  versionId: DRAFT_ID,
  versionRevisionId: 'create',
  parentId: 'publish',
}

const EVENTS: DocumentGroupEvent[] = [
  edit('group'),
  transaction('group-tx-1', 'group'),
  transaction('group-tx-2', 'group'),
  publish,
  edit('published-group', {parentId: 'publish'}),
  create,
]

const ids = (events: DocumentGroupEvent[]) => events.map((event) => event.id)

describe('getSinceEvents', () => {
  it('lists every event but the newest when there is no "To" event', () => {
    expect(ids(getSinceEvents(EVENTS, null))).toEqual(ids(EVENTS.slice(1)))
  })

  it('leaves out the transactions listed under a grouped edit "To" event', () => {
    expect(ids(getSinceEvents(EVENTS, EVENTS[0]))).toEqual(['publish', 'published-group', 'create'])
  })

  it('lists the older siblings of a "To" transaction, keeping their parent', () => {
    const since = getSinceEvents(EVENTS, EVENTS[1])
    expect(ids(since)).toEqual(['group-tx-2', 'publish', 'published-group', 'create'])
    expect(since[0]).toMatchObject({parentId: 'group', isTransaction: true})
  })

  it('lists the events nested under a "To" publish', () => {
    expect(ids(getSinceEvents(EVENTS, publish))).toEqual(['published-group', 'create'])
  })
})
