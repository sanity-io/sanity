import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type Observable} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {type EventsStoreRevision} from './types'

const documentRevisionCache: Record<string, Observable<EventsStoreRevision>> = Object.create(null)

export function getDocumentAtRevision({
  client,
  documentId,
  revisionId,
}: {
  client: SanityClient
  documentId: string
  revisionId: string
}): Observable<EventsStoreRevision | null> {
  const cacheKey = `${documentId}@${revisionId}`
  const dataset = client.config().dataset
  if (!documentRevisionCache[cacheKey]) {
    documentRevisionCache[cacheKey] = client.observable
      .request<{documents: SanityDocument[]}>({
        url: `/data/history/${dataset}/documents/${documentId}?revision=${revisionId}`,
        tag: 'get-document-revision',
      })
      .pipe(
        map((response) => {
          const document = response.documents[0]
          return {document: document, loading: false, revisionId: revisionId}
        }),

        catchError((error: Error) => {
          // TODO: Handle error
          console.error('Error fetching document at revision', error)
          return [{document: null, loading: false, revisionId: revisionId}]
        }),
        startWith({document: null, loading: true, revisionId: revisionId}),
        shareReplay(1),
      )
  }

  return documentRevisionCache[cacheKey]
}
