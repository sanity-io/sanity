import {type SanityClient} from '@sanity/client'
import {catchError, map, type Observable, of, retry, shareReplay, startWith, timer} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {memoize} from '../../store/_legacy/document/utils/createMemoizer'
import {getPublishedId} from '../../util/draftUtils'
import {type CompanionDoc} from '../types'

export interface CanvasCompanionDocsStore {
  getCompanionDocs: (documentId: string) => Observable<CompanionDocs>
}
interface CompanionDocs {
  data: CompanionDoc[]
  error: null | string
  loading: boolean
}
const INITIAL_VALUE: CompanionDocs = {
  data: [],
  error: null,
  loading: true,
}

const getCompanionDocs = memoize(
  (
    publishedId: string,
    client: SanityClient,
    previewStore: DocumentPreviewStore,
  ): Observable<CompanionDocs> => {
    const companionDocsIdsListener$ = (id: string) =>
      previewStore.unstable_observeDocumentIdSet(
        `_type == "sanity.canvas.link" && (
            studioDocumentId in path("versions.**."+ $publishedId) || 
            studioDocumentId in [$publishedId, "drafts." + $publishedId]
         )`,
        {publishedId: id},
      )

    const getCompanionDoc$ = (id: string) =>
      client.observable
        .fetch<CompanionDoc | null>(
          `*[_id == $id][0]{ _id, canvasDocumentId, studioDocumentId}`,
          {id},
          {tag: 'canvas.companion-docs'},
        )
        .pipe(
          map((response) => {
            if (!response?._id) {
              // In some race scenarios we can get the response in the listener before the document is available to be fetched.
              // This will only retry "not ready" errors, other errors will be propagated immediately
              throw new Error('Companion doc not ready')
            }
            return response
          }),
          retry({
            count: 2,
            delay: (error) => {
              if (error instanceof Error && error.message === 'Companion doc not ready') {
                return timer(1000)
              }

              throw error
            },
          }),
        )

    return companionDocsIdsListener$(publishedId).pipe(
      map((value) => value.documentIds),
      mergeMapArray(getCompanionDoc$),
      map((value) => ({error: null, data: value, loading: false})),
      catchError((error) => of({error, data: [], loading: false})),
      startWith(INITIAL_VALUE),
      shareReplay(1),
    )
  },
  (publishedId, client) => `${publishedId}-${client.config().dataset}-${client.config().projectId}`,
)

/**
 * This store is used to get the companion docs for a given document bundle.
 * It uses the published id of the document and it sets up a listener `companionDocsIdsListener$` for document with type `sanity.canvas.link`
 * that have a `studioDocumentId` in the published, draft or version path of the document.
 *
 * The mentioned listener doesn't get the full document, it gets only the ids, so the subsequent request `getCompanionDoc$` is the one that handles
 * fetching the data for that companion doc obtained from the listener.
 *
 * The value is memoized based on the publishedId and the client config, ensuring that using the same publishedId and client config will return the same observable and won't start multiple listeners.
 */
export function createCanvasCompanionDocsStore({
  client,
  previewStore,
}: {
  client: SanityClient
  previewStore: DocumentPreviewStore
}): CanvasCompanionDocsStore {
  return {
    getCompanionDocs: (documentId: string) =>
      getCompanionDocs(getPublishedId(documentId), client, previewStore),
  }
}
