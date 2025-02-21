import {type ObjectSchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {
  EMPTY_ARRAY,
  EventsProvider,
  getDraftId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getVersionId,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  PerspectiveProvider,
  useArchivedReleases,
  useEditState,
  useEventsStore,
  usePerspective,
  useSchema,
} from 'sanity'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentEventsPane = (props: DocumentPaneProviderProps) => {
  const {params = EMPTY_PARAMS} = usePaneRouter()
  const options = usePaneOptions(props.pane.options, params)
  const schema = useSchema()
  const documentType = options.type
  const schemaType = schema.get(options.type) as ObjectSchemaType | undefined
  const liveEdit = Boolean(schemaType?.liveEdit)

  const {selectedPerspectiveName, selectedReleaseId, selectedPerspective} = usePerspective()
  const {data: archivedReleases} = useArchivedReleases()
  const editState = useEditState(
    getPublishedId(options.id),
    documentType,
    'default',
    selectedReleaseId,
  )

  const showingPublishedOnDraft = liveEdit && selectedPerspective === 'drafts' && !editState?.draft
  const {rev, since} = params
  const historyVersion = params.historyVersion

  const documentId = useMemo(() => {
    if (showingPublishedOnDraft) {
      return getPublishedId(options.id)
    }
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
    if (selectedReleaseId) {
      return getVersionId(options.id, selectedPerspectiveName)
    }
    return options.id
  }, [
    archivedReleases,
    historyVersion,
    selectedPerspectiveName,
    options.id,
    showingPublishedOnDraft,
    selectedReleaseId,
  ])

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

  return (
    <EventsProvider value={value}>
      {historyVersion ? (
        <PerspectiveProvider
          selectedPerspectiveName={historyVersion}
          excludedPerspectives={EMPTY_ARRAY}
        >
          <DocumentPaneProvider {...props} historyStore={historyStoreProps} />
        </PerspectiveProvider>
      ) : (
        <DocumentPaneProvider {...props} historyStore={historyStoreProps} />
      )}
    </EventsProvider>
  )
}
