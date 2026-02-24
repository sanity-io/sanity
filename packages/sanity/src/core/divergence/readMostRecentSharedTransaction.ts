import {type SanityClient} from '@sanity/client'
import {
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
  isCreateIfNotExistsMutation,
  isCreateMutation,
  isCreateOrReplaceMutation,
} from '@sanity/types'
import {applyPatch} from 'mendoza'
import {
  type Observable,
  concat,
  concatMap,
  EMPTY,
  first,
  from,
  map,
  merge,
  of,
  scan,
  switchMap,
} from 'rxjs'

import {getTransactionsLogs as defaultGetTransactionsLogs} from '../store/translog/getTransactionsLogs'

type SourceTransaction = [source: 'a' | 'b', transaction: TransactionLogEventWithEffects]

interface TransactionAccumulation {
  a: Set<string>
  b: Set<string>
  currentTransaction: SourceTransaction
}

interface PartialTransactionAccumulation extends Omit<
  TransactionAccumulation,
  'currentTransaction'
> {
  currentTransaction: SourceTransaction | undefined
}

const PAGE_LENGTH = 50

/**
 * Find the most recent transaction shared by two documents, following each base
 * document link found in the `_system.base` field in order to construct the
 * content's full history, including its lineage.
 *
 * As soon as any transaction is found that appears in the lineage of each
 * document, that transaction is emitted and the process ends. It can be assumed
 * the emitted transaction is the most recent point in time that the content of
 * the two documents was identical.
 *
 * @internal
 */
export function readMostRecentSharedTransaction({
  a,
  b,
  client,
  getTransactionsLogs = defaultGetTransactionsLogs,
}: {
  a?: string
  b?: string
  client: SanityClient
  getTransactionsLogs?: typeof defaultGetTransactionsLogs
}): Observable<TransactionLogEventWithEffects | undefined> {
  if (typeof a === 'undefined' || typeof b === 'undefined') {
    return EMPTY
  }

  return merge(
    readTransactionsFollowingLineage({documentId: a, client, getTransactionsLogs}).pipe(
      map((transaction) => ['a', transaction] satisfies SourceTransaction),
    ),
    readTransactionsFollowingLineage({documentId: b, client, getTransactionsLogs}).pipe(
      map((transaction) => ['b', transaction] satisfies SourceTransaction),
    ),
  ).pipe(
    scan<SourceTransaction, PartialTransactionAccumulation>(
      (visited, [source, transaction]) => {
        visited[source].add(transaction.id)
        visited.currentTransaction = [source, transaction] satisfies SourceTransaction
        return visited
      },
      {
        a: new Set<string>(),
        b: new Set<string>(),
        currentTransaction: undefined,
      },
    ),
    first((accumulation): accumulation is TransactionAccumulation => {
      const {a: transactionIdsA, b: transactionIdsB, currentTransaction} = accumulation

      if (typeof currentTransaction === 'undefined') {
        return false
      }

      const [source, transaction] = currentTransaction
      const partner = source === 'a' ? transactionIdsB : transactionIdsA

      return partner.has(transaction.id)
    }, undefined),
    map((accumulation) => {
      if (typeof accumulation === 'undefined') {
        return undefined
      }

      const [, transaction] = accumulation.currentTransaction
      return transaction
    }),
  )
}

/**
 * Read the entire history of a document, following each base document link
 * found in the `_system.base` field in order to construct the content's full
 * history, including its lineage.
 *
 * This is necessary, because history isn't copied when creating a version of a
 * document.
 *
 * @internal
 */
export function readTransactionsFollowingLineage({
  documentId,
  baseRevisionId,
  cursor,
  client,
  getTransactionsLogs = defaultGetTransactionsLogs,
}: {
  documentId: string
  baseRevisionId?: string
  cursor?: string
  client: SanityClient
  getTransactionsLogs?: typeof defaultGetTransactionsLogs
}): Observable<TransactionLogEventWithEffects & TransactionLogEventWithMutations> {
  if (PAGE_LENGTH < 2) {
    throw new Error(
      'Page length must be greater than 1, because the Content Lake API response is inclusive of `toTransaction`.',
    )
  }

  const request = getTransactionsLogs(client, documentId, {
    limit: PAGE_LENGTH,
    excludeContent: true,
    effectFormat: 'mendoza',
    reverse: true,
    includeIdentifiedDocumentsOnly: true,
    toTransaction: cursor ?? baseRevisionId,
  })

  return from(request).pipe(
    switchMap((transactions) => from(transactions)),
    concatMap((transaction, index) => {
      const isCursor = transaction.id === cursor

      // Content Lake response is inclusive of `toTransaction`, which means
      // transactions occurring at page boundaries will be re-emitted when using
      // `toTransaction` as a cursor.
      //
      // This step prevents the observable re-emitting such transactions.
      if (isCursor) {
        return EMPTY
      }

      const isPageEnd = index === PAGE_LENGTH - 1

      const maybeReadNextPage = isPageEnd
        ? readTransactionsFollowingLineage({
            documentId,
            baseRevisionId,
            cursor: transaction.id,
            client,
            getTransactionsLogs,
          })
        : EMPTY

      if (
        isVersionCreateTransaction(transaction, documentId) &&
        typeof transaction.effects[documentId] !== 'undefined'
      ) {
        const createdDocument = applyPatch({}, transaction.effects[documentId]?.apply)

        if (typeof createdDocument._system?.base !== 'undefined') {
          return concat(
            of(transaction),
            readTransactionsFollowingLineage({
              documentId: createdDocument._system.base.id,
              baseRevisionId: createdDocument._system.base.rev,
              client,
              getTransactionsLogs,
            }),
            maybeReadNextPage,
          )
        }
      }

      return concat(of(transaction), maybeReadNextPage)
    }),
  )
}

function isVersionCreateTransaction(
  transaction: TransactionLogEventWithEffects & TransactionLogEventWithMutations,
  documentId: string,
): boolean {
  const isCreateTransaction = transaction.mutations.some(
    (mutation) =>
      isCreateMutation(mutation) ||
      isCreateOrReplaceMutation(mutation) ||
      isCreateIfNotExistsMutation(mutation),
  )

  // Infer that a version was created if reverting the transaction is performed
  // by pushing `null` onto the output stack (Mendoza opcode 0).
  return (
    isCreateTransaction &&
    typeof transaction.effects[documentId] !== 'undefined' &&
    transaction.effects[documentId].revert.length === 2 &&
    transaction.effects[documentId].revert[0] === 0 &&
    transaction.effects[documentId].revert[1] === null
  )
}
