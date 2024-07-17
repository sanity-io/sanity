import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {getPublishedId, type TransactionLogEventWithEffects, useClient} from 'sanity'

import {getJsonStream} from '../../../../store/_legacy/history/history/getJsonStream'
import {API_VERSION} from '../../../../tasks/constants'

export type DocumentHistory = {
  history: TransactionLogEventWithEffects[]
  createdBy: string
  lastEditedBy: string
  editors: string[]
}

// TODO: Update this to contemplate the _revision change on any of the internal bundle documents, and fetch only the history of that document if changes.
export function useReleaseHistory(bundleDocuments: SanityDocument[]): {
  documentsHistory: Map<string, DocumentHistory>
  collaborators: string[]
  loading: boolean
} {
  const client = useClient({apiVersion: API_VERSION})
  const {dataset, token} = client.config()
  const [history, setHistory] = useState<TransactionLogEventWithEffects[]>([])
  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true`
  const bundleDocumentsIds = useMemo(() => bundleDocuments.map((doc) => doc._id), [bundleDocuments])

  const publishedIds = bundleDocumentsIds.map((id) => getPublishedId(id)).join(',')
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${publishedIds}?${queryParams}`,
  )

  const fetchAndParseAll = useCallback(async () => {
    if (!publishedIds) return
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
    }
    setHistory(transactions)
  }, [publishedIds, transactionsUrl, token])

  useEffect(() => {
    fetchAndParseAll()
    // When revision changes, update the history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndParseAll])

  return useMemo(() => {
    const collaborators: string[] = []
    const documentsHistory = new Map<string, DocumentHistory>()
    if (!history.length) {
      return {documentsHistory, collaborators, loading: true}
    }
    history.forEach((item) => {
      const documentId = item.documentIDs[0]
      let documentHistory = documentsHistory.get(documentId)
      if (!collaborators.includes(item.author)) {
        collaborators.push(item.author)
      }
      // eslint-disable-next-line no-negated-condition
      if (!documentHistory) {
        documentHistory = {
          history: [item],
          createdBy: item.author,
          lastEditedBy: item.author,
          editors: [item.author],
        }
        documentsHistory.set(documentId, documentHistory)
      } else {
        // @ts-expect-error TransactionLogEventWithEffects has no property 'mutations' but it's returned from the API
        const isCreate = item.mutations.some((mutation) => 'create' in mutation)
        if (isCreate) documentHistory.createdBy = item.author
        if (!documentHistory.editors.includes(item.author)) {
          documentHistory.editors.push(item.author)
        }
        // The last item in the history is the last edited by, transaction log is ordered by timestamp
        documentHistory.lastEditedBy = item.author
        // always add history item
        documentHistory.history.push(item)
      }
    })

    return {documentsHistory, collaborators, loading: false}
  }, [history])
}
