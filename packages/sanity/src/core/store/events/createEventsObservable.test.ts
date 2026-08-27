import {BehaviorSubject, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {type ReleasesReducerState} from '../../releases/store/reducer'
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
import {createEventsObservable} from './createEventsObservable'
import {type EventsObservableValue} from './getInitialFetchEvents'
import {type DocumentGroupEvent} from './types'

const releasesState = (
  releases: Map<string, typeof activeASAPRelease> = new Map(),
): ReleasesReducerState => ({releases, state: 'loaded'})

function eventsValue(events: DocumentGroupEvent[]): EventsObservableValue {
  return {events, nextCursor: '', loading: false, error: null}
}

function setup({
  documentId,
  events,
  releases = releasesState(),
}: {
  documentId: string
  events: DocumentGroupEvent[]
  releases?: ReleasesReducerState
}) {
  const releases$ = new BehaviorSubject(releases)
  const events$ = new BehaviorSubject(eventsValue(events))
  const observable = createEventsObservable({
    documentId,
    releases$: releases$ as never,
    events$,
    remoteEdits$: of([]),
    expandedEvents$: of([]),
  })
  return {observable, releases$, events$}
}

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

  it('published: attaches release metadata to release publishes and stamps the variant', () => {
    const publish = publishDocumentVersionEvent({
      versionId: `versions.${activeASAPRelease.name}.${DOCUMENT_ID}`,
    })
    const releases = releasesState(new Map([[activeASAPRelease._id, activeASAPRelease]]))

    const {observable} = setup({documentId: DOCUMENT_ID, events: [publish], releases})
    const {values, subscription} = collectEmissions(observable)
    subscription.unsubscribe()

    expect(values[0].events[0]).toMatchObject({
      release: activeASAPRelease,
      documentVariantType: 'published',
    })
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

  it('recomputes the whole list whenever the releases store emits (known perf quirk)', () => {
    const publish = publishDocumentVersionEvent()

    const {observable, releases$} = setup({documentId: DOCUMENT_ID, events: [publish]})
    const {values, subscription} = collectEmissions(observable)
    expect(values).toHaveLength(1)

    releases$.next(releasesState())
    expect(values).toHaveLength(2)
    subscription.unsubscribe()
  })
})
