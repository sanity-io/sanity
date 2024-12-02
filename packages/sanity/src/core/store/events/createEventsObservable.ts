import {combineLatest, map, type Observable} from 'rxjs'

import {type useReleasesStore} from '../../releases/store/useReleasesStore'
import {getReleaseIdFromName} from '../../releases/util/getReleaseIdFromName'
import {getVersionFromId} from '../../util/draftUtils'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {type EventsObservableValue} from './getInitialFetchEvents'
import {type EditDocumentVersionEvent, type UpdateLiveDocumentEvent} from './types'
import {decorateDraftEvents, squashLiveEditEvents} from './utils'

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
      const eventsWithRemoteEdits = [...remoteEdits, ...events, ...expandedEvents].sort(
        // Sort by timestamp, newest first
        (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
      )

      if (documentVariantType === 'published') {
        // We need to add the release information to the publish events
        return {
          events: eventsWithRemoteEdits.map((event) => {
            if (event.type === 'PublishDocumentVersion') {
              const releaseId = getVersionFromId(event.versionId)
              if (releaseId) {
                const release = releases.releases.get(getReleaseIdFromName(releaseId))
                return {...event, release: release}
              }
              return event
            }
            return event
          }),
          nextCursor: nextCursor,
          loading: loading,
          error: error,
        }
      }

      if (documentVariantType === 'draft') {
        decorateDraftEvents(eventsWithRemoteEdits)
        return {
          events: eventsWithRemoteEdits,
          nextCursor: nextCursor,
          loading: loading,
          error: error,
        }
      }
      return {
        events: eventsWithRemoteEdits,
        nextCursor: nextCursor,
        loading: loading,
        error: error,
      }
    }),
    // TODO: This is temporal - liveEditEvents will be squashed in the API
    map((value) => ({...value, events: squashLiveEditEvents(value.events)})),
  )
}
