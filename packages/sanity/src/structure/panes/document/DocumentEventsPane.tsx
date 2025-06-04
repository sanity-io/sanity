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
  useClient,
  useEditState,
  useEventsStore,
  useHistoryStore,
  usePerspective,
  useSchema,
} from 'sanity'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

// Debugging function to inspect documents at each event revision
/* eslint-disable no-console */
async function debugEventsAndRevisions(events: any[], documentId: string, client: any) {
  console.log('=== DEBUG: Events and Revisions ===')
  console.log(`Total events: ${events.length}`)

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    console.log(`\n--- Event ${i + 1}/${events.length} ---`)
    console.log('Event ID:', event.id)
    console.log('Event Type:', event.type)
    console.log('Event:', event)

    // Check if this is a delete event
    const isDeleteEvent = isDeleteDocumentGroupEvent(event) || isDeleteDocumentVersionEvent(event)
    console.log('Is Delete Event:', isDeleteEvent)

    if (event.id) {
      try {
        // Hardcoded dataset and project info - adjust as needed
        const dataset = client.config().dataset || 'test'
        const publishedId = getPublishedId(documentId)
        const draftId = getDraftId(documentId)

        const url = `/data/history/${dataset}/documents/${publishedId},${draftId}?revision=${event.id}`
        console.log('API URL:', url)

        const result = await client.request({url})
        console.log('Documents at revision:', result.documents)

        if (result.documents && result.documents.length > 0) {
          result.documents.forEach((doc: any, docIndex: number) => {
            console.log(`  Document ${docIndex + 1}:`, {
              _id: doc._id,
              _type: doc._type,
              _rev: doc._rev,
              _createdAt: doc._createdAt,
              _updatedAt: doc._updatedAt,
              title: doc.title || 'No title field',
            })
          })
        } else {
          console.log('  No documents found at this revision')
        }
      } catch (error) {
        console.error(`  Error fetching revision ${event.id}:`, error)
      }
    }

    // Add a small delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n=== END DEBUG ===')
}
/* eslint-enable no-console */

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
  const historyStore = useHistoryStore()
  const client = useClient()

  // Trigger debug function when events are loaded
  useMemo(() => {
    if (eventsStore.events.length > 0 && !eventsStore.loading) {
      debugEventsAndRevisions(eventsStore.events, documentId, client)
      // eslint-disable-next-line no-console
      console.log(eventsStore.events)
    }
  }, [client, documentId, eventsStore.events, eventsStore.loading])

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
        eventsStore.events
          .reverse()
          .find((e) => !isDeleteDocumentGroupEvent(e) && !isDeleteDocumentVersionEvent(e))?.id ||
        null,
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
