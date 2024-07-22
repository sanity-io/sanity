import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const presenceStore = usePresenceStore()
  const observable = useMemo(
    () => presenceStore.documentPresence(documentId),
    [documentId, presenceStore],
  )
  return useObservable(observable, [])
}
