import {type TransactionLogEventWithEffects} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useClient} from '../../../../hooks'
import {getJsonStream} from '../../../../store/_legacy/history/history/getJsonStream'
import {getVersionId} from '../../../../util'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../util/releasesClient'

const historyCache: Record<string, {transactions: TransactionLogEventWithEffects[]}> =
  Object.create(null)

export type DocumentHistory = {
  history: TransactionLogEventWithEffects[]
  createdBy: string
  lastEditedBy: string
  editors: string[]
}

// Add as a concurrency limiter to avoid 429s when many rows mount at once
// This happens in incredibly large releases with many documents
// 10 was the highest number I was able to run before getting consistent 429s
let activeHistoryStreams = 0
const pendingHistoryResolvers: Array<() => void> = []
async function acquireHistorySlot(maxConcurrent = 10): Promise<void> {
  if (activeHistoryStreams >= maxConcurrent) {
    await new Promise<void>((resolve) => pendingHistoryResolvers.push(resolve))
  }
  activeHistoryStreams += 1
}
function releaseHistorySlot(): void {
  activeHistoryStreams = Math.max(0, activeHistoryStreams - 1)
  const next = pendingHistoryResolvers.shift()
  if (next) next()
}

// Fetch history for a single document version within a release
export function useReleaseHistory(
  releaseDocumentId: string | undefined,
  releaseId: string,
  documentRevision?: string,
): {
  documentHistory?: DocumentHistory
  collaborators: string[]
  loading: boolean
} {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const {dataset, token} = client.config()
  const [history, setHistory] = useState<TransactionLogEventWithEffects[] | null>(null)
  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true`

  const versionId = useMemo(() => {
    if (!releaseDocumentId || !releaseId) return ''
    return getVersionId(releaseDocumentId, releaseId)
  }, [releaseDocumentId, releaseId])

  const transactionsUrl = useMemo(() => {
    if (!versionId) return ''
    return client.getUrl(`/data/history/${dataset}/transactions/${versionId}?${queryParams}`)
  }, [client, dataset, queryParams, versionId])

  const cancelledRef = useRef(false)

  const fetchAndParse = useCallback(async (): Promise<void> => {
    if (!versionId || !transactionsUrl) {
      setHistory(null)
      return
    }

    const cacheKey = `${releaseDocumentId}-${documentRevision}`

    const cached = historyCache[cacheKey]
    if (cached) {
      setHistory(cached.transactions)
      return
    }

    await acquireHistorySlot()
    try {
      const transactions: TransactionLogEventWithEffects[] = []
      const stream = await getJsonStream(transactionsUrl, token)
      const reader = stream.getReader()

      const readAll = async (): Promise<void> => {
        const result = await reader.read()
        if (result.done) return
        if ('error' in result.value) {
          throw new Error(result.value.error.description || result.value.error.type)
        }

        transactions.push(result.value)
        await readAll()
      }

      await readAll()
      if (!cancelledRef.current) {
        setHistory(transactions)

        historyCache[cacheKey] = {
          transactions,
        }
      }
    } catch (error) {
      console.error('Failed to fetch or parse document history:', error)
      if (!cancelledRef.current) setHistory([])
    } finally {
      releaseHistorySlot()
    }
  }, [versionId, transactionsUrl, releaseDocumentId, documentRevision, token])

  useEffect(() => {
    cancelledRef.current = false
    fetchAndParse()
    return () => {
      cancelledRef.current = true
    }
  }, [fetchAndParse])

  return useMemo(() => {
    const collaborators: string[] = []
    if (!history || history.length === 0) {
      return {documentHistory: undefined, collaborators, loading: true}
    }

    const aggregated: DocumentHistory = {
      history: [],
      createdBy: '',
      lastEditedBy: '',
      editors: [],
    }

    history.forEach((item) => {
      const author = item.author
      if (!collaborators.includes(author)) collaborators.push(author)

      if (aggregated.history.length === 0) {
        aggregated.createdBy = author
      }

      // @ts-expect-error TransactionLogEventWithEffects has no property 'mutations' but it's returned from the API
      const isCreate = item.mutations?.some((mutation) => 'create' in mutation)
      if (isCreate) aggregated.createdBy = author

      if (!aggregated.editors.includes(author)) aggregated.editors.push(author)
      aggregated.lastEditedBy = author
      aggregated.history.push(item)
    })

    return {documentHistory: aggregated, collaborators, loading: false}
  }, [history])
}
