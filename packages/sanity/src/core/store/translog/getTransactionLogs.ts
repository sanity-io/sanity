import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'

import {getJsonStream} from '../_legacy/history/history/getJsonStream'

/**
 * Fetches transaction logs for the specified document IDs from the translog
 * It adds the default query parameters to the request and also reads the stream of transactions.
 * @internal
 */
export async function getTransactionsLogs(
  client: SanityClient,
  /**
   * 1 or more document IDs to fetch transaction logs   */
  documentIds: string | string[],
  /**
   * {@link https://www.sanity.io/docs/history-api#45ac5eece4ca}
   */
  params: {
    /**
     * The tag that will be use when fetching the transactions.
     * (Default: sanity.studio.transactions-log)
     */
    tag?: `sanity.studio.${string}`
    /**
     * Exclude the document contents from the responses. (You are required to set excludeContent as true for now.)
     * (Default: true)
     */
    excludeContent?: true
    /**
     * Limit the number of returned transactions. (Default: 50)
     */
    limit?: number

    /**
     * Only include the documents that are part of the document ids list
     * (Default: true)
     */
    includeIdentifiedDocumentsOnly?: boolean

    /**
     * How the effects are formatted in the response.
     * "mendoza": Super efficient format for expressing differences between JSON documents. {@link https://www.sanity.io/blog/mendoza}
     */
    effectFormat?: 'mendoza' | undefined
    /**
     * Return transactions in reverse order.
     */
    reverse?: boolean
    /**
     * Time from which the transactions are fetched.
     */
    fromTime?: string
    /**
     * Time until the transactions are fetched.
     */
    toTime?: string
    /**
     * Transaction ID (Or, Revision ID) from which the transactions are fetched.
     */
    fromTransaction?: string
    /**
     * Transaction ID (Or, Revision ID) until the transactions are fetched.
     */
    toTransaction?: string
    /**
     * Comma separated list of authors to filter the transactions by.
     */
    authors?: string
  },
): Promise<TransactionLogEventWithEffects[]> {
  const clientConfig = client.config()
  const dataset = clientConfig.dataset
  const queryParams = new URLSearchParams({
    // Default values
    tag: 'sanity.studio.transactions-log',
    excludeContent: 'true',
    limit: '50',
    includeIdentifiedDocumentsOnly: 'true',
  })
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, value.toString())
    }
  })

  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${
      Array.isArray(documentIds) ? documentIds.join(',') : documentIds
    }?${queryParams.toString()}`,
  )

  const stream = await getJsonStream(transactionsUrl, clientConfig.token)
  const transactions: TransactionLogEventWithEffects[] = []

  const reader = stream.getReader()
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read()
    if (result.done) break

    if ('error' in result.value) {
      throw new Error(result.value.error.description || result.value.error.type)
    }
    transactions.push(result.value)
  }
  return transactions
}
