import {
  type MendozaPatch,
  type SanityDocument,
  type TransactionLogEventWithEffects,
} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, defer, from, map, mergeMap, type Observable, of, startWith, toArray} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionsLogs'
import {useStudioErrorHandler} from '../../../../../studio/requestErrors/useStudioErrorHandler'
import {getPublishedId} from '../../../../../util/draftUtils'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../../util/releasesClient'
import {type DocumentInRelease} from '../../../detail/types'

export type RevertDocument = SanityDocument & {
  _system?: {
    delete: true
  }
}

/**
 * How a single document in a published release should be reverted.
 *
 * - `revert`: the document existed before the release; `document` is its last published
 *   revision from before the release publish, fetched from the history API.
 * - `unpublish`: the document did not exist right before the release was published. Proven from
 *   mendoza effects in the transaction log, never assumed: either the publish transaction created
 *   it, or its last pre-release transaction deleted it. Reverting means unpublishing it.
 * - `unresolved`: no safe revert target is known. `request-failed` means a history request failed
 *   with an error the studio's request-error handler did not claim; `history-unavailable` means
 *   the history needed to decide is gone (retention), so retrying will not help. The revert must
 *   not proceed while any document is unresolved.
 */
export type DocumentRevertState =
  | {documentId: string; type: 'revert'; document: RevertDocument}
  | {documentId: string; type: 'unpublish'; document: RevertDocument}
  | {
      documentId: string
      type: 'unresolved'
      reason: 'request-failed' | 'history-unavailable'
      error?: unknown
    }

export interface DocumentRevertStates {
  states: DocumentRevertState[]
  /** Documents to write into the revert release, in release order. Excludes unresolved documents. */
  revertDocuments: RevertDocument[]
  revertCount: number
  unpublishCount: number
  unresolvedDocumentIds: string[]
}

/**
 * Upper bound per bulk translog request. The window is shared across the documents in the request,
 * so any document whose newest pre-release transaction falls outside it is resolved individually
 * instead. Content is excluded, so entries are small.
 */
const BULK_TRANSLOG_LIMIT = 1000

/**
 * Character budget for the comma-joined document ids of one bulk translog request. Ids go into the
 * URL path, and Sanity ids can be up to 128 characters, so a fixed count is not enough to keep a
 * large release under common proxy URL limits (8 KB); the budget leaves room for host, path and
 * query.
 */
const BULK_TRANSLOG_IDS_CHAR_BUDGET = 6000

/**
 * The history endpoint is not CDN-cached and counts fully against the per-IP rate limit; ten
 * concurrent requests is the highest that has been observed not to trigger 429s.
 */
const HISTORY_CONCURRENCY = 10

const EMPTY_STATES: DocumentRevertStates = {
  states: [],
  revertDocuments: [],
  revertCount: 0,
  unpublishCount: 0,
  unresolvedDocumentIds: [],
}

/**
 * A mendoza patch that maps a document to nothing. As the `apply` of an effect it means the
 * transaction deleted the document; as the `revert` it means the document did not exist before
 * the transaction, i.e. the transaction created it. Same rule as the events store's
 * `getEffectState`.
 */
function isDeletePatch(patch: MendozaPatch | undefined): boolean {
  return patch !== undefined && patch[0] === 0 && patch[1] === null
}

/** Greedily packs ids into chunks whose comma-joined length stays within `maxChars`. */
function chunkIdsByLength(ids: string[], maxChars: number): string[][] {
  const chunks: string[][] = []
  let current: string[] = []
  let currentLength = 0
  for (const id of ids) {
    const added = current.length ? id.length + 1 : id.length
    if (current.length && currentLength + added > maxChars) {
      chunks.push(current)
      current = []
      currentLength = 0
    }
    current.push(id)
    currentLength += current.length === 1 ? id.length : id.length + 1
  }
  if (current.length) chunks.push(current)
  return chunks
}

interface BulkChunk {
  /** The document ids this chunk was requested for */
  ids: string[]
  /** The chunk's response, newest transaction first */
  transactions: TransactionLogEventWithEffects[]
}

interface BulkIndex {
  newestPreRelease: Map<string, TransactionLogEventWithEffects>
  publish: Map<string, TransactionLogEventWithEffects>
}

/**
 * Indexes the bulk responses once so per-document resolution is a map lookup: the newest
 * pre-release transaction per document, and the publish transaction per document it carries an
 * effect for. A transaction can touch documents in several chunks and so appear in several
 * responses, and chunks complete in any order, so each response is only trusted for the ids it
 * was requested for; within a response, first occurrence is newest.
 */
function indexBulkChunks(chunks: BulkChunk[], publishTransactionId: string | undefined): BulkIndex {
  const newestPreRelease = new Map<string, TransactionLogEventWithEffects>()
  const publish = new Map<string, TransactionLogEventWithEffects>()
  for (const {ids, transactions} of chunks) {
    const requested = new Set(ids)
    for (const transaction of transactions) {
      if (transaction.id === publishTransactionId) {
        for (const documentId of Object.keys(transaction.effects)) {
          if (requested.has(documentId) && !publish.has(documentId)) {
            publish.set(documentId, transaction)
          }
        }
        continue
      }
      for (const documentId of transaction.documentIDs) {
        if (requested.has(documentId) && !newestPreRelease.has(documentId)) {
          newestPreRelease.set(documentId, transaction)
        }
      }
    }
  }
  return {newestPreRelease, publish}
}

function aggregateStates(states: DocumentRevertState[]): DocumentRevertStates {
  return states.reduce<DocumentRevertStates>(
    (acc, state) => {
      if (state.type === 'unresolved') {
        acc.unresolvedDocumentIds.push(state.documentId)
        return acc
      }
      acc.revertDocuments.push(state.document)
      if (state.type === 'revert') acc.revertCount += 1
      else acc.unpublishCount += 1
      return acc
    },
    {states, revertDocuments: [], revertCount: 0, unpublishCount: 0, unresolvedDocumentIds: []},
  )
}

function toUnpublishState(document: DocumentInRelease['document']): DocumentRevertState {
  const {
    publishedDocumentExists: _publishedDocumentExists,
    draftDocumentExists: _draftDocumentExists,
    ...unpublishDocument
  } = document
  return {
    documentId: document._id,
    type: 'unpublish',
    document: {...unpublishDocument, _system: {delete: true}} as RevertDocument,
  }
}

function historyUnavailable(documentId: string, message: string): DocumentRevertState {
  return {documentId, type: 'unresolved', reason: 'history-unavailable', error: new Error(message)}
}

/**
 * Resolves, for each document in a published release, the state to revert it to.
 *
 * Returns `null` while resolving, then a {@link DocumentRevertStates}.
 *
 * Every history request goes through the studio's request-error handler as a retryable read.
 * Translog requests surface non-OK responses as `@sanity/client` `HttpError`s (see
 * `getJsonStream`) and revision fetches go through the client, so network failures, 5xx responses
 * and rate limiting on any of them surface the studio's error dialog, whose "Try again" re-runs the
 * request; the hook simply stays in the resolving state meanwhile. Errors the handler does not
 * claim (other 4xx, parse errors) mark the affected document unresolved rather than being dropped
 * or turned into an unpublish action, so callers can refuse to revert until every document has a
 * known target.
 */
export const useDocumentRevertStates = (
  releaseDocuments: DocumentInRelease[],
): DocumentRevertStates | null => {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const errorHandler = useStudioErrorHandler()
  const publishTransactionId = releaseDocuments[0]?.document._rev
  const {dataset} = client.config()

  const documentRevertStates$ = useMemo((): Observable<DocumentRevertStates | null> => {
    if (!releaseDocuments.length) return of(EMPTY_STATES)

    const publishedDocuments = releaseDocuments.map(({document}) => ({
      ...document,
      _id: getPublishedId(document._id),
    }))
    const publishedIds = publishedDocuments.map((document) => document._id)

    // History reads are idempotent, so the studio dialog may re-run them. `defer` keeps the
    // request from firing until subscription, since `attempt()` runs its thunk immediately.
    const request = <T>(thunk: () => PromiseLike<T> | Observable<T>): Observable<T> =>
      defer(() => from(errorHandler.attempt(thunk, {retryable: true})))

    // The release publish transaction itself is never a revert target. Filtering by id rather
    // than position keeps this correct whether or not the API includes `toTransaction`.
    const isPreReleaseTransaction = (transaction: TransactionLogEventWithEffects) =>
      transaction.id !== publishTransactionId

    // Bulk requests covering all documents in chunks; most recent first within each chunk.
    // Documents not represented are looked up individually below, so a truncated response only
    // costs extra requests, never a wrong answer. An unclaimed bulk failure is not retried per
    // document; it falls through to the pipeline-level handler, which marks every document
    // unresolved.
    const bulkTransactions$ = from(
      chunkIdsByLength(publishedIds, BULK_TRANSLOG_IDS_CHAR_BUDGET),
    ).pipe(
      mergeMap(
        (ids) =>
          request(() =>
            getTransactionsLogs(client, ids, {
              toTransaction: publishTransactionId,
              reverse: true,
              limit: BULK_TRANSLOG_LIMIT,
              effectFormat: 'mendoza',
            }),
          ).pipe(map((transactions): BulkChunk => ({ids, transactions}))),
        2,
      ),
      toArray(),
      map((chunks) => indexBulkChunks(chunks, publishTransactionId)),
    )

    // The newest transaction touching the document before the release publish, if any.
    const findPreReleaseTransaction = (
      documentId: string,
      bulk: BulkIndex,
    ): Observable<TransactionLogEventWithEffects | undefined> => {
      const fromBulk = bulk.newestPreRelease.get(documentId)
      if (fromBulk) return of(fromBulk)

      return request(() =>
        getTransactionsLogs(client, documentId, {
          toTransaction: publishTransactionId,
          reverse: true,
          // the publish transaction may be included; one more entry is enough to see past it
          limit: 2,
          effectFormat: 'mendoza',
        }),
      ).pipe(map((transactions) => transactions.find(isPreReleaseTransaction)))
    }

    // The publish transaction's effect on the document is the only proof that the release created
    // it. Taken from the bulk response when present, otherwise fetched for this document alone.
    const findPublishTransaction = (
      documentId: string,
      bulk: BulkIndex,
    ): Observable<TransactionLogEventWithEffects | undefined> => {
      const fromBulk = bulk.publish.get(documentId)
      if (fromBulk) return of(fromBulk)

      return request(() =>
        getTransactionsLogs(client, documentId, {
          fromTransaction: publishTransactionId,
          toTransaction: publishTransactionId,
          limit: 1,
          effectFormat: 'mendoza',
        }),
      ).pipe(
        map((transactions) =>
          transactions.find((transaction) => transaction.id === publishTransactionId),
        ),
      )
    }

    const resolveState = (
      document: (typeof publishedDocuments)[number],
      bulk: BulkIndex,
    ): Observable<DocumentRevertState> => {
      const documentId = document._id
      return findPreReleaseTransaction(documentId, bulk).pipe(
        mergeMap((transaction): Observable<DocumentRevertState> => {
          if (!transaction) {
            // Nothing before the publish in the log. Either the release created the document, or
            // its older history has been pruned by retention. Only the publish transaction's
            // effect can tell the two apart.
            return findPublishTransaction(documentId, bulk).pipe(
              map((publishTransaction) =>
                isDeletePatch(publishTransaction?.effects[documentId]?.revert)
                  ? toUnpublishState(document)
                  : historyUnavailable(
                      documentId,
                      `No history before the release publish for document ${documentId}`,
                    ),
              ),
            )
          }

          // The last thing that happened to the document before the release was a delete, so it
          // did not exist when the release was published. No snapshot to fetch.
          if (isDeletePatch(transaction.effects[documentId]?.apply)) {
            return of(toUnpublishState(document))
          }

          return request(() =>
            observableClient.request<{documents: RevertDocument[]}>({
              url: `/data/history/${dataset}/documents/${documentId}?revision=${transaction.id}`,
            }),
          ).pipe(
            map(({documents: [revertDocument]}): DocumentRevertState =>
              revertDocument
                ? {documentId, type: 'revert', document: revertDocument}
                : // The transaction is in the log but its snapshot is not: history retention.
                  historyUnavailable(
                    documentId,
                    `Revision ${transaction.id} of document ${documentId} is no longer available in history`,
                  ),
            ),
          )
        }),
        catchError((error) =>
          of<DocumentRevertState>({
            documentId,
            type: 'unresolved',
            reason: 'request-failed',
            error,
          }),
        ),
      )
    }

    return bulkTransactions$.pipe(
      mergeMap((bulk) =>
        from(publishedDocuments).pipe(
          mergeMap(
            (document, index) =>
              resolveState(document, bulk).pipe(map((state) => ({index, state}))),
            HISTORY_CONCURRENCY,
          ),
          toArray(),
          map((indexed) => indexed.sort((a, b) => a.index - b.index).map(({state}) => state)),
        ),
      ),
      map(aggregateStates),
      catchError((error) =>
        of(
          aggregateStates(
            publishedIds.map((documentId): DocumentRevertState => ({
              documentId,
              type: 'unresolved',
              reason: 'request-failed',
              error,
            })),
          ),
        ),
      ),
      // Not redundant with the `useObservable` initial value: it resets the hook to the resolving
      // state when `releaseDocuments` changes and a new pipeline replaces a resolved one.
      startWith(null),
    )
  }, [client, releaseDocuments, publishTransactionId, observableClient, dataset, errorHandler])

  return useObservable(documentRevertStates$, null)
}
