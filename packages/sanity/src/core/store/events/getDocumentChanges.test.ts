import {type SanityClient} from '@sanity/client'
import {
  type SanityDocument,
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
} from '@sanity/types'
import {filter, firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getDocumentChanges} from './getDocumentChanges'
import {getDocumentTransactions} from './getDocumentTransactions'
import {
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from './types'
import {type EventsObservableValue} from './useEventsStore'

vi.mock('./getDocumentTransactions', () => ({
  getDocumentTransactions: vi.fn(),
}))

const getDocumentTransactionsMock = vi.mocked(getDocumentTransactions)

const publishedDoc = {
  _createdAt: '2025-12-04T15:21:51Z',
  _id: 'doc-1',
  _rev: 'publish-revision-id',
  _type: 'author',
  _updatedAt: '2025-12-04T15:21:51Z',
  name: 'foo',
} satisfies SanityDocument

const staleDraftTx: TransactionLogEventWithEffects & TransactionLogEventWithMutations = {
  id: '81c6d51a-e35c-4dd9-b6ee-9a096df5896b',
  timestamp: '2025-12-04T15:22:07.930920Z',
  author: 'p8xDvUMxC',
  documentIDs: ['drafts.doc-1'],
  mutations: [],
  effects: {
    'drafts.doc-1': {
      apply: [11, 3, 23, 0, 15, 22, '2:07', 23, 19, 20, 15, 17, 'foo bar', 'name'],
      revert: [10, 0, 14, '_updatedAt', 17, 'foo', 'name'],
    },
  },
}

const publishEvent: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish-event-id',
  timestamp: '2026-01-01T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  revisionId: 'publish-revision-id',
  versionId: 'drafts.doc-1',
  publishCause: 'document.publish',
}

const editEvent: EditDocumentVersionEvent = {
  type: 'editDocumentVersion',
  id: 'edit-event-id',
  timestamp: '2026-01-02T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'drafts.doc-1',
  contributors: ['author-1'],
  revisionId: 'edit-revision-id',
  transactions: [],
}

const discardVersionEvent: DeleteDocumentVersionEvent = {
  type: 'deleteDocumentVersion',
  id: 'discard-event-id',
  timestamp: '2026-01-03T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
  versionId: 'drafts.doc-1',
  versionRevisionId: 'discard-version-revision-id',
}

const discardGroupEvent: DeleteDocumentGroupEvent = {
  type: 'deleteDocumentGroup',
  id: 'deleted-2026-01-03T00:00:00.000Z',
  timestamp: '2026-01-03T00:00:00.000Z',
  author: 'author-1',
  documentVariantType: 'draft',
  documentId: 'doc-1',
}

function eventsValue(events: EventsObservableValue['events']): EventsObservableValue {
  return {events, nextCursor: '', loading: false, error: null}
}

async function collectDiff(events: EventsObservableValue['events']) {
  return firstValueFrom(
    getDocumentChanges({
      eventsObservable$: of(eventsValue(events)),
      to$: of(null),
      since$: of({
        document: publishedDoc,
        loading: false,
        revisionId: publishedDoc._rev,
      }),
      remoteTransactions$: of([staleDraftTx]),
      documentId: 'drafts.doc-1',
      client: {} as SanityClient,
    }).pipe(filter((value) => !value.loading)),
  )
}

describe('getDocumentChanges()', () => {
  beforeEach(() => {
    getDocumentTransactionsMock.mockReset()
    getDocumentTransactionsMock.mockResolvedValue([staleDraftTx])
  })

  it('does not replay a stale draft translog after discarding a published document draft', async () => {
    const result = await collectDiff([discardVersionEvent, editEvent, publishEvent])

    expect(getDocumentTransactionsMock).not.toHaveBeenCalled()
    expect(result.error).toBeNull()
    expect(result.diff?.isChanged).toBe(false)
  })

  it('does not replay a stale draft translog after a deleteDocumentGroup event', async () => {
    const result = await collectDiff([discardGroupEvent, editEvent])

    expect(getDocumentTransactionsMock).not.toHaveBeenCalled()
    expect(result.error).toBeNull()
    expect(result.diff?.isChanged).toBe(false)
  })
})
