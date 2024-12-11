import {type SanityClient} from '@sanity/client'
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  type Observable,
  skip,
  startWith,
  tap,
} from 'rxjs'

import {type DocumentPreviewStore} from '../../../../preview/documentPreviewStore'
import {type ReleasesReducerState} from '../../../store/reducer'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseActivityEvents} from './getReleaseActivityEvents'
import {getReleaseEditEvents} from './getReleaseEditEvents'
import {isCreateReleaseEvent, type ReleaseEvent} from './types'

interface getReleaseEventsOpts {
  client: SanityClient
  releaseId: string
  releasesState$: Observable<ReleasesReducerState>
  documentPreviewStore: DocumentPreviewStore
}

export const EVENTS_INITIAL_VALUE = {
  events: [],
  hasMore: false,
  error: null,
  loading: true,
}

/**
 * Combines activity and edit events for a release, and adds side effects for reloading events when the release or the document changes.
 */
export function getReleaseEvents({
  client,
  releaseId,
  releasesState$,
  documentPreviewStore,
}: getReleaseEventsOpts) {
  const activityEvents = getReleaseActivityEvents({client, releaseId})
  const {editEvents$} = getReleaseEditEvents({client, releaseId, releasesState$})

  const releaseRev$ = releasesState$.pipe(
    map((state) => state.releases.get(releaseId)?._rev),
    filter(Boolean),
    distinctUntilChanged(),
    // Emit only when rev changes, after first non null value.
    skip(1),
  )

  const groqFilter = `_id in path("versions.${getReleaseIdFromReleaseDocumentId(releaseId)}.*")`
  const documentsCount$ = documentPreviewStore.unstable_observeDocumentIdSet(groqFilter).pipe(
    filter(({status}) => status === 'connected'),
    map(({documentIds}) => documentIds.length),
    distinctUntilChanged(),
    // Emit only when count changes, after first non null value.
    skip(1),
  )

  const sideEffects$ = merge(releaseRev$, documentsCount$).pipe(
    tap(() => {
      activityEvents.reloadEvents()
    }),
    startWith(null),
  )

  const events$ = combineLatest([activityEvents.events$, editEvents$, sideEffects$]).pipe(
    map(([activity, edit]) => {
      const events = [...activity.events, ...edit.editEvents]
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .reduce((acc: ReleaseEvent[], event) => {
          if (isCreateReleaseEvent(event)) {
            // Check if the creation event exists, we want to show only one, prefer the one that has the "changes" object
            const creationEvent = acc.find(isCreateReleaseEvent)
            // The creation event with the "change" will come from the edit events, we want that one as it has more info.
            if (!creationEvent) acc.push(event)
            else if (!creationEvent.change && event.change) {
              acc[acc.indexOf(creationEvent)] = event
            }
          } else acc.push(event)
          return acc
        }, [])

      return {
        events,
        hasMore: Boolean(activity.nextCursor),
        error: activity.error || edit.error,
        loading: activity.loading || edit.loading,
      }
    }),
  )

  return {
    events$,
    loadMore: activityEvents.loadMore,
  }
}
