import {useState, useEffect} from 'react'
import {usePresenceStore} from '../datastores'
import {DocumentPresence} from './types'

export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const presenceStore = usePresenceStore()
  const [presence, setPresence] = useState<DocumentPresence[]>([])

  useEffect(() => {
    const subscription = presenceStore.documentPresence(documentId).subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId, presenceStore])

  return presence
}
