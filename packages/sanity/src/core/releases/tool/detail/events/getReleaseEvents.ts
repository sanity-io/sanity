import {type SanityClient} from '@sanity/client'
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  type Observable,
  of,
  skip,
  startWith,
  tap,
} from 'rxjs'

import {type DocumentPreviewStore} from '../../../../preview/documentPreviewStore'
import {type ReleasesReducerState} from '../../../store/reducer'
import {type ReleaseDocument} from '../../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../util/releasesClient'
import {getReleaseActivityEvents} from './getReleaseActivityEvents'
import {getReleaseEditEvents} from './getReleaseEditEvents'
import {isCreateReleaseEvent, isEventsAPIEvent, isTranslogEvent, type ReleaseEvent} from './types'

interface getReleaseEventsOpts {
  client: SanityClient
  releaseId: string
  releasesState$: Observable<ReleasesReducerState>
  documentPreviewStore: DocumentPreviewStore
  eventsAPIEnabled: boolean
}

export const EVENTS_INITIAL_VALUE = {
  events: [],
  hasMore: false,
  error: null,
  loading: true,
}

const notEnabledActivityEvents: ReturnType<typeof getReleaseActivityEvents> = {
  events$: of({
    events: [],
    nextCursor: '',
    loading: false,
    error: null,
  }),
  reloadEvents: () => {},
  loadMore: () => {},
}

/**
 * Combines activity and edit events for a release, and adds side effects for reloading events when the release or the document changes.
 */
export function getReleaseEvents({
  client,
  releaseId,
  releasesState$,
  documentPreviewStore,
  eventsAPIEnabled,
}: getReleaseEventsOpts) {
  const observeDocument$ = documentPreviewStore.unstable_observeDocument(releaseId, {
    apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
  }) as Observable<ReleaseDocument | undefined>

  const editEvents$ = getReleaseEditEvents({client, observeDocument$})

  const releaseRev$ = releasesState$.pipe(
    map((state) => state.releases.get(releaseId)?._rev),
    filter(Boolean),
    distinctUntilChanged(),
    // Emit only when rev changes, after first non null value.
    skip(1),
  )

  // Turn off activity events if eventsAPI is not enabled.
  const activityEvents = eventsAPIEnabled
    ? getReleaseActivityEvents({client, releaseId})
    : notEnabledActivityEvents

  const groqFilter = `_id in path("versions.${getReleaseIdFromReleaseDocumentId(releaseId)}.*")`
  // Turn off document counts listener if eventsAPI is not enabled.
  const documentsCount$ = eventsAPIEnabled
    ? of(0)
    : documentPreviewStore
        .unstable_observeDocumentIdSet(groqFilter, undefined, {
          apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
        })
        .pipe(
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
            const creationEvent = acc.find(isCreateReleaseEvent)
            if (!creationEvent) acc.push(event)
            // Prefer the translog event for the creation given it has extra information.
            else if (isEventsAPIEvent(creationEvent) && isTranslogEvent(event)) {
              acc[acc.indexOf(creationEvent)] = event
            }
          } else acc.push(event)
          return acc
        }, [])

      return {
        events: deduplicateEvents(events),
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

const deduplicateEvents = (events: ReleaseEvent[]) => {
  // Events are sorted by timestamp, compare this event with the next one, if they are the same type and timestamp, remove it.
  return events.filter((event, index) => {
    const nextEvent = events[index + 1]
    if (!nextEvent) return true
    return !(event.type === nextEvent.type && areTheSameDate(event.timestamp, nextEvent.timestamp))
  })
}

/**
 * Checks if two dates are the same date, without contemplating miliseconds.
 * The translog has miliseconds but the events api does not.
 */
function areTheSameDate(date1: string, date2: string) {
  const time1 = new Date(date1).getTime()
  const time2 = new Date(date2).getTime()
  return Math.abs(time1 - time2) <= 1000
}
