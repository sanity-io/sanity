import {type ObjectSchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {
  EMPTY_ARRAY,
  EventsProvider,
  getDraftId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getVersionId,
  PerspectiveProvider,
  useArchivedReleases,
  getTargetDocument,
  useEventsStore,
  usePerspective,
  useSchema,
  useTargetDocumentState,
  useDocumentVersions,
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
  const schemaType = schema.get(options.type) as ObjectSchemaType | undefined
  const liveEdit = Boolean(schemaType?.liveEdit)

  const {selectedPerspectiveName, selectedPerspective, selectedVariantName} = usePerspective()
  const {data: archivedReleases} = useArchivedReleases()
  const {versions} = useDocumentVersions({documentId: getPublishedId(options.id)})
  const targetDocumentState = useTargetDocumentState(getPublishedId(options.id))
  const draftVersion = getTargetDocument({
    bundle: 'draft',
    variant: selectedVariantName,
    documentVersions: versions,
  })

  const showingPublishedOnDraft = liveEdit && selectedPerspective === 'drafts' && !draftVersion
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
    // Variant targets: events must be fetched for the variant document itself. Its id cannot be
    // derived from the perspective name — the bundle segment is an opaque scope hash — so it
    // comes from the resolved target stub. (In `variant-missing`/`resolving` states the pane
    // shows the base document, so the perspective-derived ids below correctly apply.)
    if (
      targetDocumentState.status === 'ready' &&
      targetDocumentState.variant !== undefined &&
      targetDocumentState.targetDocument
    ) {
      return targetDocumentState.targetDocument._id
    }
    if (typeof selectedPerspectiveName === 'undefined') {
      return getDraftId(options.id)
    }
    if (selectedPerspectiveName === 'published') {
      return getPublishedId(options.id)
    }
    if (selectedPerspectiveName.length !== 0) {
      return getVersionId(options.id, selectedPerspectiveName)
    }
    return options.id
  }, [
    archivedReleases,
    historyVersion,
    selectedPerspectiveName,
    options.id,
    showingPublishedOnDraft,
    targetDocumentState,
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
      lastNonDeletedRevId: eventsStore.lastNonDeletedRevId,
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
