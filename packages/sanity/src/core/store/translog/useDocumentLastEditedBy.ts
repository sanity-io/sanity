import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useClient} from '../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getTransactionsLogs} from './getTransactionsLogs'

// Cache the resolved editor per (documentId, revision) so re-renders and remounts don't refetch the
// same transaction. Keyed on revision too, so a fresh edit invalidates the entry.
const lastEditedByCache: Record<string, string | undefined> = Object.create(null)

// The history/translog API 429s when many rows fetch at once (e.g. a large documents table mounting
// all at once). Limit concurrency to the same ceiling the release document-history hook uses — 10
// was the highest that ran without consistent 429s.
let activeStreams = 0
const pendingResolvers: Array<() => void> = []
async function acquireSlot(maxConcurrent = 10): Promise<void> {
  if (activeStreams >= maxConcurrent) {
    await new Promise<void>((resolve) => pendingResolvers.push(resolve))
  }
  activeStreams += 1
}
function releaseSlot(): void {
  activeStreams = Math.max(0, activeStreams - 1)
  const next = pendingResolvers.shift()
  if (next) next()
}

/**
 * Resolves the user id of whoever last edited a document — the author of its most recent
 * transaction. Reads a single transaction (`limit: 1, reverse: true`) from the transaction log,
 * concurrency-limited so a table of rows doesn't stampede the history API, and cached per
 * `(documentId, revision)`.
 *
 * Returns just the user id; render it with `UserAvatar` / `useUser` at the call site.
 *
 * @internal
 */
export function useDocumentLastEditedBy(
  documentId: string | undefined,
  revision?: string,
): {lastEditedBy: string | undefined; loading: boolean} {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const cacheKey = documentId ? `${documentId}-${revision ?? ''}` : ''
  const cachedInitial = cacheKey ? lastEditedByCache[cacheKey] : undefined
  const [lastEditedBy, setLastEditedBy] = useState<string | undefined>(cachedInitial)
  const [loading, setLoading] = useState<boolean>(
    Boolean(documentId) && !(cacheKey in lastEditedByCache),
  )
  const cancelledRef = useRef(false)

  const fetchLastEditor = useCallback(async (): Promise<void> => {
    if (!documentId) {
      setLastEditedBy(undefined)
      setLoading(false)
      return
    }

    if (cacheKey in lastEditedByCache) {
      setLastEditedBy(lastEditedByCache[cacheKey])
      setLoading(false)
      return
    }

    setLoading(true)
    await acquireSlot()
    // run().catch().finally() rather than try/catch/finally because the React Compiler does not yet
    // fully support the latter — matches the sibling release-history hook.
    const run = async () => {
      const transactions = await getTransactionsLogs(client, documentId, {
        tag: 'sanity.studio.document.last-edited-by',
        effectFormat: 'mendoza',
        excludeContent: true,
        includeIdentifiedDocumentsOnly: true,
        limit: 1,
        reverse: true,
      })
      if (cancelledRef.current) return
      const author = transactions[0]?.author
      lastEditedByCache[cacheKey] = author
      setLastEditedBy(author)
    }
    await run()
      .catch((error) => {
        console.error('Failed to fetch document last-editor history:', error)
        if (!cancelledRef.current) setLastEditedBy(undefined)
      })
      .finally(() => {
        releaseSlot()
        if (!cancelledRef.current) setLoading(false)
      })
  }, [cacheKey, client, documentId])

  useEffect(() => {
    cancelledRef.current = false
    // oxlint-disable-next-line react/react-compiler
    void fetchLastEditor()
    return () => {
      cancelledRef.current = true
    }
  }, [fetchLastEditor])

  return useMemo(() => ({lastEditedBy, loading}), [lastEditedBy, loading])
}
