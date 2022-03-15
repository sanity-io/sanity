import {useState, useEffect} from 'react'
import {useDatastores} from '../useDatastores'
import {DocumentPresence} from './types'

export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const {presenceStore} = useDatastores()
  const [presence, setPresence] = useState<DocumentPresence[]>([])

  useEffect(() => {
    const subscription = presenceStore.documentPresence(documentId).subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId, presenceStore])

  return presence
}
