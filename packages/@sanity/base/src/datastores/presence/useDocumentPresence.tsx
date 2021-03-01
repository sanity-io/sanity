import {useState, useEffect} from 'react'
import {DocumentPresence} from './types'
import {documentPresence} from './presence-store'

export function useDocumentPresence(documentId): DocumentPresence[] {
  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = documentPresence(documentId).subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId])
  return presence
}
