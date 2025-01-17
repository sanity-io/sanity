import {type ReleaseId} from '@sanity/client'
import {useMemo} from 'react'
import {
  EventsProvider,
  getDraftId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getVersionId,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  useArchivedReleases,
  useEventsStore,
  usePerspective,
} from 'sanity'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentEventsPane = (props: DocumentPaneProviderProps) => {
  const {params = EMPTY_PARAMS} = usePaneRouter()
  const options = usePaneOptions(props.pane.options, params)

  const {selectedPerspectiveName} = usePerspective()
  const {data: archivedReleases} = useArchivedReleases()

  const {rev, since} = params
  const historyVersion = params.historyVersion as ReleaseId | undefined

  const documentId = useMemo(() => {
    if (
      historyVersion &&
      archivedReleases.some(
        (release) => getReleaseIdFromReleaseDocumentId(release._id) === historyVersion,
      )
    ) {
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
          (e) => !isDeleteDocumentGroupEvent(e) && !isDeleteDocumentVersionEvent(e),
        )?.id || null,
    }),
    [eventsStore],
  )

  const value = useMemo(() => eventsStore, [eventsStore])

  const forcedProviderVersion = useMemo(() => {
    if (historyVersion) {
      return {
        selectedPerspectiveName: historyVersion,
        selectedReleaseId: historyVersion,
        isReleaseLocked: true,
      }
    }
    return undefined
  }, [historyVersion])

  return (
    <EventsProvider value={value}>
      <DocumentPaneProvider
        {...props}
        historyStore={historyStoreProps}
        forcedVersion={forcedProviderVersion}
      />
    </EventsProvider>
  )
}
