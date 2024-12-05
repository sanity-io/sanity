import {useEffect, useMemo, useRef} from 'react'
import {
  EventsProvider,
  getDraftId,
  getPublishedId,
  getVersionId,
  useEventsStore,
  usePerspective,
  useReleases,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentEventsPane = (props: DocumentPaneProviderProps) => {
  const {params = EMPTY_PARAMS, setParams} = usePaneRouter()
  const options = usePaneOptions(props.pane.options, params)

  const {selectedPerspectiveName} = usePerspective()
  const {archivedReleases} = useReleases()
  const {rev, since, historyVersion} = params

  const documentId = useMemo(() => {
    if (historyVersion && archivedReleases.some((release) => release.name === historyVersion)) {
      // Check if we have a release that matches with this historyVersion
      return getVersionId(options.id, historyVersion)
    }
    if (typeof selectedPerspectiveName === 'undefined') {
      return getDraftId(options.id)
    }
    if (selectedPerspectiveName === 'published') {
      return getPublishedId(options.id)
    }
    if (selectedPerspectiveName.startsWith('r')) {
      return getVersionId(options.id, selectedPerspectiveName)
    }
    return options.id
  }, [archivedReleases, historyVersion, selectedPerspectiveName, options.id])

  const isMounted = useRef(false)

  const updateHistoryParams = useEffectEvent((_perspective?: string) => {
    setParams({
      ...params,
      // Reset the history related params when the perspective changes, as they don't make sense
      // in the context of the new perspective - preserveRev is used when setting draft revision.
      rev: params.preserveRev === 'true' ? params.rev : undefined,
      preserveRev: undefined,
      since: undefined,
      historyVersion: undefined,
    })
  })
  useEffect(() => {
    // Skip the first run to avoid resetting the params on initial load
    if (isMounted.current) {
      updateHistoryParams(selectedPerspectiveName)
    } else {
      isMounted.current = true
    }
    // TODO: Remove `updateHistoryParams` as a dependency when react eslint plugin is updated
  }, [selectedPerspectiveName, updateHistoryParams])

  const eventsStore = useEventsStore({documentId, documentType: options.type, rev, since})

  const historyStoreProps = useMemo(
    () => ({
      error: eventsStore.error,
      revisionId: eventsStore.revision?.revisionId || null,
      onOlderRevision: Boolean(eventsStore.revision?.document && eventsStore.revision?.revisionId),
      revisionDocument: eventsStore.revision?.document || null,
      sinceDocument: eventsStore.sinceRevision?.document || null,
      ready: !eventsStore.loading,
      isPristine: Boolean(eventsStore.events.length === 0),
      lastNonDeletedRevId:
        eventsStore.events.find(
          (e) => e.type !== 'DeleteDocumentGroup' && e.type !== 'DeleteDocumentVersion',
        )?.id || null,
    }),
    [eventsStore],
  )

  const value = useMemo(() => eventsStore, [eventsStore])

  return (
    <EventsProvider value={value}>
      <DocumentPaneProvider {...props} historyStore={historyStoreProps} />
    </EventsProvider>
  )
}
