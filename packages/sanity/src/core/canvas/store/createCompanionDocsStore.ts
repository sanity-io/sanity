import {type SanityClient} from '@sanity/client'
import {catchError, map, type Observable, of, retry, shareReplay, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {memoize} from '../../store/_legacy/document/utils/createMemoizer'
import {getPublishedId} from '../../util/draftUtils'
import {type CompanionDoc} from '../types'

export interface CompanionDocsStore {
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
        .fetch<CompanionDoc>(
          `*[_id == $id][0]{ _id, canvasDocumentId, studioDocumentId}`,
          {id},
          {tag: 'canvas-document-layout.companion-docs'},
        )
        .pipe(
          map((response) => {
            if (!response._id) {
              // This will be caught by the retry operator below
              // In some race scenarios we can get the response in the listener before the document is available to be fetched.
              // this is a workaround to retry the request until the document is available, we know it should be available because the listener got it
              throw new Error('Companion doc not ready')
            }
            return response
          }),
          retry({count: 2, delay: 1000}),
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

export function createCompanionDocsStore({
  client,
  previewStore,
}: {
  client: SanityClient
  previewStore: DocumentPreviewStore
}): CompanionDocsStore {
  return {
    getCompanionDocs: (documentId: string) =>
      getCompanionDocs(getPublishedId(documentId), client, previewStore),
  }
}
