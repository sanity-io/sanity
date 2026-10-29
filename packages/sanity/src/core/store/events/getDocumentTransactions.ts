import {type SanityClient} from '@sanity/client'
import {
  type TransactionLogEventWithMutations,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getTransactionsLogs} from '../translog/getTransactionsLogs'

const TRANSLOG_ENTRY_LIMIT = 50

const documentTransactionsCache: Record<
  string,
  (TransactionLogEventWithEffects & TransactionLogEventWithMutations)[]
> = Object.create(null)

// Transactions could be cached, given they are not gonna change EVER.
// Transactions are in an order, so if we have [rev4, rev3, rev2] and we already got [rev4, rev3] we can just get the diff between rev3 and rev2 and increment it.

/**
 * Clears the module-level transactions cache. Exposed for tests.
 * @internal
 */
export function clearDocumentTransactionsCache(): void {
  for (const key of Object.keys(documentTransactionsCache)) {
    delete documentTransactionsCache[key]
  }
}

/**
 * Fetches the translog transactions for `documentId` between two revisions, transparently
 * paginating past the 50-entries-per-request API limit.
 *
 * Behavior:
 * - When `fromTransaction !== toTransaction`, the API includes the `fromTransaction` entry itself
 *   in the response; it is filtered out so the returned range is exclusive of `from`.
 * - When a full page is returned (accounting for the filtered `from` entry), the next page is
 *   fetched recursively starting from the last received id — unless `toTransaction` was already
 *   reached. With no `toTransaction`, pagination continues to the present (an empty
 *   `fromTransaction` therefore walks the entire translog — tracked as a known issue).
 * - Results are cached module-level per `projectId:dataset:documentId-toTransaction-fromTransaction`;
 *   the cache is only *read* for closed ranges (`toTransaction` defined — those are immutable),
 *   but writes happen for open ranges too.
 *
 * Known quirk: the cache never evicts (tracked as known issues).
 */
export async function getDocumentTransactions({
  documentId,
  client,
  toTransaction,
  fromTransaction,
}: {
  documentId: string
  client: SanityClient
  toTransaction?: string
  fromTransaction: string
}): Promise<(TransactionLogEventWithEffects & TransactionLogEventWithMutations)[]> {
  const {projectId, dataset} = client.config()
  const cacheKey = `${projectId}:${dataset}:${documentId}-${toTransaction}-${fromTransaction}`
  if (documentTransactionsCache[cacheKey] && typeof toTransaction !== 'undefined') {
    return documentTransactionsCache[cacheKey]
  }
  const skipFromTransaction = fromTransaction !== toTransaction

  let transactions = await getTransactionsLogs(client, documentId, {
    tag: 'sanity.studio.documents.history',
    effectFormat: 'mendoza',
    excludeContent: true,
    includeIdentifiedDocumentsOnly: true,
    limit: TRANSLOG_ENTRY_LIMIT,
    fromTransaction: fromTransaction,
    toTransaction: toTransaction,
  })
  if (skipFromTransaction) {
    transactions = transactions.filter((transaction) => transaction.id !== fromTransaction)
  }

  if (
    skipFromTransaction
      ? // The transaction received with the id fromTransaction is not included in the list but it's returned by the API; remove that from the count
        transactions.length === TRANSLOG_ENTRY_LIMIT - 1
      : transactions.length === TRANSLOG_ENTRY_LIMIT
  ) {
    // We have received the max values, we need to fetch the next batch. (Unless we have reached the toTransaction)
    if (
      (toTransaction && transactions[transactions.length - 1].id !== toTransaction) ||
      !toTransaction
    ) {
      const nextTransactions = await getDocumentTransactions({
        documentId,
        client,
        toTransaction,
        fromTransaction: transactions[transactions.length - 1].id,
      })
      return transactions.concat(nextTransactions)
    }
  }

  documentTransactionsCache[cacheKey] = transactions
  return transactions
}
