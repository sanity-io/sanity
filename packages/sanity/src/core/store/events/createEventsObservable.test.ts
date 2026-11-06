import {type TransactionLogEventWithEffects} from '@sanity/types'
import {BehaviorSubject, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  deleteDocumentVersionEvent,
  DOCUMENT_ID,
  DRAFT_ID,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
  updateLiveDocumentEvent,
  VERSION_ID,
} from './__fixtures__/events.fixture'
import {deleteTransaction, editTransaction} from './__fixtures__/transactions.fixture'
import {
  applyVariantTransforms,
  createEventsObservable,
  getEditEventsFromTransactions,
  withHistoryClearedEvent,
} from './createEventsObservable'
import {type FetchedEventsValue, HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {type DocumentGroupEvent, isEditDocumentVersionEvent} from './types'

function fetchedValue(
  events: DocumentGroupEvent[],
  overrides: Partial<FetchedEventsValue> = {},
): FetchedEventsValue {
  return {
    events,
    nextCursor: '',
    loading: false,
    error: null,
    transactionBatches: [],
    historyCleared: false,
    ...overrides,
  }
}

function setup({
  documentId,
  events,
  isLiveEdit = false,
  ...overrides
}: {
  documentId: string
  events: DocumentGroupEvent[]
  isLiveEdit?: boolean
} & Partial<FetchedEventsValue>) {
  const events$ = new BehaviorSubject(fetchedValue(events, overrides))
  const remoteTransactions$ = new BehaviorSubject<TransactionLogEventWithEffects[]>([])
  const observable = createEventsObservable({
    documentId,
    isLiveEdit,
    events$,
    remoteTransactions$,
    expandedEvents$: of([]),
  })
  return {observable, events$, remoteTransactions$}
}

function groupedTransactions(events: DocumentGroupEvent[]) {
  return events.map((event) =>
    isEditDocumentVersionEvent(event) ? event.transactions.map((tx) => tx.revisionId) : event.type,
  )
}

describe('getEditEventsFromTransactions', () => {
  it('groups the newest batch together with the remote transactions', () => {
    const events = getEditEventsFromTransactions({
      transactionBatches: [[editTransaction({id: 'tx-fetched', timestamp: minutesAfterBase(1)})]],
      remoteTransactions: [editTransaction({id: 'tx-remote', timestamp: minutesAfterBase(2)})],
      documentId: DRAFT_ID,
      liveEdit: false,
    })
    expect(groupedTransactions(events)).toEqual([['tx-remote', 'tx-fetched']])
  })

  it('groups older batches on their own, so edits are not grouped across lifecycle changes', () => {
    const events = getEditEventsFromTransactions({
      transactionBatches: [
        [editTransaction({id: 'tx-before-publish', timestamp: minutesAfterBase(1)})],
        [deleteTransaction({id: 'tx-publish', timestamp: minutesAfterBase(2)})],
      ],
      remoteTransactions: [
        editTransaction({id: 'tx-after-publish', timestamp: minutesAfterBase(3)}),
      ],
      documentId: DRAFT_ID,
      liveEdit: false,
    })
    expect(groupedTransactions(events)).toEqual([['tx-after-publish'], ['tx-before-publish']])
  })

  it('groups a transaction found in several places once, with the newest batch', () => {
    const shared = editTransaction({id: 'tx-shared', timestamp: minutesAfterBase(1)})
    const events = getEditEventsFromTransactions({
      transactionBatches: [[shared], [shared]],
      remoteTransactions: [shared, editTransaction({id: 'tx-new', timestamp: minutesAfterBase(2)})],
      documentId: DRAFT_ID,
      liveEdit: false,
    })
    expect(groupedTransactions(events)).toEqual([['tx-new', 'tx-shared']])
  })

  it('synthesizes live edit events when asked to', () => {
    const events = getEditEventsFromTransactions({
      transactionBatches: [],
      remoteTransactions: [editTransaction({id: 'tx-live', documentId: DOCUMENT_ID})],
      documentId: DOCUMENT_ID,
      liveEdit: true,
    })
    expect(events).toEqual([expect.objectContaining({type: 'updateLiveDocument', id: 'tx-live'})])
  })
})

describe('withHistoryClearedEvent', () => {
  const editEvents = [
    editDocumentVersionEvent({revisionId: 'tx-2', timestamp: minutesAfterBase(10)}),
    editDocumentVersionEvent({revisionId: 'tx-1', timestamp: minutesAfterBase(5)}),
  ]

  it('prepends a historyCleared event when the history was cleared', () => {
    const result = withHistoryClearedEvent(editEvents, {
      historyCleared: true,
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result.map((event) => event.type)).toEqual([
      'historyCleared',
      'editDocumentVersion',
      'editDocumentVersion',
    ])
    expect(result[0]).toMatchObject({
      id: HISTORY_CLEARED_EVENT_ID,
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    // Timestamped 1ms before the oldest edit event so it sorts after it.
    expect(Date.parse(result[0].timestamp)).toBe(Date.parse(editEvents[1].timestamp) - 1)
  })

  it('returns the edit events untouched when the history was not cleared', () => {
    const result = withHistoryClearedEvent(editEvents, {
      historyCleared: false,
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result).toBe(editEvents)
  })

  it('returns the edit events untouched when there are no edits to anchor the timestamp to', () => {
    const result = withHistoryClearedEvent([], {
      historyCleared: true,
      documentId: DRAFT_ID,
      documentVariantType: 'draft',
    })
    expect(result).toEqual([])
  })
})

describe('applyVariantTransforms', () => {
  it('draft: links edits/creates to their publish event', () => {
    const create = createDocumentVersionEvent({timestamp: minutesAfterBase(0)})
    const edit = editDocumentVersionEvent({
      revisionId: 'edit-rev',
      id: 'edit-rev',
      timestamp: minutesAfterBase(1),
    })
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'edit-rev',
      timestamp: minutesAfterBase(2),
    })

    const result = applyVariantTransforms([publish, edit, create], 'draft')
    expect(result[0]).toMatchObject({
      documentId: publish.versionId,
      creationEvent: expect.objectContaining({type: 'createDocumentVersion'}),
    })
    expect(result[1]).toMatchObject({parentId: publish.id})
  })

  it('published: passes events through untouched', () => {
    const publish = publishDocumentVersionEvent()
    expect(applyVariantTransforms([publish], 'published')).toEqual([
      {...publish, documentVariantType: 'published'},
    ])
  })

  it('version: re-points publish events at the version id', () => {
    const publish = publishDocumentVersionEvent({versionId: VERSION_ID})
    expect(applyVariantTransforms([publish], 'version')[0]).toMatchObject({
      documentId: VERSION_ID,
      documentVariantType: 'version',
    })
  })

  it('stamps every event with the variant and squashes live edit events', () => {
    const newest = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(4)})
    const oldest = updateLiveDocumentEvent({id: 'live-1', timestamp: minutesAfterBase(0)})

    const result = applyVariantTransforms([newest, oldest], 'published')
    expect(result.map((event) => event.id)).toEqual(['live-2'])
    expect(result.every((event) => event.documentVariantType === 'published')).toBe(true)
  })
})

describe('createEventsObservable', () => {
  it('draft: links edits/creates to their publish event and stamps the variant', () => {
    const create = createDocumentVersionEvent({timestamp: minutesAfterBase(0)})
    const edit = editDocumentVersionEvent({
      revisionId: 'edit-rev',
      id: 'edit-rev',
      timestamp: minutesAfterBase(1),
    })
    const publish = publishDocumentVersionEvent({
      versionRevisionId: 'edit-rev',
      timestamp: minutesAfterBase(2),
    })

    const {observable} = setup({documentId: DRAFT_ID, events: [publish, edit, create]})
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    const [result] = values
    expect(result.events.map((event) => event.type)).toEqual([
      'publishDocumentVersion',
      'editDocumentVersion',
      'createDocumentVersion',
    ])
    // addParentToEvents: the publish now points at the draft id and owns the creation event.
    expect(result.events[0]).toMatchObject({
      documentId: publish.versionId,
      creationEvent: expect.objectContaining({type: 'createDocumentVersion'}),
    })
    expect(result.events[1]).toMatchObject({parentId: publish.id})
    expect(result.events.every((event) => event.documentVariantType === 'draft')).toBe(true)
  })

  it('published: passes events through untouched and stamps the variant', () => {
    const publish = publishDocumentVersionEvent({
      versionId: `versions.rSomeRelease.${DOCUMENT_ID}`,
    })

    const {observable} = setup({documentId: DOCUMENT_ID, events: [publish]})
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    // The release behind a publish event is resolved in the UI from the releases store,
    // not attached by the store.
    expect(values[0].events[0]).toEqual({...publish, documentVariantType: 'published'})
  })

  it('version: re-points publish events at the version id and stamps the variant', () => {
    const publish = publishDocumentVersionEvent({versionId: VERSION_ID})

    const {observable} = setup({documentId: VERSION_ID, events: [publish]})
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events[0]).toMatchObject({
      documentId: VERSION_ID,
      documentVariantType: 'version',
    })
  })

  it('squashes same-author live edit events within the merge window', () => {
    const newest = updateLiveDocumentEvent({id: 'live-2', timestamp: minutesAfterBase(4)})
    const oldest = updateLiveDocumentEvent({id: 'live-1', timestamp: minutesAfterBase(0)})

    const {observable} = setup({documentId: DOCUMENT_ID, events: [newest, oldest]})
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events.map((event) => event.id)).toEqual(['live-2'])
  })

  it('groups fetched and remote edits within the merge window into one edit event', () => {
    const create = createDocumentVersionEvent()
    const {observable, remoteTransactions$} = setup({
      documentId: DRAFT_ID,
      events: [create],
      transactionBatches: [[editTransaction({id: 'tx-fetched', timestamp: minutesAfterBase(1)})]],
    })
    const {values, subscription} = collectEmissions(observable)

    remoteTransactions$.next([
      editTransaction({id: 'tx-remote', author: 'author-2', timestamp: minutesAfterBase(2)}),
    ])
    subscription.unsubscribe()

    expect(groupedTransactions(values.at(-1)!.events)).toEqual([
      ['tx-remote', 'tx-fetched'],
      'createDocumentVersion',
    ])
    expect(values.at(-1)!.events[0]).toMatchObject({
      id: 'tx-remote',
      contributors: ['author-2', 'author-1'],
    })
  })

  it('version: does not duplicate a delete that shares its id with a synthesized edit', () => {
    // Delete events often reuse the last edit's revision as versionRevisionId, so the
    // synthesized edit and the delete get the same client-side id.
    const lastEditRevision = '6bffe811-d5cc-4c73-995f-8b742d3a77f9'
    const apiDelete = deleteDocumentVersionEvent({
      id: lastEditRevision,
      versionId: VERSION_ID,
      versionRevisionId: lastEditRevision,
      timestamp: '2026-08-26T09:51:12Z',
      documentVariantType: 'version',
    })
    const apiCreate = createDocumentVersionEvent({
      id: 'HyFGxFe6HLdujEBXb2YLpb',
      versionId: VERSION_ID,
      versionRevisionId: 'HyFGxFe6HLdujEBXb2YLpb',
      timestamp: '2026-08-26T09:47:08Z',
      documentVariantType: 'version',
    })
    const {observable} = setup({
      documentId: VERSION_ID,
      events: [apiDelete, apiCreate],
      transactionBatches: [
        [
          editTransaction({
            id: lastEditRevision,
            documentId: VERSION_ID,
            timestamp: '2026-08-26T09:50:00Z',
          }),
        ],
      ],
    })
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events.map((event) => event.type)).toEqual([
      'deleteDocumentVersion',
      'createDocumentVersion',
    ])
  })

  it('appends the historyCleared event after the oldest edit event', () => {
    const {observable} = setup({
      documentId: DRAFT_ID,
      events: [],
      historyCleared: true,
      transactionBatches: [[editTransaction({id: 'tx-edit', timestamp: minutesAfterBase(10)})]],
    })
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events.map((event) => event.id)).toEqual(['tx-edit', HISTORY_CLEARED_EVENT_ID])
  })

  it('only synthesizes live edit events for the published document of a live edit type', () => {
    const published = setup({documentId: DOCUMENT_ID, events: [], isLiveEdit: true})
    const version = setup({documentId: VERSION_ID, events: [], isLiveEdit: true})
    const publishedEmissions = collectEmissions(published.observable)
    const versionEmissions = collectEmissions(version.observable)

    published.remoteTransactions$.next([editTransaction({id: 'tx-live', documentId: DOCUMENT_ID})])
    version.remoteTransactions$.next([editTransaction({id: 'tx-version', documentId: VERSION_ID})])
    publishedEmissions.subscription.unsubscribe()
    versionEmissions.subscription.unsubscribe()

    expect(publishedEmissions.values.at(-1)!.events).toEqual([
      expect.objectContaining({type: 'updateLiveDocument', id: 'tx-live'}),
    ])
    expect(versionEmissions.values.at(-1)!.events).toEqual([
      expect.objectContaining({type: 'editDocumentVersion', id: 'tx-version'}),
    ])
  })

  it('recomputes only when an event source emits', () => {
    const publish = publishDocumentVersionEvent()

    const {observable, events$} = setup({documentId: DOCUMENT_ID, events: [publish]})
    const {values, subscription} = collectEmissions(observable)
    expect(values).toHaveLength(1)

    events$.next(fetchedValue([publish]))
    expect(values).toHaveLength(2)
    subscription.unsubscribe()
  })
})
