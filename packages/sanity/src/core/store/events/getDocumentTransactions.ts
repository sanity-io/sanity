import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'

import {getTransactionsLogs} from '../translog/getTransactionsLogs'

const TRANSLOG_ENTRY_LIMIT = 50

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

// Transactions could be cached, given they are not gonna change EVER.
// Transactions are in an order, so if we have [rev4, rev3, rev2] and we already got [rev4, rev3] we can just get the diff between rev3 and rev2 and increment it.

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
}): Promise<TransactionLogEventWithEffects[]> {
  const cacheKey = `${documentId}-${toTransaction}-${fromTransaction}`
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
