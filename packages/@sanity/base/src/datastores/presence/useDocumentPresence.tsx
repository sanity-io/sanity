import {useState, useEffect} from 'react'
import {documentPresence} from './presence-store'
import {DocumentPresence} from './types'

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
