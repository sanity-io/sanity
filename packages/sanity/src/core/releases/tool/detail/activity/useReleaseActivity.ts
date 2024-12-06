import {useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, type ReleaseDocument, useClient} from 'sanity'

import {useReleasesStore} from '../../../store/useReleasesStore'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseActivityEvents, RELEASE_ACTIVITY_INITIAL_VALUE} from './getReleaseActivityEvents'
import {EDITS_EVENTS_INITIAL_VALUE, getReleaseEditEvents} from './getReleaseEditEvents'
import {isCreateReleaseEvent, type ReleaseEvent} from './types'

export interface ReleaseActivity {
  events: ReleaseEvent[]
  loading: boolean
  error: null | Error
  loadMore: () => void
}

export function useReleaseActivity({
  release,
  releaseDocumentsCount,
  releaseDocumentsLoading,
}: {
  release?: ReleaseDocument
  releaseDocumentsCount: number
  releaseDocumentsLoading: boolean
}): ReleaseActivity {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentsCount = useRef<null | number>(null)
  const {state$: releasesState$} = useReleasesStore()
  const releaseId = release?._id

  const releaseRev = useRef<string | null>(release?._rev || null)
  const {events$, reloadEvents, loadMore} = useMemo(
    () =>
      getReleaseActivityEvents({
        client,
        releaseId: releaseId ? getReleaseIdFromReleaseDocumentId(releaseId) : undefined,
      }),
    [client, releaseId],
  )

  const {events, loading, error} = useObservable(events$, RELEASE_ACTIVITY_INITIAL_VALUE)
  const {editEvents$} = useMemo(
    () => getReleaseEditEvents({client, releaseId, releasesState$}),
    [releaseId, client, releasesState$],
  )
  const {editEvents} = useObservable(editEvents$, EDITS_EVENTS_INITIAL_VALUE)

  useEffect(() => {
    // Wait until the documents are loaded
    if (releaseDocumentsLoading) return

    // After loading, set the initial value, we only care about changes.
    if (documentsCount.current === null) {
      documentsCount.current = releaseDocumentsCount
      return
    }

    if (releaseDocumentsCount !== documentsCount.current) {
      // eslint-disable-next-line no-console
      console.log('Reloading release events, ::documents:: count changed')
      reloadEvents()
      documentsCount.current = releaseDocumentsCount
    }
  }, [releaseDocumentsCount, releaseDocumentsLoading, reloadEvents])

  // TODO: Move this to the observable by using the releasesState$
  useEffect(() => {
    // Wait until the release exists
    if (!release?._rev) return
    // After loading, set the initial value, we only care about changes to the rev
    if (releaseRev.current === null) {
      releaseRev.current = release._rev
      return
    }

    if (releaseRev.current !== release._rev) {
      // eslint-disable-next-line no-console
      console.log('Reloading release events, ::release:: changed')
      reloadEvents()
      releaseRev.current = release._rev
    }
  }, [release?._rev, reloadEvents])

  const allEvents = useMemo(() => {
    return [...events, ...editEvents]
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
  }, [editEvents, events])

  return {
    events: allEvents,
    loadMore,
    loading,
    error,
  }
}
