import {combineLatest, map, type Observable} from 'rxjs'

import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type EventsObservableValue,
  type UpdateLiveDocumentEvent,
} from './types'
import {addParentToEvents, sortEvents, squashLiveEditEvents, updateVersionEvents} from './utils'

interface CreateEventsObservableOptions {
  documentId: string
  events$: Observable<EventsObservableValue>
  remoteEdits$: Observable<(UpdateLiveDocumentEvent | EditDocumentVersionEvent)[]>
  expandedEvents$: Observable<EditDocumentVersionEvent[]>
}

const addDocumentVariantTypeToEvents = (
  events: DocumentGroupEvent[],
  documentVariantType: DocumentVariantType,
) => {
  return events.map((event) => ({...event, documentVariantType}))
}

/**
 * Applies the variant-specific transforms to a sorted event list:
 * 1. The per-variant transform:
 *    - draft: link edits/creates to their publish events ({@link addParentToEvents})
 *    - version: re-point publish events at the version id ({@link updateVersionEvents})
 *    - published: pass through untouched
 * 2. Stamp every event with the `documentVariantType` of the viewed document.
 * 3. Squash same-author live-edit events within the merge window
 *    ({@link squashLiveEditEvents}; temporary until the API squashes them).
 */
export function applyVariantTransforms(
  events: DocumentGroupEvent[],
  documentVariantType: DocumentVariantType,
): DocumentGroupEvent[] {
  let transformed = events
  if (documentVariantType === 'draft') {
    transformed = addParentToEvents(events)
  } else if (documentVariantType === 'version') {
    transformed = updateVersionEvents(events)
  }
  transformed = addDocumentVariantTypeToEvents(transformed, documentVariantType)
  // TODO: This is temporal - liveEditEvents will be squashed in the API
  return squashLiveEditEvents(transformed)
}

/**
 * Combines the three event sources (fetched events, live remote edits, user-expanded edit events)
 * into the final event list the UI consumes.
 *
 * Per emission, merges and sorts all events newest-first ({@link sortEvents}), then applies the
 * variant transforms ({@link applyVariantTransforms}).
 */
export function createEventsObservable({
  events$,
  remoteEdits$,
  expandedEvents$,
  documentId,
}: CreateEventsObservableOptions) {
  const documentVariantType = getDocumentVariantType(documentId)
  return combineLatest([events$, remoteEdits$, expandedEvents$]).pipe(
    map(([{events, nextCursor, loading, error}, remoteEdits, expandedEvents]) => ({
      events: applyVariantTransforms(
        sortEvents({remoteEdits, events, expandedEvents}),
        documentVariantType,
      ),
      nextCursor,
      loading,
      error,
    })),
  )
}
