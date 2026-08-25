import {type SanityClient} from '@sanity/client'
import {
  type TransactionLogEventWithMutations,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getTransactionsLogs} from '../translog/getTransactionsLogs'

const TRANSLOG_ENTRY_LIMIT = 50
/**
 * Maximum number of transaction ranges kept in the module cache (LRU).
 * @internal
 */
export const TRANSACTIONS_CACHE_MAX_ENTRIES = 100

const documentTransactionsCache = new Map<
  string,
  (TransactionLogEventWithEffects & TransactionLogEventWithMutations)[]
>()

// Transactions could be cached, given they are not gonna change EVER.
// Transactions are in an order, so if we have [rev4, rev3, rev2] and we already got [rev4, rev3] we can just get the diff between rev3 and rev2 and increment it.

/** LRU insert: refreshes recency on rewrite and evicts the oldest entry beyond the cap. */
function setCacheEntry(
  key: string,
  transactions: (TransactionLogEventWithEffects & TransactionLogEventWithMutations)[],
): void {
  documentTransactionsCache.delete(key)
  documentTransactionsCache.set(key, transactions)
  if (documentTransactionsCache.size > TRANSACTIONS_CACHE_MAX_ENTRIES) {
    const oldestKey = documentTransactionsCache.keys().next().value
    if (oldestKey !== undefined) documentTransactionsCache.delete(oldestKey)
  }
}

/**
 * Clears the module-level transactions cache. Exposed for tests.
 * @internal
 */
export function clearDocumentTransactionsCache(): void {
  documentTransactionsCache.clear()
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
 *   but writes happen for open ranges too. The cache is LRU-bounded (oldest entry evicted beyond
 *   the cap).
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
  const cached = documentTransactionsCache.get(cacheKey)
  if (cached && typeof toTransaction !== 'undefined') {
    // Refresh recency so frequently viewed ranges survive eviction.
    setCacheEntry(cacheKey, cached)
    return cached
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

  setCacheEntry(cacheKey, transactions)
  return transactions
}
