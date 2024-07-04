import {useCallback, useEffect, useMemo, useState} from 'react'
import {getPublishedId, type TransactionLogEventWithEffects, useClient} from 'sanity'

import {getJsonStream} from '../../../../store/_legacy/history/history/getJsonStream'
import {API_VERSION} from '../../../../tasks/constants'

/**
 * TODO:
 * Temporal solution, will be replaced once we have the API endpoint that returns all the necessary data.
 */
export function useVersionHistory(id: string, revision: string) {
  const client = useClient({apiVersion: API_VERSION})
  const {dataset, token} = client.config()
  const [history, setHistory] = useState<TransactionLogEventWithEffects[]>([])
  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true`
  const publishedId = getPublishedId(id)
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${publishedId}?${queryParams}`,
  )

  const fetchAndParse = useCallback(async () => {
    const transactions: TransactionLogEventWithEffects[] = []
    const stream = await getJsonStream(transactionsUrl, token)
    const reader = stream.getReader()
    let result
    for (;;) {
      result = await reader.read()
      if (result.done) {
        break
      }
      if ('error' in result.value) {
        throw new Error(result.value.error.description || result.value.error.type)
      }
      transactions.push(result.value)
      setHistory(transactions)
    }
  }, [transactionsUrl, token])

  useEffect(() => {
    fetchAndParse()
    // When revision changes, update the history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndParse, revision])
  const createdBy = history[0]?.author
  const lastEditedBy = history[history.length - 1]?.author
  const editors = useMemo(
    () => Array.from(new Set(history.map((event) => event.author).filter(Boolean))),
    [history],
  )

  return {history, createdBy, lastEditedBy, editors}
}
