import {combineLatest, map, type Observable} from 'rxjs'

import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {type EventsObservableValue} from './getInitialFetchEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
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
 * Combines the three event sources (fetched events, live remote edits, user-expanded edit events)
 * into the final event list the UI consumes.
 *
 * Per emission:
 * 1. Merge and sort all events newest-first ({@link sortEvents}).
 * 2. Apply the variant-specific transform:
 *    - draft: link edits/creates to their publish events ({@link addParentToEvents})
 *    - version: re-point publish events at the version id ({@link updateVersionEvents})
 *    - published: pass through untouched
 * 3. Stamp every event with the `documentVariantType` of the viewed document.
 * 4. Squash same-author live-edit events within the merge window
 *    ({@link squashLiveEditEvents}; temporary until the API squashes them).
 *
 */
export function createEventsObservable({
  events$,
  remoteEdits$,
  expandedEvents$,
  documentId,
}: CreateEventsObservableOptions) {
  const documentVariantType = getDocumentVariantType(documentId)
  return combineLatest([events$, remoteEdits$, expandedEvents$]).pipe(
    map(([{events, nextCursor, loading, error}, remoteEdits, expandedEvents]) => {
      const eventsWithRemoteEdits = sortEvents({remoteEdits, events, expandedEvents})

      if (documentVariantType === 'published') {
        return {
          events: eventsWithRemoteEdits,
          nextCursor: nextCursor,
          loading: loading,
          error: error,
        }
      }

      if (documentVariantType === 'draft') {
        return {
          events: addParentToEvents(eventsWithRemoteEdits),
          nextCursor: nextCursor,
          loading: loading,
          error: error,
        }
      }
      return {
        events: updateVersionEvents(eventsWithRemoteEdits),
        nextCursor: nextCursor,
        loading: loading,
        error: error,
      }
    }),
    map((value) => ({
      ...value,
      events: addDocumentVariantTypeToEvents(value.events, documentVariantType),
    })),
    // TODO: This is temporal - liveEditEvents will be squashed in the API
    map((value) => ({...value, events: squashLiveEditEvents(value.events)})),
  )
}
