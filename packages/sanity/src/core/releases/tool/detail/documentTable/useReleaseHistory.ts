import {type TransactionLogEventWithEffects} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../store/translog/getTransactionsLogs'
import {getVersionId} from '../../../../util/draftUtils'
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
  const [history, setHistory] = useState<TransactionLogEventWithEffects[] | null>(null)

  const versionId = useMemo(() => {
    if (!releaseDocumentId || !releaseId) return ''
    return getVersionId(releaseDocumentId, releaseId)
  }, [releaseDocumentId, releaseId])

  // Reset to the loading state during render when `versionId` changes, before the new fetch
  // settles — React's recommended "adjusting state when a prop changes" pattern (setState during
  // render bails out and re-renders immediately, without the extra commit an effect-based reset
  // would cause). Without this, a stale `[]` (or a previous version's transactions) from before
  // the change renders as "loaded, no history" for the duration of the new fetch — the
  // false-settled flash. A cache hit or the `!versionId` short-circuit in `fetchAndParse` still
  // settles synchronously within the same effect tick, so there's no visible flicker for those.
  const [prevVersionId, setPrevVersionId] = useState(versionId)
  if (versionId !== prevVersionId) {
    setPrevVersionId(versionId)
    setHistory(null)
  }

  const cancelledRef = useRef(false)

  const fetchAndParse = useCallback(async (): Promise<void> => {
    if (!versionId) {
      // No document to fetch history for (e.g. a pending / just-added placeholder row passes an
      // undefined id). Settle to an empty history so `loading` reports false instead of hanging
      // true — otherwise the Edited / Edited-by cells keep an endless skeleton on rows that will
      // never resolve a history.
      setHistory([])
      return
    }

    const cacheKey = `${releaseDocumentId}-${documentRevision}`

    const cached = historyCache[cacheKey]
    if (cached) {
      setHistory(cached.transactions)
      return
    }

    await acquireHistorySlot()
    // The run().catch().finally() syntax instead of try/catch/finally is because of the React Compiler not fully supporting the syntax yet
    const run = async () => {
      const transactions = await getTransactionsLogs(client, versionId, {
        tag: 'sanity.studio.releases.documents.history',
        effectFormat: 'mendoza',
        excludeContent: true,
        includeIdentifiedDocumentsOnly: true,
        limit: 1,
        reverse: true,
      })

      if (!cancelledRef.current) {
        setHistory(transactions)

        historyCache[cacheKey] = {
          transactions,
        }
      }
    }
    await run()
      .catch((error) => {
        console.error('Failed to fetch or parse document history:', error)
        if (!cancelledRef.current) setHistory([])
      })
      .finally(() => {
        releaseHistorySlot()
      })
  }, [versionId, releaseDocumentId, documentRevision, client])

  useEffect(() => {
    cancelledRef.current = false
    // oxlint-disable-next-line react/react-compiler
    void fetchAndParse()
    return () => {
      cancelledRef.current = true
    }
  }, [fetchAndParse])

  return useMemo(() => {
    const collaborators: string[] = []
    // `null` = not yet fetched → genuinely loading. `[]` = settled with no history (a legitimately
    // empty log, or a failed fetch that set `[]` on line 93) → NOT loading, just nothing to show.
    // Keying `loading` off length would leave those rows on a permanent skeleton.
    if (history === null) {
      return {documentHistory: undefined, collaborators, loading: true}
    }
    if (history.length === 0) {
      return {documentHistory: undefined, collaborators, loading: false}
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
