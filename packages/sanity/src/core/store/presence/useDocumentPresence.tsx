import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

const initial: DocumentPresence[] = []

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const presenceStore = usePresenceStore()
  const presence$ = useMemo(
    () => presenceStore.documentPresence(documentId),
    [presenceStore, documentId],
  )
  return useObservable(presence$, initial)
}
