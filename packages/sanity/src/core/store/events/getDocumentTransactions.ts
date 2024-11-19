import {type TransactionLogEventWithEffects} from '@sanity/types'
import {type SanityClient} from 'sanity'

import {getJsonStream} from '../_legacy/history/history/getJsonStream'

const TRANSLOG_ENTRY_LIMIT = 50

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

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
  const clientConfig = client.config()
  const dataset = clientConfig.dataset

  const queryParams = new URLSearchParams({
    tag: 'sanity.studio.documents.history',
    effectFormat: 'mendoza',
    excludeContent: 'true',
    includeIdentifiedDocumentsOnly: 'true',
    // reverse: 'true',
    limit: TRANSLOG_ENTRY_LIMIT.toString(),
    // https://www.sanity.io/docs/history-api#fromTransaction-db53ef83c809
    fromTransaction,
  })
  if (toTransaction) {
    queryParams.append('toTransaction', toTransaction)
  }

  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${documentId}?${queryParams.toString()}`,
  )
  const transactions: TransactionLogEventWithEffects[] = []

  const stream = await getJsonStream(transactionsUrl, clientConfig.token)
  const reader = stream.getReader()
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read()
    if (result.done) break

    if ('error' in result.value) {
      throw new Error(result.value.error.description || result.value.error.type)
    }
    if (result.value.id === fromTransaction) continue
    else transactions.push(result.value)
  }

  if (
    transactions.length ===
    // The transaction received with the id fromTransaction is not included in the list but it's returned by the API; remove that from the count
    TRANSLOG_ENTRY_LIMIT - 1
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
