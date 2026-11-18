import {type SanityClient} from '@sanity/client'
import {
  buffer,
  catchError,
  concatMap,
  concatWith,
  debounceTime,
  defer,
  EMPTY,
  filter,
  from,
  ignoreElements,
  last,
  map,
  merge,
  type Observable,
  of,
  retry,
  scan,
  share,
  Subject,
  takeWhile,
  throwError,
  timer,
} from 'rxjs'

import {classifyRequestError} from '../../../studio/requestErrors/classify'
import {type DocumentInRelease} from './types'

type HistoryDocument = DocumentInRelease['document']

type ChunkOutcome =
  | {type: 'success'; ids: string[]; documents: HistoryDocument[]}
  | {type: 'failure'; ids: string[]; error: unknown}

interface CollectedRevisions {
  answeredIds: Set<string>
  documentsById: Map<string, HistoryDocument>
}

const HISTORY_IDS_PER_REQUEST = 10
// The history endpoint is uncached and its in-flight limit is shared with other tabs and editors.
const HISTORY_REQUEST_GAP_MS = 100
const MAX_HISTORY_REQUEST_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 60_000

function chunkIds(ids: string[]): string[][] {
  const chunkCount = Math.ceil(ids.length / HISTORY_IDS_PER_REQUEST)
  return Array.from({length: chunkCount}, (_unused, chunkIndex) =>
    ids.slice(chunkIndex * HISTORY_IDS_PER_REQUEST, (chunkIndex + 1) * HISTORY_IDS_PER_REQUEST),
  )
}

function getRetryDelay(error: unknown, retryCount: number): Observable<number> {
  const classification = classifyRequestError(error)
  if (classification === null) return throwError(() => error)
  if (classification.type === 'rateLimited' && classification.retryAfterSeconds !== undefined) {
    return timer(Math.min(classification.retryAfterSeconds * 1000, MAX_RETRY_DELAY_MS))
  }
  return timer(DEFAULT_RETRY_DELAY_MS * 2 ** (retryCount - 1))
}

function fetchLastRevisions(client: SanityClient, ids: string[]): Observable<ChunkOutcome> {
  return client.observable
    .request<{documents: HistoryDocument[]}>({
      url: `/data/history/${client.config().dataset}/documents/${ids.join(',')}?lastRevision=true`,
      // The client's own retries ignore `Retry-After` and re-burst inside the rate limit window.
      maxRetries: 0,
    })
    .pipe(
      retry({count: MAX_HISTORY_REQUEST_RETRIES, delay: getRetryDelay}),
      map(({documents}): ChunkOutcome => ({type: 'success', ids, documents})),
      catchError((error: unknown) => of<ChunkOutcome>({type: 'failure', ids, error})),
    )
}

/**
 * Creates a loader that resolves the last history revision of documents, merging the ids that
 * every caller asks for in the same tick into shared requests that run one at a time.
 *
 * @internal
 */
export function createHistoryLastRevisionLoader(
  client: SanityClient,
): (ids: string[]) => Observable<HistoryDocument[]> {
  const requestedIds$ = new Subject<string>()

  const outcomes$ = requestedIds$.pipe(
    buffer(requestedIds$.pipe(debounceTime(0))),
    concatMap((ids) => from(chunkIds([...new Set(ids)]))),
    concatMap((ids) =>
      fetchLastRevisions(client, ids).pipe(
        concatWith(timer(HISTORY_REQUEST_GAP_MS).pipe(ignoreElements())),
      ),
    ),
    share(),
  )

  return (ids) => {
    const idsToLoad = new Set(ids)

    const outcomesForIds$ = outcomes$.pipe(
      filter((outcome) => outcome.ids.some((id) => idsToLoad.has(id))),
      concatMap((outcome) =>
        outcome.type === 'failure' ? throwError(() => outcome.error) : of(outcome),
      ),
      scan<Extract<ChunkOutcome, {type: 'success'}>, CollectedRevisions>(
        (collected, outcome) => ({
          answeredIds: new Set([
            ...collected.answeredIds,
            ...outcome.ids.filter((id) => idsToLoad.has(id)),
          ]),
          documentsById: new Map([
            ...collected.documentsById,
            ...outcome.documents
              .filter((document) => idsToLoad.has(document._id))
              .map((document): [string, HistoryDocument] => [document._id, document]),
          ]),
        }),
        {answeredIds: new Set(), documentsById: new Map()},
      ),
      takeWhile((collected) => collected.answeredIds.size < idsToLoad.size, true),
      last(),
      map((collected) => [...idsToLoad].flatMap((id) => collected.documentsById.get(id) ?? [])),
    )

    const requestIds$ = defer(() => {
      idsToLoad.forEach((id) => requestedIds$.next(id))
      return EMPTY
    })

    return merge(outcomesForIds$, requestIds$)
  }
}
