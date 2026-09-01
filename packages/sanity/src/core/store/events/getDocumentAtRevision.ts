import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {getDraftId, getPublishedId, isVersionId} from '../../util/draftUtils'
import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {type EventsStoreRevision} from './types'

const documentRevisionCache: Record<string, Observable<EventsStoreRevision>> = Object.create(null)

/**
 * - When fetching by `revisionId`, `revisionId` will always be present in the result.
 * - When fetching by `time`, `revisionId` will only be present after fetching.
 */
type Result<InputContext> = InputContext extends {revisionId: string}
  ? EventsStoreRevision
  : Omit<EventsStoreRevision, 'revisionId'> & Partial<Pick<EventsStoreRevision, 'revisionId'>>

type Context = {
  client: SanityClient
  documentId: string
  /**
   * Also query the other documents in the group (published, draft and — when `documentId` is a
   * version id — the version) and resolve the revision against whichever of them it belongs to,
   * preferring `documentId`. The timeline needs this: event ids for e.g. publish events can be
   * revisions of the published document even when the pane shows the draft variant.
   */
  includeGroupDocuments?: boolean
} & (
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
 * Picks the matching document out of a history API response.
 *
 * Single-document requests trust the API response (`documents[0]`). Group requests can return
 * several documents — including ones whose `_rev` is merely their state as of the requested
 * transaction — so the revision must be matched explicitly (`_rev === revisionId`), preferring
 * the requested `documentId` when several group documents share the revision. Time-based group
 * requests return one snapshot per group document, so only the requested id is the right answer.
 */
function pickDocument(
  documents: SanityDocument[],
  {
    documentId,
    revisionId,
    includeGroupDocuments,
  }: {documentId: string; revisionId?: string; includeGroupDocuments?: boolean},
): SanityDocument | undefined {
  if (!includeGroupDocuments) {
    return documents[0]
  }
  if (typeof revisionId === 'string') {
    return (
      documents.find((doc) => doc._rev === revisionId && doc._id === documentId) ||
      documents.find((doc) => doc._rev === revisionId)
    )
  }
  return documents.find((doc) => doc._id === documentId)
}

/**
 * Fetches a document snapshot from the history API, either at a specific `revisionId` or at a
 * point in `time`. Emits `{loading: true}` first, then the result.
 *
 * Main cases covered:
 * - `revisionId === HISTORY_CLEARED_EVENT_ID` short-circuits to `{document: null, loading: false}`
 *   without a request (that id is synthetic and has no revision behind it).
 * - With `includeGroupDocuments`, the request queries the published, draft (and version) ids
 *   together and resolves the revision against whichever group document it belongs to. Without
 *   it, only `documentId` is queried and the revision must belong to that document.
 * - The revision may be missing (history retention): the API returns no documents and `document`
 *   is `undefined`; callers like `getDocumentChanges` translate that into
 *   `MissingSinceDocumentError`.
 * - Errors are logged and emitted as `{document: null, loading: false}` — never thrown.
 *
 * Results are cached module-level per queried ids + `<revisionId|time>` observable
 * (`shareReplay(1)`), so concurrent and repeated subscribers share one request. Group requests
 * are additionally scoped by the preferring `documentId`, since the same queried ids can
 * resolve to different documents depending on which variant is asking.
 * Known quirks:  error results are cached forever, and the cache never evicts (tracked as known issues).
 */
export function getDocumentAtRevision<InputContext extends Context>({
  client,
  documentId,
  revisionId,
  time,
  includeGroupDocuments,
}: InputContext): Observable<Result<InputContext> | null> {
  if (revisionId === HISTORY_CLEARED_EVENT_ID) {
    return of({document: null, loading: false, revisionId: revisionId})
  }
  const idsToQuery = includeGroupDocuments
    ? [
        getPublishedId(documentId),
        getDraftId(documentId),
        ...(isVersionId(documentId) ? [documentId] : []),
      ]
    : [documentId]
  // Group results are selected relative to `documentId` (see `pickDocument`), and the same id
  // list is queried for every member of a group — so group cache entries must also be scoped to
  // the preferring id, or the first variant to fetch would decide the result for all of them.
  const cacheKey = `${includeGroupDocuments ? `${documentId}:` : ''}${idsToQuery.join(',')}@${revisionId ? ['revisionId', revisionId].join('.') : ['time', time].join('.')}`
  const dataset = client.config().dataset
  if (!documentRevisionCache[cacheKey]) {
    const searchParams = new URLSearchParams(
      typeof revisionId === 'string' ? {revision: revisionId} : {time},
    )
    documentRevisionCache[cacheKey] = client.observable
      .request<{documents: SanityDocument[]}>({
        url: `/data/history/${dataset}/documents/${idsToQuery.join(',')}?${searchParams}`,
        tag: 'get-document-revision',
      })
      .pipe(
        map((response) => {
          const document = pickDocument(response.documents, {
            documentId,
            revisionId,
            includeGroupDocuments,
          })
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
