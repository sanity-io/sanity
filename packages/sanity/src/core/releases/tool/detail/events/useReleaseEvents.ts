import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useClient} from '../../../../hooks/useClient'
import {useDocumentPreviewStore} from '../../../../store/_legacy/datastores'
import {useSource} from '../../../../studio/source'
import {useReleasesStore} from '../../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../../util/getReleaseDocumentIdFromReleaseId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../util/releasesClient'
import {EVENTS_INITIAL_VALUE, getReleaseEvents} from './getReleaseEvents'
import {type ReleaseEvent} from './types'

export interface ReleaseEvents {
  events: ReleaseEvent[]
  loading: boolean
  error: null | Error
  loadMore: () => void
  hasMore: boolean
}

export function useReleaseEvents(releaseId: string): ReleaseEvents {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const documentPreviewStore = useDocumentPreviewStore()
  const {state$: releasesState$} = useReleasesStore()
  const source = useSource()
  const eventsAPIEnabled = Boolean(source.beta?.eventsAPI?.releases)

  const releaseEvents = useMemo(
    () =>
      getReleaseEvents({
        client,
        releaseId: getReleaseDocumentIdFromReleaseId(releaseId),
        releasesState$,
        documentPreviewStore,
        eventsAPIEnabled,
      }),
    [releaseId, client, releasesState$, documentPreviewStore, eventsAPIEnabled],
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
