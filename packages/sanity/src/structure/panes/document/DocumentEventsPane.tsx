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
import {useDocumentPerspective} from '../../hooks/useDocumentPerspective'
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

  // Get global perspective for UI logic
  const {selectedPerspective} = usePerspective()

  // Get document-level perspective for data operations (handles cardinality one releases)
  const isCreatingNewDocument = params.template !== undefined
  const documentPerspective = useDocumentPerspective({
    documentId: getPublishedId(options.id),
    isCreatingNewDocument,
  })

  const {data: archivedReleases} = useArchivedReleases()
  const editState = useEditState(
    getPublishedId(options.id),
    documentType,
    'default',
    documentPerspective.selectedReleaseId,
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
    if (typeof documentPerspective.selectedPerspectiveName === 'undefined') {
      return getDraftId(options.id)
    }
    if (documentPerspective.selectedPerspectiveName === 'published') {
      return getPublishedId(options.id)
    }
    if (documentPerspective.selectedReleaseId) {
      return getVersionId(options.id, documentPerspective.selectedPerspectiveName)
    }
    return options.id
  }, [
    archivedReleases,
    historyVersion,
    documentPerspective.selectedPerspectiveName,
    options.id,
    showingPublishedOnDraft,
    documentPerspective.selectedReleaseId,
  ])

  const eventsStore = useEventsStore({documentId, documentType: options.type, rev, since})

  const historyStoreProps = useMemo(
    () => ({
      error: eventsStore.error,
      revisionId: eventsStore.revision?.revisionId || null,
      onOlderRevision: Boolean(rev && !eventsStore.revision?.loading),
      revisionDocument: eventsStore.revision?.document || null,
      sinceDocument: eventsStore.sinceRevision?.document || null,
      ready: !eventsStore.loading,
      isPristine: Boolean(eventsStore.events.length === 0),
      lastNonDeletedRevId:
        eventsStore.events.find(
          (e) => !isDeleteDocumentGroupEvent(e) && !isDeleteDocumentVersionEvent(e),
        )?.id || null,
    }),
    [eventsStore, rev],
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
