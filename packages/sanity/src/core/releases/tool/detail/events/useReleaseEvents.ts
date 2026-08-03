import {useMemo} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useDocumentPreviewStore} from '../../../../store/datastores'
import {useSource} from '../../../../studio/source'
import {useDeferredObservableValue} from '../../../../util/useDeferredObservableValue'
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
  const events = useDeferredObservableValue(releaseEvents.events$, EVENTS_INITIAL_VALUE)

  return {
    events: events.events,
    hasMore: events.hasMore,
    loading: events.loading,
    error: events.error,
    loadMore: releaseEvents.loadMore,
  }
}
