import {BehaviorSubject, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {
  createDocumentVersionEvent,
  DOCUMENT_ID,
  DRAFT_ID,
  editDocumentVersionEvent,
  minutesAfterBase,
  publishDocumentVersionEvent,
  updateLiveDocumentEvent,
  VERSION_ID,
} from './__fixtures__/events.fixture'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {applyVariantTransforms, createEventsObservable} from './createEventsObservable'
import {getEditEvents} from './getEditEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type EventsObservableValue,
} from './types'

function eventsValue(events: DocumentGroupEvent[]): EventsObservableValue {
  return {events, nextCursor: '', loading: false, error: null}
}

function setup({documentId, events}: {documentId: string; events: DocumentGroupEvent[]}) {
  const events$ = new BehaviorSubject(eventsValue(events))
  const observable = createEventsObservable({
    documentId,
    events$,
    remoteEdits$: of([]),
    expandedEvents$: of([]),
    frozenEditGroups$: of(new Map()),
  })
  return {observable, events$}
}

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

  it('groups fetched and live edit events within the merge window into one edit event', () => {
    const fetchedEdit = editTransaction({id: 'tx-fetched', timestamp: minutesAfterBase(1)})
    const liveEdit = editTransaction({
      id: 'tx-live',
      author: 'author-2',
      timestamp: minutesAfterBase(2),
    })
    const create = createDocumentVersionEvent()

    const observable = createEventsObservable({
      documentId: DRAFT_ID,
      events$: of(eventsValue([...getEditEvents([fetchedEdit], DRAFT_ID), create])),
      remoteEdits$: of(getEditEvents([liveEdit], DRAFT_ID)),
      expandedEvents$: of([]),
      frozenEditGroups$: of(new Map()),
    })
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events).toEqual([
      expect.objectContaining({
        type: 'editDocumentVersion',
        id: 'tx-live',
        contributors: ['author-2', 'author-1'],
        transactions: [
          expect.objectContaining({revisionId: 'tx-live'}),
          expect.objectContaining({revisionId: 'tx-fetched'}),
        ],
      }),
      expect.objectContaining({
        type: 'editDocumentVersion',
        id: 'tx-fetched',
        parentId: 'tx-live',
        isTransaction: true,
      }),
      expect.objectContaining({type: 'createDocumentVersion', id: create.id}),
    ])
  })

  it('lists the transactions of grouped edit events after the variant transforms', () => {
    const create = createDocumentVersionEvent({timestamp: minutesAfterBase(0)})
    const [publishedEdits] = getEditEvents(
      [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(1)}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(2)}),
      ],
      DRAFT_ID,
    )
    const publish = publishDocumentVersionEvent({
      id: 'tx-published-version',
      versionRevisionId: 'tx-published-version',
      timestamp: minutesAfterBase(3),
    })
    const [draftEdits] = getEditEvents(
      [
        editTransaction({id: 'tx-4', timestamp: minutesAfterBase(4)}),
        editTransaction({id: 'tx-5', timestamp: minutesAfterBase(5)}),
      ],
      DRAFT_ID,
    )

    const {observable} = setup({
      documentId: DRAFT_ID,
      events: [draftEdits, publish, publishedEdits, create],
    })
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(
      values[0].events.map((event) => ({
        id: event.id,
        parentId: 'parentId' in event ? event.parentId : undefined,
        isTransaction: 'isTransaction' in event ? event.isTransaction : undefined,
      })),
    ).toEqual([
      {id: 'tx-5', parentId: undefined, isTransaction: undefined},
      {id: 'tx-4', parentId: 'tx-5', isTransaction: true},
      {id: 'tx-published-version', parentId: undefined, isTransaction: undefined},
      // addParentToEvents nests the published edits under the publish, but not their transactions.
      {id: 'tx-2', parentId: 'tx-published-version', isTransaction: undefined},
      {id: 'tx-1', parentId: 'tx-2', isTransaction: true},
      {id: create.id, parentId: 'tx-published-version', isTransaction: undefined},
    ])
    expect(values[0].events.every((event) => event.documentVariantType === 'draft')).toBe(true)
  })

  it('keeps an expanded edit group as it is while live edits arrive', () => {
    const fetched = getEditEvents(
      [
        editTransaction({id: 'tx-1', timestamp: minutesAfterBase(1)}),
        editTransaction({id: 'tx-2', timestamp: minutesAfterBase(2)}),
      ],
      DRAFT_ID,
    )
    const create = createDocumentVersionEvent()
    const remoteEdits$ = new BehaviorSubject<EditDocumentVersionEvent[]>([])
    const frozenEditGroups$ = new BehaviorSubject<ReadonlyMap<string, string>>(new Map())

    const observable = createEventsObservable({
      documentId: DRAFT_ID,
      events$: of(eventsValue([...fetched, create])),
      remoteEdits$,
      expandedEvents$: of([]),
      frozenEditGroups$,
    })
    const {values, subscription} = collectEmissions(observable)
    frozenEditGroups$.next(
      new Map([
        ['tx-1', 'tx-2'],
        ['tx-2', 'tx-2'],
      ]),
    )
    remoteEdits$.next(
      getEditEvents([editTransaction({id: 'tx-3', timestamp: minutesAfterBase(3)})], DRAFT_ID),
    )
    subscription.unsubscribe()

    expect(
      values
        .at(-1)
        ?.events.map((event) => [event.id, 'parentId' in event ? event.parentId : undefined]),
    ).toEqual([
      ['tx-3', undefined],
      ['tx-2', undefined],
      ['tx-1', 'tx-2'],
      [create.id, undefined],
    ])
  })

  it('recomputes only when an event source emits', () => {
    const publish = publishDocumentVersionEvent()

    const {observable, events$} = setup({documentId: DOCUMENT_ID, events: [publish]})
    const {values, subscription} = collectEmissions(observable)
    expect(values).toHaveLength(1)

    events$.next(eventsValue([publish]))
    expect(values).toHaveLength(2)
    subscription.unsubscribe()
  })
})
