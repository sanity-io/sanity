import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
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
  if (revisionId === HISTORY_CLEARED_EVENT_ID) {
    return of({document: null, loading: false, revisionId: revisionId})
  }
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
