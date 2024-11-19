import {type TransactionLogEventWithEffects} from '@sanity/types'
import {type SanityClient} from 'sanity'

import {getJsonStream} from '../_legacy/history/history/getJsonStream'

const TRANSLOG_ENTRY_LIMIT = 50

const documentTransactionsCache: Record<string, TransactionLogEventWithEffects[]> =
  Object.create(null)

// TODO: This needs to account for pagination, if the limit is reached and the toTransaction is not found we need to keep fetching
// Possibly: if(limitReached && !toTransactionFound) { return getDocumentTransactions({documentId, client, toTransaction, fromTransaction: lastTransactionId}) }
export async function getDocumentTransactions({
  documentId,
  client,
  toTransaction,
  fromTransaction,
}: {
  documentId: string
  client: SanityClient
  toTransaction?: string
  fromTransaction?: string
}) {
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
  })
  if (toTransaction) {
    queryParams.append('toTransaction', toTransaction)
  }
  if (fromTransaction) {
    // https://www.sanity.io/docs/history-api#fromTransaction-db53ef83c809
    queryParams.append('fromTransaction', fromTransaction)
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
  documentTransactionsCache[cacheKey] = transactions
  return transactions
}
