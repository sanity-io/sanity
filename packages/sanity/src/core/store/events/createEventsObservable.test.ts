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
import {applyVariantTransforms, createEventsObservable} from './createEventsObservable'
import {type DocumentGroupEvent, type EventsObservableValue} from './types'

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
