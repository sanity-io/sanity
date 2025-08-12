import {type TransactionLogEventWithEffects} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

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

// Simple global concurrency limiter to avoid 429s when many rows mount at once
let activeHistoryStreams = 0
const pendingHistoryResolvers: Array<() => void> = []
async function acquireHistorySlot(maxConcurrent = 2): Promise<void> {
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

  const attemptsRef = useRef(0)
  const cancelledRef = useRef(false)

  const fetchAndParse = useCallback(async (): Promise<void> => {
    if (!versionId || !transactionsUrl) {
      setHistory(null)
      return
    }
    await acquireHistorySlot()
    try {
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
      if (!cancelledRef.current) setHistory(transactions)
    } catch (err) {
      // Basic retry with exponential backoff to handle transient 429s
      if (attemptsRef.current < 3 && !cancelledRef.current) {
        const delayMs = Math.min(500 * 2 ** attemptsRef.current, 4000)
        attemptsRef.current += 1
        await new Promise((r) => setTimeout(r, delayMs))
        await fetchAndParse()
        return
      }
      if (!cancelledRef.current) setHistory([])
    } finally {
      releaseHistorySlot()
    }
  }, [transactionsUrl, token, versionId])

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
