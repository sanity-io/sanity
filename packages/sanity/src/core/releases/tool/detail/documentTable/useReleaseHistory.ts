import {type TransactionLogEventWithEffects} from '@sanity/types'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {useClient} from '../../../../hooks'
import {getJsonStream} from '../../../../store/_legacy/history/history/getJsonStream'
import {getVersionId} from '../../../../util'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../util/releasesClient'

export type DocumentHistory = {
  history: TransactionLogEventWithEffects[]
  createdBy: string
  lastEditedBy: string
  editors: string[]
}

// TODO: Update this to contemplate the _revision change on any of the internal release documents, and fetch only the history of that document if changes.
export function useReleaseHistory(
  releaseDocumentsIds: string[],
  releaseId: string,
): {
  documentsHistory: Record<string, DocumentHistory>
  collaborators: string[]
  loading: boolean
} {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const {dataset, token} = client.config()
  const [history, setHistory] = useState<TransactionLogEventWithEffects[]>([])
  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true`
  const versionIds = releaseDocumentsIds.map((id) => getVersionId(id, releaseId)).join(',')
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${versionIds}?${queryParams}`,
  )

  const fetchAndParseAll = useCallback(async () => {
    if (!versionIds) return
    if (!releaseId) return
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
  }, [versionIds, transactionsUrl, token, releaseId])

  useEffect(() => {
    fetchAndParseAll()
    // When revision changes, update the history.
  }, [fetchAndParseAll])

  return useMemo(() => {
    const collaborators: string[] = []
    const documentsHistory: Record<string, DocumentHistory> = {}
    if (!history.length) {
      return {documentsHistory, collaborators, loading: true}
    }
    history.forEach((item) => {
      const documentId = item.documentIDs[0]
      let documentHistory = documentsHistory[documentId]
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
        documentsHistory[documentId] = documentHistory
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
