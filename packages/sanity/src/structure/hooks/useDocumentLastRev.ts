import {type SanityDocument} from '@sanity/types'
import {useEffect, useState} from 'react'
import {useHistoryStore, useTimelineSelector, useTimelineStore} from 'sanity'

export const useDocumentLastRev = (documentId: string, documentType: string) => {
  const historyStore = useHistoryStore()
  const [lastRevisionDocument, setLastRevisionDocument] = useState<SanityDocument | null>(null)
  const [loading, setLoading] = useState(false)

  // Get the timeline store to access lastNonDeletedRevId
  // needs to be done this way because otherwise the revision id will not be the most updated
  // in case if you edit the document in between deletes, for example
  const timelineStore = useTimelineStore({
    documentId,
    documentType,
  })

  // Get the lastNonDeletedRevId from the timeline store
  const lastNonDeletedRevId = useTimelineSelector(
    timelineStore,
    (state) => state.lastNonDeletedRevId,
  )

  useEffect(() => {
    if (lastNonDeletedRevId && documentId) {
      setLoading(true)
      historyStore
        .getDocumentAtRevision(documentId, lastNonDeletedRevId)
        .then((document) => {
          setLastRevisionDocument(document || null)
          setLoading(false)
        })
        .catch(() => {
          setLastRevisionDocument(null)
          setLoading(false)
        })
    } else {
      setLastRevisionDocument(null)
      setLoading(false)
    }
  }, [documentId, lastNonDeletedRevId, historyStore])

  return {lastRevisionDocument, loading}
}
