import {type TransactionLogEventWithEffects} from '@sanity/types'
import {useCallback, useMemo} from 'react'

import {useAsyncData} from '../../../../hooks/useAsyncData'
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

  const versionId = useMemo(() => {
    if (!releaseDocumentId || !releaseId) return ''
    return getVersionId(releaseDocumentId, releaseId)
  }, [releaseDocumentId, releaseId])

  const cacheKey = `${releaseDocumentId}-${documentRevision}`

  const fetcher = useCallback((): Promise<TransactionLogEventWithEffects[]> => {
    // No document to fetch history for (e.g. a pending / just-added placeholder row passes an
    // undefined id). Resolve to an empty history so loading settles to false rather than hanging.
    if (!versionId) return Promise.resolve([])

    const cached = historyCache[cacheKey]
    if (cached) return Promise.resolve(cached.transactions)

    // .then().finally() (not try/finally) for React Compiler compatibility. The concurrency slot is
    // released whether the fetch resolves or throws; a throw propagates so useAsyncData reports the
    // error state (which the cells read as settled-with-no-editor, never a permanent skeleton).
    return acquireHistorySlot().then(() =>
      getTransactionsLogs(client, versionId, {
        tag: 'sanity.studio.releases.documents.history',
        effectFormat: 'mendoza',
        excludeContent: true,
        includeIdentifiedDocumentsOnly: true,
        limit: 1,
        reverse: true,
      })
        .then((transactions) => {
          historyCache[cacheKey] = {transactions}
          return transactions
        })
        .finally(() => releaseHistorySlot()),
    )
  }, [versionId, cacheKey, client])

  // `resetKey` (not just the fetcher's own identity) forces the loading state to reset on a genuine
  // identity change — same reasoning as the sibling useDocumentLastEditedBy hook's full cache key.
  // Without it, switching to a different version, or a revision change on the same version, would
  // keep useAsyncData's default stale-while-revalidate behavior: the PREVIOUS version's history
  // stays visible with `loading: false` while the new fetch runs — a false-settled flash, not a
  // smooth refetch, since it's showing a different document's data under the new identity.
  const {data: history, loading} = useAsyncData(fetcher, {resetKey: cacheKey})

  return useMemo(() => {
    const collaborators: string[] = []
    // `loading` (from useAsyncData) is the single source of truth for "not yet settled". Once
    // settled, an empty OR errored fetch yields no history → render nothing, never a permanent
    // skeleton. Keying off array length alone would leave those rows on an endless skeleton.
    if (loading) {
      return {documentHistory: undefined, collaborators, loading: true}
    }
    if (!history || history.length === 0) {
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
  }, [history, loading])
}
