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
  time,
}: {
  client: SanityClient
  documentId: string
} & (
  | {
      revisionId: string
      time?: never
    }
  | {
      time: string
      revisionId?: never
    }
)): Observable<EventsStoreRevision | null> {
  if (revisionId === HISTORY_CLEARED_EVENT_ID) {
    return of({document: null, loading: false, revisionId: revisionId})
  }
  const cacheKey = `${documentId}@${revisionId ?? time}`
  const dataset = client.config().dataset
  if (!documentRevisionCache[cacheKey]) {
    const searchParams = new URLSearchParams(
      typeof revisionId === 'string' ? {revision: revisionId} : {time},
    )
    documentRevisionCache[cacheKey] = client.observable
      .request<{documents: SanityDocument[]}>({
        url: `/data/history/${dataset}/documents/${documentId}?${searchParams}`,
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
