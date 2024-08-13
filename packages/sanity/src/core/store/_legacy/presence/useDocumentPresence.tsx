import {isEqual} from 'lodash'
import {useEffect, useReducer} from 'react'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

function presenceReducer(state: DocumentPresence[], next: DocumentPresence[]): DocumentPresence[] {
  return isEqual(state, next) ? state : next
}

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const presenceStore = usePresenceStore()
  const [presence, dispatch] = useReducer(presenceReducer, [])

  useEffect(() => {
    const subscription = presenceStore.documentPresence(documentId).subscribe(dispatch)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId, presenceStore])

  return presence
}
