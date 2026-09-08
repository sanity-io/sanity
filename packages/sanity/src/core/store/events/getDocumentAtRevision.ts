import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {type EventsStoreRevision} from './types'

const documentRevisionCache: Record<string, Observable<EventsStoreRevision>> = Object.create(null)

/**
 * Clears the module-level revision cache. Exposed for tests.
 * @internal
 */
export function clearDocumentRevisionCache(): void {
  for (const key of Object.keys(documentRevisionCache)) {
    delete documentRevisionCache[key]
  }
}

/**
 * - When fetching by `revisionId`, `revisionId` will always be present in the result.
 * - When fetching by `time`, `revisionId` will only be present after fetching.
 */
type Result<InputContext> = InputContext extends {revisionId: string}
  ? EventsStoreRevision
  : Omit<EventsStoreRevision, 'revisionId'> & Partial<Pick<EventsStoreRevision, 'revisionId'>>

type Context = {client: SanityClient; documentId: string} & (
  | {
      /**
       * Fetch the document revision by revision id.
       */
      revisionId: string
      time?: never
    }
  | {
      revisionId?: never
      /**
       * Fetch the document revision by time, formatted as a Content Lake compatible
       * date-time string.
       */
      time: string
    }
)

/**
 * Fetches a document snapshot from the history API, either at a specific `revisionId` or at a
 * point in `time`. Emits `{loading: true}` first, then the result.
 *
 * Main cases covered:
 * - `revisionId === HISTORY_CLEARED_EVENT_ID` short-circuits to `{document: null, loading: false}`
 *   without a request (that id is synthetic and has no revision behind it).
 * - The revision may be missing (history retention): the API returns no documents and `document`
 *   is `undefined`; callers like `getDocumentChanges` translate that into
 *   `MissingSinceDocumentError`.
 * - Errors are logged and emitted as `{document: null, loading: false}` — never thrown.
 *
 * Results are cached module-level per `projectId:dataset:documentId@<revisionId|time>` observable
 * (`shareReplay(1)`), so concurrent and repeated subscribers share one request.
 * Known quirks:  error results are cached forever, and the cache never evicts (tracked as known issues).
 */
export function getDocumentAtRevision<InputContext extends Context>({
  client,
  documentId,
  revisionId,
  time,
}: InputContext): Observable<Result<InputContext> | null> {
  if (revisionId === HISTORY_CLEARED_EVENT_ID) {
    return of({document: null, loading: false, revisionId: revisionId})
  }
  const {projectId, dataset} = client.config()
  const cacheKey = `${projectId}:${dataset}:${documentId}@${revisionId ? ['revisionId', revisionId].join('.') : ['time', time].join('.')}`
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
          return {document: document, loading: false, revisionId: document?._rev}
        }),

        catchError((error: Error) => {
          // TODO: Handle error
          console.error('Error fetching document at revision', error)
          return [
            {
              document: null,
              loading: false,
              revisionId: revisionId,
            } satisfies Result<Context> as any,
          ]
        }),
        startWith({
          document: null,
          loading: true,
          revisionId: revisionId,
        } satisfies Result<Context> as any),
        shareReplay(1),
      )
  }

  return documentRevisionCache[cacheKey]
}
