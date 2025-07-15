import {type SanityDocument} from '@sanity/types'
import {useEffect, useState} from 'react'
import {useHistoryStore} from 'sanity'

export const useDocumentLastRev = (documentId: string, lastNonDeletedRevId: string | null) => {
  const historyStore = useHistoryStore()
  const [lastRevisionDocument, setLastRevisionDocument] = useState<SanityDocument | null>(null)
  const [loading, setLoading] = useState(false)

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
