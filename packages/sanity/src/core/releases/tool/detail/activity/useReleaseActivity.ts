import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../../../hooks/useClient'
import {useDocumentPreviewStore} from '../../../../store/_legacy/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {useReleasesStore} from '../../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../../util/getReleaseDocumentIdFromReleaseId'
import {EVENTS_INITIAL_VALUE, getReleaseEvents} from './getReleaseEvents'
import {type ReleaseEvent} from './types'

export interface ReleaseActivity {
  events: ReleaseEvent[]
  loading: boolean
  error: null | Error
  loadMore: () => void
  hasMore: boolean
}

export function useReleaseActivity(releaseId: string): ReleaseActivity {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentPreviewStore = useDocumentPreviewStore()
  const {state$: releasesState$} = useReleasesStore()

  const releaseEvents = useMemo(
    () =>
      getReleaseEvents({
        client,
        releaseId: getReleaseDocumentIdFromReleaseId(releaseId),
        releasesState$,
        documentPreviewStore,
      }),
    [releaseId, client, releasesState$, documentPreviewStore],
  )
  const events = useObservable(releaseEvents.events$, EVENTS_INITIAL_VALUE)

  return {
    events: events.events,
    hasMore: events.hasMore,
    loading: events.loading,
    error: events.error,
    loadMore: releaseEvents.loadMore,
  }
}
