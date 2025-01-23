import {combineLatest, map, type Observable} from 'rxjs'

import {type useReleasesStore} from '../../releases/store/useReleasesStore'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {type EventsObservableValue} from './getInitialFetchEvents'
import {type EditDocumentVersionEvent, type UpdateLiveDocumentEvent} from './types'
import {
  addParentToEvents,
  sortEvents,
  squashLiveEditEvents,
  updatePublishedEvents,
  updateVersionEvents,
} from './utils'

interface CreateEventsObservableOptions {
  documentId: string
  releases$: ReturnType<typeof useReleasesStore>['state$']
  events$: Observable<EventsObservableValue>
  remoteEdits$: Observable<(UpdateLiveDocumentEvent | EditDocumentVersionEvent)[]>
  expandedEvents$: Observable<EditDocumentVersionEvent[]>
}

export function createEventsObservable({
  releases$,
  events$,
  remoteEdits$,
  expandedEvents$,
  documentId,
}: CreateEventsObservableOptions) {
  const documentVariantType = getDocumentVariantType(documentId)
  return combineLatest([releases$, events$, remoteEdits$, expandedEvents$]).pipe(
    map(([releases, {events, nextCursor, loading, error}, remoteEdits, expandedEvents]) => {
      const eventsWithRemoteEdits = sortEvents({remoteEdits, events, expandedEvents})

      if (documentVariantType === 'published') {
        return {
          events: updatePublishedEvents(eventsWithRemoteEdits, releases),
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
    // TODO: This is temporal - liveEditEvents will be squashed in the API
    map((value) => ({...value, events: squashLiveEditEvents(value.events)})),
  )
}
